import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

const RequestTimeline = ({ activities }) => {
  if (!activities || activities.length === 0) return null;

  return (
    <div className="py-6 px-4">
      <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 px-2">Audit Trail & Timeline</h4>
      <div className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800"></div>
        <div className="space-y-8">
          {activities.map((activity, index) => {
            const isLast = index === activities.length - 1;
            const date = new Date(activity.timestamp);
            
            return (
              <div key={activity.id} className="relative flex items-start group">
                <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-900 transition-all ${
                  isLast ? 'bg-sda-blue text-white shadow-lg shadow-blue-500/20 scale-110' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'
                }`}>
                  {isLast ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-3 h-3 fill-current" />}
                </div>
                
                <div className="ml-6 pt-1 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className={`text-sm font-bold ${isLast ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {activity.action}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md border border-slate-100 dark:border-slate-800 self-start sm:self-center">
                      {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="mt-1 flex items-center gap-2">
                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      activity.user_role === 'clerk' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                      activity.user_role === 'elder' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                      'bg-sda-red/10 text-sda-red dark:bg-red-900/20'
                    }`}>
                      {activity.user_role.toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-500 font-medium italic">by {activity.username}</span>
                  </div>
                  
                  {activity.details && Object.keys(activity.details).length > 0 && (
                     <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 border-dashed">
                        {Object.entries(activity.details).map(([key, value]) => (
                          <div key={key} className="flex gap-2">
                            <span className="font-bold capitalize">{key.replace('_', ' ')}:</span>
                            <span>{value}</span>
                          </div>
                        ))}
                     </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RequestTimeline;
