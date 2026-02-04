import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface TableEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialName: string;
    initialDescription: string;
    initialSchema?: string;
    onSave: (name: string, description: string, schema: string) => Promise<void>;
}

export function TableEditModal({ isOpen, onClose, initialName, initialDescription, initialSchema, onSave }: TableEditModalProps) {
    const { openAlert } = useAppStore();
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [schema, setSchema] = useState(initialSchema || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setDescription(initialDescription || '');
            setSchema(initialSchema || '');
        }
    }, [isOpen, initialName, initialDescription, initialSchema]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            await onSave(name, description, schema);
            onClose();
        } catch (error) {
            console.error('Failed to save table:', error);
            openAlert('Error', 'Failed to save.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-[500px] bg-[#1a1b26] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()} // Prevent closing if click inside
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-[#1e1e1e]">
                    <h2 className="text-lg font-bold text-slate-100">
                        Edit File
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSave} className="flex-1 flex flex-col p-6 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">
                            Schema
                        </label>
                        <input
                            value={schema}
                            onChange={(e) => setSchema(e.target.value)}
                            placeholder="public"
                            className="w-full bg-[#13141f] border border-slate-700 rounded-md px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">
                            Table Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., users"
                            className="w-full bg-[#13141f] border border-slate-700 rounded-md px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Optional"
                            className="w-full bg-[#13141f] border border-slate-700 rounded-md px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-800/50 mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-md shadow-lg shadow-cyan-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save className="w-4 h-4" />
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
