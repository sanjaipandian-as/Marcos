import React, { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Link,
  ShoppingBag,
  Globe,
  X,
  ToggleLeft,
  ToggleRight,
  Search,
  GripVertical,
  Upload,
  Eye,
  Sparkles,
  Wrench,
  Clock,
  Calendar,
  Save,
  Image as ImageIcon,
  Flame,
  ShieldAlert,
  Layers,
  Loader2
} from 'lucide-react';
import api from '../utils/api';

export default function PromoContentManager() {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' | 'reels'
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    linkType: 'NONE',
    productId: '',
    externalUrl: '',
    sortOrder: 0,
    isActive: true,
  });

  // App Popups & Maintenance Alerts State - Separated Date & Time
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
    loadData();
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [promosRes, productsRes] = await Promise.all([
        api.request('/admin/promos'),
        api.request('/products?limit=1000').catch(() => ({ data: [] })),
      ]);
      setPromos(promosRes.data || []);
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error('Failed to load promos:', err);
      setError('Failed to load promo content');
    } finally {
      setLoading(false);
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

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      linkType: 'NONE',
      productId: '',
      externalUrl: '',
      sortOrder: promos.length,
      isActive: true,
    });
    setProductSearch('');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title,
      description: promo.description || '',
      videoUrl: promo.videoUrl,
      thumbnailUrl: promo.thumbnailUrl || '',
      linkType: promo.linkType,
      productId: promo.productId || '',
      externalUrl: promo.externalUrl || '',
      sortOrder: promo.sortOrder,
      isActive: promo.isActive,
    });
    setProductSearch('');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setVideoUploading(true);
      const fd = new FormData();
      fd.append('video', file);
      const res = await api.request('/admin/upload-video', {
        method: 'POST',
        body: fd,
        headers: {},
      });
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, videoUrl: res.data.url }));
      }
    } catch (err) {
      setError('Failed to upload video: ' + err.message);
    } finally {
      setVideoUploading(false);
    }
  };

  const handleUploadThumbnail = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setThumbnailUploading(true);
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.request('/admin/upload', {
        method: 'POST',
        body: fd,
        headers: {},
      });
      if (res.data?.url) {
        setFormData(prev => ({ ...prev, thumbnailUrl: res.data.url }));
      }
    } catch (err) {
      setError('Failed to upload thumbnail: ' + err.message);
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const payload = {
        title: formData.title,
        description: formData.description || null,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl || null,
        linkType: formData.linkType,
        productId: (formData.linkType === 'PRODUCT' || formData.linkType === 'BOTH') ? formData.productId : null,
        externalUrl: (formData.linkType === 'EXTERNAL' || formData.linkType === 'BOTH') ? formData.externalUrl : null,
        sortOrder: Number(formData.sortOrder),
        isActive: formData.isActive,
      };

      if (editingPromo) {
        await api.request(`/admin/promos/${editingPromo.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setSuccess('Promo content updated!');
      } else {
        await api.request('/admin/promos', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess('Promo content created!');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save promo content');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo content?')) return;
    try {
      await api.request(`/admin/promos/${id}`, { method: 'DELETE' });
      setSuccess('Promo deleted');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete');
    }
  };

  const toggleActive = async (promo) => {
    try {
      await api.request(`/admin/promos/${promo.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !promo.isActive }),
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const getLinkIcon = (linkType) => {
    switch (linkType) {
      case 'PRODUCT': return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'EXTERNAL': return <Globe className="w-3.5 h-3.5" />;
      default: return <Link className="w-3.5 h-3.5" />;
    }
  };

  const getLinkLabel = (promo) => {
    if (promo.linkType === 'PRODUCT' && promo.productId) {
      const prod = products.find(p => p.id === promo.productId);
      return prod ? prod.name : 'Unknown Product';
    }
    if (promo.linkType === 'EXTERNAL' && promo.externalUrl) {
      return promo.externalUrl.length > 30 ? promo.externalUrl.slice(0, 30) + '...' : promo.externalUrl;
    }
    return 'No link';
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">App Promos & Scheduled Alerts</h1>
          <p className="text-sm text-slate-400 mt-1">Manage promotional video reels, 3-second sale popups, and maintenance schedules</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('reels')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'reels'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Video className="w-4 h-4 text-brand-500" />
            Promo Reels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold rounded-xl transition-all ${
              activeTab === 'alerts'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Flash Sale & Maintenance Alerts
          </button>
        </div>
      </div>

      {activeTab === 'reels' ? (
        <>
          <div className="flex justify-end">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-500 text-white text-xs font-bold rounded-xl shadow hover:bg-brand-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Promo Reel
            </button>
          </div>

          {/* Success/Error */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-2.5 rounded-xl">
              {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Promos Grid */}
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading...</div>
          ) : promos.length === 0 ? (
            <div className="text-center py-16">
              <Video className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-400 font-bold">No promo content yet</p>
              <p className="text-xs text-slate-300 mt-1">Create your first promotional reel to engage customers</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Video Preview */}
                  <div className="relative h-64 bg-slate-950 flex items-center justify-center overflow-hidden">
                    {promo.videoUrl ? (
                      <video
                        src={promo.videoUrl}
                        poster={promo.thumbnailUrl || undefined}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Video className="w-12 h-12" />
                        <span className="text-[10px]">No video source</span>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold z-10 ${
                      promo.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-700/80 text-white backdrop-blur-sm'
                    }`}>
                      {promo.isActive ? 'LIVE' : 'DRAFT'}
                    </div>
                    {/* Sort Order */}
                    <div className="absolute top-3 left-3 bg-black/60 text-white px-2 py-0.5 rounded-lg text-[9px] font-bold flex items-center gap-1 z-10 backdrop-blur-sm">
                      <GripVertical className="w-3 h-3 text-slate-400" />
                      #{promo.sortOrder}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm truncate">{promo.title}</h3>
                      {promo.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{promo.description}</p>
                      )}
                    </div>

                    {/* Link Info */}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      {getLinkIcon(promo.linkType)}
                      <span className="truncate">{getLinkLabel(promo)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <button
                        onClick={() => toggleActive(promo)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-500 transition-colors"
                      >
                        {promo.isActive
                          ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                          : <ToggleLeft className="w-5 h-5 text-slate-400" />
                        }
                        {promo.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(promo)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-brand-500 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Tab 2: Flash Sale & Maintenance Alerts Form */
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

            {/* Alert 2: System Maintenance Alert */}
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

              {/* Auto calculated duration indicator */}
              {getCalculatedDuration() && (
                <div className="bg-orange-50/80 border border-orange-100 p-3.5 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-orange-800 font-bold">
                    <Clock className="w-4 h-4 text-orange-600" />
                    Estimated Downtime Duration:
                  </div>
                  <span className="font-extrabold text-orange-700 bg-white px-3 py-1 rounded-xl border border-orange-200">
                    {getCalculatedDuration()}
                  </span>
                </div>
              )}
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-extrabold text-slate-800">
                  {editingPromo ? 'Edit Promo Reel' : 'Create Promo Reel'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-2 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Summer Collection Reel"
                    className="w-full text-sm border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description..."
                    rows={2}
                    className="w-full text-sm border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                {/* Video Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Video *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.videoUrl}
                      onChange={e => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="Video URL or upload..."
                      className="flex-1 text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                      required
                    />
                    <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      {videoUploading ? 'Uploading...' : 'Upload'}
                      <input type="file" accept="video/*,image/*" className="hidden" onChange={handleUploadVideo} disabled={videoUploading} />
                    </label>
                  </div>
                  {formData.videoUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden bg-slate-900 h-32 flex items-center justify-center">
                      {formData.videoUrl.match(/\.(mp4|webm|mov)$/i) ? (
                        <video src={formData.videoUrl} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={formData.videoUrl} alt="preview" className="h-full w-full object-cover" />
                      )}
                    </div>
                  )}
                </div>

                {/* Thumbnail Upload */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Thumbnail Image (optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.thumbnailUrl}
                      onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                      placeholder="Thumbnail URL..."
                      className="flex-1 text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    />
                    <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap">
                      <Upload className="w-3.5 h-3.5" />
                      {thumbnailUploading ? 'Uploading...' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleUploadThumbnail} disabled={thumbnailUploading} />
                    </label>
                  </div>
                </div>

                {/* Link Type */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Link Type</label>
                  <div className="flex gap-2">
                    {['NONE', 'PRODUCT', 'EXTERNAL', 'BOTH'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, linkType: type })}
                        className={`flex-1 text-xs py-2.5 rounded-xl font-bold border transition-colors ${
                          formData.linkType === type
                            ? 'bg-brand-50 border-brand-200 text-brand-700'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {type === 'NONE' ? 'No Link' : type === 'PRODUCT' ? 'Product' : type === 'EXTERNAL' ? 'External URL' : 'Both'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Selector */}
                {(formData.linkType === 'PRODUCT' || formData.linkType === 'BOTH') && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Select Product</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                      {products
                        .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                        .slice(0, 20)
                        .map(prod => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, productId: prod.id })}
                            className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                              formData.productId === prod.id
                                ? 'bg-brand-50 text-brand-700 font-bold'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {prod.name}
                          </button>
                        ))
                      }
                    </div>
                  </div>
                )}

                {/* External URL */}
                {(formData.linkType === 'EXTERNAL' || formData.linkType === 'BOTH') && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">External URL</label>
                    <input
                      type="url"
                      value={formData.externalUrl}
                      onChange={e => setFormData({ ...formData, externalUrl: e.target.value })}
                      placeholder="https://example.com/promo"
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                )}

                {/* Sort Order & Active */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={e => setFormData({ ...formData, sortOrder: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Status</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                      className={`w-full flex items-center justify-center gap-2 text-xs py-2.5 rounded-xl font-bold border transition-colors ${
                        formData.isActive
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}
                    >
                      {formData.isActive
                        ? <><ToggleRight className="w-4 h-4" /> Active</>
                        : <><ToggleLeft className="w-4 h-4" /> Inactive</>
                      }
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-500 text-white text-sm font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/25"
                >
                  {editingPromo ? 'Update Promo Reel' : 'Create Promo Reel'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
