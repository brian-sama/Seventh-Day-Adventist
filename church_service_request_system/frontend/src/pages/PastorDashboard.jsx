import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { FileText, CheckCircle, XCircle, Archive, RefreshCw, Eye } from 'lucide-react';

const PastorDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loadingAction, setLoadingAction] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await fetchApi('/api/requests/');
            setRequests(data);
        } catch (error) {
            console.error("Failed to load requests:", error);
        }
    };

    const handleAction = async (id, action) => {
        setLoadingAction(`${id}-${action}`);
        try {
            await fetchApi(`/api/requests/${id}/${action}/`, { method: 'POST' });
            loadRequests();
        } catch (error) {
            alert(`Failed to perform ${action}.`);
        } finally {
            setLoadingAction(null);
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending_pastor').length;
    const archivedCount = requests.filter(r => r.status === 'approved' || r.status === 'rejected').length;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pastor Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Final authorizations and archive access.</p>
                </div>
                <div className="flex space-x-4">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {pendingCount} Pending
                    </div>
                    <div className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold flex items-center">
                        <Archive className="w-4 h-4 mr-2" />
                        {archivedCount} Archived
                    </div>
                </div>
            </header>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Final Authorizations</h3>
                </div>
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <CheckCircle className="w-12 h-12 text-slate-300 mb-3" />
                        <p>All caught up! No requests require final signature.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 bg-slate-50/50">
                                    <th className="py-4 px-6">Document</th>
                                    <th className="py-4 px-6">Clerk</th>
                                    <th className="py-4 px-6">Elder</th>
                                    <th className="py-4 px-6">Status</th>
                                    <th className="py-4 px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-slate-800 flex items-center">
                                            <FileText className="w-4 h-4 mr-2 text-primary-500" />
                                            {req.document?.title}
                                        </td>
                                        <td className="py-4 px-6 text-slate-500 text-sm">{req.clerk_name}</td>
                                        <td className="py-4 px-6 text-slate-500 text-sm">{req.elder_name || '-'}</td>
                                        <td className="py-4 px-6 text-sm font-medium">
                                            {req.status === 'pending_pastor' ? (
                                                <span className="text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded-full text-xs">Waiting Signature</span>
                                            ) : req.status === 'approved' ? (
                                                <span className="text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded-full text-xs">Approved & Archived</span>
                                            ) : (
                                                <span className="text-slate-500 capitalize">{req.status.replace(/_/g, ' ')}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right flex items-center justify-end space-x-2">
                                            <a 
                                                href={`http://localhost:8000${req.document?.file}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View Document"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </a>
                                            {req.status === 'pending_pastor' && (
                                                <>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'approve_pastor')}
                                                        disabled={loadingAction === `${req.id}-approve_pastor`}
                                                        className="p-2 text-slate-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Final Sign & Archive"
                                                    >
                                                        <CheckCircle className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'return_to_clerk')}
                                                        disabled={loadingAction === `${req.id}-return_to_clerk`}
                                                        className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                                        title="Return to Clerk"
                                                    >
                                                        <RefreshCw className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'reject')}
                                                        disabled={loadingAction === `${req.id}-reject`}
                                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Reject Request"
                                                    >
                                                        <XCircle className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// Simple Clock Icon Component since it wasn't imported from lucide-react initially
const Clock = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

export default PastorDashboard;
