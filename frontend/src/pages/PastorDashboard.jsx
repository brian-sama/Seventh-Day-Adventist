import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { 
  CheckCircle, XCircle, Clock, Eye, 
  FileText, LayoutDashboard, FileBarChart, Search,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import GooeyFooter from '../components/GooeyFooter';
import RequestDetailView from '../components/RequestDetailView';

const PastorDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history' or 'reports'
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const data = await fetchApi('/api/reports/');
        setReports(data);
      } else {
        const data = await fetchApi('/api/ministry-requests/');
        setRequests(data);
      }
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = activeTab === 'pending' 
    ? requests.filter(r => r.elder_signed && !r.pastor_approved && r.status === 'pending')
    : requests.filter(r => r.pastor_approved || r.status === 'rejected');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-indigo-500" />
              Pastor's Oversight
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">Reviewing ministry requests and quarterly reports.</p>
          </div>

          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-color)] shadow-xl">
            {[
              { id: 'pending', label: 'Pending', icon: Clock },
              { id: 'history', label: 'History', icon: CheckCircle },
              { id: 'reports', label: 'Reports', icon: FileBarChart }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${
                  activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'reports' ? (
            <motion.div 
              key="reports"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {reports.map(report => (
                <div key={report.id} className="bg-[var(--bg-secondary)] p-6 rounded-3xl border border-[var(--border-color)] flex flex-col gap-4 shadow-xl hover:bg-[var(--bg-primary)] transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-2xl">
                      <FileBarChart size={28} />
                    </div>
                    <div className="px-3 py-1 bg-slate-700 rounded-full text-[10px] font-black uppercase text-slate-400">{report.quarter} {report.year}</div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{report.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">Uploaded by {report.uploaded_by_name}</p>
                  </div>
                  <a 
                    href={`/api/reports/${report.id}/download/`}
                    className="mt-2 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition-all text-sm text-white"
                  >
                    View Report PDF
                  </a>
                </div>
              ))}
              {reports.length === 0 && <EmptyState icon={FileBarChart} text="No reports submitted yet." />}
            </motion.div>
          ) : (
            <motion.div 
              key="requests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {filteredRequests.map(req => (
                <div 
                  key={req.id} 
                  className="bg-[var(--bg-secondary)] p-5 rounded-3xl border border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[var(--bg-primary)] transition-all border-l-4 border-l-indigo-500 shadow-xl"
                >
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className={`p-4 rounded-full ${req.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                      {req.status === 'rejected' ? <XCircle size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-1">Request for {req.request_type}</div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{req.invited_name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(req.event_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><LayoutDashboard size={12} /> {req.receiving_church}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <StatusBadge approved={req.pastor_approved} rejected={req.status === 'rejected'} />
                    <button 
                      onClick={() => setSelectedRequest(req)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2"
                    >
                      <Eye size={16} /> Open Details
                    </button>
                  </div>
                </div>
              ))}
              {filteredRequests.length === 0 && <EmptyState icon={FileText} text="No pending requests found." />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedRequest && (
        <RequestDetailView 
          requestId={selectedRequest.id} 
          userRole="pastor" 
          onClose={() => { setSelectedRequest(null); loadData(); }} 
        />
      )}

      <GooeyFooter />
    </div>
  );
};

const StatusBadge = ({ approved, rejected }) => {
  if (rejected) return <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase">Rejected</span>;
  if (approved) return <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase">Your Approval Given</span>;
  return <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-black uppercase tracking-widest">Awaiting You</span>;
};

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center p-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">
    <Icon size={48} className="mb-4 opacity-20" />
    <p className="text-lg font-bold italic opacity-50">{text}</p>
  </div>
);

export default PastorDashboard;
