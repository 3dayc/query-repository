import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileCode, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { SearchResult } from '../types/db';
import { useAppStore } from '../store/useAppStore';


export function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const {
        openFolder,
        setSelectedTableId,
        setTargetQueryId,

    } = useAppStore();

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 0) {
                setIsLoading(true);
                try {
                    const data = await api.searchQueries(query);
                    setResults(data);
                    setIsOpen(true);
                } catch (error) {
                    console.error('Search failed:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Click Outside Handling
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleResultClick = (result: SearchResult) => {
        // Smart Navigation Logic
        if (result.tables?.folder_id) {
            openFolder(result.tables.folder_id);
        }
        setSelectedTableId(result.table_id);
        setTargetQueryId(result.id);

        // Close search
        setIsOpen(false);
        setQuery('');
    };

    // Highlight helper
    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;

        // Simple case-insensitive highlight logic
        // For long SQL code, we should probably truncate it around the match?
        // Let's just highlight first match or use simple split for now.
        // For UI simplicity in dropdown, titles are short. SQL code is long.
        // We'll trust browser/react rendering for title.

        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-amber-500/30 text-amber-200 font-bold px-0.5 rounded-sm">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    return (
        <div ref={wrapperRef} className="relative w-full max-w-xl">
            {/* Input Wrapper */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 text-cyan-500 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                    )}
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg 
                             text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                    placeholder="Search queries across all tables..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim().length > 0) setIsOpen(true);
                    }}
                />
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-[#1a1b26] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[100] max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                    {results.length > 0 ? (
                        <ul className="divide-y divide-slate-800">
                            {results.map((result) => (
                                <li
                                    key={result.id}
                                    onClick={() => handleResultClick(result)}
                                    className="p-3 hover:bg-slate-800 cursor-pointer transition-colors group flex items-start gap-3"
                                >
                                    <div className="mt-1 p-1.5 rounded bg-slate-800 border border-slate-700 group-hover:border-cyan-500/50 group-hover:text-cyan-400 text-slate-500 transition-colors">
                                        <FileCode className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="text-sm font-medium text-slate-200 truncate pr-2 group-hover:text-cyan-300 transition-colors">
                                                {highlightText(result.title, query)}
                                            </h4>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700 whitespace-nowrap">
                                                {result.tables?.table_name || 'Unknown Table'}
                                            </span>
                                        </div>
                                        {/* Snippet preview only if SQL matches? */}
                                        <p className="text-xs text-slate-500 line-clamp-2 font-mono bg-slate-900/50 p-1.5 rounded border border-slate-800/50">
                                            {highlightText(result.sql_code, query)}
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-all self-center transform group-hover:translate-x-1" />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No results found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
