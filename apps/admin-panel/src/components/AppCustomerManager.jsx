import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  X, 
  UserPlus,
  Mail,
  Phone,
  Lock,
  User
} from 'lucide-react';
import api from '../utils/api';

export default function AppCustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    gender: '',
    address: ''
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const list = await api.getAppCustomers();
      setCustomers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ fullName: '', email: '', phoneNumber: '', password: '', gender: '', address: '' });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phoneNumber: customer.phoneNumber || '',
      password: '',
      gender: customer.gender || '',
      address: customer.address || ''
    });
    setError('');
    setSuccess('');
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fullName || !formData.email || !formData.phoneNumber) {
      setError('Full name, email, and phone number are required.');
      return;
    }
    if (!editingCustomer && !formData.password) {
      setError('Password is required for new customers.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const payload = { ...formData };
      if (editingCustomer && !payload.password) delete payload.password;

      if (editingCustomer) {
        await api.updateAppCustomer(editingCustomer.id, payload);
        setSuccess('Customer updated successfully!');
      } else {
        await api.createAppCustomer(payload);
        setSuccess('Customer created! They can now login to the app.');
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      setError(err.message || 'Operation failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer account? This action cannot be undone.')) return;
    try {
      await api.deleteCustomer(id);
      loadCustomers();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const filtered = customers.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.fullName?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phoneNumber?.includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">App Customers</h2>
          <p className="text-xs text-slate-500 font-medium">Create customer accounts for the mobile app</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Customer</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
        />
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Customers</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Active This Month</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {customers.filter(c => {
              const d = new Date(c.createdAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Male</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{customers.filter(c => c.gender === 'Male').length}</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Female</p>
          <p className="text-2xl font-extrabold text-pink-600 mt-1">{customers.filter(c => c.gender === 'Female').length}</p>
        </div>
      </div>

      {/* Customer list */}
      <div className="bg-white border border-slate-200/60 rounded-3xl shadow-premium overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">Customer Directory</h3>
          <span className="text-[10px] text-slate-400 font-semibold">{filtered.length} customers</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold">
              <Smartphone className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p>No app customers yet.</p>
              <p className="text-[10px] mt-1 text-slate-350">Create your first customer to get started.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-extrabold text-xs">
                    {c.fullName?.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{c.fullName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {c.email}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {c.phoneNumber}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {c.gender && (
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${c.gender === 'Male' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-pink-50 text-pink-600 border border-pink-100'}`}>
                      {c.gender}
                    </span>
                  )}
                  <button
                    onClick={() => copyToClipboard(c.email, c.id)}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
                    title="Copy email"
                  >
                    {copiedField === c.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                    title="Edit Customer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-100 text-slate-400 transition-colors"
                    title="Delete Customer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto flex flex-col relative animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-500" />
                {editingCustomer ? 'Edit Customer' : 'Create App Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold">{error}</div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold">{success}</div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="priya@email.com"
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="9876543210"
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 pl-9 pr-3 focus:outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  Password {editingCustomer ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingCustomer ? '••••••••' : 'Minimum 6 characters'}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 pl-9 pr-10 focus:outline-none focus:border-brand-500"
                    {...(!editingCustomer ? { required: true } : {})}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    placeholder="City, State"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {!editingCustomer && (
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <p className="text-[10px] text-blue-700 font-bold flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    This customer will be able to login to the mobile app using email & password.
                  </p>
                </div>
              )}

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
                  {editingCustomer ? 'Save Changes' : 'Create Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
