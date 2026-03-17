import React, { useState, useEffect } from 'react';
import { 
    X, CheckCircle, Clock, ShieldCheck, Send, 
    FileText, User, MessageSquare, Download, 
    Maximize2, ChevronRight, History
} from 'lucide-react';
import { fetchApi, downloadFile } from '../utils/api';
import TruckButton from './TruckButton';
import toast from 'react-hot-toast';

const STAGES = [
    { key: 'UPLOADED', label: 'Uploaded', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified', icon: ShieldCheck },
    { key: 'ELDER_PENDING', label: 'Awaiting Elder', icon: Clock },
    { key: 'PASTOR_PENDING', label: 'Awaiting Pastor', icon: Clock },
    { key: 'FINALIZED', label: 'Finalized', icon: CheckCircle },
    { key: 'SENT', label: 'Sent', icon: Send },
];

const DocumentViewer = ({ request, onClose, onActionSuccess }) => {
    const [activities, setActivities] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('actions'); // actions, history, comments
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        if (request?.id) {
            loadDetails();
            loadPreview();
        }
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [request?.id]);

    const loadDetails = async () => {
        try {
            const actData = await fetchApi(`/api/requests/${request.id}/activities/`, { noToast: true });
            setActivities(actData);
            // Assuming comments endpoint exists or is part of regular request
            const commentData = await fetchApi(`/api/comments/?request=${request.id}`, { noToast: true });
            setComments(commentData);
        } catch (err) {
            console.error('Failed to load viewer details', err);
        }
    };

    const loadPreview = async () => {
        const token = localStorage.getItem('accessToken');
        try {
            // Using inline=1 to tell backend we want a preview, not a download attachment
            const response = await fetch(`/api/documents/${request.document.id}/download/?inline=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Preview failed');
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch (err) {
            console.error('Failed to load preview', err);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            await fetchApi(`/api/comments/`, {
                method: 'POST',
                body: JSON.stringify({ request: request.id, text: newComment })
            });
            setNewComment('');
            loadDetails();
            toast.success('Comment added');
        } catch (err) {
            toast.error('Failed to add comment');
        }
    };

    if (!request) return null;

    const currentIdx = STAGES.findIndex(s => s.key === request.current_stage);
    const isFinalized = request.current_stage === 'FINALIZED' || request.current_stage === 'SENT';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/95 backdrop-blur-md p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-[95vh] sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                
                {/* 1. HEADER SECTION (Progress & Details) */}
                <header className="bg-white border-b border-slate-100 px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-2xl">
                            <FileText className="w-6 h-6 text-[#1e3a8a]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 leading-tight">
                                {request.document_title || "Church Service Request"}
                            </h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                ID: #{request.id} • Applicant: {request.clerk_name}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar Component */}
                    <div className="hidden lg:flex items-center gap-1">
                        {STAGES.map((stage, idx) => {
                            const isDone = idx < currentIdx;
                            const isCurrent = idx === currentIdx;
                            return (
                                <React.Fragment key={stage.key}>
                                    <div className="flex flex-col items-center group relative">
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2
                                            ${isDone ? 'bg-emerald-500 border-emerald-100' : 
                                              isCurrent ? 'bg-white border-[#1e3a8a] ring-4 ring-blue-50' : 
                                              'bg-slate-50 border-slate-200'}
                                        `}>
                                            <stage.icon className={`w-3.5 h-3.5 ${isDone ? 'text-white' : isCurrent ? 'text-[#1e3a8a]' : 'text-slate-300'}`} />
                                        </div>
                                        {/* Tooltip */}
                                        <span className="absolute -bottom-6 text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white px-2 py-0.5 rounded whitespace-nowrap z-50">
                                            {stage.label}
                                        </span>
                                    </div>
                                    {idx < STAGES.length - 1 && (
                                        <div className={`w-8 h-0.5 rounded-full ${idx < currentIdx ? 'bg-emerald-500' : 'bg-slate-100'}`}></div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors order-first sm:order-last">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-slate-50">
                    
                    {/* 2. CENTER PANEL (70%: Document Preview) */}
                    <main className="flex-1 bg-slate-200/50 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
                        <div className="w-full h-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative group">
                            {previewUrl ? (
                                <iframe 
                                    src={previewUrl}
                                    className="w-full h-full border-0"
                                    title="Document Preview"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-slate-400">
                                    <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                                    <p className="text-sm font-bold uppercase tracking-widest">Loading Preview...</p>
                                </div>
                            )}
                            {/* Overlay Controls */}
                            <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => previewUrl && window.open(previewUrl, '_blank')}
                                    className="p-2 bg-white/90 backdrop-blur shadow-md rounded-xl hover:bg-white text-slate-600"
                                >
                                    <Maximize2 className="w-4 h-4" />
                                </button>
                                {isFinalized && (
                                    <button 
                                        onClick={() => downloadFile(`/api/documents/${request.document.id}/download/`, `${request.document_title}.pdf`)}
                                        className="p-2 bg-[#1e3a8a] text-white shadow-md rounded-xl hover:bg-blue-700"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </main>

                    {/* 3. RIGHT PANEL (30%: Actions & Details) */}
                    <aside className="w-full lg:w-[400px] bg-white border-l border-slate-100 flex flex-col shrink-0">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-slate-50 px-4">
                            {[
                                { id: 'actions', label: 'Actions', icon: Send },
                                { id: 'history', label: 'History', icon: History },
                                { id: 'comments', label: 'Comments', icon: MessageSquare }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        flex-1 py-4 flex flex-col items-center gap-1 border-b-2 transition-all
                                        ${activeTab === tab.id ? 'border-[#1e3a8a] text-[#1e3a8a]' : 'border-transparent text-slate-400 hover:text-slate-600'}
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 bg-[#fcfdfe]">
                            {activeTab === 'actions' && (
                                <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                                    <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100/50">
                                        <h4 className="text-xs font-black text-[#1e3a8a] uppercase tracking-[0.2em] mb-4">Required Attention</h4>
                                        <p className="text-sm text-[#1e3a8a]/70 font-medium mb-6 leading-relaxed">
                                            Currently held by <span className="font-bold underline">{request.current_holder}</span>. 
                                            Action is required to progress this document to the <b>{STAGES[currentIdx + 1]?.label}</b> stage.
                                        </p>
                                        
                                        {/* Action Area (Prop-based buttons from parent) */}
                                        <div className="space-y-4">
                                            {request.can_approve && (
                                                <TruckButton 
                                                    text={request.role === 'clerk' ? "Apply Official Stamp" : "Sign & Forward"}
                                                    onClick={() => onActionSuccess('approve')}
                                                />
                                            )}
                                            {request.can_reject && (
                                                <button className="w-full py-4 text-xs font-black text-rose-600 bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-colors uppercase tracking-widest">
                                                    Reject & Return to Clerk
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Security & Metadata</h4>
                                        <div className="space-y-5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 font-bold">SHA-256 HASH</span>
                                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded truncate max-w-[150px]">
                                                    {request.document_hash || "Unverified"}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-400 font-bold">LOCKED STATUS</span>
                                                <span className={`font-black uppercase tracking-tighter ${request.is_locked ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {request.is_locked ? "Encrypted & Locked" : "Writable / Pending"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    {activities.map((act, i) => (
                                        <div key={act.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
                                                {i < activities.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1"></div>}
                                            </div>
                                            <div className="pb-4">
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{act.action}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(act.timestamp).toLocaleString()}</span>
                                                    <span className="text-[9px] font-black text-blue-600 uppercase border border-blue-100 px-1 rounded">{act.user_role}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'comments' && (
                                <div className="h-full flex flex-col animate-in slide-in-from-right-4 duration-500">
                                    <div className="flex-1 space-y-4 mb-4">
                                        {comments.length === 0 ? (
                                            <div className="text-center py-10">
                                                <MessageSquare className="w-8 h-8 text-slate-100 mx-auto mb-3" />
                                                <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">No internal comments</p>
                                            </div>
                                        ) : comments.map(c => (
                                            <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase">{c.author_name}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase">{new Date(c.timestamp).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium">{c.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="sticky bottom-0 bg-[#fcfdfe] pt-4">
                                        <textarea 
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write internal note..."
                                            className="w-full p-4 bg-white border border-slate-100 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none h-24 shadow-sm"
                                        />
                                        <button 
                                            onClick={handleAddComment}
                                            className="w-full mt-2 py-3 bg-[#1e3a8a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                                        >
                                            Post Comment
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default DocumentViewer;
