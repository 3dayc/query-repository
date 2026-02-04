
import { useState, useEffect } from 'react';
import { X, Save, Folder } from 'lucide-react';
import type { DbFolder } from '../types/db';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';

interface FolderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    folder: DbFolder | null;
    onUpdate: (updatedFolder: DbFolder) => void;
}

export function FolderEditModal({ isOpen, onClose, folder, onUpdate }: FolderEditModalProps) {
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { openAlert } = useAppStore();

    useEffect(() => {
        if (folder) {
            setName(folder.name);
        }
    }, [folder]);

    if (!isOpen || !folder) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        try {
            const updated = await api.updateFolder(folder.id, name);
            onUpdate(updated);
            onClose();
        } catch (error) {
            console.error('Failed to update folder:', error);
            openAlert('Error', 'Failed to update folder name.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-amber-100 rounded-lg">
                            <Folder className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Edit Folder</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Folder Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium text-slate-800"
                            placeholder="Enter folder name"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors mr-2"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving || !name.trim()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-md shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
