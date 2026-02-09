
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react';

export default function Register() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uniqueId, setUniqueId] = useState('');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name');
        const email = formData.get('email');
        const gender = formData.get('gender');
        const country = formData.get('country');
        const password = formData.get('password');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, gender, country, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            setUniqueId(data.user.uniqueId);
            // Optional: Auto-login or redirect after delay

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (uniqueId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[--color-background] p-4">
                <div className="max-w-md w-full glass-premium p-8 rounded-2xl border border-[--color-accent]/20 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[--color-accent] to-transparent animate-pulse-slow"></div>

                    <div className="mb-6 flex justify-center">
                        <div className="w-20 h-20 rounded-full bg-[--color-accent]/10 flex items-center justify-center ring-2 ring-[--color-accent]/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                            <ShieldCheck className="w-10 h-10 text-[--color-accent]" />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">Identity Established</h2>
                    <p className="text-slate-400 mb-6">Your secure comms ID has been generated.</p>

                    <div className="bg-black/40 p-6 rounded-xl border border-[--color-accent]/30 mb-8 relative group">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#020617] px-3 text-[10px] text-[--color-accent] uppercase tracking-widest border border-[--color-accent]/20 rounded-full">
                            Unique Signal ID
                        </span>
                        <div className="text-4xl font-mono font-bold text-white tracking-[0.2em] neon-text-cyan select-all cursor-pointer hover:scale-105 transition-transform">
                            {uniqueId}
                        </div>
                        <p className="text-xs text-slate-500 mt-2 font-mono">Share this ID to connect.</p>
                    </div>

                    <Link href="/login">
                        <Button className="w-full bg-[--color-accent] text-black hover:bg-cyan-400 font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                            Proceed to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[--color-background] p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[--color-secondary]/10 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[--color-accent]/5 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-md w-full glass-premium p-8 rounded-2xl border border-white/5 relative z-10 backdrop-blur-xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tight mb-2">
                        Establish Link
                    </h1>
                    <p className="text-slate-400 text-sm">Create a secure identity to begin transmission.</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Codename</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[--color-accent]/50 focus:bg-black/40 transition-all placeholder:text-slate-600"
                            placeholder="Enter alias"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Frequency (Email)</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[--color-accent]/50 focus:bg-black/40 transition-all placeholder:text-slate-600"
                            placeholder="secure@frequency.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Bio-Signature</label>
                            <select
                                name="gender"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[--color-accent]/50 focus:bg-black/40 transition-all appearance-none cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled className="text-slate-600">Select Gender</option>
                                <option value="male" className="bg-black">Male</option>
                                <option value="female" className="bg-black">Female</option>
                                <option value="other" className="bg-black">Non-Binary</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Origin Node</label>
                            <input
                                name="country"
                                type="text"
                                required
                                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[--color-accent]/50 focus:bg-black/40 transition-all placeholder:text-slate-600"
                                placeholder="Country"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-slate-500 font-bold ml-1">Encryption Key</label>
                        <input
                            name="password"
                            type="password"
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[--color-accent]/50 focus:bg-black/40 transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 mt-4 bg-[--color-secondary] hover:bg-violet-600 text-white font-bold tracking-wide shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <span className="flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Initialize Identity
                            </span>
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm">
                        Already have an ID?{' '}
                        <Link href="/login" className="text-[--color-accent] hover:text-cyan-300 font-medium transition-colors">
                            Access Terminal
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
