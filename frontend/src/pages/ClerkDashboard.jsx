import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { 
  FilePlus, FileText, CheckCircle, Clock, XCircle, 
  RefreshCw, Send, Archive, Eye, MapPin, UploadCloud,
  ChevronRight, LayoutDashboard, FileBarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import GooeyFooter from '../components/GooeyFooter';
import MinistryRequestForm from '../components/MinistryRequestForm';
import RequestDetailView from '../components/RequestDetailView';

const ClerkDashboard = () => {
  const [activeModule, setActiveModule] = useState('requests'); // 'requests' or 'reports'
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeModule]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeModule === 'requests') {
        const data = await fetchApi('/api/ministry-requests/');
        setRequests(data);
      } else {
        const data = await fetchApi('/api/reports/');
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleReportUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endswith('.pdf')) {
      toast.error('Only PDF files are allowed for reports');
      return;
    }

    const title = prompt('Enter report title:');
    if (!title) return;

    const quarter = prompt('Enter quarter (e.g. Q1):');
    const year = prompt('Enter year (e.g. 2024):');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('quarter', quarter);
    formData.append('year', year);

    try {
      await fetchApi('/api/reports/', {
        method: 'POST',
        body: formData,
        // FormData handles headers
      });
      toast.success('Report uploaded successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to upload report');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] pb-20 transition-colors duration-300">
      {/* Mobile-friendly Sidebar/Nav toggle could go here */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Module Switcher Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-blue-500" />
              Church Clerk Portal
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">Manage ministry requests and official reports.</p>
          </div>

          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
            <button
              onClick={() => setActiveModule('requests')}
              className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeModule === 'requests' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FilePlus size={18} /> Requests
            </button>
            <button
              onClick={() => setActiveModule('reports')}
              className={`px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
                activeModule === 'reports' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileBarChart size={18} /> Reports
            </button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-end mb-6">
          {activeModule === 'requests' ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2"
            >
              {showForm ? <XCircle size={20} /> : <FilePlus size={20} />}
              {showForm ? 'Close Form' : 'New Ministry Request'}
            </motion.button>
          ) : (
            <label className="cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold shadow-xl flex items-center gap-2 hover:opacity-90 transition-opacity">
              <UploadCloud size={20} /> Upload PDF Report
              <input type="file" className="hidden" accept=".pdf" onChange={handleReportUpload} />
            </label>
          )}
        </div>

        <AnimatePresence mode="wait">
          {showForm && activeModule === 'requests' ? (
            <MinistryRequestForm onComplete={() => { setShowForm(false); loadData(); }} />
          ) : (
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid gap-6"
            >
              {activeModule === 'requests' ? (
                <div className="bg-[var(--bg-secondary)] backdrop-blur-md rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-xl">
                  <table className="w-full text-left">
                    <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Request For</th>
                        <th className="px-6 py-4">To Church</th>
                        <th className="px-6 py-4">Event Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50 text-sm">
                      {requests.map(req => (
                        <tr key={req.id} className="hover:bg-[var(--bg-primary)] transition-colors group">
                          <td className="px-6 py-5">
                            <div className="font-bold text-[var(--text-primary)]">{req.invited_name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{req.request_type}</div>
                          </td>
                          <td className="px-6 py-5 text-[var(--text-secondary)]">{req.receiving_church}</td>
                          <td className="px-6 py-5 text-[var(--text-secondary)]">
                            {new Date(req.event_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge 
                              status={req.status} 
                              elder_signed={req.elder_signed} 
                              pastor_approved={req.pastor_approved} 
                            />
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setSelectedRequest(req)}
                                className="p-2 bg-[var(--bg-primary)] hover:bg-blue-600 rounded-lg transition-colors text-[var(--text-primary)] hover:text-white border border-[var(--border-color)]"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              {req.status === 'approved' && (
                                <a 
                                  href={`/api/ministry-requests/${req.id}/download/`}
                                  className="p-2 bg-[var(--bg-primary)] hover:bg-emerald-600 rounded-lg transition-colors text-[var(--text-primary)] hover:text-white border border-[var(--border-color)]"
                                  title="Download PDF"
                                >
                                  <FileText size={18} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan="5" className="px-6 py-12 text-center text-[var(--text-secondary)] italic">
                            No ministry requests found matching your current view.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map(report => (
                    <motion.div
                      key={report.id}
                      whileHover={{ y: -5 }}
                      className="bg-[var(--bg-secondary)] p-6 rounded-2xl border border-[var(--border-color)] flex flex-col gap-4 shadow-xl"
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                          <FileBarChart size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">{report.quarter} {report.year}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{report.title}</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">Uploaded {new Date(report.timestamp).toLocaleDateString()}</p>
                      </div>
                      <a 
                        href={`/api/reports/${report.id}/download/`}
                        className="mt-auto flex items-center justify-center gap-2 py-3 bg-[var(--bg-primary)] hover:bg-[var(--border-color)] rounded-xl font-bold transition-all text-sm text-[var(--text-primary)] border border-[var(--border-color)]"
                      >
                        <UploadCloud size={16} /> Download PDF
                      </a>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedRequest && (
        <RequestDetailView 
          requestId={selectedRequest.id} 
          userRole="clerk" 
          onClose={() => { setSelectedRequest(null); loadData(); }} 
        />
      )}

      <GooeyFooter />
    </div>
  );
};

const StatusBadge = ({ status, approved, elder_signed, pastor_approved }) => {
  if (status === 'rejected') return <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={12} /> Rejected</span>;
  if (status === 'approved') return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12} /> Finalized</span>;

  if (!elder_signed) return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Awaiting Elder</span>;
  if (!pastor_approved) return <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Awaiting Pastor</span>;
  
  return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12} /> Processing</span>;
};

export default ClerkDashboard;
