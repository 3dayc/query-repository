import { useState, useMemo } from 'react';
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
import { TableEditModal } from './TableEditModal';

// --- Sortable Items Components ---

interface SortableFolderProps {
    folder: DbFolder;
    tables: DbTable[];
    isExpanded: boolean;
    onToggle: () => void;
    onEditTable: (table: DbTable) => void;
}

function SortableFolderItem({ folder, tables, isExpanded, onToggle, onEditTable }: SortableFolderProps) {
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
        openConfirm('Delete Folder', `Delete folder "${folder.name}"? Tables inside will be moved to Root.`, async () => {
            try {
                removeFolder(folder.id); // Optimistic
                await api.deleteFolder(folder.id);
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

                {/* Delete Folder */}
                <button
                    onClick={handleDelete}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
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
    const setSelectedTableId = useAppStore(state => state.setSelectedTableId);
    const removeTable = useAppStore(state => state.removeTable);
    const fetchData = useAppStore(state => state.fetchData); // Fallback

    const openConfirm = useAppStore(state => state.openConfirm);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();

        openConfirm('Delete File', `Delete file "${table.table_name}"?`, async () => {
            try {
                // Optimistic UI
                removeTable(table.id);
                if (selectedTableId === table.id) setSelectedTableId(null);

                await api.deleteTable(table.id);
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
            onClick={() => setSelectedTableId(table.id)}
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
                <button
                    onClick={handleDelete}
                    className="p-1 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded transition-all"
                    title="Delete"
                    onPointerDown={(e) => e.stopPropagation()} // Extra safety for dnd-kit
                >
                    <Trash2 className="w-3 h-3" />
                </button>
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
        updateTable
    } = useAppStore();

    const [activeId, setActiveId] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // New Table State
    const [isCreatingTable, setIsCreatingTable] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [newTableDescription, setNewTableDescription] = useState('');
    const [activeFolderForNewTable, setActiveFolderForNewTable] = useState<string | null>(null);

    // Edit Table State
    const [editingTable, setEditingTable] = useState<DbTable | null>(null);

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
                // Optimistic Local Update
                // We need to update the table's location in our local store immediately
                const updatedTable = { ...activeTable, folder_id: overTable.folder_id, order_index: overTable.order_index }; // Simplified order logic for now (insert before/after is hard without full list reorder logic locally)

                // For a true flicker-free experience on DnD reorder, we usually need 'arrayMove' on the whole sub-list.
                // Given the constraints and the simplified requirement, let's just update the folder_id locally if changed.
                if (activeTable.folder_id !== overTable.folder_id) {
                    updateTable({ ...activeTable, folder_id: overTable.folder_id });
                }

                try {
                    if (activeTable.folder_id === overTable.folder_id) {
                        await api.updateTableLocation(activeId, activeTable.folder_id, overTable.order_index);
                    } else {
                        await api.updateTableLocation(activeId, overTable.folder_id, overTable.order_index);
                    }
                    // No full fetch needed!
                } catch (e) {
                    fetchData();
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

        const tempId = `temp-${Date.now()}`;
        const optimisticFolder: DbFolder = {
            id: tempId,
            name: newFolderName,
            order_index: folders.length,
            created_at: new Date().toISOString()
        };

        addFolder(optimisticFolder);
        setNewFolderName('');
        setIsCreatingFolder(false);

        try {
            const realFolder = await api.createFolder(newFolderName, folders.length);
            // Replace optimstic folder with real one? 
            // Zustand store replace pattern is tricky without ID. 
            // For now, silent fetch is safer to get real ID for future ops.
            // But user asked for NO RELOAD. 
            // Ideally we swap the ID in the store. 
            // Let's do a silent fetch in background to sync IDs.
            fetchData();
        } catch (error) {
            console.error(error);
            // Error handling
            // removeFolder(tempId); // If we had removeFolder
            fetchData();
        }
    };

    const handleCreateTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableName.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const optimisticTable: DbTable = {
            id: tempId,
            table_name: newTableName,
            description: newTableDescription,
            folder_id: activeFolderForNewTable,
            order_index: 0,
            created_at: new Date().toISOString()
        };

        addTable(optimisticTable);
        setNewTableName('');
        setNewTableDescription('');
        setIsCreatingTable(false);
        setActiveFolderForNewTable(null);

        try {
            await api.createTable(newTableName, newTableDescription, activeFolderForNewTable);
            fetchData(); // Sync IDs
        } catch (error) {
            console.error(error);
            fetchData();
        }
    };

    const handleSaveEdit = async (name: string, description: string) => {
        if (!editingTable) return;

        // Optimistic
        const updated = { ...editingTable, table_name: name, description };
        updateTable(updated);

        try {
            await api.updateTable(editingTable.id, name, description);
            // No fetch needed technically if successful
        } catch (error) {
            console.error(error);
            fetchData();
        }
    };

    return (
        <div className="w-72 bg-[#0f1016] h-screen border-r border-slate-800 flex flex-col flex-shrink-0 select-none">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="text-cyan-500 w-5 h-5 shadow-glow-cyan" />
                    <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent tracking-tight">
                        AIR-SQL
                    </h1>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setIsCreatingFolder(true)}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition-colors"
                        title="New Folder"
                    >
                        <Folder className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => { setIsCreatingTable(true); setActiveFolderForNewTable(null); }}
                        className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                        title="New File (Root)"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/20">
                {/* Folder Creation Form */}
                {isCreatingFolder && (
                    <form onSubmit={handleCreateFolder} className="mb-2 px-2 py-2 bg-slate-800/50 rounded border border-slate-700">
                        <input
                            autoFocus
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-500 mb-2"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreatingFolder(false)} className="text-[10px] text-slate-400">Cancel</button>
                            <button type="submit" className="text-[10px] text-amber-400 font-bold">Create</button>
                        </div>
                    </form>
                )}

                {/* Table Creation Form */}
                {isCreatingTable && (
                    <form onSubmit={handleCreateTable} className="mb-2 px-2 py-2 bg-slate-800/50 rounded border border-slate-700">
                        <div className="text-[10px] text-slate-500 mb-1">
                            New File in: <span className="text-slate-300">{activeFolderForNewTable ? folders.find(f => f.id === activeFolderForNewTable)?.name : 'Root'}</span>
                        </div>
                        <input
                            autoFocus
                            placeholder="Table Name"
                            value={newTableName}
                            onChange={e => setNewTableName(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mb-2"
                        />
                        <textarea
                            placeholder="Description (Optional)"
                            value={newTableDescription}
                            onChange={e => setNewTableDescription(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 mb-2 resize-none h-12"
                        />
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setIsCreatingTable(false)} className="text-[10px] text-slate-400">Cancel</button>
                            <button type="submit" className="text-[10px] text-cyan-400 font-bold">Create</button>
                        </div>
                    </form>
                )}

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={folders.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                            {folders.map(folder => (
                                <SortableFolderItem
                                    key={folder.id}
                                    folder={folder}
                                    tables={tables.filter(t => t.folder_id === folder.id).sort((a, b) => a.order_index - b.order_index)}
                                    isExpanded={expandedFolderIds.includes(folder.id)}
                                    onToggle={() => toggleFolder(folder.id)}
                                    onEditTable={setEditingTable}
                                />
                            ))}
                        </div>
                    </SortableContext>

                    {/* Uncategorized / Root Files */}
                    {unorganizedTables.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <h3 className="px-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Uncategorized</h3>
                            <SortableContext items={unorganizedTables.map(t => t.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-0.5">
                                    {unorganizedTables.map(table => (
                                        <SortableFileItem
                                            key={table.id}
                                            table={table}
                                            onEdit={() => setEditingTable(table)}
                                        />
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
            <div className="p-3 border-t border-slate-800 text-[10px] text-slate-600 text-center">
                NOL UNIVERSE
            </div>

            <TableEditModal
                isOpen={!!editingTable}
                onClose={() => setEditingTable(null)}
                initialName={editingTable?.table_name || ''}
                initialDescription={editingTable?.description || ''}
                onSave={handleSaveEdit}
            />
        </div>
    );
}
