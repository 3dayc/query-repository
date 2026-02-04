import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { RefreshCw, Trash2, ArrowLeft, Folder, Database, FileText, AlertTriangle, RotateCcw } from 'lucide-react';
import type { DbFolder, DbTable, DbQuery } from '../types/db';
import clsx from 'clsx';

export function TrashBin() {
    const { setViewMode, openConfirm, showToast, addFolder, addTable } = useAppStore();

    // We treat queries as 'any' because of the joined 'tables' property which isn't in DbQuery strict type
    const [trash, setTrash] = useState<{ folders: DbFolder[], tables: DbTable[], queries: any[] }>({ folders: [], tables: [], queries: [] });
    const [loading, setLoading] = useState(true);

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const data = await api.getTrashItems();
            setTrash(data);
        } catch (error) {
            console.error(error);
            showToast('Failed to load trash', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, []);

    // --- Restore Handlers ---
    const handleRestoreFolder = async (item: DbFolder) => {
        try {
            await api.restoreFolder(item.id);
            setTrash(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== item.id) }));
            addFolder({ ...item, deleted_at: null });
            showToast('Folder restored', 'success');
        } catch (e) { console.error(e); showToast('Failed to restore folder', 'error'); }
    };

    const handleRestoreTable = async (item: DbTable) => {
        try {
            await api.restoreTable(item.id);
            setTrash(prev => ({ ...prev, tables: prev.tables.filter(t => t.id !== item.id) }));
            addTable({ ...item, deleted_at: null });
            showToast('Table restored', 'success');
        } catch (e) { console.error(e); showToast('Failed to restore table', 'error'); }
    };

    const handleRestoreQuery = async (item: any) => {
        try {
            await api.restoreQuery(item.id);
            setTrash(prev => ({ ...prev, queries: prev.queries.filter(q => q.id !== item.id) }));
            showToast('Query restored', 'success');
        } catch (e) { console.error(e); showToast('Failed to restore query', 'error'); }
    };

    // --- Hard Delete Handlers ---
    const handleHardDeleteFolder = (item: DbFolder) => {
        openConfirm('Permanent Delete', `Permanently delete folder "${item.name}"? This cannot be undone.`, async () => {
            try {
                await api.hardDeleteFolder(item.id);
                setTrash(prev => ({ ...prev, folders: prev.folders.filter(f => f.id !== item.id) }));
                showToast('Permanently deleted', 'success');
            } catch (e) { console.error(e); showToast('Failed to delete', 'error'); }
        });
    };

    const handleHardDeleteTable = (item: DbTable) => {
        openConfirm('Permanent Delete', `Permanently delete table "${item.table_name}"?`, async () => {
            try {
                await api.hardDeleteTable(item.id);
                setTrash(prev => ({ ...prev, tables: prev.tables.filter(t => t.id !== item.id) }));
                showToast('Permanently deleted', 'success');
            } catch (e) { console.error(e); showToast('Failed to delete', 'error'); }
        });
    };

    const handleHardDeleteQuery = (item: any) => {
        openConfirm('Permanent Delete', `Permanently delete query "${item.title}"?`, async () => {
            try {
                await api.hardDeleteQuery(item.id);
                setTrash(prev => ({ ...prev, queries: prev.queries.filter(q => q.id !== item.id) }));
                showToast('Permanently deleted', 'success');
            } catch (e) { console.error(e); showToast('Failed to delete', 'error'); }
        });
    };

    const handleEmptyTrash = () => {
        openConfirm('Empty Trash', 'Are you sure you want to permanently delete all items in the trash? This cannot be undone.', async () => {
            try {
                await api.emptyTrash();
                setTrash({ folders: [], tables: [], queries: [] });
                showToast('Trash emptied', 'success');
            } catch (e) {
                console.error(e);
                showToast('Failed to empty trash', 'error');
            }
        });
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#13141f] text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    const isEmpty = trash.folders.length === 0 && trash.tables.length === 0 && trash.queries.length === 0;

    return (
        <div className="flex-1 flex flex-col h-screen bg-[#13141f] overflow-hidden">
            {/* Header */}
            <div className="h-16 border-b border-slate-800 bg-[#0f1016] flex items-center px-6 justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('main')} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 text-slate-200 text-lg font-bold">
                        <Trash2 className="w-5 h-5 text-rose-500" />
                        <span>Trash Bin</span>
                    </div>
                </div>

                <button
                    onClick={handleEmptyTrash}
                    disabled={isEmpty}
                    className={clsx(
                        "px-3 py-1.5 rounded text-xs font-bold transition-colors flex items-center gap-2 border",
                        isEmpty
                            ? "bg-slate-800/50 text-slate-600 border-slate-700 cursor-not-allowed"
                            : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20 hover:border-rose-500/40"
                    )}
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Empty Trash
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-8">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <Trash2 className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-lg">Trash is empty</p>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-8">
                        {/* Folders */}
                        {trash.folders.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Folder className="w-4 h-4" /> Folders
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {trash.folders.map(item => (
                                        <TrashItem
                                            key={item.id}
                                            icon={<Folder className="w-5 h-5 text-amber-500" />}
                                            name={item.name}
                                            deletedAt={item.deleted_at}
                                            onRestore={() => handleRestoreFolder(item)}
                                            onDelete={() => handleHardDeleteFolder(item)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Tables */}
                        {trash.tables.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Database className="w-4 h-4" /> Files
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {trash.tables.map(item => (
                                        <TrashItem
                                            key={item.id}
                                            icon={<Database className="w-5 h-5 text-cyan-500" />}
                                            name={item.table_name}
                                            subtext={item.description}
                                            deletedAt={item.deleted_at}
                                            onRestore={() => handleRestoreTable(item)}
                                            onDelete={() => handleHardDeleteTable(item)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Queries */}
                        {trash.queries.length > 0 && (
                            <section>
                                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Queries
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {trash.queries.map(item => (
                                        <TrashItem
                                            key={item.id}
                                            icon={<FileText className="w-5 h-5 text-emerald-500" />}
                                            name={item.title}
                                            subtext={item.tables?.table_name ? `in ${item.tables.table_name}` : 'Unknown Table'}
                                            deletedAt={item.deleted_at}
                                            onRestore={() => handleRestoreQuery(item)}
                                            onDelete={() => handleHardDeleteQuery(item)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function TrashItem({ icon, name, subtext, deletedAt, onRestore, onDelete }: any) {
    return (
        <div className="bg-[#1a1b26] border border-slate-700/50 rounded-lg p-4 flex items-center justify-between group hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-slate-800 rounded-md">
                    {icon}
                </div>
                <div className="min-w-0">
                    <h4 className="text-slate-200 font-medium truncate">{name}</h4>
                    {subtext && <p className="text-xs text-slate-500 truncate">{subtext}</p>}
                    <p className="text-[10px] text-slate-600 mt-0.5">
                        Deleted: {new Date(deletedAt).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={onRestore}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                    title="Restore"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                    title="Delete Permanently"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
