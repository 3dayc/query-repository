import { useAppStore } from '../store/useAppStore';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

export function ConfirmDialog() {
    const { modal, closeModal } = useAppStore();

    if (!modal.isOpen) return null;

    const handleConfirm = () => {
        if (modal.onConfirm) modal.onConfirm();
        closeModal();
    };

    const isDelete = modal.title.toLowerCase().includes('delete');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div
                className="w-[400px] bg-[#1a1b26] rounded-xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-[#1e1e1e]">
                    <div className="flex items-center gap-2">
                        {modal.type === 'confirm' ? (
                            <AlertTriangle className={clsx("w-5 h-5", isDelete ? "text-red-500" : "text-amber-500")} />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-cyan-500" />
                        )}
                        <h2 className="text-lg font-bold text-slate-100">
                            {modal.title}
                        </h2>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 text-slate-300 text-sm leading-relaxed">
                    {modal.message}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[#13141f] border-t border-slate-800 flex justify-end gap-3">
                    {modal.type === 'confirm' && (
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={clsx(
                            "px-4 py-2 text-sm font-bold text-white rounded-md shadow-lg transition-all",
                            modal.type === 'confirm'
                                ? (isDelete ? "bg-red-600 hover:bg-red-500 shadow-red-900/20" : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20")
                                : "bg-cyan-600 hover:bg-cyan-500 shadow-cyan-900/20"
                        )}
                    >
                        {modal.type === 'confirm' ? (isDelete ? 'Delete' : 'Continue') : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    );
}
