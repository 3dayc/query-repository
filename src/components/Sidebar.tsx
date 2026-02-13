import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Folder,
    FolderOpen,
    MoreVertical,
    Plus,
    Database,
    ChevronRight,
    ChevronDown,
    Trash2,
    Pencil
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { api } from '../services/api';
import clsx from 'clsx';
import type { DbFolder, DbTable } from '../types/db';

import { isSuperAdmin } from '../utils/whitelist';

// --- Sortable Items Components ---

interface SortableFolderProps {
    folder: DbFolder;
    tables: DbTable[];
    isExpanded: boolean;
    onToggle: () => void;
    onEditTable: (table: DbTable) => void;
    onEditFolder: () => void;
}

function SortableFolderItem({ folder, tables, isExpanded, onToggle, onEditTable, onEditFolder }: SortableFolderProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: folder.id,
        data: { type: 'folder', folder }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 'auto',
        opacity: isDragging ? 0.3 : 1
    };

    const removeFolder = useAppStore(state => state.removeFolder);
    const openConfirm = useAppStore(state => state.openConfirm);
    const fetchData = useAppStore(state => state.fetchData);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        openConfirm('Move to Trash', `Move folder "${folder.name}" to Trash?`, async () => {
            try {
                removeFolder(folder.id); // Optimistic
                await api.softDeleteFolder(folder.id);
            } catch (error) {
                console.error(error);
                fetchData();
            }
        });
    };

    return (
        <div ref={setNodeRef} style={style} className="mb-1">
            <div
                className={clsx(
                    "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group transition-colors select-none",
                    isDragging ? "bg-slate-700/50" : "hover:bg-slate-800"
                )}
            >
                {/* Drag Handle */}
                <div {...attributes} {...listeners} className="text-slate-600 hover:text-slate-400 cursor-grab active:cursor-grabbing p-0.5">
                    <MoreVertical className="w-3 h-3" />
                </div>

                {/* Toggle & Name */}
                <div
                    className="flex-1 flex items-center gap-2"
                    onClick={onToggle}
                >
                    {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 transition-transform" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform" />
                    )}

                    {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-500/90" />
                    ) : (
                        <Folder className="w-4 h-4 text-amber-500/90" />
                    )}

                    <span className="text-sm font-medium text-slate-300 group-hover:text-slate-100">
                        {folder.name}
                    </span>
                </div>

                {/* Actions (Hover) */}
                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    {isSuperAdmin(useAppStore.getState().user?.email) && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onEditFolder(); }}
                                className="p-1 hover:bg-slate-600/50 text-slate-500 hover:text-cyan-400 rounded transition-all"
                                title="Edit Folder"
                            >
                                <Pencil className="w-3 h-3" />
                            </button>
                            <button
                                onClick={handleDelete}
                                className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
                                title="Delete Folder"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Nested Files */}
            {isExpanded && (
                <div className="pl-4 mt-1 space-y-0.5 border-l border-slate-700/50 ml-3">
                    <SortableContext
                        items={tables.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {tables.map(table => (
                            <SortableFileItem key={table.id} table={table} onEdit={() => onEditTable(table)} />
                        ))}
                    </SortableContext>
                    {tables.length === 0 && (
                        <div className="pl-6 text-xs text-slate-600 italic py-1">Example empty</div>
                    )}
                </div>
            )}
        </div>
    );
}

interface SortableFileProps {
    table: DbTable;
    onEdit: () => void;
}

function SortableFileItem({ table, onEdit }: SortableFileProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: table.id,
        data: { type: 'file', table }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1
    };

    const selectedTableId = useAppStore(state => state.selectedTableId);
    const user = useAppStore(state => state.user);
    const setSelectedTableId = useAppStore(state => state.setSelectedTableId);
    const removeTable = useAppStore(state => state.removeTable);
    const fetchData = useAppStore(state => state.fetchData); // Fallback
    const setMobileMenuOpen = useAppStore(state => state.setMobileMenuOpen);

    const openConfirm = useAppStore(state => state.openConfirm);
    const checkUnsavedChanges = useAppStore(state => state.checkUnsavedChanges);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        openConfirm('Move to Trash', `Move file "${table.table_name}" to Trash?`, async () => {
            try {
                // Optimistic UI
                removeTable(table.id);
                if (selectedTableId === table.id) setSelectedTableId(null);

                await api.softDeleteTable(table.id);
            } catch (e) {
                console.error(e);
                fetchData();
            }
        });
    };

    const isSelected = selectedTableId === table.id;

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => {
                checkUnsavedChanges(() => {
                    setSelectedTableId(table.id);
                    useAppStore.getState().setViewMode('main');
                    setMobileMenuOpen(false);
                });
            }}
            className={clsx(
                "group relative flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all select-none",
                isSelected
                    ? "bg-slate-700/80 text-cyan-400 shadow-sm ring-1 ring-cyan-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
            )}
        >
            <div
                {...attributes}
                {...listeners}
                className="text-slate-700 group-hover:text-slate-500 cursor-grab active:cursor-grabbing"
                onClick={(e) => e.stopPropagation()}
            >
                <MoreVertical className="w-3 h-3" />
            </div>

            <Database className={clsx(
                "w-3.5 h-3.5",
                isSelected ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"
            )} />

            <span className="text-xs font-medium truncate flex-1">
                {table.table_name}
            </span>

            {/* Actions (Hover) */}
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1 hover:bg-slate-600/50 text-slate-500 hover:text-cyan-400 rounded transition-all"
                    title="Edit"
                >
                    <Pencil className="w-3 h-3" />
                </button>
                {isSuperAdmin(user?.email) && (
                    <button
                        onClick={handleDelete}
                        className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
                        title="Delete"
                        onPointerDown={(e) => e.stopPropagation()} // Extra safety for dnd-kit
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                )}
            </div>
        </div>
    );
}


// --- Main Sidebar Component ---

export function Sidebar() {
    const {
        folders,
        tables,
        expandedFolderIds,
        toggleFolder,
        fetchData,
        setFolders,
        addFolder,
        addTable,
        updateTable,
        setSelectedTableId,
        setTables,
        collapseAllFolders,
        checkUnsavedChanges,
        viewMode,
        setViewMode,
        setAIPanelOpen,
        setEditingTable,
        setEditingFolder,
        user
    } = useAppStore();

    const [activeId, setActiveId] = useState<string | null>(null);

    const visibleFolders = useMemo(() => folders.filter(f => f.name !== '참조' || isSuperAdmin(user?.email)), [folders, user?.email]);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // New Table State
    const [isCreatingTable, setIsCreatingTable] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [newTableSchema, setNewTableSchema] = useState(''); // Added Schema state
    const [newTableDescription, setNewTableDescription] = useState('');
    const [activeFolderForNewTable, setActiveFolderForNewTable] = useState<string | null>(null);



    // Refs for Click Outside
    const createFolderFormRef = useRef<HTMLFormElement>(null);
    const createTableFormRef = useRef<HTMLFormElement>(null);

    // Helpers to clear create mode when editing
    const handleEditTable = (table: DbTable) => {
        setIsCreatingTable(false);
        setIsCreatingFolder(false);
        setEditingTable(table);
    };

    const handleEditFolder = (folder: DbFolder) => {
        setIsCreatingTable(false);
        setIsCreatingFolder(false);
        setEditingFolder(folder);
    };

    // Click Outside Effect
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (isCreatingFolder && createFolderFormRef.current && !createFolderFormRef.current.contains(target)) {
                setIsCreatingFolder(false);
            }
            if (isCreatingTable && createTableFormRef.current && !createTableFormRef.current.contains(target)) {
                setIsCreatingTable(false);
            }
        };

        if (isCreatingFolder || isCreatingTable) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isCreatingFolder, isCreatingTable]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Derived state for rendering
    const unorganizedTables = useMemo(() =>
        tables.filter(t => !t.folder_id).sort((a, b) => a.order_index - b.order_index),
        [tables]);

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeType = active.data.current?.type;
        const overType = over.data.current?.type;

        // 1. Reorder Folders
        if (activeType === 'folder' && overType === 'folder' && activeId !== overId) {
            const oldIndex = folders.findIndex(f => f.id === activeId);
            const newIndex = folders.findIndex(f => f.id === overId);

            // Optimistic update
            const newFolders = arrayMove(folders, oldIndex, newIndex);
            setFolders(newFolders);

            // API update
            try {
                await api.updateFolderOrder(activeId, newIndex);
            } catch (e) {
                console.error(e);
                fetchData(); // revert
            }
        }

        // 2. Reorder Files
        if (activeType === 'file' && overType === 'file') { // File over File
            const activeTable = tables.find(t => t.id === activeId);
            const overTable = tables.find(t => t.id === overId);

            if (activeTable && overTable) {
                // Same Folder: Reorder
                if (activeTable.folder_id === overTable.folder_id) {
                    const currentFolderId = activeTable.folder_id;
                    // Get items in this folder sorted
                    const folderItems = tables
                        .filter(t => t.folder_id === currentFolderId)
                        .sort((a, b) => a.order_index - b.order_index);

                    const oldIndex = folderItems.findIndex(t => t.id === activeId);
                    const newIndex = folderItems.findIndex(t => t.id === overId);

                    if (oldIndex !== newIndex) {
                        // Reorder locally and update indices
                        const newFolderItems = arrayMove(folderItems, oldIndex, newIndex).map((t, index) => ({
                            ...t,
                            order_index: index
                        }));

                        // Update global store
                        const otherItems = tables.filter(t => t.folder_id !== currentFolderId);
                        setTables([...otherItems, ...newFolderItems]);

                        // API Update (Parallel)
                        // Note: Updating all might be heavy but ensures consistency
                        Promise.all(newFolderItems.map(t =>
                            api.updateTableLocation(t.id, t.folder_id, t.order_index)
                        )).catch(e => {
                            console.error('Failed to reorder tables:', e);
                            fetchData(); // Revert on error
                        });
                    }
                } else {
                    // Moving to different folder (insert at target position)
                    // Simplified: Just update folder_id and try to insert near target.
                    // For thorough implementation, we should reorder the target folder too.
                    // For now, let's keep the simple "assign folder_id" approach but try to set index.
                    updateTable({ ...activeTable, folder_id: overTable.folder_id });

                    api.updateTableLocation(activeId, overTable.folder_id, overTable.order_index)
                        .catch(e => {
                            console.error(e);
                            fetchData();
                        });
                }
            }
        }

        if (activeType === 'file' && overType === 'folder') { // File over Folder
            const activeTable = tables.find(t => t.id === activeId);
            if (activeTable) {
                // Optimistic
                updateTable({ ...activeTable, folder_id: overId, order_index: 0 });
                if (!expandedFolderIds.includes(overId)) toggleFolder(overId);

                try {
                    await api.updateTableLocation(activeId, overId, 0);
                } catch (e) {
                    fetchData();
                }
            }
        }
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        const nameToSave = newFolderName;
        setNewFolderName('');
        setIsCreatingFolder(false);

        try {
            const newFolder = await api.createFolder(nameToSave, folders.length);
            addFolder(newFolder);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCreateTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableName.trim()) return;

        const nameToSave = newTableName;
        const descToSave = newTableDescription;
        const schemaToSave = newTableSchema.trim();
        const targetFolderId = activeFolderForNewTable;

        setNewTableName('');
        setNewTableSchema('');
        setNewTableDescription('');
        setIsCreatingTable(false);
        setActiveFolderForNewTable(null);

        try {
            const newTable = await api.createTable(nameToSave, descToSave, targetFolderId, 0, schemaToSave);
            addTable(newTable);
        } catch (error) {
            console.error(error);
        }
    };



    // Resizable Sidebar Logic
    const [sidebarWidth, setSidebarWidth] = useState(288); // Default w-72 (288px)
    const [isResizing, setIsResizing] = useState(false);

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        setIsResizing(true);
        mouseDownEvent.preventDefault();

        const startWidth = sidebarWidth;
        const startX = mouseDownEvent.clientX;

        const doDrag = (mouseMoveEvent: MouseEvent) => {
            const delta = mouseMoveEvent.clientX - startX;
            const newWidth = Math.max(200, Math.min(600, startWidth + delta)); // Min 200px, Max 600px
            setSidebarWidth(newWidth);
        };

        const stopDrag = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', doDrag);
            document.removeEventListener('mouseup', stopDrag);
        };

        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', stopDrag);
    }, [sidebarWidth]);

    const { isMobileMenuOpen, setMobileMenuOpen } = useAppStore();

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div
                style={{ width: sidebarWidth }}
                className={clsx(
                    "bg-[#0f1016] h-screen border-r border-slate-800 flex flex-col flex-shrink-0 select-none group/sidebar transition-transform duration-300 ease-in-out",
                    // Mobile Styles (Drawer)
                    "fixed inset-y-0 left-0 z-50 md:relative",
                    isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Resizer Handle (Desktop Only) */}
                <div
                    className={clsx(
                        "absolute top-0 right-0 w-1 h-full cursor-col-resize z-50 transition-colors hidden md:block",
                        isResizing ? "bg-cyan-500" : "hover:bg-cyan-500/50 bg-transparent"
                    )}
                    onMouseDown={startResizing}
                />

                {/* Header */}
                <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                    <div
                        className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                            checkUnsavedChanges(() => {
                                setSelectedTableId(null);
                                collapseAllFolders();
                                setViewMode('main');
                                setMobileMenuOpen(false);
                                setAIPanelOpen(false);
                            });
                        }}
                    >
                        <Database className="text-cyan-500 w-5 h-5 shadow-glow-cyan" />
                        <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent tracking-tight">
                            NOL UNIVERSE
                        </h1>
                    </div>
                    <div className="flex gap-1">
                        {isSuperAdmin(useAppStore.getState().user?.email) && (
                            <button
                                onClick={() => setIsCreatingFolder(true)}
                                className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors touch-manipulation"
                                title="New Folder"
                            >
                                <Folder className="w-5 h-5" />
                            </button>
                        )}
                        <button
                            onClick={() => { setIsCreatingTable(true); setActiveFolderForNewTable(null); }}
                            className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors touch-manipulation"
                            title="New File (Root)"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/20">
                    {/* Folder Creation Form */}
                    {isCreatingFolder && (
                        <form ref={createFolderFormRef} onSubmit={handleCreateFolder} className="mb-2 px-2 py-2 bg-slate-800/50 rounded border border-slate-700">
                            <input
                                autoFocus
                                placeholder="Folder Name"
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 mb-2"
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreatingFolder(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
                                <button type="submit" className="px-3 py-1.5 text-xs text-amber-400 font-bold">Create</button>
                            </div>
                        </form>
                    )}

                    {/* Table Creation Form */}
                    {isCreatingTable && (
                        <form ref={createTableFormRef} onSubmit={handleCreateTable} className="mb-2 px-2 py-2 bg-slate-800/50 rounded border border-slate-700">
                            <div className="text-xs text-slate-500 mb-1">
                                New File in: <span className="text-slate-300">{activeFolderForNewTable ? folders.find(f => f.id === activeFolderForNewTable)?.name : 'Root'}</span>
                            </div>
                            <input
                                placeholder="Schema"
                                value={newTableSchema}
                                onChange={e => setNewTableSchema(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 mb-2"
                            />
                            <input
                                autoFocus
                                placeholder="Table Name"
                                value={newTableName}
                                onChange={e => setNewTableName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 mb-2"
                            />
                            <textarea
                                placeholder="Description"
                                value={newTableDescription}
                                onChange={e => setNewTableDescription(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 mb-2 resize-none h-16"
                            />
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsCreatingTable(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
                                <button type="submit" className="px-3 py-1.5 text-xs text-cyan-400 font-bold">Create</button>
                            </div>
                        </form>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={visibleFolders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-1">
                                {visibleFolders.map(folder => (
                                    <div key={folder.id}>
                                        <SortableFolderItem
                                            folder={folder}
                                            tables={tables.filter(t => t.folder_id === folder.id).sort((a, b) => a.order_index - b.order_index)}
                                            isExpanded={expandedFolderIds.includes(folder.id)}
                                            onToggle={() => toggleFolder(folder.id)}
                                            onEditTable={handleEditTable}
                                            onEditFolder={() => handleEditFolder(folder)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SortableContext>

                        {/* Uncategorized / Root Files */}
                        {unorganizedTables.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-800">
                                <h3 className="px-2 text-[10px] font-bold text-slate-600 tracking-wide mb-2">Uncategorized</h3>
                                <SortableContext items={unorganizedTables.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-0.5">
                                        {unorganizedTables.map(table => (
                                            <div key={table.id}>
                                                <SortableFileItem
                                                    table={table}
                                                    onEdit={() => handleEditTable(table)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </SortableContext>
                            </div>
                        )}

                        <DragOverlay>
                            {/* Minimal overlay for dragging visuals */}
                            {activeId ? (
                                <div className="px-2 py-1.5 bg-slate-700/80 rounded border border-slate-500 shadow-xl opacity-90 backdrop-blur-sm w-48">
                                    <span className="text-xs text-white break-all">Moving...</span>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                {/* Footer */}
                <div className="p-2 border-t border-slate-800">
                    <button
                        onClick={() => {
                            checkUnsavedChanges(() => setViewMode('trash'));
                        }}
                        className={clsx(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                            viewMode === 'trash' ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                        )}
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-xs font-medium">Trash</span>
                    </button>
                </div>


            </div>
        </>
    );
}
