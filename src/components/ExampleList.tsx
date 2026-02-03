import type { Example } from '../data/mockData';
import clsx from 'clsx';
import { Lightbulb, ChevronRight } from 'lucide-react';

interface ExampleListProps {
    examples: Example[];
    onSelect: (sql: string) => void;
}

export function ExampleList({ examples, onSelect }: ExampleListProps) {
    return (
        <div className="h-full flex flex-col bg-slate-900 border-l border-slate-700">
            <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h3 className="font-semibold text-slate-200">Query Examples</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {examples.map((example, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect(example.sql)}
                        className={clsx(
                            "w-full text-left p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all group relative overflow-hidden",
                            "hover:border-cyan-500/50 hover:shadow-[0_0_15px_-5px_rgba(34,211,238,0.3)]"
                        )}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-200 group-hover:text-cyan-300 transition-colors">
                                {example.title}
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 font-mono group-hover:text-slate-400">
                            {example.sql}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
