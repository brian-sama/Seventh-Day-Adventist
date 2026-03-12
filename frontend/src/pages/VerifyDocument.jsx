import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, XCircle, FileText, User, Calendar, CheckCircle2 } from 'lucide-react';

const VerifyDocument = () => {
    const { uuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [document, setDocument] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const verify = async () => {
            try {
                const response = await fetch(`/api/verify/${uuid}/`);
                if (!response.ok) throw new Error('Document not found or invalid.');
                const data = await response.json();
                setDocument(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [uuid]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center">
                    <ShieldCheck className="w-16 h-16 text-blue-200 mb-4" />
                    <p className="text-slate-400 font-medium tracking-wide">CRYPTOGRAPHIC VERIFICATION IN PROGRESS...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
                <div className="bg-white p-8 rounded-3xl shadow-2xl border border-red-100 max-w-md w-full text-center">
                    <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Verification Failed</h1>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        This document signature could not be verified by the Magwegwe West SDA Church central records. It may be forged or invalid.
                    </p>
                    <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-mono break-all">
                        {uuid}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 sm:p-8">
            <div className="max-w-xl w-full">
                {/* Header Card */}
                <div className="bg-[#1e3a8a] text-white p-8 rounded-t-[2.5rem] shadow-xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="bg-emerald-400 text-emerald-950 w-max mx-auto px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Authentically Verified
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                            MAGWEGWE WEST SEVENTH-DAY ADVENTIST CHURCH
                        </h1>
                        <p className="text-blue-100/70 text-xs font-bold uppercase tracking-widest mt-2">
                            Official Document Verification Server
                        </p>
                    </div>
                </div>

                {/* Body Card */}
                <div className="bg-white rounded-b-[2.5rem] shadow-2xl p-8 sm:p-12 border-x border-b border-slate-100">
                    <div className="space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Document Subject</label>
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-50 rounded-2xl">
                                    <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{document.title}</h2>
                                    <p className="text-sm text-slate-500 font-medium">Request ID: #{document.id}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Applicant Name</label>
                                <div className="flex items-center gap-2 text-slate-800 font-bold">
                                    <User className="w-4 h-4 text-slate-400" />
                                    {document.clerk_name}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Issued On</label>
                                <div className="flex items-center gap-2 text-slate-800 font-bold">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    {new Date(document.finalized_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Official Signatories</label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">Head Elder</span>
                                    <span className="text-sm font-black text-[#1e3a8a]">{document.elder_name}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-xs font-bold text-slate-600">District Pastor</span>
                                    <span className="text-sm font-black text-[#1e3a8a]">{document.pastor_name}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 text-center">
                            <div className="inline-block p-1 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-full mb-4">
                                <div className="bg-white rounded-full p-2">
                                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 px-6 font-medium leading-relaxed">
                                This document is cryptographically marked. Tampering with the physical or digital copy will invalidate this verification record.
                            </p>
                        </div>
                    </div>
                </div>
                
                <p className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
                    &copy; 2026 BULAWAYO CENTRAL CONSTITUENCY
                </p>
            </div>
        </div>
    );
};

export default VerifyDocument;
