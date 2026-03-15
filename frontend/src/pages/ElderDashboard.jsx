import React, { useState, useEffect } from 'react';
import { fetchApi, downloadFile } from '../utils/api';
import { FileText, CheckCircle, XCircle, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import GooeyFooter from '../components/GooeyFooter';
import TruckButton from '../components/TruckButton';
import DocumentViewer from '../components/DocumentViewer';

const ElderDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loadingAction, setLoadingAction] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => { loadRequests(); }, []);

    const loadRequests = async () => {
        try {
            const data = await fetchApi('/api/requests/');
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests:", error);
        }
    };

    const handleAction = async (id, action, body = {}) => {
        setLoadingAction(`${id}-${action}`);
        try {
            await fetchApi(`/api/requests/${id}/${action}/`, {
                method: 'POST',
                body: JSON.stringify(body),
            });
            loadRequests();
            setRejectingId(null);
            setRejectReason('');
        } catch (error) {
            alert(`Failed: ${error.message || action}`);
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Head Elder Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Review stamped requests and sign off for Pastor approval.</p>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-800">Incoming Requests Review</h3>
                </div>

                {requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-slate-300 mb-3" />
                        <p>No pending requests at this moment.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {requests.map((req) => (
                            <div key={req.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <FileText className="w-4 h-4 text-sda-blue shrink-0" />
                                            <span className="font-semibold text-slate-800 truncate">{req.document?.title}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                req.status === 'pending_elder'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {req.status.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500">Submitted by: <strong>{req.clerk_name}</strong> · {new Date(req.created_at).toLocaleDateString()}</p>

                                        {/* Stamp warning */}
                                        {!req.is_stamped && (
                                            <div className="mt-2 flex items-center gap-2 text-amber-600 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg text-sm">
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                                This document has not been stamped by the Clerk yet. You cannot sign until it is stamped.
                                            </div>
                                        )}

                                        {/* Signature trail */}
                                        {req.document?.signatures?.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {req.document.signatures.map(sig => (
                                                    <span key={sig.id} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-full">
                                                        ✔ {sig.role?.charAt(0).toUpperCase() + sig.role?.slice(1)} signed — {new Date(sig.timestamp).toLocaleDateString()}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setSelectedRequest(req)}
                                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                            title="View & Process"
                                        >
                                            <Eye className="w-5 h-5" />
                                            <span className="text-xs font-bold underline">View & Process</span>
                                        </button>

                                        {req.status === 'pending_elder' && req.is_stamped && (
                                            <>
                                                <TruckButton
                                                    onClick={() => handleAction(req.id, 'approve_elder')}
                                                    disabled={loadingAction === `${req.id}-approve_elder`}
                                                    label="Sign & Forward"
                                                    successLabel="Signed & Sent"
                                                />
                                                <button
                                                    onClick={() => handleAction(req.id, 'return_to_clerk')}
                                                    disabled={loadingAction === `${req.id}-return_to_clerk`}
                                                    className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Return to Clerk"
                                                >
                                                    <RefreshCw className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => setRejectingId(req.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Reject Request"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Reject modal inline */}
                                {rejectingId === req.id && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                        <p className="text-sm font-semibold text-red-700 mb-2">Provide a reason for rejection:</p>
                                        <textarea
                                            className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-red-400 text-slate-900"
                                            rows={3}
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            placeholder="e.g. Missing supporting documentation..."
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, 'reject', { reason: rejectReason })}
                                                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700"
                                            >
                                                Confirm Reject
                                            </button>
                                            <button
                                                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                className="px-4 py-2 bg-white text-slate-600 text-sm border rounded-lg hover:bg-slate-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedRequest && (
                <DocumentViewer 
                    request={selectedRequest}
                    onClose={() => { setSelectedRequest(null); loadRequests(); }}
                    onActionSuccess={(type) => {
                        if (type === 'approve') handleAction(selectedRequest.id, 'approve_elder');
                    }}
                />
            )}

            <GooeyFooter />
        </div>
    );
};

export default ElderDashboard;
