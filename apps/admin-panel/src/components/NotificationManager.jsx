import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Users, 
  Send, 
  Calendar, 
  CheckCircle,
  Clock,
  Sparkles,
  Flame,
  Wrench,
  Upload,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Loader2,
  Save,
  Image as ImageIcon,
  Trash2,
  Bell
} from 'lucide-react';
import api from '../utils/api';

export default function NotificationManager() {
  const [activeTab, setActiveTab] = useState('broadcast'); // 'broadcast' | 'app-alerts'
  const [notifications, setNotifications] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Broadcast Wizard Modal Form State
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

  // ── App Open Flash Sale & System Maintenance Alerts State ──
  const [saleAlertActive, setSaleAlertActive] = useState(false);
  const [saleAlertImageUrl, setSaleAlertImageUrl] = useState('');
  const [saleAlertTarget, setSaleAlertTarget] = useState('NEW_ARRIVALS');
  const [saleAlertProductId, setSaleAlertProductId] = useState('');
  const [saleAlertDurationSec, setSaleAlertDurationSec] = useState(3);
  
  const [saleStartDate, setSaleStartDate] = useState('');
  const [saleStartTime, setSaleStartTime] = useState('00:00');
  const [saleEndDate, setSaleEndDate] = useState('');
  const [saleEndTime, setSaleEndTime] = useState('23:59');

  const [maintenanceAlertActive, setMaintenanceAlertActive] = useState(false);
  const [maintenanceTitle, setMaintenanceTitle] = useState('System Maintenance');
  const [maintenanceMessage, setMaintenanceMessage] = useState('We are currently conducting scheduled system maintenance to enhance your luxury tailoring experience.');
  
  const [maintStartDate, setMaintStartDate] = useState('');
  const [maintStartTime, setMaintStartTime] = useState('00:00');
  const [maintEndDate, setMaintEndDate] = useState('');
  const [maintEndTime, setMaintEndTime] = useState('23:59');

  const [alertsSaving, setAlertsSaving] = useState(false);
  const [alertsSuccess, setAlertsSuccess] = useState('');
  const [alertsError, setAlertsError] = useState('');
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadProducts();
    loadAlertSettings();
  }, []);

  const parseDateTime = (isoString) => {
    if (!isoString) return { date: '', time: '00:00' };
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: '', time: '00:00' };
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
    };
  };

  const combineDateTime = (dateStr, timeStr) => {
    if (!dateStr) return null;
    const time = timeStr || '00:00';
    return new Date(`${dateStr}T${time}:00`).toISOString();
  };

  const loadNotifications = async () => {
    try {
      const list = await api.getNotifications();
      setNotifications(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.request('/products?limit=1000').catch(() => ({ data: [] }));
      setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAlertSettings = async () => {
    try {
      const res = await api.request('/admin/settings');
      if (res.data) {
        const s = res.data;
        setSaleAlertActive(!!s.saleAlertActive);
        setSaleAlertImageUrl(s.saleAlertImageUrl || '');
        setSaleAlertTarget(s.saleAlertTarget || 'NEW_ARRIVALS');
        setSaleAlertProductId(s.saleAlertProductId || '');
        setSaleAlertDurationSec(s.saleAlertDurationSec || 3);
        
        const saleStart = parseDateTime(s.saleAlertStartTime);
        setSaleStartDate(saleStart.date);
        setSaleStartTime(saleStart.time || '00:00');
        
        const saleEnd = parseDateTime(s.saleAlertEndTime);
        setSaleEndDate(saleEnd.date);
        setSaleEndTime(saleEnd.time || '23:59');

        setMaintenanceAlertActive(!!s.maintenanceAlertActive);
        setMaintenanceTitle(s.maintenanceTitle || 'System Maintenance');
        setMaintenanceMessage(s.maintenanceMessage || 'We are currently conducting scheduled system maintenance to enhance your luxury tailoring experience.');
        
        const maintStart = parseDateTime(s.maintenanceStartTime);
        setMaintStartDate(maintStart.date);
        setMaintStartTime(maintStart.time || '00:00');
        
        const maintEnd = parseDateTime(s.maintenanceEndTime);
        setMaintEndDate(maintEnd.date);
        setMaintEndTime(maintEnd.time || '23:59');
      }
    } catch (err) {
      console.error('Failed to load alert settings:', err);
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

  const handleSaveAlerts = async (e) => {
    e.preventDefault();
    setAlertsError('');
    setAlertsSuccess('');
    setAlertsSaving(true);

    try {
      const saleAlertStartTime = combineDateTime(saleStartDate, saleStartTime);
      const saleAlertEndTime = combineDateTime(saleEndDate, saleEndTime);

      const maintenanceStartTime = combineDateTime(maintStartDate, maintStartTime);
      const maintenanceEndTime = combineDateTime(maintEndDate, maintEndTime);

      await api.request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          saleAlertActive,
          saleAlertImageUrl,
          saleAlertTarget,
          saleAlertProductId: saleAlertTarget === 'PRODUCT' ? saleAlertProductId : null,
          saleAlertDurationSec: Number(saleAlertDurationSec || 3),
          saleAlertStartTime,
          saleAlertEndTime,

          maintenanceAlertActive,
          maintenanceTitle,
          maintenanceMessage,
          maintenanceStartTime,
          maintenanceEndTime,
        }),
      });

      setAlertsSuccess('App popup and maintenance alert settings updated successfully!');
    } catch (err) {
      setAlertsError(err.message || 'Failed to update alert settings.');
    } finally {
      setAlertsSaving(false);
    }
  };

  const handleUploadPromoImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.request('/admin/upload', {
        method: 'POST',
        body: fd,
        headers: {},
      });
      if (res.data?.url) {
        setSaleAlertImageUrl(res.data.url);
      }
    } catch (err) {
      setAlertsError('Failed to upload image: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const getCalculatedDuration = () => {
    if (!maintStartDate || !maintEndDate) return null;
    const startStr = `${maintStartDate}T${maintStartTime || '00:00'}:00`;
    const endStr = `${maintEndDate}T${maintEndTime || '23:59'}:00`;
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return 'Invalid time range';
    const mins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    const remHrs = hrs % 24;
    const remMins = mins % 60;
    
    if (days > 0) {
      let result = `${days} day${days > 1 ? 's' : ''}`;
      if (remHrs > 0) result += ` ${remHrs} hr${remHrs > 1 ? 's' : ''}`;
      if (remMins > 0) result += ` ${remMins} min${remMins > 1 ? 's' : ''}`;
      return result;
    }
    if (hrs > 0 && remMins > 0) return `${hrs} hr ${remMins} mins`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  return (
    <div className="space-y-6">
      {/* Header section with Updated Phrase */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Broadcast & App Alerts Center</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">Dispatch live push notifications, set up 3-second app open sale popups, and schedule system maintenance alerts</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'broadcast'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Megaphone className="w-4 h-4 text-brand-500" />
            Push Broadcasts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('app-alerts')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'app-alerts'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            App Open & Maintenance Alerts
          </button>
        </div>
      </div>

      {activeTab === 'broadcast' ? (
        <>
          <div className="flex justify-end">
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
        </>
      ) : (
        /* Tab 2: App Open Flash Sale & System Maintenance Alerts Form */
        <form onSubmit={handleSaveAlerts} className="space-y-6">
          {alertsSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              {alertsSuccess}
            </div>
          )}
          {alertsError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-2xl flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              {alertsError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alert 1: Flash Sale Image Popup */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800">1. Flash Sale App Open Alert</h2>
                    <p className="text-xs text-slate-400">Shows image-only popup for 3s on app launch</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSaleAlertActive(!saleAlertActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    saleAlertActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {saleAlertActive ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                  {saleAlertActive ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              {/* Promo Banner Image Upload Dropzone & Live Mobile Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Flash Sale Banner Image *
                  </label>
                  {saleAlertImageUrl && (
                    <button
                      type="button"
                      onClick={() => setSaleAlertImageUrl('')}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Image
                    </button>
                  )}
                </div>

                {!saleAlertImageUrl ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-brand-500 rounded-3xl p-6 bg-slate-50/50 hover:bg-brand-50/20 transition-all flex flex-col items-center justify-center text-center cursor-pointer group space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                      {imageUploading ? (
                        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-brand-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-700">
                        {imageUploading ? 'Uploading Image...' : 'Click to Upload Flash Sale Banner Image'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports PNG, JPG, WEBP • Auto-dispatches on app launch</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadPromoImage}
                      disabled={imageUploading}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 group shadow-md">
                    <img
                      src={saleAlertImageUrl}
                      alt="Flash Sale Preview"
                      className="w-full h-52 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md text-white text-[10px] font-extrabold px-3 py-1 rounded-xl flex items-center gap-1.5 border border-white/10">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      3s App Open Flash Deals
                    </div>

                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <label className="px-3 py-1.5 bg-white/90 hover:bg-white text-slate-800 text-[10px] font-extrabold rounded-xl shadow cursor-pointer transition-colors flex items-center gap-1">
                        <Upload className="w-3 h-3 text-brand-500" />
                        {imageUploading ? 'Uploading...' : 'Change Image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleUploadPromoImage}
                          disabled={imageUploading}
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or Image URL:</span>
                  <input
                    type="text"
                    value={saleAlertImageUrl}
                    onChange={e => setSaleAlertImageUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="flex-1 text-[11px] border border-slate-200 rounded-xl py-1.5 px-3 focus:outline-none focus:border-brand-500 text-slate-600 bg-white"
                  />
                </div>
              </div>

              {/* Target Screen Navigation */}
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  On Tap Navigation Destination
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'NEW_ARRIVALS', label: 'New Arrivals' },
                    { id: 'TRENDING', label: 'Trending Page' },
                    { id: 'PRODUCT', label: 'Specific Product' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSaleAlertTarget(t.id)}
                      className={`text-xs py-2.5 px-2 rounded-xl font-bold border transition-colors ${
                        saleAlertTarget === t.id
                          ? 'bg-brand-50 border-brand-200 text-brand-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Selector if PRODUCT target chosen */}
              {saleAlertTarget === 'PRODUCT' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Select Target Product
                  </label>
                  <select
                    value={saleAlertProductId}
                    onChange={e => setSaleAlertProductId(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 bg-white"
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (₹{Number(p.price).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Schedule Section - Separated Date & Time */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Campaign Schedule (Multi-Day Compatible)
                  </span>
                  {saleStartDate && saleEndDate && (
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-100">
                      Scheduled Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Start Date & Start Time */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Start Schedule
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Start Date</span>
                        <input
                          type="date"
                          value={saleStartDate}
                          onChange={e => setSaleStartDate(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Start Time</span>
                        <input
                          type="time"
                          value={saleStartTime}
                          onChange={e => setSaleStartTime(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date & End Time */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      End Schedule (e.g. 3 days later)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">End Date</span>
                        <input
                          type="date"
                          value={saleEndDate}
                          onChange={e => setSaleEndDate(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">End Time</span>
                        <input
                          type="time"
                          value={saleEndTime}
                          onChange={e => setSaleEndTime(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert 2: System Maintenance Alert (No Image Field) */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-800">2. System Maintenance Alert</h2>
                    <p className="text-xs text-slate-400">Displays downtime notification with live time & duration</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMaintenanceAlertActive(!maintenanceAlertActive)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors ${
                    maintenanceAlertActive
                      ? 'bg-orange-50 text-orange-700 border border-orange-200'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {maintenanceAlertActive ? <ToggleRight className="w-4 h-4 text-orange-500" /> : <ToggleLeft className="w-4 h-4" />}
                  {maintenanceAlertActive ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Maintenance Headline Title
                </label>
                <input
                  type="text"
                  value={maintenanceTitle}
                  onChange={e => setMaintenanceTitle(e.target.value)}
                  placeholder="System Maintenance Scheduled"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 font-bold text-slate-800"
                />
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Detailed Message Body
                </label>
                <textarea
                  value={maintenanceMessage}
                  onChange={e => setMaintenanceMessage(e.target.value)}
                  rows={3}
                  placeholder="We are upgrading our servers..."
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 text-slate-600 resize-none"
                />
              </div>

              {/* Schedule Section - Separated Date & Time */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" />
                    Maintenance Schedule (Multi-Day Compatible)
                  </span>
                  {getCalculatedDuration() && (
                    <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-100">
                      Duration: {getCalculatedDuration()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Start Date & Start Time */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      Start Schedule
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Start Date</span>
                        <input
                          type="date"
                          value={maintStartDate}
                          onChange={e => setMaintStartDate(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">Start Time</span>
                        <input
                          type="time"
                          value={maintStartTime}
                          onChange={e => setMaintStartTime(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date & End Time */}
                  <div className="bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 space-y-2">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                      End Schedule
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">End Date</span>
                        <input
                          type="date"
                          value={maintEndDate}
                          onChange={e => setMaintEndDate(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold block mb-1">End Time</span>
                        <input
                          type="time"
                          value={maintEndTime}
                          onChange={e => setMaintEndTime(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl py-2 px-2.5 focus:outline-none focus:border-brand-500 bg-white font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={alertsSaving}
              className="flex items-center gap-2 px-8 py-3 bg-brand-500 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-brand-500/25 hover:bg-brand-600 transition-all disabled:opacity-50"
            >
              {alertsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {alertsSaving ? 'Saving Alerts Configuration...' : 'Save App Popups & Maintenance Settings'}
            </button>
          </div>
        </form>
      )}

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
