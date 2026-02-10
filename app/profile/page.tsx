"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { Avatar } from '@/app/components/ui/Avatar';
import { generateKeyPair, saveKeyPair, exportPublicKey, loadKeyPair } from '@/app/lib/security';
import { ShieldCheck, Loader2, ArrowLeft, User, Shield, MapPin, Activity, LogOut } from 'lucide-react';
import { clsx } from "clsx";

export default function Profile() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [generatingKeys, setGeneratingKeys] = useState(false);
    const [keysExist, setKeysExist] = useState(false);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (!userData) {
            router.push('/login');
        } else {
            setUser(JSON.parse(userData));
        }

        // Check if keys exist
        loadKeyPair().then(keys => {
            if (keys) setKeysExist(true);
        });
    }, [router]);

    const handleGenerateKeys = async () => {
        setGeneratingKeys(true);
        try {
            const keyPair = await generateKeyPair();
            await saveKeyPair(keyPair);

            // Export public key and send to server
            const jwk = await exportPublicKey(keyPair.publicKey);

            if (user && user._id) {
                const res = await fetch('/api/users/keys', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user._id, publicKey: JSON.stringify(jwk) })
                });

                if (res.ok) {
                    setKeysExist(true);
                    alert("Deep-layer encryption keys generated and synced.");
                } else {
                    alert("Failed to sync public key with network node.");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Encryption protocol initialization failed.");
        } finally {
            setGeneratingKeys(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 flex flex-col items-center justify-center relative overflow-hidden font-sans">

            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-zinc-900/30 blur-[150px] rounded-full animate-void-pulse"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-zinc-800/30 blur-[150px] rounded-full animate-void-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 cyber-grid-bg opacity-10"></div>
            </div>

            <div className="w-full max-w-4xl relative z-10">
                <div className="mb-8 flex justify-between items-end">
                    <Link href="/" className="inline-flex items-center text-zinc-500 hover:text-white transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-mono text-xs tracking-widest uppercase">Return to Dashboard</span>
                    </Link>
                    <div className="text-right">
                        <h2 className="text-2xl font-bold font-mono text-white tracking-wider nodus-glow-text">COMMAND_CENTER</h2>
                        <p className="text-[10px] text-zinc-500 font-mono tracking-[0.3em] uppercase opacity-70">
                            User Clearance: Level 1
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Profile Card */}
                    <div className="md:col-span-2 glass-premium rounded-3xl p-1 border border-white/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                        <div className="bg-zinc-900/40 rounded-[22px] p-8 md:p-10 h-full relative z-10 backdrop-blur-md">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                                <div className="relative group/avatar">
                                    <div className="absolute -inset-1 bg-gradient-to-tr from-white/20 to-zinc-500/20 rounded-full opacity-70 blur-md group-hover/avatar:opacity-100 group-hover/avatar:blur-lg transition-all duration-500 animate-[spin_4s_linear_infinite]"></div>
                                    <div className="relative bg-black rounded-full p-1.5 ring-1 ring-white/20">
                                        <Avatar name={user.name} size="xl" className="w-28 h-28 text-2xl font-bold bg-black border border-white/10" />
                                    </div>
                                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 rounded-full border-4 border-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse"></div>
                                </div>

                                <div className="flex-1 text-center md:text-left space-y-6">
                                    <div>
                                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight font-mono">{user.name}</h1>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                            <span className="px-3 py-1 rounded-sm bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                                                <Shield className="w-3 h-3" />
                                                Verified Node
                                            </span>
                                            <span className="px-3 py-1 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                                                <Activity className="w-3 h-3" />
                                                Online
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-white/5 p-4 rounded-sm border-l-2 border-zinc-500 hover:bg-white/10 transition-colors group/item">
                                            <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1 group-hover/item:text-white transition-colors">Digital Frequency</label>
                                            <p className="text-zinc-300 font-mono text-xs truncate" title={user.email}>{user.email}</p>
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-sm border-l-2 border-white hover:bg-white/10 transition-colors group/item">
                                            <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold block mb-1 group-hover/item:text-white transition-colors">Signal Signature</label>
                                            <p className="text-white font-mono text-sm font-bold tracking-widest glow-text">{user.uniqueId}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Diagnostics / Keys Panel */}
                    <div className="glass-premium rounded-3xl p-1 border border-white/10 relative overflow-hidden flex flex-col">
                        <div className="bg-black/60 rounded-[22px] p-6 h-full flex flex-col relative z-20 backdrop-blur-xl">
                            <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-white" />
                                System Diagnostics
                            </h3>

                            <div className="flex-1 space-y-6">
                                {/* Encryption Status */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs text-zinc-500 font-mono">
                                        <span>ENCRYPTION_PROTOCOL</span>
                                        <span className={keysExist ? "text-emerald-400" : "text-amber-400"}>
                                            {keysExist ? "ACTIVE" : "MISSING"}
                                        </span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={clsx("h-full rounded-full transition-all duration-1000 ease-out", keysExist ? "w-full bg-emerald-500 shadow-[0_0_10px_#22c55e]" : "w-[20%] bg-amber-500 animate-pulse")} />
                                    </div>
                                </div>

                                {/* Key Visualizer */}
                                <div className="flex-1 min-h-[140px] bg-black/80 rounded-sm border border-white/10 p-4 relative overflow-hidden font-mono text-[10px] text-green-500/80 leading-tight select-none">
                                    <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,rgba(255,255,255,0.03)_1px,rgba(255,255,255,0.03)_2px)] pointer-events-none"></div>
                                    {generatingKeys ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 backdrop-blur-sm">
                                            <Loader2 className="w-8 h-8 text-white animate-spin mb-2" />
                                            <span className="text-white animate-pulse tracking-widest">GENERATING_KEYS...</span>
                                            <span className="text-xs text-zinc-500 mt-1">Calculating primes...</span>
                                        </div>
                                    ) : (
                                        <div className="opacity-70 break-all text-emerald-500">
                                            {keysExist
                                                ? "01001011 01000101 01011001 01011011 01010010 01000101 01000001 01000100 01011001 01011101 00101110 00101110 00101110 RSA-OAEP-256 SHA-256 MGF1 GENERATED SECURE STORAGE LOCKED"
                                                : "WARNING: NO ENCRYPTION KEYS FOUND. COMM CHANNELS INSECURE. INITIALIZE IMMEDIATE."}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-auto pt-4">
                                    {!keysExist ? (
                                        <Button
                                            onClick={handleGenerateKeys}
                                            disabled={generatingKeys}
                                            className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/50 backdrop-blur-sm group relative overflow-hidden"
                                            size="sm"
                                        >
                                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                                            {generatingKeys ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Shield className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                                            <span className="font-mono tracking-wider">INITIALIZE_KEYS</span>
                                        </Button>
                                    ) : (
                                        <div className="text-center">
                                            <p className="text-[10px] text-emerald-500/70 font-mono mb-3">SECURE HANDSHAKE ESTABLISHED</p>
                                            <Button
                                                variant="ghost"
                                                className="w-full text-zinc-500 hover:text-white border border-white/5 hover:border-white/20 text-xs font-mono"
                                                onClick={() => {
                                                    if (confirm("Regenerate keys? Previous messages will become unreadable.")) handleGenerateKeys();
                                                }}
                                            >
                                                Rotate Keys (Destructive)
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-center">
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2 border border-red-500/20 hover:border-red-500/40 neon-text-red transition-all px-8"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="font-mono tracking-widest text-xs">TERMINATE_SESSION</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
