import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  User, 
  MapPin, 
  Clipboard, 
  CheckCircle, 
  Clock,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';

export default function AppointmentManager() {
  const [appointments, setAppointments] = useState([]);
  const [visits, setVisits] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const [activeTab, setActiveTab] = useState('fittings');

  const [activeVisitId, setActiveVisitId] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  
  const [reportVisitId, setReportVisitId] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const appList = await api.getAppointments();
      const visitList = await api.getStoreVisits();
      const staff = await api.getStaffList();
      setAppointments(appList);
      setVisits(visitList);
      setStaffList(staff);
      if (staff.length > 0) {
        setSelectedStaffId(staff[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateAppStatus = async (id, status) => {
    try {
      await api.updateAppointmentStatus(id, status);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssignStaff = async (e) => {
    e.preventDefault();
    if (!activeVisitId || !selectedStaffId) return;

    try {
      await api.assignStaffToVisit(activeVisitId, selectedStaffId);
      setActiveVisitId(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCompleteVisit = async (e) => {
    e.preventDefault();
    if (!reportVisitId || !completionNotes.trim()) return;

    const urls = mediaUrl.trim() ? [mediaUrl.trim()] : ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500'];

    try {
      await api.completeStoreVisit(reportVisitId, completionNotes.trim(), urls);
      setReportVisitId(null);
      setCompletionNotes('');
      setMediaUrl('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-750 border-emerald-200';
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-750 border-blue-200';
      case 'PENDING':
        return 'bg-amber-50 text-amber-755 border-amber-200';
      default:
        return 'bg-red-50 text-red-750 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Fittings & Visits Console</h2>
          <p className="text-sm text-slate-500 font-medium">Manage tailoring fittings, assign staff home visits, and compile reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-550 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Refresh Logs
          </button>
        </div>
      </div>

      <div className="flex flex-wrap border-b border-slate-200 gap-4 sm:gap-6">
        <button
          onClick={() => setActiveTab('fittings')}
          className={`pb-3 text-sm font-extrabold transition-all border-b-2 -mb-[2px] focus:outline-none flex items-center gap-2 ${
            activeTab === 'fittings'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-405 hover:text-slate-650'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Fitting Appointments ({appointments.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`pb-3 text-sm font-extrabold transition-all border-b-2 -mb-[2px] focus:outline-none flex items-center gap-2 ${
            activeTab === 'visits'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-405 hover:text-slate-650'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>In-Store Visits Request ({visits.length})</span>
        </button>
      </div>

      <div className="w-full">
        {activeTab === 'fittings' ? (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-premium space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-500" />
                <span>Tailoring Fittings Schedule</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">{appointments.length} Total slots</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {appointments.length === 0 ? (
                <div className="md:col-span-2 text-center text-slate-400 py-16 font-semibold">
                  No appointments scheduled.
                </div>
              ) : (
                appointments.map((app) => (
                  <div 
                    key={app.id} 
                    className="p-5 rounded-2xl border border-slate-150 bg-slate-50/10 hover:bg-slate-50/30 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-base font-extrabold text-slate-800 block leading-tight">{app.userName}</span>
                          <p className="text-xs text-slate-400 mt-1 font-semibold">Product Type: <span className="text-slate-600">{app.productType}</span></p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${getStatusColor(app.status)}`}>
                          {app.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-550 font-semibold pt-1">
                        <span className="flex items-center gap-1 bg-slate-100/80 px-2 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(app.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {app.timeSlot}
                        </span>
                        <span className="bg-brand-55 text-brand-700 py-1 px-2.5 rounded-lg uppercase text-[10px] tracking-wide border border-brand-100">
                          {app.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {app.notes && (
                        <div className="text-xs text-slate-600 bg-white border border-slate-100 rounded-xl p-3 leading-relaxed">
                          <strong className="text-slate-700 block mb-1">Tailor Notes:</strong>
                          {app.notes}
                        </div>
                      )}
                    </div>

                    {app.status === 'PENDING' && (
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'CONFIRMED')}
                          className="w-full py-2 rounded-xl bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          Confirm Slot
                        </button>
                        <button
                          onClick={() => handleUpdateAppStatus(app.id, 'CANCELLED')}
                          className="w-full py-2 rounded-xl border border-slate-205 hover:bg-slate-50 text-slate-400 text-xs font-bold transition-all"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-premium space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-500" />
                <span>Store Home Visit Requests</span>
              </h3>
              <span className="text-xs font-bold text-slate-400">{visits.length} Total requests</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visits.length === 0 ? (
                <div className="md:col-span-2 text-center text-slate-400 py-16 font-semibold">
                  No visit requests filed.
                </div>
              ) : (
                visits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="p-5 rounded-2xl border border-slate-150 bg-slate-50/10 hover:bg-slate-50/30 hover:border-slate-300 transition-all shadow-sm hover:shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-base font-extrabold text-slate-80 block leading-tight">{visit.customerName}</span>
                          <div className="text-xs text-slate-505 mt-1.5 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="leading-tight">{visit.address}</span>
                          </div>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0 ${getStatusColor(visit.status)}`}>
                          {visit.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-655 bg-white border border-slate-100 rounded-xl p-3 leading-relaxed">
                        <strong className="text-slate-700 block mb-1">Tailoring Requirements:</strong>
                        {visit.requirements}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-450 font-bold pt-1 border-t border-slate-100/60">
                        <span className="bg-slate-100 px-2 py-1 rounded-lg text-slate-600">
                          Preferred: {new Date(visit.preferredDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-slate-500">
                          Assigned Staff: <span className="text-brand-600 font-extrabold">{visit.assignedStaffName || 'Unassigned'}</span>
                        </span>
                      </div>
                    </div>

                    {visit.status === 'PENDING' && (
                      <button
                        onClick={() => {
                          setActiveVisitId(visit.id);
                          setReportVisitId(null);
                        }}
                        className="w-full py-2 rounded-xl border border-slate-250 hover:bg-slate-550 text-slate-700 text-xs font-bold transition-all mt-2"
                      >
                        Assign Tailor Member
                      </button>
                    )}

                    {visit.status === 'ASSIGNED' && (
                      <button
                        onClick={() => {
                          setReportVisitId(visit.id);
                          setActiveVisitId(null);
                        }}
                        className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm transition-all mt-2"
                      >
                        File Completion Report
                      </button>
                    )}

                    {visit.status === 'COMPLETED' && visit.completionNotes && (
                      <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl text-xs text-slate-655 space-y-1.5 mt-2">
                        <p className="font-extrabold text-slate-750 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completion Report Summary:</span>
                        </p>
                        <p className="italic leading-relaxed font-medium">"{visit.completionNotes}"</p>
                        {visit.mediaUrls && visit.mediaUrls.length > 0 && (
                          <div className="pt-2 flex gap-1.5">
                            {visit.mediaUrls.map((url, idx) => (
                              <img key={idx} src={url} alt="fitting media" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {activeVisitId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-sm">Assign Tailoring Staff</h4>
              <button onClick={() => setActiveVisitId(null)} className="text-slate-400 hover:text-slate-600 text-xs font-extrabold">Close</button>
            </div>
            
            <form onSubmit={handleAssignStaff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Select Staff Member</label>
                <select
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 bg-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-semibold"
                >
                  {staffList.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all"
              >
                Confirm Allocation
              </button>
            </form>
          </div>
        </div>
      )}

      {reportVisitId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-sm">Submit Visit Completion Report</h4>
              <button onClick={() => setReportVisitId(null)} className="text-slate-400 hover:text-slate-650 text-xs font-extrabold">Close</button>
            </div>
            
            <form onSubmit={handleCompleteVisit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Completion Notes *</label>
                <textarea
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="Describe physical measurements taken, items fabric selection..."
                  rows="3"
                  className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Media Attachment URL (Optional)</label>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/fitting-photo.jpg"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all"
              >
                Submit Completion File
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
