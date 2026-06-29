import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Plus, 
  Edit, 
  Trash2, 
  Percent, 
  IndianRupee, 
  Truck, 
  Calendar, 
  Check, 
  X, 
  Tag,
  ToggleLeft,
  ToggleRight,
  Package,
  Layers,
  Search
} from 'lucide-react';
import api from '../utils/api';

export default function OfferManager() {
  const [offers, setOffers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'PERCENTAGE',
    isFreeShipping: false,
    discountValue: '',
    minOrderAmount: '0',
    maxDiscount: '',
    applicableProductIds: [],
    applicableCategoryIds: [],
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    loadOffers();
    loadCategories();
    loadProducts();
  }, []);

  const loadOffers = async () => {
    try {
      const list = await api.getOffers();
      setOffers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const list = await api.getCategories();
      setCategories(list);
    } catch (err) {
      console.error(err);
    }
  };

  const loadProducts = async () => {
    try {
      const list = await api.getProducts();
      setProducts(list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingOffer(null);
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setFormData({
      title: '',
      description: '',
      type: 'PERCENTAGE',
      isFreeShipping: false,
      discountValue: '',
      minOrderAmount: '0',
      maxDiscount: '',
      applicableProductIds: [],
      applicableCategoryIds: [],
      startDate: now.toISOString().slice(0, 16),
      endDate: nextWeek.toISOString().slice(0, 16),
      isActive: true
    });
    setCategorySearch('');
    setProductSearch('');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      type: offer.type || 'NONE',
      isFreeShipping: offer.isFreeShipping || false,
      discountValue: String(offer.discountValue || ''),
      minOrderAmount: String(offer.minOrderAmount || '0'),
      maxDiscount: offer.maxDiscount ? String(offer.maxDiscount) : '',
      applicableProductIds: offer.applicableProductIds || [],
      applicableCategoryIds: offer.applicableCategoryIds || [],
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 16) : '',
      endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 16) : '',
      isActive: offer.isActive
    });
    setCategorySearch('');
    setProductSearch('');
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('Title, start date, and end date are required.');
      return;
    }

    const payload = {
      ...formData,
      discountValue: Number(formData.discountValue) || 0,
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    try {
      if (editingOffer) {
        await api.updateOffer(editingOffer.id, payload);
        setSuccess('Offer updated!');
      } else {
        await api.createOffer(payload);
        setSuccess('Offer created!');
      }
      setIsModalOpen(false);
      loadOffers();
    } catch (err) {
      setError(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await api.deleteOffer(id);
      loadOffers();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      await api.updateOffer(offer.id, { isActive: !offer.isActive });
      loadOffers();
    } catch (err) {
      alert(err.message || 'Toggle failed.');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'PERCENTAGE': return <Percent className="w-4 h-4" />;
      case 'FLAT': return <IndianRupee className="w-4 h-4" />;
      case 'FREE_SHIPPING': return <Truck className="w-4 h-4" />;
      default: return <Gift className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'PERCENTAGE': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'FLAT': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'FREE_SHIPPING': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const getOfferStatus = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);
    if (!offer.isActive) return { label: 'Inactive', color: 'bg-slate-100 text-slate-500' };
    if (now < start) return { label: 'Scheduled', color: 'bg-amber-50 text-amber-600' };
    if (now > end) return { label: 'Expired', color: 'bg-red-50 text-red-600' };
    return { label: 'Live', color: 'bg-emerald-50 text-emerald-600' };
  };

  const toggleProductId = (id) => {
    setFormData(prev => ({
      ...prev,
      applicableProductIds: prev.applicableProductIds.includes(id)
        ? prev.applicableProductIds.filter(pid => pid !== id)
        : [...prev.applicableProductIds, id]
    }));
  };

  const toggleCategoryId = (id) => {
    setFormData(prev => ({
      ...prev,
      applicableCategoryIds: prev.applicableCategoryIds.includes(id)
        ? prev.applicableCategoryIds.filter(cid => cid !== id)
        : [...prev.applicableCategoryIds, id]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Offers & Free Shipping</h2>
          <p className="text-xs text-slate-500 font-medium">Create and manage product offers, discounts, and free shipping rules</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Create Offer</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Offers</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{offers.length}</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase">Live Offers</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {offers.filter(o => {
              const now = new Date();
              return o.isActive && new Date(o.startDate) <= now && new Date(o.endDate) >= now;
            }).length}
          </p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-blue-500 uppercase">Free Shipping</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">
            {offers.filter(o => o.type === 'FREE_SHIPPING' && o.isActive).length}
          </p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-amber-500 uppercase">Scheduled</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {offers.filter(o => o.isActive && new Date(o.startDate) > new Date()).length}
          </p>
        </div>
      </div>

      {/* Offers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {offers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-bold">
            <Gift className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p>No offers created yet.</p>
          </div>
        ) : (
          offers.map(offer => {
            const status = getOfferStatus(offer);
            
            // Format discount display
            let discountDisplay = '';
            if (offer.type === 'PERCENTAGE') {
              discountDisplay = `${offer.discountValue}%`;
            } else if (offer.type === 'FLAT') {
              discountDisplay = `₹${Number(offer.discountValue).toLocaleString()}`;
            } else {
              discountDisplay = 'Free Ship';
            }

            // Calculate total products affected
            const totalProducts = (offer.applicableProductIds?.length || 0);

            // Compute prices if applied to exactly one product
            let singleTargetProduct = null;
            let originalPrice = 0;
            let finalPrice = 0;

            if (totalProducts === 1 && (!offer.applicableCategoryIds || offer.applicableCategoryIds.length === 0)) {
               const p = products.find(prod => prod.id === offer.applicableProductIds[0]);
               if (p) {
                 singleTargetProduct = p;
                 originalPrice = Number(p.price);
                 if (offer.type === 'PERCENTAGE') {
                   finalPrice = originalPrice - (originalPrice * (offer.discountValue / 100));
                 } else if (offer.type === 'FLAT') {
                   finalPrice = Math.max(0, originalPrice - offer.discountValue);
                 } else {
                   finalPrice = originalPrice;
                 }
               }
            }

            return (
              <div key={offer.id} className="bg-white border border-slate-200/60 rounded-[28px] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
                <div className="p-6 flex-1 space-y-5">
                  {/* Top Row: Icon, Title & Status, Toggle */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${getTypeColor(offer.type)} bg-opacity-50`}>
                        {getTypeIcon(offer.type)}
                      </div>
                      <div className="pt-0.5">
                        <h3 className="font-extrabold text-slate-800 text-base">{offer.title}</h3>
                        <span className={`inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleActive(offer)}
                      className="p-1 hover:bg-slate-50 rounded-full transition-colors"
                      title={offer.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {offer.isActive ? <ToggleRight className="w-7 h-7 text-emerald-500" /> : <ToggleLeft className="w-7 h-7 text-slate-300" />}
                    </button>
                  </div>

                  {/* Big Discount Value & Example Pricing */}
                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                      {discountDisplay}
                    </h2>
                    {singleTargetProduct && offer.type !== 'FREE_SHIPPING' && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold text-slate-400 line-through decoration-slate-300">
                          ₹{originalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-sm font-extrabold text-emerald-600">
                          ₹{finalPrice.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium ml-1 bg-slate-50 px-1.5 py-0.5 rounded">
                          on {singleTargetProduct.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dates & Tags */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                      <Calendar className="w-4 h-4 text-slate-300" />
                      <span>{new Date(offer.startDate).toLocaleDateString()} — {new Date(offer.endDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {totalProducts > 0 && (
                        <span className="text-[10px] px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg font-bold flex items-center gap-1.5">
                          <Package className="w-3 h-3" /> {totalProducts} products
                        </span>
                      )}
                      {offer.applicableCategoryIds?.length > 0 && (
                        <span className="text-[10px] px-2.5 py-1 bg-slate-50 border border-slate-100 text-slate-500 rounded-lg font-bold flex items-center gap-1.5">
                          <Layers className="w-3 h-3" /> {offer.applicableCategoryIds.length} categories
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Row */}
                <div className="flex border-t border-slate-100 mt-auto bg-slate-50/50">
                  <button
                    onClick={() => handleOpenEdit(offer)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-xs font-bold transition-colors border-r border-slate-100"
                  >
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-3.5 text-slate-400 hover:bg-red-50 hover:text-red-600 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Gift className="w-5 h-5 text-brand-500" />
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold">{error}</div>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Offer Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Summer Sale 50% Off"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the offer..."
                  rows="2"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Offer Type Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Offer Type *</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: formData.type === 'PERCENTAGE' ? 'NONE' : 'PERCENTAGE' })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.type === 'PERCENTAGE' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Percent className={`w-5 h-5 mx-auto mb-1 ${formData.type === 'PERCENTAGE' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-bold ${formData.type === 'PERCENTAGE' ? 'text-purple-700' : 'text-slate-500'}`}>Percentage</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: formData.type === 'FLAT' ? 'NONE' : 'FLAT' })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.type === 'FLAT' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <IndianRupee className={`w-5 h-5 mx-auto mb-1 ${formData.type === 'FLAT' ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-bold ${formData.type === 'FLAT' ? 'text-emerald-700' : 'text-slate-500'}`}>Flat Amount</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFreeShipping: !formData.isFreeShipping })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.isFreeShipping ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Truck className={`w-5 h-5 mx-auto mb-1 ${formData.isFreeShipping ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className={`text-[10px] font-bold ${formData.isFreeShipping ? 'text-blue-700' : 'text-slate-500'}`}>Free Shipping</span>
                  </button>
                </div>
              </div>

              {formData.type !== 'NONE' && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">
                      {formData.type === 'PERCENTAGE' ? 'Discount %' : 'Discount ₹'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.discountValue}
                      onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                      placeholder={formData.type === 'PERCENTAGE' ? '20' : '500'}
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Min Order ₹</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.minOrderAmount}
                      onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                      placeholder="0"
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  {formData.type === 'PERCENTAGE' && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block">Max Discount ₹</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.maxDiscount}
                        onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                        placeholder="No limit"
                        className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Start Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">End Date *</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              {/* Applicable Categories */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Apply to Categories (optional)</label>
                  <div className="relative w-1/2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input 
                      type="text" 
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                  {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategoryId(cat.id)}
                      className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold transition-colors ${
                        formData.applicableCategoryIds.includes(cat.id)
                          ? 'bg-brand-50 border-brand-200 text-brand-700'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {formData.applicableCategoryIds.includes(cat.id) && <Check className="w-3 h-3 inline mr-1" />}
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applicable Products */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Apply to Specific Products (optional) — {formData.applicableProductIds.length} selected
                  </label>
                  <div className="relative w-1/2 max-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input 
                      type="text" 
                      placeholder="Search products..."
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3">
                  {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).slice(0, 50).map(prod => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => toggleProductId(prod.id)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-colors ${
                        formData.applicableProductIds.includes(prod.id)
                          ? 'bg-brand-50 border-brand-200 text-brand-700'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {formData.applicableProductIds.includes(prod.id) && <Check className="w-3 h-3 inline mr-0.5" />}
                      {prod.name}
                    </button>
                  ))}
                  {products.length === 0 && (
                    <p className="text-[10px] text-slate-400">No products available</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm"
                >
                  {editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
