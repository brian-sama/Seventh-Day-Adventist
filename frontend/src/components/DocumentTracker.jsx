import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { CheckCircle, Clock, Send, ShieldCheck, User, MapPin, History } from 'lucide-react';

const STAGES = [
    { key: 'UPLOADED', label: 'Uploaded', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Clerk Verified', icon: ShieldCheck },
    { key: 'ELDER_PENDING', label: 'Awaiting Elder', icon: Clock },
    { key: 'ELDER_SIGNED', label: 'Elder Signed', icon: CheckCircle },
    { key: 'PASTOR_PENDING', label: 'Awaiting Pastor', icon: Clock },
    { key: 'FINALIZED', label: 'Finalized', icon: ShieldCheck },
    { key: 'SENT', label: 'Sent via WhatsApp', icon: Send },
];

const DocumentTracker = ({ request }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (request?.id) {
            loadActivities();
        }
    }, [request?.id]);

    const loadActivities = async () => {
        setLoading(true);
        try {
            const data = await fetchApi(`/api/requests/${request.id}/activities/`, { noToast: true });
            setActivities(data);
        } catch (err) {
            console.error('Failed to load tracking activities', err);
        } finally {
            setLoading(false);
        }
    };

    if (!request) return null;

    const currentIdx = STAGES.findIndex(s => s.key === request.current_stage);

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-white pb-4 z-20 border-b border-slate-50">
                <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <History className="w-5 h-5 text-sda-blue" />
                        Document Tracking
                    </h3>
                    <p className="text-sm text-slate-500">Real-time status of Request #{request.id}</p>
                </div>
                <div className="flex items-center bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
                    <User className="w-4 h-4 text-blue-600 mr-2" />
                    <span className="text-xs font-bold text-blue-700 uppercase">
                        Holder: {request.current_holder}
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative flex justify-between items-center mb-16 px-4">
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1.5 bg-slate-100 rounded-full z-0"></div>
                <div 
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-1.5 bg-emerald-500 rounded-full z-0 transition-all duration-1000"
                    style={{ width: `calc(${(currentIdx / (STAGES.length - 1)) * 100}% - 2rem)` }}
                ></div>
                
                {STAGES.map((stage, idx) => {
                    const isDone = idx < currentIdx;
                    const isCurrent = idx === currentIdx;
                    return (
                        <div key={stage.key} className="relative z-10 flex flex-col items-center group">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center border-4 transition-all duration-500
                                ${isDone ? 'bg-emerald-500 border-emerald-100' : 
                                  isCurrent ? 'bg-white border-blue-500 scale-125 shadow-lg' : 
                                  'bg-white border-slate-200'}
                            `}>
                                <stage.icon className={`w-3.5 h-3.5 ${isDone ? 'text-white' : isCurrent ? 'text-blue-600' : 'text-slate-300'}`} />
                            </div>
                            <span className={`
                                absolute top-10 text-[9px] font-bold uppercase whitespace-nowrap transition-colors text-center
                                ${isCurrent ? 'text-blue-700' : isDone ? 'text-emerald-700' : 'text-slate-400'}
                            `}>
                                {stage.label.split(' ').map((word, i) => <div key={i}>{word}</div>)}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Timeline Details */}
            <div className="space-y-4 mt-12">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Activity Log</h4>
                
                {loading && activities.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm italic">Synchronizing log history...</div>
                ) : activities.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-slate-400 text-sm text-center">No activities recorded yet.</div>
                ) : (
                    activities.map((act, i) => (
                        <div key={act.id} className="flex gap-4">
                            <div className="w-10 flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ring-4 ${i === activities.length - 1 ? 'bg-blue-600 ring-blue-50' : 'bg-slate-300 ring-slate-100'}`}></div>
                                {i !== activities.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1"></div>}
                            </div>
                            <div className="flex-1 pb-4">
                                <p className={`text-sm font-bold ${i === activities.length - 1 ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {act.action}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium uppercase tracking-tighter">
                                        {act.user_role}
                                    </span>
                                    <span className="text-[10px] text-slate-400 uppercase">
                                        {new Date(act.timestamp).toLocaleString()} by {act.username}
                                    </span>
                                </div>
                                {act.details?.reason && (
                                    <p className="mt-2 text-xs bg-red-50 text-red-700 p-2 rounded-lg border border-red-100 italic">
                                        " {act.details.reason} "
                                    </p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DocumentTracker;
