import { useEffect, useState } from 'react';
import { X, Bell, Info, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
    _id: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'alert' | 'success';
    createdAt: string;
}

export const NotificationPanel = ({ onClose }: { onClose: () => void }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => {
                setNotifications(data.notifications || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            case 'alert': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
                <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                    <h3 className="text-white font-mono font-bold flex items-center gap-2">
                        <Bell className="w-4 h-4 text-zinc-400" />
                        SYSTEM_NOTIFICATIONS
                    </h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-zinc-500 animate-pulse">Scanning frequencies...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-zinc-500">
                            <p className="text-sm">No active alerts.</p>
                        </div>
                    ) : (
                        notifications.map(n => (
                            <div key={n._id} className="bg-zinc-950/50 p-3 rounded border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5">{getIcon(n.type)}</div>
                                    <div>
                                        <h4 className="text-sm font-bold text-zinc-200">{n.title}</h4>
                                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{n.content}</p>
                                        <p className="text-[10px] text-zinc-600 mt-2 font-mono">{new Date(n.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};
