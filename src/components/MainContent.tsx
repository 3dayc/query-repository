import { useEffect, useState, useCallback } from 'react';
import type { DbQuery } from '../types/db';
import { SqlEditor } from './SqlEditor';
import { ExampleList } from './ExampleList';
import { Database, Save, FilePlus } from 'lucide-react';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { QueryCreationModal } from './QueryCreationModal';

export function MainContent() {
    const { selectedTableId, tables, openAlert } = useAppStore();
    const table = tables.find(t => t.id === selectedTableId);

    const [queries, setQueries] = useState<DbQuery[]>([]);
    const [selectedQuery, setSelectedQuery] = useState<DbQuery | null>(null);

    // Editor State (for editing existing queries)
    const [sqlCode, setSqlCode] = useState('');
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchQueries = useCallback(async () => {
        if (!table) return;
        try {
            const data = await api.getQueries(table.id);
            setQueries(data);
        } catch (error) {
            console.error('Failed to fetch queries:', error);
        }
    }, [table]);

    useEffect(() => {
        if (table) {
            fetchQueries();
            // Default: Select first query if exists, or show blank/placeholder?
            // Actually, if we don't have "New Mode" inline, we should probably just clear selection.
            setSelectedQuery(null);
            setSqlCode('');
            setTitle('');
        }
    }, [table, fetchQueries]);

    const handleSelectQuery = (query: DbQuery) => {
        setSelectedQuery(query);
        setSqlCode(query.sql_code);
        setTitle(query.title);
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
            const updated = await api.updateQuery(selectedQuery.id, title, sqlCode);
            setQueries(queries.map(q => q.id === updated.id ? updated : q));
            setSelectedQuery(updated);
            openAlert('Success', 'Query saved successfully!');
        } catch (error) {
            console.error('Failed to save query:', error);
            openAlert('Error', 'Failed to save query.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle Create (Modal)
    const handleCreate = async (newTitle: string, newSql: string) => {
        if (!table) return;
        try {
            const newQuery = await api.createQuery(table.id, newTitle, newSql);
            setQueries([...queries, newQuery]);
            handleSelectQuery(newQuery); // Auto-select the new query
        } catch (error) {
            console.error(error);
            throw error; // Let modal handle error alert
        }
    };

    const handleDeleteQuery = async (id: string) => {
        try {
            await api.deleteQuery(id);
            setQueries(queries.filter(q => q.id !== id));
            if (selectedQuery?.id === id) {
                setSelectedQuery(null);
                setSqlCode('');
                setTitle('');
            }
        } catch (error) {
            console.error('Failed to delete query:', error);
        }
    };

    if (!table) {
        // ... (Empty state code remains same, omitted for brevity in replace check if it matches)
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#13141f]">
                <div className="max-w-md space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="inline-block p-4 rounded-full bg-slate-900/50 border border-slate-800 mb-4 animate-pulse">
                        <span className="text-4xl">🚀</span>
                    </div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent">
                        항공Product SQL
                    </h1>
                    <p className="text-slate-400 text-lg">
                        Select a file from the sidebar to start editing queries.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#13141f] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#1a1b26] border-b border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                        <Database className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
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
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Editor (70%) */}
                <div className="flex-1 flex flex-col bg-[#1e1e1e] border-r border-black/40">
                    {/* Editor Toolbar (Only visible if a query is selected) */}
                    {selectedQuery ? (
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#252526]">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-transparent text-slate-200 font-medium focus:outline-none focus:border-cyan-500 border-b border-transparent px-1 transition-colors w-1/2"
                                placeholder="Query Title..."
                            />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleUpdate}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-3 border-b border-white/5 bg-[#252526] text-xs text-slate-500 italic">
                            Select a query to edit or click "New Query" to create one.
                        </div>
                    )}

                    <div className="flex-1 overflow-hidden p-0 relative">
                        {/* Disable editor if no query selected? Or let them type but disable save? 
                            Let's keep it enabled but maybe show specific state. 
                            Actually, if sqlCode is state, we can just show it. 
                        */}
                        <SqlEditor code={sqlCode} onChange={selectedQuery ? setSqlCode : () => { }} />
                    </div>
                </div>

                {/* Right: Examples (30%) */}
                <div className="w-[350px] h-full overflow-hidden border-l border-slate-800 bg-[#1a1b26]">
                    <ExampleList
                        queries={queries}
                        selectedQueryId={selectedQuery?.id || null}
                        onSelect={handleSelectQuery}
                        onDelete={handleDeleteQuery}
                        onCreate={() => setIsModalOpen(true)}
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

            <QueryCreationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreate}
            />
        </div>
    );
}
