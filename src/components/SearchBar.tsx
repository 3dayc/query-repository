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
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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
                    if (!isMobileSearchOpen) setIsOpen(true);
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
    }, [query, isMobileSearchOpen]);

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
        if (result.tables?.folder_id) {
            openFolder(result.tables.folder_id);
        }
        setSelectedTableId(result.table_id);
        setTargetQueryId(result.id);

        setIsOpen(false);
        setIsMobileSearchOpen(false);
        setQuery('');
    };

    // Highlight helper
    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;

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
        <div ref={wrapperRef} className="relative w-full">
            {/* Desktop Input */}
            <div className="hidden md:block relative w-full h-full group">
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

            {/* Mobile Trigger Icon */}
            <button
                className="md:hidden flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors ml-auto"
                onClick={() => setIsMobileSearchOpen(true)}
            >
                <Search className="w-6 h-6" />
            </button>

            {/* Mobile Fullscreen Overlay */}
            {isMobileSearchOpen && (
                <div className="fixed inset-0 z-[100] bg-[#0f1016] flex flex-col animate-in fade-in duration-200">
                    <div className="h-16 flex items-center px-4 border-b border-slate-800 gap-3">
                        <button onClick={() => setIsMobileSearchOpen(false)} className="p-1 -ml-1 text-slate-400">
                            <ArrowRight className="w-6 h-6 rotate-180" /> {/* Back Icon using ArrowRight */}
                        </button>
                        <div className="flex-1 relative">
                            <input
                                autoFocus
                                type="text"
                                className="w-full bg-transparent text-lg text-slate-200 placeholder-slate-500 focus:outline-none"
                                placeholder="Search..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                        {isLoading && <Loader2 className="h-5 w-5 text-cyan-500 animate-spin" />}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {results.length > 0 ? (
                            <ul className="space-y-4">
                                {results.map((result) => (
                                    <li
                                        key={result.id}
                                        onClick={() => handleResultClick(result)}
                                        className="p-4 bg-slate-900 rounded-lg border border-slate-800 active:bg-slate-800 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-base font-bold text-slate-200">
                                                {highlightText(result.title, query)}
                                            </h4>
                                            <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                                {result.tables?.table_name}
                                            </span>
                                        </div>
                                        {result.tables?.description && (
                                            <div className="text-xs text-slate-500 mb-2 px-1 border-l-2 border-slate-700 pl-2">
                                                {highlightText(result.tables.description, query)}
                                            </div>
                                        )}
                                        <p className="text-sm text-slate-500 line-clamp-3 font-mono">
                                            {highlightText(result.sql_code, query)}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : query.length > 0 ? (
                            <div className="text-center text-slate-500 mt-10">
                                No results found for "{query}"
                            </div>
                        ) : (
                            <div className="text-center text-slate-600 mt-10 text-sm">
                                Type to search queries...
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Desktop Dropdown Results */}
            {isOpen && !isMobileSearchOpen && (
                <div className="absolute top-full mt-2 w-full bg-[#1a1b26] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[100] max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 hidden md:block">
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
                                        {result.tables?.description && (
                                            <div className="text-[10px] text-slate-500 mb-1.5 truncate border-l-2 border-slate-700 pl-1.5 ml-0.5">
                                                {highlightText(result.tables.description, query)}
                                            </div>
                                        )}
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
