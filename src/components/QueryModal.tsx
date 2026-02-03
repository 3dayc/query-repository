import { useEffect, useState } from 'react';
import type { TableInfo } from '../data/mockData';
import { SqlEditor } from './SqlEditor';
import { ExampleList } from './ExampleList';
import { X, Database } from 'lucide-react';


interface QueryModalProps {
    isOpen: boolean;
    onClose: () => void;
    table: TableInfo | null;
}

export function QueryModal({ isOpen, onClose, table }: QueryModalProps) {
    const [currentSql, setCurrentSql] = useState('');

    // Update SQL when table changes
    useEffect(() => {
        if (table && table.examples.length > 0) {
            setCurrentSql(table.examples[0].sql);
        } else {
            setCurrentSql('');
        }
    }, [table]);

    if (!isOpen || !table) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 backdrop-blur-sm bg-black/60 transition-opacity animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative w-full max-w-6xl h-[85vh] bg-[#1a1b26] rounded-xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                            <Database className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                {table.tableName}
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
                    <div className="w-[70%] p-4 bg-[#1a1b26]">
                        <SqlEditor code={currentSql} onChange={setCurrentSql} />
                    </div>

                    {/* Right: Examples (30%) */}
                    <div className="w-[30%]">
                        <ExampleList
                            examples={table.examples}
                            onSelect={(sql) => setCurrentSql(sql)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
