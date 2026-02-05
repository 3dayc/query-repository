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
                setUser(session.user);
                setIsLoading(false);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                navigate('/login', { replace: true });
            } else {
                const email = session.user.email || session.user.user_metadata?.email;
                console.log('AuthStateChange check for:', email);

                if (!isEmailWhitelisted(email)) {
                    supabase.auth.signOut();
                    useAppStore.getState().showToast(`Access Denied: ${email} is not whitelisted.`, 'error');
                } else {
                    setUser(session.user);
                }
            }
        });

        return () => subscription.unsubscribe();
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
