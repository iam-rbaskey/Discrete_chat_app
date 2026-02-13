"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { ShieldCheck, Users, Activity, HardDrive, ArrowLeft, LogOut, MoreVertical, AlertTriangle, Bell, Lock, Unlock, Key } from 'lucide-react';
import { clsx } from "clsx";

interface User {
    _id: string;
    name: string;
    email: string;
    uniqueId: string;
    role: string;
    clearanceLevel?: number;
    status: string;
    minutesActive?: number;
    dataUsage?: number;
    lastActive?: Date;
    isSuspended?: boolean;
}

export default function AdminPanel() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeStats: 0,
        dataTransferredBytes: 0,
        totalMinutesActive: 0
    });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [notifyingUser, setNotifyingUser] = useState<User | null>(null);
    const [notificationMsg, setNotificationMsg] = useState("");

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (!token || !userData) {
            router.push('/login');
            return;
        }

        try {
            const user = JSON.parse(userData);
            if (user.role !== 'admin') {
                alert("ACCESS DENIED: LEVEL 5 CLEARANCE REQUIRED");
                router.push('/');
                return;
            }

            fetchAllData(token);
        } catch (e) {
            router.push('/login');
        }
    }, [router]);

    const fetchAllData = async (token: string) => {
        try {
            // Parallel fetch for speed
            const [usersRes, statsRes] = await Promise.all([
                fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (usersRes.ok && statsRes.ok) {
                const usersData = await usersRes.json();
                const statsData = await statsRes.json();
                setUsers(usersData.users);
                setStats(statsData.stats);
            }
        } catch (error) {
            console.error("Admin fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (userId: string, updates: any) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const data = await res.json();
                setUsers(users.map(u => u._id === userId ? { ...u, ...updates } : u));
                setEditingUser(null);
            } else {
                alert("Failed to update user");
            }
        } catch (e) {
            console.error("Update failed", e);
        }
    };

    const handleSendNotification = async () => {
        if (!notifyingUser || !notificationMsg.trim()) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const res = await fetch(`/api/admin/users/${notifyingUser._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ message: notificationMsg })
            });

            if (res.ok) {
                alert("Notification dispatched.");
                setNotifyingUser(null);
                setNotificationMsg("");
            } else {
                alert("Failed to dispatch notification.");
            }
        } catch (e) {
            console.error("Notification failed", e);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = Math.floor(minutes % 60);
        return `${h}h ${m}m`;
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin mb-4"></div>
                <p className="text-zinc-500 font-mono tracking-widest text-xs">AUTHENTICATING ADMIN ACCESS...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-sans relative overflow-hidden">
            {/* Background Ambience similar to Chat/Profile */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-zinc-900/40 blur-[150px] rounded-full"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-zinc-800/40 blur-[150px] rounded-full"></div>
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-10"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold font-mono tracking-tighter flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-white" />
                            ADMIN_CONSOLE
                        </h1>
                        <p className="text-zinc-500 text-xs font-mono mt-1 tracking-[0.3em]">SYSTEM OVERWATCH MODULE</p>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="ghost" className="text-zinc-400 hover:text-white" onClick={() => router.push('/')}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> EXIT
                        </Button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { label: "TOTAL USERS", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
                        { label: "ACTIVE NODES", value: stats.activeStats, icon: Activity, color: "text-emerald-400" },
                        { label: "DATA TRANSFERRED", value: formatBytes(stats.dataTransferredBytes), icon: HardDrive, color: "text-purple-400" },
                        { label: "TOTAL UPTIME", value: formatTime(stats.totalMinutesActive), icon: Activity, color: "text-amber-400" }
                    ].map((stat, i) => (
                        <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-xl hover:bg-zinc-900 transition-colors group">
                            <div className="flex justify-between items-start mb-4">
                                <stat.icon className={clsx("w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity", stat.color)} />
                                <span className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">L-{i + 1}</span>
                            </div>
                            <h3 className="text-2xl font-bold font-mono tracking-tight text-white mb-1">{stat.value}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* User Table */}
                <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden min-h-[500px]">
                    <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                        <h2 className="text-lg font-bold font-mono tracking-wide">USER DATABASE</h2>
                        <div className="flex gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-xs text-zinc-500 font-mono">LIVE FEED</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-zinc-900/80 text-zinc-500 font-mono text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Identity</th>
                                    <th className="px-6 py-4 font-medium">Signal ID</th>
                                    <th className="px-6 py-4 font-medium">Clearance</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Data Usage</th>
                                    <th className="px-6 py-4 font-medium text-right">Active Time</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/50">
                                {users.map((user) => (
                                    <tr key={user._id} className={clsx("hover:bg-zinc-900/50 transition-colors group", user.isSuspended && "opacity-50 grayscale")}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-zinc-700">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <span className="font-medium text-zinc-300 group-hover:text-white transition-colors block">{user.name}</span>
                                                    {user.isSuspended && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">SUSPENDED</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-zinc-400">{user.uniqueId}</td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider border cursor-pointer hover:bg-zinc-700/50 font-mono",
                                                (user.clearanceLevel || 1) === 5
                                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                                    : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                            )} onClick={() => setEditingUser(user)}>
                                                LEVEL {user.clearanceLevel || 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "flex items-center gap-2 text-xs font-medium",
                                                user.status === 'online' ? "text-emerald-400" : "text-zinc-500"
                                            )}>
                                                <span className={clsx("w-1.5 h-1.5 rounded-full", user.status === 'online' ? "bg-emerald-400" : "bg-zinc-600")}></span>
                                                {user.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-zinc-400">{formatBytes(user.dataUsage || 0)}</td>
                                        <td className="px-6 py-4 font-mono text-zinc-400 text-right">{formatTime(user.minutesActive || 0)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Manage User" onClick={() => setEditingUser(user)}>
                                                    <Key className="w-4 h-4 text-zinc-500 hover:text-white" />
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Send Notification" onClick={() => setNotifyingUser(user)}>
                                                    <Bell className="w-4 h-4 text-zinc-500 hover:text-white" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Editing User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
                        <h2 className="text-xl font-bold text-white mb-6 font-mono border-b border-zinc-800 pb-2">MANAGE IDENTITY: {editingUser.name}</h2>

                        <div className="space-y-6">
                            {/* Role (Clearance Level) Manager */}
                            <div className="group">
                                <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold block mb-2">Clearance Level ({editingUser.clearanceLevel || 1})</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => handleUpdateUser(editingUser._id, { clearanceLevel: level })}
                                            className={clsx(
                                                "h-10 rounded text-xs font-bold font-mono transition-all border",
                                                (editingUser.clearanceLevel || 1) === level
                                                    ? level === 5
                                                        ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]"
                                                        : "bg-zinc-100 text-black border-white"
                                                    : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                                            )}
                                        >
                                            L-{level}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                                    {(editingUser.clearanceLevel || 1) === 5 ? "⚠️ FULL SYSTEM ACCESS (ADMIN)" : "Standard Neural Link Access"}
                                </p>
                            </div>

                            {/* Suspension Toggle */}
                            <div className="flex justify-between items-center group border-t border-zinc-800 pt-6">
                                <div>
                                    <label className="text-xs text-zinc-500 uppercase tracking-widest font-bold block">Network Status</label>
                                    <p className="text-sm text-zinc-400">Allow access to neural net</p>
                                </div>
                                <Button
                                    className={clsx("w-32 transition-colors", editingUser.isSuspended ? "bg-red-600 hover:bg-red-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white")}
                                    onClick={() => handleUpdateUser(editingUser._id, { isSuspended: !editingUser.isSuspended })}
                                >
                                    {editingUser.isSuspended ? <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> LOCKED</span> : <span className="flex items-center gap-1"><Unlock className="w-3 h-3" /> ACTIVE</span>}
                                </Button>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button variant="ghost" onClick={() => setEditingUser(null)}>CLOSE_CONSOLE</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {notifyingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-4 font-mono">DISPATCH SIGNAL</h2>
                        <p className="text-xs text-zinc-500 mb-4 bg-zinc-950 p-2 rounded border border-zinc-800 font-mono">TARGET: {notifyingUser.uniqueId} ({notifyingUser.name})</p>

                        <textarea
                            className="w-full h-32 bg-black border border-zinc-700 rounded-lg p-3 text-white focus:outline-none focus:border-zinc-500 font-mono text-sm resize-none"
                            placeholder="Type system notification..."
                            value={notificationMsg}
                            onChange={(e) => setNotificationMsg(e.target.value)}
                        />

                        <div className="mt-6 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => { setNotifyingUser(null); setNotificationMsg(""); }}>CANCEL</Button>
                            <Button className="bg-white text-black hover:bg-zinc-200" onClick={handleSendNotification}>TRANSMIT</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
