import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { FileUp, FileText, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';

const ClerkDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

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

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return;
        setLoading(true);

        try {
            // 1. Upload Document
            const formData = new FormData();
            formData.append('title', title);
            formData.append('file', file);
            
            const docData = await fetchApi('/api/documents/', {
                method: 'POST',
                body: formData
            });

            // 2. Create Service Request
            await fetchApi('/api/requests/', {
                method: 'POST',
                body: JSON.stringify({
                    document_id: docData.id
                })
            });

            setIsMenuOpen(false);
            setTitle('');
            setFile(null);
            loadRequests();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Check console.");
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const specs = {
            pending_elder: { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, label: 'Pending Elder' },
            pending_pastor: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock, label: 'Pending Pastor' },
            approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Approved' },
            rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, label: 'Rejected' },
            returned_to_clerk: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: RefreshCw, label: 'Returned' }
        };
        const s = specs[status] || specs['pending_elder'];
        const Icon = s.icon;
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {s.label}
            </span>
        );
    };

    const pending = requests.filter(r => r.status.includes('pending')).length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const rejected = requests.filter(r => r.status === 'rejected').length;
    const returned = requests.filter(r => r.status === 'returned_to_clerk').length;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clerk Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1">Manage and submit your service requests.</p>
                </div>
                <button 
                    onClick={() => setIsMenuOpen(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-primary-500/20 transition-all hover:-translate-y-0.5 flex items-center"
                >
                    <FileUp className="w-5 h-5 mr-2" />
                    New Request
                </button>
            </header>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:border-primary-200 transition-colors">
                    <span className="text-slate-500 text-sm font-medium">Pending Requests</span>
                    <span className="text-4xl font-bold text-slate-800 mt-2">{pending}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:border-green-200 transition-colors">
                    <span className="text-slate-500 text-sm font-medium">Approved</span>
                    <span className="text-4xl font-bold text-green-500 mt-2">{approved}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:border-purple-200 transition-colors">
                    <span className="text-slate-500 text-sm font-medium">Returned</span>
                    <span className="text-4xl font-bold text-purple-500 mt-2">{returned}</span>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:border-red-200 transition-colors">
                    <span className="text-slate-500 text-sm font-medium">Rejected</span>
                    <span className="text-4xl font-bold text-red-500 mt-2">{rejected}</span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
                    <h3 className="text-lg font-semibold text-slate-800">Recent Service Requests</h3>
                </div>
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                        <FileText className="w-12 h-12 text-slate-300 mb-3" />
                        <p>No requests found. Create a new one to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 bg-slate-50/50">
                                    <th className="py-4 px-6">Document Title</th>
                                    <th className="py-4 px-6">Submitted</th>
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
                                        <td className="py-4 px-6 text-slate-500 text-sm">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            {getStatusBadge(req.status)}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <a 
                                                href={`http://localhost:8000${req.document?.file}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                            >
                                                View PDF
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">New Service Request</h3>
                            <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpload} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
                                    placeholder="e.g. Funeral Service 12th Oct"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Document (PDF)</label>
                                <input 
                                    type="file" 
                                    required
                                    accept=".pdf,.doc,.docx"
                                    onChange={e => setFile(e.target.files[0])}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className={`px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl shadow-md shadow-primary-500/20 hover:-translate-y-0.5 transition-all ${loading ? 'opacity-70' : ''}`}
                                >
                                    {loading ? 'Uploading...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClerkDashboard;
