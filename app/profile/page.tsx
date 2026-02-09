
"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Avatar } from '@/app/components/ui/Avatar';
import { ArrowLeft, User, Shield, MapPin, Activity, LogOut } from 'lucide-react';

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[--color-background] text-white p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden">

            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[--color-secondary]/10 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[--color-accent]/5 blur-[150px] rounded-full"></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)' }}></div>
            </div>

            <div className="w-full max-w-2xl relative z-10">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Return to Dashboard
                    </Link>
                </div>

                <div className="glass-premium rounded-3xl p-8 md:p-12 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[--color-accent] to-transparent opacity-50"></div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-[--color-accent] to-[--color-secondary] rounded-full opacity-70 blur-md group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative bg-[#050b18] rounded-full p-2">
                                <Avatar name={user.name} size="xl" className="w-32 h-32 text-2xl font-bold" />
                            </div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-[#050b18] shadow-[0_0_10px_#22c55e]"></div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{user.name}</h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-6">
                                <span className="px-3 py-1 rounded-full bg-[--color-secondary]/10 border border-[--color-secondary]/20 text-[--color-secondary] text-xs font-mono uppercase tracking-wider flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Level 1 Clearance
                                </span>
                                <span className="px-3 py-1 rounded-full bg-[--color-accent]/10 border border-[--color-accent]/20 text-[--color-accent] text-xs font-mono uppercase tracking-wider flex items-center gap-1">
                                    <Activity className="w-3 h-3" />
                                    Signal Active
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Frequency (Email)</label>
                                    <p className="text-slate-200 font-mono text-sm">{user.email}</p>
                                </div>
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1">Signal ID</label>
                                    <p className="text-[--color-accent] font-mono text-lg font-bold tracking-widest">{user.uniqueId}</p>
                                </div>
                                {user.gender && (
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1 flex items-center gap-1">
                                            <User className="w-3 h-3" /> Bio-Signature
                                        </label>
                                        <p className="text-slate-200 capitalize">{user.gender}</p>
                                    </div>
                                )}
                                {user.country && (
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block mb-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> Origin Node
                                        </label>
                                        <p className="text-slate-200 capitalize">{user.country}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-end">
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 border border-transparent hover:border-red-500/20"
                        >
                            <LogOut className="w-4 h-4" />
                            Terminate Session
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
