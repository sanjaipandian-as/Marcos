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
  Eye
} from 'lucide-react';
import api from '../utils/api';

export default function PromoContentManager() {
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

  useEffect(() => {
    loadData();
  }, []);

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Promo Reels & Content</h1>
          <p className="text-sm text-slate-400 mt-1">Manage promotional videos and reels for the mobile app</p>
        </div>
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
