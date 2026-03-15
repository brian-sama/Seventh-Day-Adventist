import React, { useState, useEffect } from 'react';
import { fetchApi, downloadFile } from '../utils/api';
import { FileUp, FileText, CheckCircle, Clock, XCircle, RefreshCw, Stamp, Send, Archive, Eye, MapPin } from 'lucide-react';
import GooeyFooter from '../components/GooeyFooter';
import TruckButton from '../components/TruckButton';
import DocumentViewer from '../components/DocumentViewer';
import DocumentTracker from '../components/DocumentTracker';

const STATUS_BADGE = {
  pending_elder:    { color: 'bg-amber-100 text-amber-800 border-amber-200',   icon: Clock,        label: 'Pending Elder' },
  pending_pastor:   { color: 'bg-blue-100 text-blue-800 border-blue-200',      icon: Clock,        label: 'Pending Pastor' },
  approved:         { color: 'bg-green-100 text-green-800 border-green-200',   icon: CheckCircle,  label: 'Approved' },
  rejected:         { color: 'bg-red-100 text-red-800 border-red-200',         icon: XCircle,      label: 'Rejected' },
  returned_to_clerk:{ color: 'bg-purple-100 text-purple-800 border-purple-200',icon: RefreshCw,    label: 'Returned' },
  finalized:        { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle, label: 'Finalized' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_BADGE[status] || STATUS_BADGE['pending_elder'];
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${s.color}`}>
      <Icon className="w-3 h-3 mr-1" />{s.label}
    </span>
  );
};

const TABS = [
  { key: 'pending',   label: 'Pending Verification', icon: Clock },
  { key: 'awaiting',  label: 'Awaiting Signatures',  icon: FileText },
  { key: 'finalized', label: 'Finalized Documents',  icon: CheckCircle },
  { key: 'all',       label: 'All Requests',         icon: Archive },
];

const ClerkDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stampingId, setStampingId] = useState(null);
  const [trackingRequest, setTrackingRequest] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const data = await fetchApi('/api/requests/');
      setRequests(data);
    } catch (err) {
      console.error('Failed to load requests:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('file', file);
      const docData = await fetchApi('/api/documents/', { method: 'POST', body: formData });
      await fetchApi('/api/requests/', {
        method: 'POST',
        body: JSON.stringify({ document_id: docData.id }),
      });
      setIsMenuOpen(false);
      setTitle('');
      setFile(null);
      loadRequests();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed. Check console.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStamp = async (id) => {
    setStampingId(id);
    try {
      await fetchApi(`/api/requests/${id}/apply_stamp/`, { method: 'POST' });
      loadRequests();
    } catch (err) {
      alert('Failed to apply stamp. See console for details.');
      console.error(err);
    } finally {
      setStampingId(null);
    }
  };

  const handleWhatsApp = async (id) => {
    try {
      const data = await fetchApi(`/api/requests/${id}/whatsapp_link/`);
      window.open(data.whatsapp_link, '_blank');
    } catch (err) {
      alert('Could not generate WhatsApp link.');
      console.error(err);
    }
  };

  // Tab filter logic
  const filtered = {
    pending:   requests.filter(r => (r.status === 'pending_elder' || r.status === 'returned_to_clerk') && !r.is_stamped),
    awaiting:  requests.filter(r => r.is_stamped && r.status !== 'finalized' && r.status !== 'rejected'),
    finalized: requests.filter(r => r.status === 'finalized'),
    all:       requests,
  }[activeTab] || [];

  const stats = {
    pending:   requests.filter(r => r.status === 'pending_elder' && !r.is_stamped).length,
    awaiting:  requests.filter(r => r.is_stamped && !['finalized','rejected'].includes(r.status)).length,
    finalized: requests.filter(r => r.status === 'finalized').length,
    rejected:  requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clerk Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Manage, stamp, and distribute service requests.</p>
        </div>
        <button
          onClick={() => setIsMenuOpen(true)}
          style={{ backgroundColor: '#C8102E' }}
          className="hover:opacity-90 active:scale-95 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5 flex items-center"
        >
          <FileUp className="w-5 h-5 mr-2" /> New Request
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Needs Stamp',  value: stats.pending,   color: 'text-amber-500',   border: 'hover:border-amber-200' },
          { label: 'In Pipeline',  value: stats.awaiting,  color: 'text-blue-500',    border: 'hover:border-blue-200' },
          { label: 'Finalized',    value: stats.finalized, color: 'text-emerald-500', border: 'hover:border-emerald-200' },
          { label: 'Rejected',     value: stats.rejected,  color: 'text-red-500',     border: 'hover:border-red-200' },
        ].map(s => (
          <div key={s.label} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col ${s.border} transition-colors`}>
            <span className="text-slate-500 text-sm font-medium">{s.label}</span>
            <span className={`text-4xl font-bold mt-2 ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-5 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.key
                    ? 'border-[#C8102E] text-[#C8102E] bg-red-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <FileText className="w-12 h-12 text-slate-300 mb-3" />
            <p>No requests in this category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-sm font-semibold text-slate-500 bg-slate-50/50">
                  <th className="py-4 px-6">Document</th>
                  <th className="py-4 px-6">Submitted</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Stamped</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id} className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-800 flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-sda-blue" />
                      {req.document?.title}
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-sm">
                      {new Date(req.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6"><StatusBadge status={req.status} /></td>
                    <td className="py-4 px-6">
                      {req.is_stamped
                        ? <span className="text-emerald-600 text-sm font-semibold">✔ Stamped</span>
                        : <span className="text-slate-400 text-sm">Not yet</span>}
                    </td>
                    <td className="py-4 px-6 text-right flex items-center justify-end gap-2">
                      {/* View PDF */}
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-4 h-4" /> View & Process
                      </button>

                      {/* Track Progress */}
                      <button
                        onClick={() => setTrackingRequest(req)}
                        className="text-slate-500 hover:text-slate-800 text-sm font-semibold underline flex items-center gap-1 transition-all"
                      >
                        <MapPin className="w-4 h-4" /> Track
                      </button>

                      {/* Apply Stamp (Clerk's Signature) */}
                      {!req.is_stamped && ['pending_elder', 'returned_to_clerk'].includes(req.status) && (
                        <TruckButton
                          onClick={() => handleApplyStamp(req.id)}
                          label="Verify & Stamp"
                          successLabel="Stamped & Sent"
                          disabled={stampingId === req.id}
                        />
                      )}

                      {/* Send via WhatsApp */}
                      {req.status === 'finalized' && (
                        <TruckButton
                           onClick={() => handleWhatsApp(req.id)}
                           label="Send WhatsApp"
                           successLabel="Message Sent"
                           className="!bg-emerald-600"
                        />
                      )}

                      {/* Show rejection reason */}
                      {req.status === 'rejected' && req.rejection_reason && (
                        <span className="text-red-500 text-xs italic ml-2" title={req.rejection_reason}>
                          Reason: {req.rejection_reason.slice(0, 40)}{req.rejection_reason.length > 40 ? '…' : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Viewer Modal */}
      {selectedRequest && (
        <DocumentViewer 
          request={selectedRequest} 
          onClose={() => { setSelectedRequest(null); loadRequests(); }}
          onActionSuccess={(type) => {
             if (type === 'approve') handleApplyStamp(selectedRequest.id);
          }}
        />
      )}

      {/* Tracker Modal */}

      {/* Upload Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
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
                  type="text" required value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none text-slate-900"
                  placeholder="e.g. Funeral Service 12th March"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Document (PDF)</label>
                <input
                  type="file" required accept=".pdf,.doc,.docx"
                  onChange={e => setFile(e.target.files[0])}
                  className="w-full border border-slate-300 rounded-xl px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 text-slate-900"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsMenuOpen(false)}
                  className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ backgroundColor: '#C8102E' }}
                  className={`px-6 py-2.5 text-white font-medium rounded-xl shadow-md hover:-translate-y-0.5 transition-all ${loading ? 'opacity-70' : ''}`}>
                  {loading ? 'Uploading…' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <GooeyFooter />
    </div>
  );
};

export default ClerkDashboard;
