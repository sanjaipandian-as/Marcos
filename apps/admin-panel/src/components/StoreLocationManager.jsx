import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Clock, 
  Globe, 
  X, 
  Navigation,
  Store,
  ToggleLeft,
  ToggleRight,
  Upload
} from 'lucide-react';
import api from '../utils/api';

export default function StoreLocationManager() {
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    openingHours: '09:00',
    closingHours: '21:00',
    isActive: true,
    description: '',
    imageUrl: ''
  });

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const list = await api.getStoreLocations();
      setStores(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingStore(null);
    setFormData({
      name: '', address: '', city: '', state: '', pincode: '', country: 'India',
      phone: '', email: '', latitude: '', longitude: '',
      openingHours: '09:00', closingHours: '21:00',
      isActive: true, description: '', imageUrl: ''
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      pincode: store.pincode || '',
      country: store.country || 'India',
      phone: store.phone || '',
      email: store.email || '',
      latitude: String(store.latitude || ''),
      longitude: String(store.longitude || ''),
      openingHours: store.openingHours || '09:00',
      closingHours: store.closingHours || '21:00',
      isActive: store.isActive !== false,
      description: store.description || '',
      imageUrl: store.imageUrl || ''
    });
    setError('');
    setSuccess('');
    setIsModalOpen(true);
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

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.address || !formData.city || !formData.state || !formData.pincode || !formData.latitude || !formData.longitude) {
      setError('Name, address, city, state, pincode, and coordinates are required.');
      return;
    }

    const parseCoordinate = (val) => {
      if (typeof val === 'number') return val;
      if (!val) return 0;
      // Strip any letters or special symbols, keep sign and decimal digits
      const cleaned = val.replace(/[^\d.-]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const payload = {
      ...formData,
      latitude: parseCoordinate(formData.latitude),
      longitude: parseCoordinate(formData.longitude),
      phone: formData.phone || null,
      email: formData.email || null,
      description: formData.description || null,
      imageUrl: formData.imageUrl || null,
    };

    try {
      if (editingStore) {
        await api.updateStoreLocation(editingStore.id, payload);
        setSuccess('Store updated!');
      } else {
        await api.createStoreLocation(payload);
        setSuccess('Store location created!');
      }
      setIsModalOpen(false);
      loadStores();
    } catch (err) {
      setError(err.message || 'Action failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this store location?')) return;
    try {
      await api.deleteStoreLocation(id);
      loadStores();
    } catch (err) {
      alert(err.message || 'Delete failed.');
    }
  };

  const handleToggleActive = async (store) => {
    try {
      await api.updateStoreLocation(store.id, { isActive: !store.isActive });
      loadStores();
    } catch (err) {
      alert(err.message || 'Toggle failed.');
    }
  };

  const openGoogleMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Store Locations</h2>
          <p className="text-xs text-slate-500 font-medium">Manage physical store locations shown in the mobile app</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Add Store</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Stores</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{stores.length}</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-emerald-500 uppercase">Active</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stores.filter(s => s.isActive).length}</p>
        </div>
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Cities Covered</p>
          <p className="text-2xl font-extrabold text-brand-600 mt-1">{new Set(stores.map(s => s.city)).size}</p>
        </div>
      </div>

      {/* Store cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {stores.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 font-bold">
            <Store className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p>No store locations added yet.</p>
          </div>
        ) : (
          stores.map(store => (
            <div key={store.id} className="bg-white border border-slate-200/60 rounded-3xl overflow-hidden shadow-premium hover:shadow-lg transition-all">
              {/* Store Image */}
              {store.imageUrl ? (
                <div className="h-36 bg-slate-100">
                  <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <Store className="w-8 h-8 text-slate-400" />
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{store.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{store.city}, {store.state}</p>
                  </div>
                  <button
                    onClick={() => handleToggleActive(store)}
                    className="shrink-0"
                    title={store.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {store.isActive
                      ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                      : <ToggleLeft className="w-6 h-6 text-slate-400" />
                    }
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-500" />
                  {store.address}, {store.pincode}
                </p>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500 font-semibold">
                  {store.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {store.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" /> {store.openingHours} – {store.closingHours}
                  </span>
                </div>

                {store.description && (
                  <p className="text-[10px] text-slate-400 line-clamp-2">{store.description}</p>
                )}
              </div>

              <div className="flex border-t border-slate-100">
                <button
                  onClick={() => openGoogleMaps(store.latitude, store.longitude)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 text-brand-500 hover:bg-brand-50 text-xs font-semibold transition-colors border-r border-slate-100"
                >
                  <Navigation className="w-3.5 h-3.5" /> Directions
                </button>
                <button
                  onClick={() => handleOpenEdit(store)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 text-slate-500 hover:bg-slate-50 text-xs font-semibold transition-colors border-r border-slate-100"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(store.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 text-slate-400 hover:bg-red-50 hover:text-red-500 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col relative animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-500" />
                {editingStore ? 'Edit Store Location' : 'Add Store Location'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {error && <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold">{error}</div>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Store Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. MARCOS Studio - Brigade Road"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Address *</label>
                <textarea
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Full street address..."
                  rows="2"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Bangalore"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Karnataka"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Pincode *</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="560001"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="store@marcos.com"
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Globe className="w-4 h-4 text-blue-500" />
                  GPS Coordinates *
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Latitude</label>
                    <input
                      type="text"
                      value={formData.latitude}
                      onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                      placeholder="e.g. 13.0500"
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 bg-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Longitude</label>
                    <input
                      type="text"
                      value={formData.longitude}
                      onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                      placeholder="e.g. 80.2824"
                      className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 bg-white"
                      required
                    />
                  </div>
                </div>
                <p className="text-[9px] text-blue-500 font-medium">
                  Tip: Search your store on Google Maps, right-click → "What's here?" to get coordinates.
                </p>
              </div>

              {/* Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Opening Hours</label>
                  <input
                    type="time"
                    value={formData.openingHours}
                    onChange={e => setFormData({ ...formData, openingHours: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">Closing Hours</label>
                  <input
                    type="time"
                    value={formData.closingHours}
                    onChange={e => setFormData({ ...formData, closingHours: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief info about this store..."
                  rows="2"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Store Image */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">Store Image</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/store-image.jpg"
                    className="flex-1 text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  />
                  <label className="cursor-pointer shrink-0 py-2 px-3.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 text-xs font-bold transition-all flex items-center gap-1 select-none">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
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
                  {editingStore ? 'Save Changes' : 'Add Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
