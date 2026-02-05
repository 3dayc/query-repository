import { useEffect, useState, useCallback } from 'react';
import type { DbQuery } from '../types/db';
import { SqlEditor } from './SqlEditor';
import { ExampleList } from './ExampleList';
import { Database, Save, FilePlus, Menu, Link as LinkIcon, Pencil, Check, LogOut } from 'lucide-react';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { QueryCreationModal } from './QueryCreationModal';
import { SearchBar } from './SearchBar';
import { AIAssistantPanel } from './AIAssistantPanel';
import { Sparkles } from 'lucide-react';

export function MainContent() {
    const {
        selectedTableId, tables, openAlert, targetQueryId,
        setTargetQueryId, toggleMobileMenu, showToast,
        setHasUnsavedChanges, checkUnsavedChanges,
        isAIPanelOpen, toggleAIPanel
    } = useAppStore();
    const table = tables.find(t => t.id === selectedTableId);

    const [queries, setQueries] = useState<DbQuery[]>([]);
    const [selectedQuery, setSelectedQuery] = useState<DbQuery | null>(null);

    // Editor State (for editing existing queries)
    const [sqlCode, setSqlCode] = useState('');
    const [title, setTitle] = useState('');
    const [relatedLink, setRelatedLink] = useState('');
    const [isLinkEditing, setIsLinkEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Derived State for Unsaved Changes
    const isModified = selectedQuery
        ? (title !== selectedQuery.title || sqlCode !== selectedQuery.sql_code || relatedLink !== (selectedQuery.related_link || ''))
        : false;

    // Sync to store
    useEffect(() => {
        setHasUnsavedChanges(isModified);
    }, [isModified, setHasUnsavedChanges]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchQueries = useCallback(async () => {
        if (!table) return [];
        try {
            const data = await api.getQueries(table.id);
            setQueries(data);
            return data;
        } catch (error) {
            console.error('Failed to fetch queries:', error);
            return [];
        }
    }, [table]);

    // Smart Navigation Effect
    // Smart Navigation Effect
    useEffect(() => {
        // If we have a targetQueryId and queries are loaded, select it
        if (targetQueryId && queries.length > 0) {
            // Only update if mismatch (prevent loops)
            if (selectedQuery?.id !== targetQueryId) {
                const target = queries.find(q => q.id === targetQueryId);
                if (target) {
                    // Select Query
                    setSelectedQuery(target);
                    setSqlCode(target.sql_code);
                    setTitle(target.title);
                    setRelatedLink(target.related_link || '');
                    setIsLinkEditing(false); // Reset edit mode
                }
            }
        }
    }, [targetQueryId, queries, selectedQuery?.id]);

    useEffect(() => {
        if (table) {
            // Reset state first
            setSelectedQuery(null);
            setSqlCode('');
            setTitle('');
            setRelatedLink('');

            // Fetch and auto-select
            fetchQueries().then(data => {
                // Only auto-select first query if NOT navigating to a specific target
                // Check store state directly to avoid closure staleness, although fetchQueries is usually fast
                const currentTarget = useAppStore.getState().targetQueryId;

                if (!currentTarget && data && data.length > 0) {
                    const firstQuery = data[0];
                    setSelectedQuery(firstQuery);
                    setSqlCode(firstQuery.sql_code);
                    setTitle(firstQuery.title);
                    setRelatedLink(firstQuery.related_link || '');
                    // Sync up
                    setTargetQueryId(firstQuery.id);
                }
            });
        }
    }, [table, fetchQueries, setTargetQueryId]);

    const handleSelectQuery = (query: DbQuery) => {
        if (selectedQuery?.id === query.id) return;

        setSelectedQuery(query);
        setSqlCode(query.sql_code);
        setTitle(query.title);
        setRelatedLink(query.related_link || '');
        setIsLinkEditing(false);
        setTargetQueryId(query.id); // Sync to global state
    };

    // Handle Update (Inline)
    const handleUpdate = async () => {
        if (!selectedQuery) return;
        if (!title.trim() || !sqlCode.trim()) {
            openAlert('Validation Error', 'Title and SQL Code are required.');
            return;
        }

        setIsSaving(true);
        try {
            const updated = await api.updateQuery(selectedQuery.id, title, sqlCode, relatedLink);
            setQueries(queries.map(q => q.id === updated.id ? updated : q));
            setSelectedQuery(updated);
            showToast('Query saved successfully!', 'success');
        } catch (error) {
            console.error('Failed to save query:', error);
            showToast('Failed to save query.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Create (Modal)
    const handleCreate = async (newTitle: string, newSql: string, newLink?: string) => {
        if (!table) return;
        try {
            const newQuery = await api.createQuery(table.id, newTitle, newSql, queries.length, newLink);
            setQueries([...queries, newQuery]);
            handleSelectQuery(newQuery); // Auto-select the new query
        } catch (error) {
            console.error(error);
            throw error; // Let modal handle error alert
        }
    };

    const handleDeleteQuery = async (id: string) => {
        try {
            await api.softDeleteQuery(id);
            setQueries(queries.filter(q => q.id !== id));
            if (selectedQuery?.id === id) {
                setSelectedQuery(null);
                setSqlCode('');
                setTitle('');
                setRelatedLink('');
            }
        } catch (error) {
            console.error('Failed to delete query:', error);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#13141f] overflow-hidden">
            {/* Global Header (Search) */}
            <div className="h-16 border-b border-slate-800 bg-[#0f1016] flex items-center px-4 md:px-6 justify-between flex-shrink-0 z-[60] gap-4">
                {/* Mobile Trigger */}
                <button
                    className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                    onClick={toggleMobileMenu}
                >
                    <Menu className="w-6 h-6" />
                </button>

                <div className="flex-1 max-w-2xl">
                    <SearchBar />
                </div>

                <div className="flex items-center gap-3 ml-4 border-l border-slate-700 pl-4">
                    <button
                        onClick={toggleAIPanel}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 font-medium text-sm
                        ${isAIPanelOpen
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                            }`}
                        title="Ask AI Assistant"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span className="hidden lg:inline">Ask AI</span>
                    </button>

                    {/* User Profile */}
                    <div className="flex items-center gap-3">
                        {useAppStore.getState().user?.user_metadata?.avatar_url ? (
                            <img
                                src={useAppStore.getState().user.user_metadata.avatar_url}
                                alt="User"
                                className="w-8 h-8 rounded-full border border-slate-600"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 border border-slate-600">
                                {useAppStore.getState().user?.email?.[0].toUpperCase() || 'U'}
                            </div>
                        )}

                        <button
                            onClick={() => useAppStore.getState().signOut()}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            {!table ? (
                // Empty State
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#13141f]">
                    <div className="max-w-md space-y-6">
                        <div className="inline-block p-4 rounded-full bg-slate-900/50 border border-slate-800 mb-4">
                            <span className="text-4xl">🚀</span>
                        </div>
                        <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                            항공Product SQL
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Select a file from the sidebar to start editing queries.
                        </p>

                        <div className="flex items-center justify-center gap-2 pt-8">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-sm font-medium text-slate-500 tracking-wide font-mono">
                                Supabase Connected
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Table Header */}
                    <div className="flex items-center justify-between px-6 py-4 bg-[#1a1b26] border-b border-slate-800 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                                <Database className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                {table.schema_name && (
                                    <div className="text-[10px] font-mono text-slate-500 mb-0.5 tracking-wide">
                                        {table.schema_name}
                                    </div>
                                )}
                                <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                    {table.table_name}
                                    <span className="px-2 py-0.5 text-xs rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                        Table
                                    </span>
                                </h2>
                                {table.description && (
                                    <p className="text-sm text-slate-400">{table.description}</p>
                                )}
                            </div>
                        </div>
                        {/* New Query Button */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors shadow-lg shadow-cyan-900/20"
                        >
                            <FilePlus className="w-3.5 h-3.5" />
                            New Query
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto bg-[#1e1e1e]">
                        <div className="flex flex-col md:flex-row h-full w-full md:min-w-[1000px] min-w-0">
                            {/* Left: Editor (Mobile: Top, Desktop: Left 70%) */}
                            <div className="flex-1 flex flex-col border-r border-slate-800 border-b md:border-b-0 min-h-[50vh] md:min-h-0">
                                {/* Editor Toolbar (Only visible if a query is selected) */}
                                {selectedQuery ? (
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#252526]">
                                        <div className="flex items-center gap-2 w-1/2 group">
                                            <input
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                className="flex-1 bg-transparent text-slate-200 font-medium focus:outline-none border-b border-transparent focus:border-cyan-500 hover:border-slate-700 px-1 py-0.5 transition-all w-full min-w-0"
                                                placeholder="Query Title..."
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={handleUpdate}
                                                disabled={isSaving || !isModified}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 whitespace-nowrap"
                                            >
                                                <Save className="w-3.5 h-3.5" />
                                                <span className="hidden sm:inline">Save</span>
                                                <span className="sm:hidden">Save</span>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-4 py-3 border-b border-white/5 bg-[#252526] text-xs text-slate-500 italic">
                                        Select a query to edit or click "New Query" to create one.
                                    </div>
                                )}

                                <div className="flex-1 overflow-hidden p-0 relative">
                                    <SqlEditor code={sqlCode} onChange={selectedQuery ? setSqlCode : () => { }} />
                                </div>

                                {/* Link Input (Below Editor) */}
                                {/* Link Input (Below Editor) */}
                                {selectedQuery && (
                                    <div className="h-12 border-t border-slate-800 bg-[#252526] flex items-center px-4 gap-4 flex-shrink-0">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <LinkIcon className="w-4 h-4" />
                                            <span className="text-xs font-semibold uppercase tracking-wider">Link</span>
                                        </div>

                                        {!isLinkEditing && relatedLink ? (
                                            <div className="flex-1 flex items-center gap-2 min-w-0 group">
                                                <a
                                                    href={relatedLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline truncate font-mono"
                                                >
                                                    {relatedLink}
                                                </a>
                                                <button
                                                    onClick={() => setIsLinkEditing(true)}
                                                    className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                                    title="Edit Link"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    value={relatedLink}
                                                    onChange={(e) => setRelatedLink(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') setIsLinkEditing(false);
                                                    }}
                                                    className="flex-1 bg-[#1e1e1e] border border-slate-700/50 rounded px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                                                    placeholder="https://..."
                                                    autoFocus={isLinkEditing}
                                                />
                                                {relatedLink && (
                                                    <button
                                                        onClick={() => setIsLinkEditing(false)}
                                                        className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                                                        title="Done"
                                                    >
                                                        <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Right: Examples (Mobile: Bottom, Desktop: Right 30%) */}
                            <div className="w-full md:w-[350px] h-[40vh] md:h-full overflow-hidden border-l border-slate-800 bg-[#1a1b26] flex-shrink-0 flex flex-col">
                                <ExampleList
                                    queries={queries}
                                    selectedQueryId={selectedQuery?.id || null}
                                    onSelect={(q) => checkUnsavedChanges(() => handleSelectQuery(q))}
                                    onDelete={handleDeleteQuery}

                                    onReorder={async (newQueries) => {
                                        // Optimistic Update
                                        setQueries(newQueries);

                                        // API Update (Parallel)
                                        try {
                                            const updates = newQueries.map((q, index) => api.updateQueryOrder(q.id, index));
                                            await Promise.all(updates);
                                        } catch (e) {
                                            console.error("Failed to reorder queries", e);
                                            // Fallback? setQueries(oldQueries) potentially
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            <QueryCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreate}
            />



            <AIAssistantPanel isOpen={isAIPanelOpen} onClose={toggleAIPanel} />
        </div >
    );
}
