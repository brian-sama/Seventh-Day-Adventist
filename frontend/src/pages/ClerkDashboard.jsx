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
    <div className="min-h-screen bg-[#0f172a] text-slate-200 pb-20">
      {/* Mobile-friendly Sidebar/Nav toggle could go here */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Module Switcher Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-blue-500" />
              Church Clerk Portal
            </h1>
            <p className="text-slate-400 mt-1">Manage ministry requests and official reports.</p>
          </div>

          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700">
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
                <div className="bg-slate-800/40 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900/50 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-widest">
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
                        <tr key={req.id} className="hover:bg-slate-700/20 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="font-bold text-white">{req.invited_name}</div>
                            <div className="text-xs text-slate-500">{req.request_type}</div>
                          </td>
                          <td className="px-6 py-5 text-slate-300">{req.receiving_church}</td>
                          <td className="px-6 py-5 text-slate-300">
                            {new Date(req.event_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-5">
                            <StatusBadge status={req.status} approved={req.elder_signed} />
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setSelectedRequest(req)}
                                className="p-2 bg-slate-700 hover:bg-blue-600 rounded-lg transition-colors text-white"
                                title="View Details"
                              >
                                <Eye size={18} />
                              </button>
                              {req.status === 'approved' && (
                                <a 
                                  href={`/api/ministry-requests/${req.id}/download/`}
                                  className="p-2 bg-slate-700 hover:bg-emerald-600 rounded-lg transition-colors text-white"
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
                          <td colSpan="5" className="px-6 py-12 text-center text-slate-500 italic">
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
                      className="bg-slate-800/40 p-6 rounded-2xl border border-slate-700/50 flex flex-col gap-4 shadow-xl"
                    >
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                          <FileBarChart size={24} />
                        </div>
                        <span className="text-xs font-bold text-slate-500 uppercase">{report.quarter} {report.year}</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white leading-tight">{report.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">Uploaded {new Date(report.timestamp).toLocaleDateString()}</p>
                      </div>
                      <a 
                        href={`/api/reports/${report.id}/download/`}
                        className="mt-auto flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all text-sm"
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

      <GooeyFooter />
    </div>
  );
};

const StatusBadge = ({ status, approved }) => {
  if (approved) return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/30 flex items-center gap-1 w-fit"><CheckCircle size={12} /> Finalized</span>;
  
  const configs = {
    pending: { label: 'Awaiting Approvals', class: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    rejected: { label: 'Rejected', class: 'bg-red-500/20 text-red-400 border-red-500/30' }
  };
  const config = configs[status] || configs.pending;
  return <span className={`px-3 py-1 ${config.class} rounded-full text-xs font-bold border flex items-center gap-1 w-fit`}><Clock size={12} /> {config.label}</span>;
};

export default ClerkDashboard;
