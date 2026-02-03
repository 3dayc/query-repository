import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import clsx from 'clsx';
import { SqlEditor } from './SqlEditor';
import type { DbQuery } from '../types/db';

interface QueryCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string, sqlCode: string) => Promise<void>;
    initialQuery?: DbQuery | null;
}

export function QueryCreationModal({ isOpen, onClose, onSave, initialQuery }: QueryCreationModalProps) {
    const [title, setTitle] = useState('');
    const [sqlCode, setSqlCode] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialQuery) {
                setTitle(initialQuery.title);
                setSqlCode(initialQuery.sql_code);
            } else {
                setTitle('');
                setSqlCode('');
            }
        }
    }, [isOpen, initialQuery]);

    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!title.trim() || !sqlCode.trim()) {
            setError('값을 입력해주세요'); // Korean message as requested
            return;
        }
        setError('');

        setIsSaving(true);
        try {
            await onSave(title, sqlCode);
            onClose();
        } catch (error) {
            console.error(error);
            setError('Failed to save query');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-[800px] h-[600px] bg-[#1a1b26] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-[#1e1e1e]">
                    <h2 className="text-lg font-bold text-slate-100">
                        {initialQuery ? 'Edit Query' : 'New Query'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col p-6 gap-4 overflow-hidden">
                    {/* Title Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                            Query Title
                        </label>
                        <input
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                if (error) setError('');
                            }}
                            placeholder="e.g., Daily Active Users"
                            className={clsx(
                                "w-full bg-[#13141f] border rounded-md px-4 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 transition-all",
                                error && !title.trim() ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : "border-slate-700 focus:border-cyan-500 focus:ring-cyan-500/50"
                            )}
                            autoFocus
                        />
                    </div>

                    {/* SQL Editor */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                            SQL Query
                        </label>
                        <div className={clsx(
                            "flex-1 border rounded-md overflow-hidden bg-[#13141f] relative group",
                            error && !sqlCode.trim() ? "border-red-500" : "border-slate-700"
                        )}>
                            <SqlEditor code={sqlCode} onChange={(val) => {
                                setSqlCode(val);
                                if (error) setError('');
                            }} />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-red-500 text-xs font-medium animate-in slide-in-from-top-1">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#1e1e1e] border-t border-slate-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save Query'}
                    </button>
                </div>
            </div>
        </div>
    );
}
