import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { useNavigate } from 'react-router-dom';
import { isEmailWhitelisted } from '../utils/whitelist';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { setUser } = useAppStore();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const SESSION_TIMEOUT = 6 * 60 * 60 * 1000; // 6 hours
        const LOGIN_KEY = 'query_repo_login_ts';

        const checkExpiry = () => {
            const stored = localStorage.getItem(LOGIN_KEY);
            if (stored) {
                const elapsed = Date.now() - parseInt(stored, 10);
                if (elapsed > SESSION_TIMEOUT) {
                    supabase.auth.signOut();
                    localStorage.removeItem(LOGIN_KEY);
                    useAppStore.getState().showToast('Session expired (6 hours limit). Please login again.', 'info');
                    useAppStore.getState().setUser(null);
                    navigate('/login', { replace: true });
                }
            }
        };

        // Initial Check
        checkExpiry();
        // Periodic Check (1 min)
        const interval = setInterval(checkExpiry, 60 * 1000);

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                navigate('/login', { replace: true });
                setIsLoading(false);
                return;
            }

            const email = session.user.email || session.user.user_metadata?.email;
            console.log('Auth check for:', email);

            if (!isEmailWhitelisted(email)) {
                // Not allowed
                supabase.auth.signOut();
                useAppStore.getState().showToast(`Access Denied: ${email} is not whitelisted.`, 'error');
                navigate('/login', { replace: true });
                setIsLoading(false);
            } else {
                // Set timestamp if missing (fresh session context)
                if (!localStorage.getItem(LOGIN_KEY)) {
                    localStorage.setItem(LOGIN_KEY, Date.now().toString());
                }
                setUser(session.user);
                setIsLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && !localStorage.getItem(LOGIN_KEY)) {
                localStorage.setItem(LOGIN_KEY, Date.now().toString());
            }
            if (event === 'SIGNED_OUT') {
                localStorage.removeItem(LOGIN_KEY);
            }

            if (!session) {
                navigate('/login', { replace: true });
            } else {
                const email = session.user.email || session.user.user_metadata?.email;
                if (!isEmailWhitelisted(email)) {
                    supabase.auth.signOut();
                    useAppStore.getState().showToast(`Access Denied: ${email} is not whitelisted.`, 'error');
                } else {
                    setUser(session.user);
                }
            }
        });

        return () => {
            subscription.unsubscribe();
            clearInterval(interval);
        };
    }, [navigate, setUser]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen bg-[#0f1016] flex items-center justify-center text-slate-400">
                <Loader2 className="animate-spin h-8 w-8 text-cyan-500" />
            </div>
        );
    }



    return <>{children}</>;
}
