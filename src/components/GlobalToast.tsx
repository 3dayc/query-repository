import { useAppStore } from '../store/useAppStore';
import { Save } from 'lucide-react';

export function GlobalToast() {
    const { toast } = useAppStore();

    if (!toast.message) return null;

    return (
        <div
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 
            bg-[#1e1e2e] border border-slate-700/50 shadow-2xl rounded-r-md rounded-l-sm
            transition-opacity duration-500 ease-in-out
            ${toast.isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            ${toast.type === 'error' ? 'border-l-[3px] border-l-rose-500' :
                    toast.type === 'success' ? 'border-l-[3px] border-l-emerald-500' :
                        'border-l-[3px] border-l-cyan-500'}
        `}
        >
            {toast.type === 'success' && <div className="text-emerald-500"><Save className="w-4 h-4" /></div>}
            {toast.type === 'error' && <div className="w-4 h-4 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-xs">!</div>}
            <span className="font-medium text-sm text-slate-200 tracking-wide">{toast.message}</span>
        </div>
    );
}
