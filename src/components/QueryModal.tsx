import { useEffect, useState, useCallback } from 'react';
import type { DbTable, DbQuery } from '../types/db';
import { SqlEditor } from './SqlEditor';
import { ExampleList } from './ExampleList';
import { X, Database, Save, FilePlus } from 'lucide-react';
import { api } from '../services/api';


interface QueryModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: DbTable;
}

export function QueryModal({ isOpen, onClose, table }: QueryModalProps) {
    const [queries, setQueries] = useState<DbQuery[]>([]);
    const [selectedQuery, setSelectedQuery] = useState<DbQuery | null>(null);

    // Editor State
    const [sqlCode, setSqlCode] = useState('');
    const [title, setTitle] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isNewMode, setIsNewMode] = useState(false);

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
        if (isOpen && table) {
            fetchQueries();
            resetEditor(); // Reset to "New Query" state initially
        }
    }, [isOpen, table, fetchQueries]);

    const resetEditor = () => {
        setSelectedQuery(null);
        setSqlCode('');
        setTitle('New Query');
        setIsNewMode(true);
    };

    const handleSelectQuery = (query: DbQuery) => {
        setSelectedQuery(query);
        setSqlCode(query.sql_code);
        setTitle(query.title);
        setIsNewMode(false);
    };

    const handleSave = async () => {
        if (!title.trim() || !sqlCode.trim()) {
            alert('Title and SQL Code are required.');
            return;
        }

        setIsSaving(true);
        try {
            if (isNewMode || !selectedQuery) {
                // Create
                const newQuery = await api.createQuery(table.id, title, sqlCode);
                setQueries([...queries, newQuery]);
                handleSelectQuery(newQuery); // Switch to view mode
            } else {
                // Update
                const updated = await api.updateQuery(selectedQuery.id, title, sqlCode);
                setQueries(queries.map(q => q.id === updated.id ? updated : q));
                setSelectedQuery(updated);
            }
        } catch (error) {
            console.error('Failed to save query:', error);
            alert('Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteQuery = async (id: string) => {
        try {
            await api.deleteQuery(id);
            setQueries(queries.filter(q => q.id !== id));
            if (selectedQuery?.id === id) {
                resetEditor();
            }
        } catch (error) {
            console.error('Failed to delete query:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm bg-black/60 transition-opacity animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-6xl h-[85vh] bg-[#1a1b26] rounded-xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700 flex-shrink-0">
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
                            <p className="text-sm text-slate-400">{table.description}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Left: Editor (70%) */}
                    <div className="w-[70%] flex flex-col bg-[#1e1e1e]">
                        {/* Editor Toolbar */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#252526]">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-transparent text-slate-200 font-medium focus:outline-none focus:border-cyan-500 border-b border-transparent px-1 transition-colors w-1/2"
                                placeholder="Query Title..."
                            />
                            <div className="flex items-center gap-2">
                                {isNewMode && (
                                    <span className="text-xs text-yellow-500 flex items-center gap-1 mr-2 px-2 py-1 bg-yellow-500/10 rounded">
                                        <FilePlus className="w-3 h-3" /> New
                                    </span>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors disabled:opacity-50"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    {isSaving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden p-0 relative">
                            <SqlEditor code={sqlCode} onChange={setSqlCode} />
                        </div>
                    </div>

                    {/* Right: Examples (30%) */}
                    <div className="w-[30%] h-full overflow-hidden">
                        <ExampleList
                            queries={queries}
                            selectedQueryId={selectedQuery?.id || null}
                            onSelect={handleSelectQuery}
                            onDelete={handleDeleteQuery}
                            onCreate={resetEditor}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
