import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ShieldCheck, Calendar, User, MapPin, Search } from 'lucide-react';
import { fetchApi } from '../utils/api';

const VerifyRequest = () => {
    const { uuid } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verify = async () => {
            try {
                // Public endpoint
                const res = await fetch(`/api/verify/${uuid}/`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                } else {
                    setError('This verification code is invalid or the document has not been finalized.');
                }
            } catch (err) {
                setError('Unable to reach the verification server.');
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [uuid]);

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 text-slate-200">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-10">
                    <div className="inline-block p-4 bg-blue-500/10 rounded-3xl mb-4 border border-blue-500/20">
                        <ShieldCheck size={48} className="text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Document Verification</h1>
                    <p className="text-slate-400 mt-2 italic shadow-sm">Securely verifying Magwegwe West SDA Church documents.</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <p className="font-bold text-slate-500 animate-pulse uppercase tracking-widest text-xs">Authenticating...</p>
                    </div>
                ) : error ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500/10 p-8 rounded-3xl border border-red-500/20 text-center"
                    >
                        <XCircle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
                        <p className="text-red-400 text-sm">{error}</p>
                    </motion.div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-800/40 backdrop-blur-xl p-8 rounded-[40px] border border-slate-700/50 shadow-2xl relative overflow-hidden"
                    >
                        {/* Status Watermark */}
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <CheckCircle size={150} className="text-emerald-500" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/30">
                                    Authentic Document
                                </span>
                                <span className="text-slate-500 text-xs font-bold">Ref: {uuid.slice(0,8).toUpperCase()}</span>
                            </div>

                            <h2 className="text-2xl font-black text-white mb-6 tracking-tight leading-tight">
                                Ministry Request: {data.invited_name}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                                <VerifItem icon={Calendar} label="Event Date" value={new Date(data.event_date).toLocaleDateString()} />
                                <VerifItem icon={MapPin} label="To Church" value={data.receiving_church} />
                                <VerifItem icon={User} label="Authorized By" value={data.elder} />
                                <VerifItem icon={CheckCircle} label="Processed By" value={data.clerk} />
                            </div>

                            <div className="p-6 bg-slate-900/50 rounded-3xl border border-slate-800">
                                <p className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-widest">Digital Fingerprint</p>
                                <code className="text-[10px] text-blue-400 break-all">{uuid}</code>
                            </div>
                        </div>

                        <div className="mt-8 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Official Digital Verification • Magwegwe West SDA
                        </div>
                    </motion.div>
                )}

                <div className="mt-12 text-center">
                    <button 
                        onClick={() => window.location.href = '/'}
                        className="text-slate-500 hover:text-white text-sm font-bold transition-all underline underline-offset-4"
                    >
                        Return to Official Portal
                    </button>
                </div>
            </div>
        </div>
    );
};

const VerifItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3">
        <div className="mt-1 text-slate-500"><Icon size={16} /></div>
        <div>
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">{label}</div>
            <div className="text-sm text-slate-200 font-bold">{value}</div>
        </div>
    </div>
);

export default VerifyRequest;
