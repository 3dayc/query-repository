import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Sparkles, Loader2 } from 'lucide-react';

export function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Failed to login with Google');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#0f1016] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#16161e] border border-slate-700 rounded-2xl shadow-2xl p-8 flex flex-col items-center">

                {/* Logo / Branding */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 border border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        <Sparkles className="w-8 h-8 text-cyan-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">항공Product SQL</h1>
                    <p className="text-slate-400 mt-2 text-sm text-center">
                        Secure access for authorized personnel only
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-medium rounded-lg transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                    ) : (
                        <img
                            src="https://www.google.com/favicon.ico"
                            alt="Google"
                            className="w-5 h-5"
                        />
                    )}
                    <span>
                        {isLoading ? 'Connecting...' : 'Sign in with Google'}
                    </span>
                </button>

                <p className="mt-6 text-xs text-slate-500 text-center">
                    By signing in, you agree to the updated<br />Security Protocols & Access Control List
                </p>
            </div>
        </div>
    );
}
