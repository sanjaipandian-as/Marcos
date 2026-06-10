import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Image, 
  Trash2, 
  Calendar, 
  BarChart, 
  ExternalLink,
  Layers,
  Check,
  X,
  Edit
} from 'lucide-react';
import api from '../utils/api';

export default function BannerManager() {
  const [banners, setBanners] = useState([]);
  
  // New Banner Wizard Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    targetUrl: '',
    location: 'HOME_SLIDER',
    order: 0,
    scheduledStart: '',
    scheduledEnd: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [selectedTargetType, setSelectedTargetType] = useState('NewArrivals');
  const [customTargetUrl, setCustomTargetUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingOrder, setEditingOrder] = useState(0);

  const startEditingOrder = (id, order) => {
    setEditingId(id);
    setEditingOrder(order);
  };

  const handleSaveOrder = async (id) => {
    try {
      await api.updateBannerOrder(id, editingOrder);
      setEditingId(null);
      loadBanners();
    } catch (err) {
      alert('Updating banner index failed.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setError('');
    try {
      const url = await api.uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      setError('Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promo banner?')) return;
    try {
      await api.deleteBanner(id);
      loadBanners();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const list = await api.getBanners();
      setBanners(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await api.toggleBannerActive(id, isActive);
      loadBanners();
    } catch (err) {
      alert('Toggle active state failed.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const targetUrlVal = selectedTargetType === 'custom' ? customTargetUrl.trim() : selectedTargetType;

    if (!formData.title || !formData.imageUrl || !targetUrlVal) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      await api.createBanner({
        title: formData.title.trim(),
        imageUrl: formData.imageUrl.trim(),
        targetUrl: targetUrlVal,
        location: formData.location,
        order: parseInt(formData.order) || 0,
        scheduledStart: formData.scheduledStart ? new Date(formData.scheduledStart).toISOString() : new Date().toISOString(),
        scheduledEnd: formData.scheduledEnd ? new Date(formData.scheduledEnd).toISOString() : new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
      });

      setSuccess('Banner campaign created!');
      setIsFormOpen(false);
      setSelectedTargetType('NewArrivals');
      setCustomTargetUrl('');
      setFormData(prev => ({ ...prev, order: 0, title: '' }));
      loadBanners();
    } catch (err) {
      setError(err.message || 'Create banner failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Promo Banner Manager</h2>
          <p className="text-xs text-slate-500 font-medium">Configure home screen sliders, promo sections, and track click counts</p>
        </div>
        <button
          onClick={() => {
            setIsFormOpen(true);
            setError('');
          }}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Promo Banner</span>
        </button>
      </div>

      {/* Grid of Banners list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-450 font-bold">
            No banners campaigns created yet.
          </div>
        ) : (
          banners.map((b) => (
            <div 
              key={b.id} 
              className="bg-white border border-slate-200/50 rounded-3xl overflow-hidden shadow-premium flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-0.5 duration-300"
            >
              {/* Image Banner */}
              <div className="relative h-44 bg-slate-100 shrink-0 overflow-hidden">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <span className="bg-slate-900/80 text-white py-0.5 px-2.5 rounded-full text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                    {b.location.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="absolute top-3 right-3">
                  <span className={`
                    px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase shadow-sm border transition-all duration-300
                    ${b.isActive 
                      ? 'bg-emerald-500 border-emerald-400 text-white shadow-md shadow-emerald-500/20' 
                      : 'bg-white border-slate-200 text-slate-400'}
                  `}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Banner Details Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{b.title}</h4>
                  <a 
                    href={b.targetUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] text-brand-650 hover:underline flex items-center gap-0.5 w-max font-semibold"
                  >
                    <span>Target URL: {b.targetUrl}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Status Toggle & Index Edit Section */}
                <div className="flex items-center justify-between bg-slate-50/70 border border-slate-200/50 rounded-2xl p-3 shadow-inner gap-3">
                  {/* Status Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Status:</span>
                    <button
                      onClick={() => handleToggleActive(b.id, !b.isActive)}
                      className={`
                        w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 focus:outline-none shadow-sm
                        ${b.isActive ? 'bg-emerald-500' : 'bg-slate-300'}
                      `}
                      title={b.isActive ? 'Deactivate Banner' : 'Activate Banner'}
                    >
                      <span className={`
                        w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200
                        ${b.isActive ? 'translate-x-5' : 'translate-x-0'}
                      `} />
                    </button>
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider ${b.isActive ? 'text-emerald-600' : 'text-slate-450'}`}>
                      {b.isActive ? 'On' : 'Off'}
                    </span>
                  </div>

                  {/* Display Index Editor */}
                  <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 flex-1 justify-end">
                    <span className="text-[10px] text-slate-500 uppercase font-extrabold tracking-wider">Index:</span>
                    {editingId === b.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={editingOrder}
                          onChange={e => setEditingOrder(parseInt(e.target.value) || 0)}
                          className="w-14 text-xs border border-slate-250 rounded-lg px-1.5 py-1 focus:outline-none focus:border-brand-500 bg-white font-bold"
                          min="0"
                        />
                        <button
                          onClick={() => handleSaveOrder(b.id)}
                          className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors shadow-sm"
                          title="Save Index"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="bg-brand-50 text-brand-700 py-0.5 px-2.5 rounded-full text-xs font-bold border border-brand-100">
                          {b.order}
                        </span>
                        <button
                          onClick={() => startEditingOrder(b.id, b.order)}
                          className="p-1 hover:bg-slate-200/60 text-slate-500 hover:text-brand-600 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold"
                          title="Edit Position Index"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistics CTR */}
                <div className="flex justify-between items-center border-t border-slate-100 pt-3 text-[10px] text-slate-500 font-semibold shrink-0">
                  <div className="flex gap-4 items-center flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <BarChart className="w-4 h-4 text-slate-400" />
                      <span>Clicks: <strong className="text-slate-800 font-extrabold">{b.clicks}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="truncate">Ends: {new Date(b.scheduledEnd).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="p-1.5 border border-slate-200 rounded-lg text-slate-400 hover:text-red-500 hover:border-red-100 transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Banner Dialog Wizard */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">Create Banner Campaign</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Banner Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Wedding Season Slider Promo"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

               <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Banner Image *</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="flex-1 text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                  <label className="cursor-pointer shrink-0 py-2 px-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center gap-1 select-none">
                    <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Choose Navigation Target *</label>
                <select
                  value={selectedTargetType}
                  onChange={e => setSelectedTargetType(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="NewArrivals">New Arrivals Screen</option>
                  <option value="SeasonalCollections">Seasonal Collections Screen</option>
                  <option value="FestivalOffers">Festival Offers Screen</option>
                  <option value="Discounts">Discounts & Promotions Screen</option>
                  <option value="TrendingProducts">Trending Products Screen</option>
                  <option value="custom">Custom Deep-link Route / URL</option>
                </select>
              </div>

              {selectedTargetType === 'custom' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Custom Route / URL *</label>
                  <input
                    type="text"
                    value={customTargetUrl}
                    onChange={e => setCustomTargetUrl(e.target.value)}
                    placeholder="e.g. /custom-route"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Display Location Slot</label>
                <select
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none"
                >
                  <option value="HOME_SLIDER">Home Slider</option>
                  <option value="PROMOTIONAL_SECTION">Promotional Section</option>
                  <option value="OFFER_SECTION">Offer Section</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Display Order Index / Position</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="e.g. 0, 1, 2"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                  min="0"
                />
                <span className="text-[10px] text-slate-400 block mt-1 leading-normal">
                  Hint: Lower numbers appear first in the list/slider (e.g., Index 0 shows before Index 1).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Start Date</label>
                  <input
                    type="date"
                    value={formData.scheduledStart}
                    onChange={e => setFormData({ ...formData, scheduledStart: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">End Date</label>
                  <input
                    type="date"
                    value={formData.scheduledEnd}
                    onChange={e => setFormData({ ...formData, scheduledEnd: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-sm transition-colors"
              >
                Launch Banner Campaign
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
