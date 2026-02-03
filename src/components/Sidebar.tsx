import { Table, Database } from 'lucide-react';
import type { TableInfo } from '../data/mockData';
import clsx from 'clsx';

interface SidebarProps {
    tables: TableInfo[];
    onSelectTable: (table: TableInfo) => void;
}

export function Sidebar({ tables, onSelectTable }: SidebarProps) {
    return (
        <div className="w-64 bg-slate-800 h-screen border-r border-slate-700 flex flex-col">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <Database className="text-cyan-400 w-6 h-6" />
                <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    Anti-Gravity
                </h1>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2 mt-2">
                    Tables
                </h2>
                <ul className="space-y-1">
                    {tables.map((table) => (
                        <li key={table.id}>
                            <button
                                onClick={() => onSelectTable(table)}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors group",
                                    "hover:bg-slate-700 text-slate-300 hover:text-cyan-300"
                                )}
                            >
                                <Table className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                                <span>{table.tableName}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 border-t border-slate-700 text-xs text-slate-500">
                © 2026 Dale Company
            </div>
        </div>
    );
}
