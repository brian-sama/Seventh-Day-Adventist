import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, CheckCircle, Clock, XCircle, User, 
  MapPin, Calendar, Phone, FileText, Download,
  MessageSquare, History, Stamp, PenTool
} from 'lucide-react';
import { fetchApi } from '../utils/api';
import { toast } from 'react-hot-toast';

const RequestDetailView = ({ requestId, onClose, userRole }) => {
  const [request, setRequest] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (requestId) loadDetails();
  }, [requestId]);

  const loadDetails = async () => {
    setLoading(true);
    try {
      const data = await fetchApi(`/api/ministry-requests/${requestId}/`);
      setRequest(data);
      const acts = await fetchApi(`/api/ministry-requests/${requestId}/activities/`);
      setActivities(acts);
    } catch (err) {
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionType) => {
    let endpoint = '';
    let confirmMsg = '';

    if (actionType === 'approve') {
      endpoint = 'approve_pastor';
      confirmMsg = 'Approve this request?';
    } else if (actionType === 'sign') {
      endpoint = 'sign_elder';
      confirmMsg = 'Sign this request?';
    } else if (actionType === 'finalize') {
      endpoint = 'finalize_clerk';
      confirmMsg = 'Apply Pastor/Church stamp and generate final PDF?';
    }
    
    if (!window.confirm(confirmMsg)) return;
    
    try {
      await fetchApi(`/api/ministry-requests/${requestId}/${endpoint}/`, { method: 'POST' });
      toast.success('Action successful!');
      loadDetails();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await fetchApi(`/api/ministry-requests/${requestId}/reject/`, { 
        method: 'POST',
        body: JSON.stringify({ reason }) 
      });
      toast.success('Request rejected');
      loadDetails();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-lg">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-tighter rounded">Request #{request.id}</span>
              <h2 className="text-2xl font-bold text-white tracking-tight">{request.invited_name}</h2>
            </div>
            <p className="text-slate-400 text-sm flex items-center gap-1">
              <Calendar size={14} /> Scheduled for {new Date(request.event_date).toLocaleDateString()}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/30 px-8">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'history', label: 'History', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all ${
                activeTab === tab.id ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'details' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Guest & Event */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Guest Information</h3>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <DetailItem icon={PenTool} label="Type" value={request.request_type} />
                    <DetailItem icon={User} label="Invited Church" value={request.invited_church} />
                  </div>
                </section>
                <section>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Event Details</h3>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <DetailItem icon={Calendar} label="Service Type" value={request.event_type} />
                    <DetailItem icon={MapPin} label="To Church" value={request.receiving_church} />
                    <DetailItem icon={MapPin} label="Location" value={request.receiving_location} />
                  </div>
                </section>
              </div>

              {/* Right Column: Signatories & Status */}
              <div className="space-y-6">
                <section>
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Signatories</h3>
                  <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-800 space-y-4">
                    <SignatoryItem title="Clerk" name={request.clerk_name} contact={request.clerk_contact} signed={true} />
                    <SignatoryItem title="Head Elder" name={request.elder_name} contact={request.elder_contact} signed={request.elder_signed} />
                    <SignatoryItem title="Pastor" name={request.pastor_name || "Assigned by System"} signed={request.pastor_approved} />
                  </div>
                </section>

                {request.status === 'rejected' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <h4 className="text-red-400 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                      <XCircle size={14} /> Rejection Reason
                    </h4>
                    <p className="text-slate-300 text-sm italic">"{request.rejection_reason}"</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-white">{act.action}</div>
                    <div className="text-xs text-slate-500">{new Date(act.timestamp).toLocaleString()} • {act.username} ({act.user_role})</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-800 bg-slate-900/50 flex flex-wrap gap-4">
          {/* Elder Action - Now first after Clerk */}
          {userRole === 'elder' && !request.elder_signed && request.status === 'pending' && (
            <button 
              onClick={() => handleAction('sign')}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <PenTool size={20} /> Sign Request
            </button>
          )}

          {/* Pastor Action - Now last stage */}
          {userRole === 'pastor' && request.elder_signed && !request.pastor_approved && request.status === 'pending' && (
            <button 
              onClick={() => handleAction('approve')}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Stamp size={20} /> Approve & Finalize
            </button>
          )}

          {/* Common Actions */}
          {['pastor', 'elder'].includes(userRole) && request.status === 'pending' && (
            <button 
              onClick={handleReject}
              className="px-6 py-3 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-xl font-bold transition-all"
            >
              Reject
            </button>
          )}

          {/* Clerk Action - Final Stage */}
          {userRole === 'clerk' && request.can_finalize && (
            <button 
              onClick={() => handleAction('finalize')}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Stamp size={20} /> Finalize & Stamp
            </button>
          )}

          {request.final_pdf && (
            <a 
              href={`/api/ministry-requests/${request.id}/download/?vid=${request.verification_uuid}`}
              className={`flex-1 ${request.status === 'rejected' ? 'bg-red-900/40 hover:bg-red-800' : 'bg-slate-800 hover:bg-slate-700'} text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg`}
            >
              <Download size={20} /> Download {request.status === 'rejected' ? 'Rejection' : 'Official'} PDF
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3">
    <div className="text-slate-500"><Icon size={16} /></div>
    <div>
      <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">{label}</div>
      <div className="text-sm text-slate-200 mt-1">{value}</div>
    </div>
  </div>
);

const SignatoryItem = ({ title, name, contact, signed }) => (
  <div className="flex items-center justify-between">
    <div className="flex gap-3">
      <div className={`mt-1 h-2 w-2 rounded-full ${signed ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} />
      <div>
        <div className="text-[10px] text-slate-550 uppercase font-black tracking-widest leading-none mb-1">{title}</div>
        <div className={`text-sm font-bold ${signed ? 'text-white' : 'text-slate-500 italic'}`}>{name || 'Awaiting...'}</div>
        {contact && <div className="text-[10px] text-slate-600">{contact}</div>}
      </div>
    </div>
    {signed && <CheckCircle size={16} className="text-emerald-500" />}
  </div>
);

export default RequestDetailView;
