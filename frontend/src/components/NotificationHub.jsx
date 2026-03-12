import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { Bell, Clock, CheckCircle, XCircle, Info, X } from 'lucide-react';

const NotificationHub = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadNotifications();
        }
    }, [isOpen]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await fetchApi('/api/notifications/', { noToast: true });
            setNotifications(data);
        } catch (err) {
            console.error('Failed to load notifications', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-[100] border-l border-slate-200 animate-in slide-in-from-right duration-300">
            <div className="flex flex-col h-full">
                <header className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-sda-blue" />
                        <h3 className="font-bold text-slate-800">Workflow Updates</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading && notifications.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Loading alerts...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-10 space-y-3">
                            <Info className="w-10 h-10 text-slate-200 mx-auto" />
                            <p className="text-slate-400 text-sm">No recent activity.</p>
                        </div>
                    ) : (
                        notifications.map(note => (
                            <div key={note.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all">
                                <div className="flex gap-3">
                                    <div className={`mt-1 p-1.5 rounded-full ${
                                        note.status === 'sent' ? 'bg-emerald-100 text-emerald-600' : 
                                        note.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {note.status === 'sent' ? <CheckCircle className="w-3.5 h-3.5" /> : 
                                         note.status === 'failed' ? <XCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">
                                            {note.message}
                                        </p>
                                        <span className="text-[10px] text-slate-400 mt-1 block">
                                            {new Date(note.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <footer className="p-4 border-t border-slate-100 bg-slate-50">
                    <button 
                        onClick={loadNotifications}
                        className="w-full py-2.5 text-xs font-bold text-sda-blue hover:text-blue-800 transition-colors"
                    >
                        Refresh All Updates
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default NotificationHub;
