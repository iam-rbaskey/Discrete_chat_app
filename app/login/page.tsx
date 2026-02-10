
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Loader2, LogIn, Key, Wifi } from 'lucide-react';
import { clsx } from "clsx";

export default function Login() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const uniqueId = formData.get('uniqueId');
        const password = formData.get('password');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uniqueId, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Access Denied');
            }

            // Store token
            localStorage.setItem('token', data.token);

            // Validate and store user data
            const userData = data.user;
            if (userData && !userData._id && userData.id) {
                userData._id = userData.id; // consistency
            }

            localStorage.setItem('user', JSON.stringify(userData));

            router.push('/'); // Go to chat dashboard

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[--color-background] p-4 relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none bg-black">
                <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] bg-zinc-800/20 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] bg-zinc-900/20 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-sm w-full bg-zinc-950 p-8 rounded-2xl border border-zinc-800 relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl border border-zinc-800 mx-auto flex items-center justify-center mb-4 shadow-none">
                        <Wifi className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-widest uppercase">
                        Terminal Access
                    </h1>
                    <p className="text-zinc-500 text-xs mt-1 font-mono">Secure Connection Required</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-900/20 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-mono">
                        ⚠ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1 relative group">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[--color-accent] rounded-full"></span>
                            Signal ID
                        </label>
                        <input
                            name="uniqueId"
                            type="text"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono tracking-[0.2em] focus:outline-none focus:border-[--color-accent] focus:shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all placeholder:text-slate-700"
                            placeholder="A1B2C"
                            maxLength={5}
                        />
                    </div>

                    <div className="space-y-1 relative">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[--color-secondary] rounded-full"></span>
                            Access Key
                        </label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-mono tracking-widest focus:outline-none focus:border-[--color-secondary] focus:shadow-[0_0_15px_rgba(124,58,237,0.2)] transition-all placeholder:text-slate-700"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 mt-6 bg-[--color-accent] hover:bg-cyan-400 text-black font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all skew-x-0 overflow-hidden relative group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <>
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
                                <span className="flex items-center gap-2 relative z-10">
                                    <LogIn className="w-4 h-4" />
                                    Establish Link
                                </span>
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-white/5 pt-4">
                    <p className="text-slate-500 text-xs">
                        No signal ID?{' '}
                        <Link href="/register" className="text-[--color-secondary] hover:text-violet-300 font-bold transition-colors uppercase tracking-wider ml-1">
                            Initialize
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
