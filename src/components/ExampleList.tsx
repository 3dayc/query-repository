import type { DbQuery } from '../types/db';
import clsx from 'clsx';
import { Lightbulb, ChevronRight, Trash2, Plus } from 'lucide-react';

interface ExampleListProps {
    queries: DbQuery[];
    selectedQueryId: string | null;
    onSelect: (query: DbQuery) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}

export function ExampleList({ queries, selectedQueryId, onSelect, onDelete, onCreate }: ExampleListProps) {
    return (
        <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <h3 className="font-semibold text-slate-200">Examples</h3>
                </div>
                <button
                    onClick={onCreate}
                    className="p-1 hover:bg-slate-800 rounded text-cyan-400 hover:text-cyan-300 transition-colors"
                    title="New Query"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
                {queries.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No queries yet.</p>
                ) : (
                    queries.map((query) => (
                        <div key={query.id} className="relative group">
                            <button
                                onClick={() => onSelect(query)}
                                className={clsx(
                                    "w-full text-left p-3 rounded-lg border transition-all relative overflow-hidden",
                                    selectedQueryId === query.id
                                        ? "bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_-5px_rgba(34,211,238,0.2)]"
                                        : "bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600"
                                )}
                            >
                                <div className="flex items-center justify-between mb-1 pr-6">
                                    <span className={clsx(
                                        "font-medium transition-colors text-sm truncate",
                                        selectedQueryId === query.id ? "text-cyan-300" : "text-slate-300 group-hover:text-slate-200"
                                    )}>
                                        {query.title}
                                    </span>
                                    {selectedQueryId === query.id && (
                                        <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 line-clamp-2 font-mono opacity-70">
                                    {query.sql_code}
                                </p>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm('Delete this query?')) onDelete(query.id);
                                }}
                                className="absolute right-2 top-2 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-900/80 rounded opacity-0 group-hover:opacity-100 transition-all z-10"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
