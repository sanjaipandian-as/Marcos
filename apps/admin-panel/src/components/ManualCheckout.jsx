import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Tag, 
  User, 
  Check, 
  CheckCircle,
  Mail,
  Printer,
  X
} from 'lucide-react';
import api from '../utils/api';

export default function ManualCheckout() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [cart, setCart] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [orderStatus, setOrderStatus] = useState('DELIVERED');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [isQuickOrder, setIsQuickOrder] = useState(false);
  const [quickOrderReason, setQuickOrderReason] = useState('');
  const [quickOrderExpectedDate, setQuickOrderExpectedDate] = useState('');

  // Appointment State
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentTimeSlot, setAppointmentTimeSlot] = useState('');
  const [appointmentStaffId, setAppointmentStaffId] = useState('');
  const [staffMembers, setStaffMembers] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const [completedOrder, setCompletedOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCategoriesAndStaff = async () => {
      try {
        const catList = await api.getCategories();
        setCategories(catList);

        const staffList = await api.getStaffList();
        const staff = staffList.filter(u => ['STAFF', 'ADMIN', 'SUPERADMIN'].includes(u.role));
        setStaffMembers(staff);

        try {
          const settingsData = await api.getSettings();
          if (settingsData) {
            generateDynamicSlots(settingsData.businessHoursStart || '09:00', settingsData.businessHoursEnd || '18:00', settingsData.bookingSlotDurationMinutes || 15);
          } else {
            generateDynamicSlots('09:00', '18:00', 15);
          }
        } catch (e) {
          generateDynamicSlots('09:00', '18:00', 15);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadCategoriesAndStaff();
  }, []);

  const generateDynamicSlots = (start, end, durationStr) => {
    const duration = Number(durationStr) || 60;
    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + (m || 0);
    };
    const formatTime = (mins) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    let current = parseTime(start);
    const endTime = parseTime(end);
    const slots = [];

    while (current + duration <= endTime) {
      slots.push(`${formatTime(current)} - ${formatTime(current + duration)}`);
      current += duration;
    }

    if (slots.length > 0) setTimeSlots(slots);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, selectedCategory, categories.length]);

  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearchTerm.trim().length < 2 || selectedCustomer) {
        setCustomerSearchResults([]);
        return;
      }
      setIsSearchingCustomer(true);
      try {
        const results = await api.searchCustomers(customerSearchTerm);
        setCustomerSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCustomer(false);
      }
    };
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerSearchTerm, selectedCustomer]);

  const loadData = async () => {
    try {
      let categorySlug = '';
      if (selectedCategory !== 'ALL' && categories.length > 0) {
        const cat = categories.find(c => c.id === selectedCategory);
        if (cat) categorySlug = cat.slug;
      }
      
      const res = await api.getProductsPaginated({
        page: currentPage,
        limit: 12,
        search: searchTerm,
        category: categorySlug
      });
      
      if (res && res.success) {
        setProducts(res.data);
        setTotalPages(res.pagination.pages);
      } else {
        setProducts(res || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = (product) => {
    setError('');
    if (product.inventoryQty <= 0) {
      setError(`Product '${product.name}' is out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.inventoryQty) {
          setError(`Cannot add more. Available stock for '${product.name}' is ${product.inventoryQty}`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        maxStock: product.inventoryQty
      }];
    });
  };

  const handleUpdateQty = (productId, delta) => {
    setError('');
    setCart(prev => {
      const item = prev.find(i => i.productId === productId);
      if (!item) return prev;

      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter(i => i.productId !== productId);
      }
      if (nextQty > item.maxStock) {
        setError(`Cannot add more. Available stock is ${item.maxStock}`);
        return prev;
      }
      return prev.map(i => 
        i.productId === productId 
          ? { ...i, quantity: nextQty } 
          : i
      );
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const handleApplyCoupon = async () => {
    setCouponError('');
    setAppliedCoupon(null);
    if (!couponCode.trim()) return;

    try {
      const coupons = await api.getCoupons();
      const code = couponCode.toUpperCase().trim();
      const coupon = coupons.find(c => c.code.toUpperCase() === code);

      if (!coupon) {
        setCouponError('Invalid coupon code.');
        return;
      }
      if (!coupon.isActive) {
        setCouponError('This coupon is deactivated.');
        return;
      }
      if (new Date(coupon.expiryDate).getTime() < Date.now()) {
        setCouponError('Coupon has expired.');
        return;
      }
      if (coupon.usedCount >= coupon.maxUses) {
        setCouponError('Coupon limit reached.');
        return;
      }

      setAppliedCoupon(coupon);
      setCouponError('');
    } catch (err) {
      setCouponError('Error verifying coupon.');
    }
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;

    if (appliedCoupon) {
      if (appliedCoupon.discountPercent > 0) {
        discount = (subtotal * appliedCoupon.discountPercent) / 100;
        if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
          discount = appliedCoupon.maxDiscount;
        }
      } else if (appliedCoupon.discountFlat > 0) {
        discount = appliedCoupon.discountFlat;
      }
    }

    const taxRate = 0.18;
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = Number((taxableAmount * taxRate).toFixed(2));
    const total = Number((taxableAmount + tax).toFixed(2));

    return { subtotal, discount, tax, total };
  };

  const handleCheckout = async () => {
    setError('');
    if (cart.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }
    if (!selectedCustomer && !customerSearchTerm.trim()) {
      setError('Please input customer name details.');
      return;
    }
    if (isQuickOrder && !quickOrderReason.trim()) {
      setError('Please provide a reason for the quick order.');
      return;
    }
    if (isQuickOrder && !quickOrderExpectedDate) {
      setError('Please specify the expected date for the quick order.');
      return;
    }

    try {
      const order = await api.checkoutOfflineSale({
        userId: selectedCustomer ? selectedCustomer.id : undefined,
        customerName: selectedCustomer ? selectedCustomer.fullName : customerSearchTerm.trim(),
        items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
        couponCode: appliedCoupon?.code,
        status: orderStatus,
        isQuickOrder,
        quickOrderReason: isQuickOrder ? quickOrderReason : undefined,
        quickOrderExpectedDate: isQuickOrder ? quickOrderExpectedDate : undefined
      });

      if (orderStatus === 'PAID') {
        if (!appointmentTimeSlot) {
          throw new Error('Please select an appointment time slot.');
        }
        const appt = await api.createAppointment({
          userId: selectedCustomer ? selectedCustomer.id : undefined,
          date: new Date(appointmentDate).toISOString(),
          timeSlot: appointmentTimeSlot,
          type: 'MEASUREMENT',
          productType: 'Custom Tailoring',
          staffId: appointmentStaffId || undefined,
          adminOverride: true,
          notes: order.invoiceNumber,
        });
        order.booking = appt;
      }

      setCompletedOrder(order);
      setCart([]);
      setCustomerSearchTerm('');
      setSelectedCustomer(null);
      setCouponCode('');
      setAppliedCoupon(null);
      setAppointmentTimeSlot('');
      setAppointmentStaffId('');
      setIsQuickOrder(false);
      setQuickOrderReason('');
      setQuickOrderExpectedDate('');
      loadData();
    } catch (err) {
      setError(err.message || 'Checkout failed.');
    }
  };

  const { subtotal, discount, tax, total } = calculateTotals();

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const filteredProducts = products;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Manual Checkout</h2>
        <p className="text-xs text-slate-500 font-medium">Record in-store customer sales, check stock, and compile invoices</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl text-xs font-bold animate-pulse">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center w-full">
              <span className="font-bold text-slate-800 text-sm">Product Selector</span>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search product..."
                    className="w-full sm:w-auto pl-8 pr-4 py-1.5 text-xs rounded-xl bg-slate-550/5 border border-slate-200/80 focus:bg-white focus:outline-none"
                  />
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                </div>

                <select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="w-full sm:w-auto text-xs font-bold border border-slate-200 rounded-xl py-1.5 px-3 bg-white text-slate-600 focus:outline-none"
                >
                  <option value="ALL">All Catalog</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredProducts.map(p => (
                <div 
                  key={p.id} 
                  className={`p-3.5 rounded-2xl border transition-all flex gap-3 items-center justify-between ${p.inventoryQty <= 0 ? 'bg-slate-50/50 border-slate-100 opacity-60' : 'bg-white border-slate-200/60 hover:border-slate-300'} min-w-0`}
                >
                  <div className="flex gap-3 items-center min-w-0">
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="w-12 h-12 object-cover rounded-xl border border-slate-100 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 leading-snug truncate">{p.name}</span>
                      <span className="text-[10px] text-brand-650 font-bold mt-0.5">₹{p.price}</span>
                      <span className="text-[9px] text-slate-400">Stock: {p.inventoryQty}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(p)}
                    disabled={p.inventoryQty <= 0}
                    className="p-1.5 rounded-lg bg-brand-50 border border-brand-100 text-brand-600 hover:bg-brand-500 hover:text-white disabled:opacity-45 disabled:hover:bg-brand-50 disabled:hover:text-brand-600 transition-all focus:outline-none shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-50 text-slate-500 disabled:opacity-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-bold text-slate-600">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-50 text-slate-500 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-5">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <ShoppingCart className="w-4.5 h-4.5 text-brand-500" />
            <span>Invoice Checkout Details</span>
          </h3>

          <div className="space-y-1 relative">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Customer Search / Full Name *</label>
            {selectedCustomer ? (
              <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-xl px-4 py-2">
                <div>
                  <p className="text-xs font-bold text-brand-800">{selectedCustomer.fullName}</p>
                  <p className="text-[10px] text-brand-600">{selectedCustomer.email || selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearchTerm('');
                  }}
                  className="p-1 hover:bg-brand-100 rounded-lg text-brand-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={e => setCustomerSearchTerm(e.target.value)}
                  placeholder="Search email/phone or enter Walk-In Name"
                  className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                  required
                />
                <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                {customerSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                    {customerSearchResults.map(user => (
                      <button
                        key={user.id}
                        className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0"
                        onClick={() => {
                          setSelectedCustomer(user);
                          setCustomerSearchTerm(user.fullName);
                          setCustomerSearchResults([]);
                        }}
                      >
                        <p className="font-bold text-slate-800">{user.fullName}</p>
                        <p className="text-[10px] text-slate-500">{user.email} {user.phone && `• ${user.phone}`}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto border-t border-b border-slate-100 py-3">
            {cart.length === 0 ? (
              <p className="text-xs text-center text-slate-400 py-6">Your shopping cart is empty</p>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                    <p className="text-[10px] text-slate-400">₹{item.price} x {item.quantity}</p>
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button 
                        onClick={() => handleUpdateQty(item.productId, -1)}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded-l-lg"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-bold text-slate-700 text-[11px]">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.productId, 1)}
                        className="p-1 hover:bg-slate-100 text-slate-500 rounded-r-lg"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.productId)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Promo Coupon</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  placeholder="e.g. WELCOME150"
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
                />
                <Tag className="w-4 h-4 absolute left-3 top-2 text-slate-400" />
              </div>
              <button
                onClick={handleApplyCoupon}
                className="py-1.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs shrink-0"
              >
                Apply
              </button>
            </div>
            {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
            {appliedCoupon && (
              <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Coupon code {appliedCoupon.code} applied (-{appliedCoupon.discountPercent > 0 ? `${appliedCoupon.discountPercent}%` : `₹${appliedCoupon.discountFlat}`})
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Method</span>
            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'Online', 'Card'].map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`
                    py-1.5 rounded-xl text-xs font-bold border transition-all focus:outline-none
                    ${paymentMethod === method 
                      ? 'bg-brand-500 border-brand-500 text-white shadow-sm' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}
                  `}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Order Status</span>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500"
            >
              <option value="PENDING">Pending (Order Placed)</option>
              <option value="PAID">Paid (Measurement Session)</option>
              <option value="PROCESSING">Processing (Order Stitching)</option>
              <option value="SHIPPED">Shipped (Product Completed)</option>
              <option value="DELIVERED">Delivered (Handed over)</option>
            </select>
          </div>

          <div className="space-y-1.5 p-3 rounded-xl border border-brand-200 bg-brand-50/50">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quickOrder"
                checked={isQuickOrder}
                onChange={(e) => setIsQuickOrder(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
              />
              <label htmlFor="quickOrder" className="text-xs font-bold text-brand-800">
                Mark as Quick Order
              </label>
            </div>
            {isQuickOrder && (
              <div className="mt-2 space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-700 uppercase block">Expected Date *</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={quickOrderExpectedDate}
                    onChange={(e) => setQuickOrderExpectedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-700 uppercase block">Why do you need this order quick? *</label>
                  <textarea
                    value={quickOrderReason}
                    onChange={(e) => setQuickOrderReason(e.target.value)}
                    placeholder="Enter reason..."
                    rows={2}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-brand-200 rounded-xl focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {orderStatus === 'PAID' && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                Book Measurement Session
              </h4>
              <p className="text-[10px] text-emerald-600/80 mb-2 font-medium">Bypass limits active: As an admin, you can book any slot, even if fully booked.</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase">Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-emerald-700 uppercase">Time Slot</label>
                  <select
                    value={appointmentTimeSlot}
                    onChange={(e) => setAppointmentTimeSlot(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-700 uppercase">Sizing Person (Staff)</label>
                <select
                  value={appointmentStaffId}
                  onChange={(e) => setAppointmentStaffId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold bg-white border border-emerald-200 rounded-xl focus:outline-none focus:border-brand-500"
                >
                  <option value="">Unassigned (Any Available Staff)</option>
                  {staffMembers.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Coupon Discount</span>
              <span className="font-semibold text-red-500">-₹{discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Taxes (GST 18%)</span>
              <span className="font-semibold text-slate-800">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-extrabold text-slate-800">
              <span>Total Payable</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-premium shadow-brand-500/10 transition-all focus:outline-none"
          >
            Checkout & Print Invoice
          </button>
        </div>
      </div>

      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setCompletedOrder(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div id="invoice-print-area" className="flex-1 space-y-6 pr-1">
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-black text-slate-800 text-lg tracking-tight">MARCOS STUDIO</h3>
                  <p className="text-[10px] text-slate-400">Custom Luxury Tailoring & Apparel</p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-emerald-50 text-emerald-700 py-0.5 px-2 rounded-full font-bold uppercase">
                    PAID
                  </span>
                  <p className="text-[10px] text-slate-450 mt-1.5">{completedOrder.invoiceNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Billed To</p>
                  <p className="font-bold text-slate-800 mt-1">{completedOrder.customerName}</p>
                  <p className="text-slate-500">Walk-In Client Checkout</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Payment Details</p>
                  <p className="font-semibold text-slate-700 mt-1">{completedOrder.paymentMethod} Payment</p>
                  <p className="text-slate-500">
                    {new Date(completedOrder.createdAt).toLocaleDateString()} {new Date(completedOrder.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>

              {completedOrder.booking && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 mb-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Measurement Session Confirmed
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-emerald-700">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600/80 block mb-0.5">Date</span>
                      <span className="font-bold">{new Date(completedOrder.booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-600/80 block mb-0.5">Time</span>
                      <span className="font-bold">{completedOrder.booking.timeSlot}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[9px] font-bold text-slate-400 uppercase">
                    <tr>
                      <th className="py-2 px-3">Product Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {completedOrder.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{item.productName}</td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right text-slate-600">₹{item.price}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="w-1/2 ml-auto space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">₹{Number(completedOrder.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Discount</span>
                  <span className="font-semibold text-red-500">-₹{Number(completedOrder.discountAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxes (GST 18%)</span>
                  <span className="font-semibold text-slate-800">₹{Number(completedOrder.taxAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-extrabold text-slate-800">
                  <span>Payable</span>
                  <span>₹{Number(completedOrder.payableAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-slate-100 pt-4 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 font-bold text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
