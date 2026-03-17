import React, { useState, useEffect } from 'react';
import { fetchApi } from '../utils/api';
import { 
  CheckCircle, XCircle, Clock, Eye, 
  FileText, LayoutDashboard, Search,
  ChevronRight, PenTool
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import GooeyFooter from '../components/GooeyFooter';
import RequestDetailView from '../components/RequestDetailView';

const ElderDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/ministry-requests/');
      setRequests(data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = activeTab === 'pending' 
    ? requests.filter(r => !r.elder_signed && r.status === 'pending')
    : requests.filter(r => r.elder_signed || r.status === 'rejected');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-secondary)] pb-20 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <PenTool className="text-emerald-500" size={28} />
            </div>
            <h1 className="text-4xl font-black text-slate-100 tracking-tight">Elder's Dashboard</h1>
          </div>
          <p className="text-slate-400 text-lg">Review and sign ministry requests from the Clerk.</p>
        </div>

          <div className="flex bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-color)] shadow-xl">
            {[
              { id: 'pending', label: 'Needs Signature', icon: PenTool },
              { id: 'history', label: 'History', icon: CheckCircle }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 text-sm ${
                  activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                }`}
              >
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {filteredRequests.map(req => (
              <div 
                key={req.id} 
                className="bg-[var(--bg-secondary)] p-5 rounded-3xl border border-[var(--border-color)] flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-[var(--bg-primary)] transition-all border-l-4 border-l-emerald-500 shadow-xl group"
              >
                <div className="flex items-center gap-5 w-full md:w-auto">
                  <div className={`p-4 rounded-full ${req.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {req.status === 'rejected' ? <XCircle size={24} /> : <PenTool size={24} />}
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none mb-1">Service Request</div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{req.invited_name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1 font-bold"><Clock size={12} /> {new Date(req.event_date).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><LayoutDashboard size={12} /> {req.receiving_church}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  {req.status === 'rejected' && <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[10px] font-black uppercase">Rejected</span>}
                  {req.elder_signed && <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10px] font-black uppercase">Signed</span>}
                  
                  <button 
                    onClick={() => setSelectedRequest(req)}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg active:scale-95 flex items-center gap-2 group-hover:scale-105"
                  >
                    <Eye size={16} /> {activeTab === 'pending' ? 'Review & Sign' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && <EmptyState icon={PenTool} text={activeTab === 'pending' ? "No requests awaiting your signature." : "No request history found."} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {selectedRequest && (
        <RequestDetailView 
          requestId={selectedRequest.id} 
          userRole="elder" 
          onClose={() => { setSelectedRequest(null); loadData(); }} 
        />
      )}

      <GooeyFooter />
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }) => (
  <div className="flex flex-col items-center justify-center p-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">
    <Icon size={48} className="mb-4 opacity-20" />
    <p className="text-lg font-bold italic opacity-50">{text}</p>
  </div>
);

export default ElderDashboard;
