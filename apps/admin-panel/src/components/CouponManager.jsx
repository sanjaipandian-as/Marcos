import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  Check, 
  Layers,
  Sparkles,
  Percent,
  CheckCircle,
  XCircle,
  X
} from 'lucide-react';
import api from '../utils/api';

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [activeTab, setActiveTab] = useState('COUPONS'); // COUPONS, VOUCHERS
  
  // New Coupon Form modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discountPercent: '10',
    discountFlat: '0',
    maxDiscount: '',
    expiryDate: '',
    maxUses: '100'
  });
  const [isFlat, setIsFlat] = useState(false);

  // New Voucher Plan state
  const [voucherPlans, setVoucherPlans] = useState([]);
  const [isVoucherFormOpen, setIsVoucherFormOpen] = useState(false);
  const [voucherFormData, setVoucherFormData] = useState({
    title: '',
    pointsRequired: '500',
    discountFlat: '500',
    description: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCoupons();
    loadVouchers();
  }, []);

  const loadCoupons = async () => {
    try {
      const list = await api.getCoupons();
      // Filter out user-generated vouchers (starting with REDEEM-)
      const filtered = list.filter(c => !c.code.startsWith('REDEEM-'));
      setCoupons(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const loadVouchers = async () => {
    try {
      const list = await api.getVoucherPlans();
      setVoucherPlans(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this coupon code?')) return;
    try {
      await api.deactivateCoupon(id);
      loadCoupons();
    } catch (err) {
      alert('Deactivation failed.');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.code || !formData.expiryDate) {
      setError('Please fill in code and expiry date.');
      return;
    }

    const payload = {
      code: formData.code.toUpperCase().trim(),
      discountPercent: isFlat ? 0 : Number(formData.discountPercent),
      discountFlat: isFlat ? Number(formData.discountFlat) : 0,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      expiryDate: new Date(formData.expiryDate).toISOString(),
      maxUses: Number(formData.maxUses)
    };

    try {
      await api.createCoupon(payload);
      setSuccess('Coupon code created successfully!');
      setIsFormOpen(false);
      loadCoupons();
    } catch (err) {
      setError(err.message || 'Create coupon failed.');
    }
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!voucherFormData.title || !voucherFormData.pointsRequired || !voucherFormData.discountFlat) {
      setError('Please fill in title, points required, and discount amount.');
      return;
    }

    try {
      await api.createVoucherPlan({
        title: voucherFormData.title.trim(),
        pointsRequired: Number(voucherFormData.pointsRequired),
        discountFlat: Number(voucherFormData.discountFlat),
        description: voucherFormData.description.trim() || undefined
      });
      setSuccess('Voucher Reward Plan created successfully!');
      setIsVoucherFormOpen(false);
      setVoucherFormData({ title: '', pointsRequired: '500', discountFlat: '500', description: '' });
      loadVouchers();
    } catch (err) {
      setError(err.message || 'Create voucher plan failed.');
    }
  };

  const handleDeactivateVoucher = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this voucher plan?')) return;
    try {
      await api.deactivateVoucherPlan(id);
      loadVouchers();
    } catch (err) {
      alert('Deactivation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Promotions & Vouchers</h2>
          <p className="text-xs text-slate-500 font-medium">Create promotional coupon codes or points-based loyalty vouchers</p>
        </div>
        
        {activeTab === 'COUPONS' ? (
          <button
            onClick={() => {
              setIsFormOpen(true);
              setError('');
              setFormData({
                code: '',
                discountPercent: '10',
                discountFlat: '0',
                maxDiscount: '',
                expiryDate: '',
                maxUses: '100'
              });
            }}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Coupon Code</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setIsVoucherFormOpen(true);
              setError('');
              setVoucherFormData({
                title: '',
                pointsRequired: '500',
                discountFlat: '500',
                description: ''
              });
            }}
            className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Voucher Plan</span>
          </button>
        )}
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-slate-200/60 shrink-0">
        <button
          onClick={() => {
            setActiveTab('COUPONS');
            setError('');
            setSuccess('');
          }}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all focus:outline-none ${
            activeTab === 'COUPONS'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          Promotional Coupons
        </button>
        <button
          onClick={() => {
            setActiveTab('VOUCHERS');
            setError('');
            setSuccess('');
          }}
          className={`py-3 px-6 text-xs font-bold border-b-2 transition-all focus:outline-none ${
            activeTab === 'VOUCHERS'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-slate-400 hover:text-slate-650'
          }`}
        >
          User Vouchers (Loyalty Points)
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold">
          {success}
        </div>
      )}

      {/* TAB CONTENT: Coupons Grid */}
      {activeTab === 'COUPONS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coupons.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-450 font-bold">
              No coupon codes created yet.
            </div>
          ) : (
            coupons.map((c) => (
              <div 
                key={c.id} 
                className={`bg-white border rounded-3xl p-6 shadow-premium flex flex-col justify-between h-48 transition-all hover:shadow-md relative overflow-hidden group ${c.isActive ? 'border-slate-200/60 hover:-translate-y-0.5' : 'border-slate-100 opacity-60'}`}
              >
                {/* Card border cutouts for ticket look */}
                <div className="absolute top-1/2 -left-3.5 w-7 h-7 rounded-full bg-bg-main border-r border-slate-200/50 -translate-y-1/2 z-10 hidden md:block" />
                <div className="absolute top-1/2 -right-3.5 w-7 h-7 rounded-full bg-bg-main border-l border-slate-200/50 -translate-y-1/2 z-10 hidden md:block" />

                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-800 text-base tracking-tight">{c.code}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${c.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {c.isActive ? 'Active' : 'Expired/Deactivated'}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-650 font-bold">
                      {c.discountPercent > 0 ? `${c.discountPercent}% Off` : `₹${c.discountFlat} Flat Off`}
                      {c.maxDiscount ? ` (Cap: ₹${c.maxDiscount})` : ''}
                    </p>
                  </div>
                  
                  <Ticket className="w-8 h-8 text-brand-100 shrink-0" />
                </div>

                {/* Progress and limits */}
                <div className="space-y-2 border-t border-slate-105 border-dashed pt-3 text-[10px] text-slate-500 font-semibold">
                  <div className="flex justify-between">
                    <span>Usage Redemptions:</span>
                    <span className="text-slate-800 font-extrabold">{c.usedCount} / {c.maxUses} times</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-500 rounded-full" 
                      style={{ width: `${Math.min(100, (c.usedCount / c.maxUses) * 100)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 pt-1 leading-none">
                    <span>Expires: {new Date(c.expiryDate).toLocaleDateString()}</span>
                    
                    {c.isActive && (
                      <button
                        onClick={() => handleDeactivate(c.id)}
                        className="text-red-500 hover:underline font-bold"
                      >
                        Deactivate offer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: Voucher Plans Grid */}
      {activeTab === 'VOUCHERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {voucherPlans.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-450 font-bold">
              No voucher reward plans created yet.
            </div>
          ) : (
            voucherPlans.map((vp) => (
              <div 
                key={vp.id} 
                className={`bg-white border rounded-3xl p-6 shadow-premium flex flex-col justify-between h-48 transition-all hover:shadow-md relative overflow-hidden group ${vp.isActive ? 'border-slate-200/60 hover:-translate-y-0.5' : 'border-slate-100 opacity-60'}`}
              >
                {/* Card border cutouts for ticket look */}
                <div className="absolute top-1/2 -left-3.5 w-7 h-7 rounded-full bg-bg-main border-r border-slate-200/50 -translate-y-1/2 z-10 hidden md:block" />
                <div className="absolute top-1/2 -right-3.5 w-7 h-7 rounded-full bg-bg-main border-l border-slate-200/50 -translate-y-1/2 z-10 hidden md:block" />

                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-slate-800 text-sm tracking-tight">{vp.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${vp.isActive ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                        {vp.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </div>
                    <p className="text-[11px] text-brand-650 font-bold">
                      ₹{Number(vp.discountFlat)} Flat Off
                    </p>
                  </div>
                  
                  <Ticket className="w-8 h-8 text-brand-100 shrink-0" />
                </div>

                {/* Points and description */}
                <div className="space-y-2 border-t border-slate-105 border-dashed pt-3 text-[10px] text-slate-500 font-semibold">
                  <div className="flex justify-between">
                    <span>Required Points:</span>
                    <span className="text-slate-800 font-extrabold">{vp.pointsRequired} pts</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{vp.description || 'No description provided.'}</p>
                  <div className="flex justify-end text-[9px] text-slate-400 pt-1 leading-none">
                    {vp.isActive && (
                      <button
                        onClick={() => handleDeactivateVoucher(vp.id)}
                        className="text-red-500 hover:underline font-bold"
                      >
                        Deactivate plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Coupon Builder Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">Create Coupon Offer</h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 pt-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Coupon Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. WEDDING500"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500 font-mono font-bold"
                  required
                />
              </div>

              {/* Discount Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Discount Metric Type</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFlat(false)}
                    className={`
                      py-1.5 rounded-xl text-xs font-bold border transition-all focus:outline-none
                      ${!isFlat 
                        ? 'bg-brand-500 border-brand-500 text-white shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'}
                    `}
                  >
                    Percentage (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFlat(true)}
                    className={`
                      py-1.5 rounded-xl text-xs font-bold border transition-all focus:outline-none
                      ${isFlat 
                        ? 'bg-brand-500 border-brand-500 text-white shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'}
                    `}
                  >
                    Flat Discount (₹)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {!isFlat ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase block">Percentage Off (%) *</label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={e => setFormData({ ...formData, discountPercent: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                      required
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-450 uppercase block">Flat Discount (₹) *</label>
                    <input
                      type="number"
                      value={formData.discountFlat}
                      onChange={e => setFormData({ ...formData, discountFlat: e.target.value })}
                      className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Max Discount Capping (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={e => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Maximum Usage Cap</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-sm transition-colors"
              >
                Assemble Promo Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Voucher Plan Form Modal */}
      {isVoucherFormOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">Create Voucher Reward Plan</h3>
              <button
                onClick={() => setIsVoucherFormOpen(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-4 pt-4 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Voucher Title *</label>
                <input
                  type="text"
                  value={voucherFormData.title}
                  onChange={e => setVoucherFormData({ ...voucherFormData, title: e.target.value })}
                  placeholder="e.g. ₹500 Discount Voucher"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500 font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Points Required *</label>
                  <input
                    type="number"
                    value={voucherFormData.pointsRequired}
                    onChange={e => setVoucherFormData({ ...voucherFormData, pointsRequired: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-450 uppercase block">Flat Discount Value (₹) *</label>
                  <input
                    type="number"
                    value={voucherFormData.discountFlat}
                    onChange={e => setVoucherFormData({ ...voucherFormData, discountFlat: e.target.value })}
                    placeholder="e.g. 500"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Description (Optional)</label>
                <textarea
                  value={voucherFormData.description}
                  onChange={e => setVoucherFormData({ ...voucherFormData, description: e.target.value })}
                  placeholder="e.g. Redeem points for flat ₹500 discount during checkout"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none min-h-[80px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-sm transition-colors"
              >
                Assemble Voucher Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
