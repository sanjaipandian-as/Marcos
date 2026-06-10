import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Users, 
  Send, 
  Calendar, 
  CheckCircle,
  Clock
} from 'lucide-react';
import api from '../utils/api';

export default function NotificationManager() {
  const [notifications, setNotifications] = useState([]);
  
  // Wizard Modal Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'PROMOTIONAL_BLAST',
    isScheduled: false,
    scheduledTime: '',
    targetAudience: 'ALL'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.body) {
      setError('Please fill in title and body details.');
      return;
    }

    try {
      await api.createNotification({
        title: formData.title.trim(),
        body: formData.body.trim(),
        type: formData.type,
        isScheduled: formData.isScheduled,
        scheduledTime: formData.isScheduled && formData.scheduledTime ? new Date(formData.scheduledTime).toISOString() : undefined,
        targetAudience: formData.targetAudience
      });

      setSuccess('Broadcast campaign initialized!');
      setIsFormOpen(false);
      loadNotifications();
    } catch (err) {
      setError(err.message || 'Send broadcast failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Broadcast Center</h2>
          <p className="text-xs text-slate-500 font-medium">Build promotional campaigns and schedule customer alerts push messages</p>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setError('');
          }}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Broadcast Alert</span>
        </button>
      </div>

      {/* Broadcast History logs list */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Megaphone className="w-4.5 h-4.5 text-brand-500" />
          <span>Message Logs Ledger</span>
        </h3>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <p className="text-xs text-center text-slate-400 py-12">No notifications broadcasts logged</p>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-50/20 px-2 rounded-xl transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-800">{n.title}</span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full font-bold uppercase tracking-wider">
                      {n.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-snug">{n.body}</p>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-[10px] text-slate-400 font-semibold justify-between sm:justify-end">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Target: {n.targetAudience}
                  </span>
                  
                  {n.isScheduled && n.scheduledTime ? (
                    <span className="flex items-center gap-1 text-orange-600 bg-orange-50 border border-orange-100/30 px-2 py-0.5 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      Pending: {new Date(n.scheduledTime).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100/30 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Sent
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Broadcast alert creator Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">Launch Broadcast Alert</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-450 text-xs font-semibold">Close</button>
            </div>

            <form onSubmit={handleSend} className="space-y-4 pt-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block font-sans">Campaign Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Wedding Season Special discount offer!"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block font-sans">Message Body *</label>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Input detailed alert text..."
                  rows="3"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Alert Category</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none"
                  >
                    <option value="PROMOTIONAL_BLAST">Promo Blast</option>
                    <option value="APPOINTMENT_REMINDER">Appointment Reminder</option>
                    <option value="ORDER_UPDATE">Order Status Alert</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Target Segment</label>
                  <select
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none"
                  >
                    <option value="ALL">All Clients</option>
                    <option value="CUSTOMERS">Customers Only</option>
                    <option value="STAFF">Staff Only</option>
                  </select>
                </div>
              </div>

              {/* Scheduled timing box toggle */}
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Schedule Broadcast for Later</span>
                  <input
                    type="checkbox"
                    checked={formData.isScheduled}
                    onChange={e => setFormData({ ...formData, isScheduled: e.target.checked })}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-400"
                  />
                </div>
                {formData.isScheduled && (
                  <div className="space-y-1 animate-fadeIn">
                    <label className="text-[9px] font-bold text-slate-450 uppercase block">Select Scheduled Time Slot</label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledTime}
                      onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 focus:outline-none"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Broadcast Message</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
