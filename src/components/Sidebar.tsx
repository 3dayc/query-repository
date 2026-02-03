import { Table, Database, Plus, Trash2 } from 'lucide-react';
import type { DbTable } from '../types/db';
import clsx from 'clsx';
import { useState } from 'react';

interface SidebarProps {
    tables: DbTable[];
    selectedTableId: string | null;
    onSelectTable: (table: DbTable) => void;
    onCreateTable: (name: string, description: string) => void;
    onDeleteTable: (id: string) => void;
}

export function Sidebar({ tables, selectedTableId, onSelectTable, onCreateTable, onDeleteTable }: SidebarProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [newTableName, setNewTableName] = useState('');
    const [newTableDesc, setNewTableDesc] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTableName.trim()) return;

        onCreateTable(newTableName, newTableDesc);
        setIsCreating(false);
        setNewTableName('');
        setNewTableDesc('');
    };

    return (
        <div className="w-72 bg-slate-800 h-screen border-r border-slate-700 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Database className="text-cyan-400 w-6 h-6" />
                    <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                        Anti-Gravity
                    </h1>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-cyan-400 transition-colors"
                    title="Create New Table"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800/50">
                {isCreating && (
                    <form onSubmit={handleSubmit} className="mb-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="Table Name"
                                value={newTableName}
                                onChange={(e) => setNewTableName(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                                autoFocus
                            />
                            <input
                                type="text"
                                placeholder="Description (Optional)"
                                value={newTableDesc}
                                onChange={(e) => setNewTableDesc(e.target.value)}
                                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-2 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 text-white rounded"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">
                    Tables
                </h2>
                {tables.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-slate-500 text-center italic">
                        No tables found. Click + to add one.
                    </p>
                ) : (
                    <ul className="space-y-1">
                        {tables.map((table) => (
                            <li key={table.id} className="group relative">
                                <button
                                    onClick={() => onSelectTable(table)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-left transition-all",
                                        selectedTableId === table.id
                                            ? "bg-slate-700/80 text-cyan-400 border border-slate-600 shadow-sm"
                                            : "hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-transparent"
                                    )}
                                >
                                    <Table className={clsx(
                                        "w-4 h-4 transition-colors",
                                        selectedTableId === table.id ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"
                                    )} />
                                    <div className="flex-1 overflow-hidden">
                                        <span className="truncate block font-medium">{table.table_name}</span>
                                        {table.description && (
                                            <span className="text-[10px] text-slate-500 truncate block mt-0.5 opacity-80">
                                                {table.description}
                                            </span>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete table '${table.table_name}' and all its queries?`)) {
                                            onDeleteTable(table.id);
                                        }
                                    }}
                                    className="absolute right-2 top-2.5 p-1 text-slate-600 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-all bg-slate-800/10 hover:bg-slate-800 rounded"
                                    title="Delete Table"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
                © 2026 Dale Company
            </div>
        </div>
    );
}
