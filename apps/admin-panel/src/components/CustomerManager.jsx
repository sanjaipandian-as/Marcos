import React, { useState, useEffect } from 'react';
import { 
  Search, 
  User, 
  Ruler, 
  History, 
  Edit, 
  Save, 
  Plus,
  FileText,
  Trash2
} from 'lucide-react';
import api from '../utils/api';

const fieldLabels = {
  fullLength: 'Full Length',
  shoulderWidth: 'Shoulder Width',
  upperChest: 'Upper Chest',
  bust: 'Bust Size',
  waist: 'Waist Size',
  hip: 'Hip Size',
  armLength: 'Arm Length',
  sleeveLength: 'Sleeve Length',
  neck: 'Neck Size',
  skirtLength: 'Skirt Length',
  pantLength: 'Pant Length'
};

const sheetTabs = {
  upper: [
    { key: 'fullLength', label: 'Full Length' },
    { key: 'shoulderWidth', label: 'Shoulder Width' },
    { key: 'upperChest', label: 'Upper Chest' },
    { key: 'bust', label: 'Bust Size' }
  ],
  lower: [
    { key: 'waist', label: 'Waist Size' },
    { key: 'hip', label: 'Hip Size' },
    { key: 'skirtLength', label: 'Skirt Length' },
    { key: 'pantLength', label: 'Pant Length' }
  ],
  sleeves: [
    { key: 'armLength', label: 'Arm Length' },
    { key: 'sleeveLength', label: 'Sleeve Length' },
    { key: 'neck', label: 'Neck Size' }
  ]
};

export default function CustomerManager() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [profiles, setProfiles] = useState([]);
  
  const [activeProfile, setActiveProfile] = useState(null);
  const [profileHistory, setProfileHistory] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [activeSheetTab, setActiveSheetTab] = useState('upper');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const list = await api.getCustomers();
      setCustomers(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectCustomer = async (id) => {
    try {
      const data = await api.getCustomerDetails(id);
      setCustomerInfo(data.user);
      setProfiles(data.profiles);
      setSelectedCustomerId(id);
      setIsEditing(false);
      setIsAddingProfile(false);
      
      if (data.profiles.length > 0) {
        handleSelectProfile(data.profiles[0]);
      } else {
        setActiveProfile(null);
        setProfileHistory([]);
      }
    } catch (err) {
      alert('Failed to load customer details');
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Are you sure you want to delete this measurement profile?')) return;
    try {
      await api.deleteMeasurementProfile(profileId);
      // Reload customer details to sync profiles list
      if (customerInfo) {
        handleSelectCustomer(customerInfo.id);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete profile.');
    }
  };

  const handleSelectProfile = async (profile) => {
    setActiveProfile(profile);
    setEditForm({ ...profile });
    setIsEditing(false);
    
    try {
      const hist = await api.getMeasurementHistory(profile.id);
      setProfileHistory(hist);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    try {
      const p = await api.createMeasurementProfile({
        userId: customerInfo.id,
        profileName: newProfileName.trim(),
        fullLength: 0,
        shoulderWidth: 0,
        upperChest: 0,
        bust: 0,
        waist: 0,
        hip: 0,
        armLength: 0,
        sleeveLength: 0,
        neck: 0,
        skirtLength: 0,
        pantLength: 0,
        tailorNotes: ''
      });

      setNewProfileName('');
      setIsAddingProfile(false);
      
      const data = await api.getCustomerDetails(customerInfo.id);
      setProfiles(data.profiles);
      
      const newP = data.profiles.find(item => item.id === p.id);
      if (newP) handleSelectProfile(newP);
    } catch (err) {
      alert('Create profile failed');
    }
  };

  const handleSaveMeasurements = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateMeasurements(activeProfile.id, {
        fullLength: Number(editForm.fullLength),
        shoulderWidth: Number(editForm.shoulderWidth),
        upperChest: Number(editForm.upperChest),
        bust: Number(editForm.bust),
        waist: Number(editForm.waist),
        hip: Number(editForm.hip),
        armLength: Number(editForm.armLength),
        sleeveLength: Number(editForm.sleeveLength),
        neck: Number(editForm.neck),
        skirtLength: Number(editForm.skirtLength),
        pantLength: Number(editForm.pantLength),
        tailorNotes: editForm.tailorNotes
      });

      setIsEditing(false);
      setActiveProfile(updated);
      
      const hist = await api.getMeasurementHistory(activeProfile.id);
      setProfileHistory(hist);
      
      const data = await api.getCustomerDetails(customerInfo.id);
      setProfiles(data.profiles);
    } catch (err) {
      alert('Save measurements failed.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Customer Directory</h2>
        <p className="text-xs text-slate-500 font-medium">View tailoring measurement charts and modification history logs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customer name..."
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-550/5 border border-slate-200 focus:bg-white focus:outline-none"
            />
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <p className="text-xs text-center text-slate-400 py-8">No customers found</p>
            ) : (
              filteredCustomers.map(cust => (
                <button
                  key={cust.id}
                  onClick={() => handleSelectCustomer(cust.id)}
                  className={`
                    w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-colors focus:outline-none
                    ${selectedCustomerId === cust.id 
                      ? 'bg-brand-55 border border-brand-100/50' 
                      : 'hover:bg-slate-50 border border-transparent'}
                  `}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${selectedCustomerId === cust.id ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {cust.fullName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{cust.fullName}</p>
                    <p className="text-[10px] text-slate-400 truncate">{cust.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          {!selectedCustomerId ? (
            <div className="bg-white border border-slate-200/60 rounded-3xl p-16 text-center text-slate-400 shadow-premium font-bold">
              Please select a customer from the directory list to inspect their sizing details.
            </div>
          ) : (
            <>
              <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-55 flex items-center justify-center text-brand-600 font-extrabold text-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{customerInfo.fullName}</h3>
                    <p className="text-xs text-slate-505">{customerInfo.email} • {customerInfo.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-605 py-1 px-3 rounded-full uppercase">
                    Loyalty Balance: {customerInfo.pointsBalance} Pts
                  </span>
                  <span className="text-[9px] text-slate-400">Code: {customerInfo.referralCode}</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-slate-250 pb-2">
                <div className="flex gap-2 flex-wrap">
                  {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className={`
                        py-1.5 px-4 rounded-xl text-xs font-bold transition-all focus:outline-none
                        ${activeProfile?.id === p.id 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-500'}
                      `}
                    >
                      {p.profileName}
                    </button>
                  ))}
                  
                  {!isAddingProfile ? (
                    <button
                      onClick={() => setIsAddingProfile(true)}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-xl border border-slate-205 hover:bg-slate-50 text-slate-500 text-xs font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Profile</span>
                    </button>
                  ) : (
                    <form onSubmit={handleCreateProfile} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={newProfileName}
                        onChange={e => setNewProfileName(e.target.value)}
                        placeholder="Profile name (e.g. Sister)"
                        className="py-1 px-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-brand-500 w-36"
                        required
                      />
                      <button type="submit" className="text-xs font-bold bg-brand-500 hover:bg-brand-600 text-white py-1.5 px-2.5 rounded-lg shadow-sm">Save</button>
                      <button type="button" onClick={() => setIsAddingProfile(false)} className="text-xs font-bold text-slate-400">Cancel</button>
                    </form>
                  )}
                </div>
              </div>

              {activeProfile ? (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <Ruler className="w-4.5 h-4.5 text-brand-500" />
                      <span>Dimensions Sheet: {activeProfile.profileName}</span>
                    </h4>
                    {!isEditing ? (
                      <div className="flex gap-2 self-start sm:self-auto flex-wrap">
                        <button
                          onClick={() => handleDeleteProfile(activeProfile.id)}
                          className="flex items-center gap-1 text-[11px] font-bold border border-red-250 py-1.5 px-3 rounded-xl hover:bg-red-50 text-red-650"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Profile</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="flex items-center gap-1 text-[11px] font-bold border border-slate-250 py-1.5 px-3 rounded-xl hover:bg-slate-50 text-slate-650"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Adjust Measurements</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSaveMeasurements}
                        className="self-start sm:self-auto flex items-center gap-1 text-[11px] font-bold bg-brand-500 hover:bg-brand-600 py-1.5 px-3 rounded-xl text-white shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Profile</span>
                      </button>
                    )}
                  </div>

                  <div className="flex border-b border-slate-150 pb-2 gap-4">
                    {[
                      { id: 'upper', label: 'Upper Body' },
                      { id: 'lower', label: 'Lower Body' },
                      { id: 'sleeves', label: 'Sleeves & Collar' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveSheetTab(tab.id)}
                        className={`text-xs font-extrabold pb-1.5 transition-all border-b-2 -mb-[10px] focus:outline-none ${
                          activeSheetTab === tab.id
                            ? 'border-brand-500 text-brand-600'
                            : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    {sheetTabs[activeSheetTab].map(field => (
                      <div key={field.key} className="space-y-1 p-3 rounded-xl bg-slate-550/5 border border-slate-100/80 transition-all hover:border-slate-200">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">{field.label}</span>
                        {isEditing ? (
                          <div className="relative flex items-center">
                            <input
                              type="number"
                              step="0.1"
                              value={editForm[field.key] || ''}
                              onChange={e => setEditForm({ ...editForm, [field.key]: e.target.value })}
                              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            />
                            <span className="absolute right-2 text-[10px] text-slate-400 font-bold">in</span>
                          </div>
                        ) : (
                          <span className="text-xs font-extrabold text-slate-750">
                            {activeProfile[field.key] ? `${activeProfile[field.key]} inches` : 'Not recorded'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Tailoring Notes</label>
                    {isEditing ? (
                      <textarea
                        value={editForm.tailorNotes || ''}
                        onChange={e => setEditForm({ ...editForm, tailorNotes: e.target.value })}
                        className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-brand-500"
                        rows="3"
                        placeholder="Write physical details, styling preferences..."
                      />
                    ) : (
                      <p className="text-xs text-slate-655 bg-slate-50 rounded-xl p-3 leading-relaxed border border-slate-100">
                        {activeProfile.tailorNotes || 'No custom tailor notes recorded.'}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h5 className="font-bold text-slate-755 text-xs flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-400" />
                      <span>Sizing Change Logs</span>
                    </h5>
                    
                    {profileHistory.length === 0 ? (
                      <p className="text-[10px] text-slate-450 italic">No dimensions changes logged yet</p>
                    ) : (
                      <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                        {profileHistory.map((h) => {
                          const changedKeys = Object.keys(fieldLabels);
                          const deltas = [];
                          changedKeys.forEach(key => {
                            const prev = h.previousValues?.[key];
                            const curr = h.newValues?.[key];
                            if (prev !== undefined && curr !== undefined && Number(prev) !== Number(curr)) {
                              const diff = Number(curr) - Number(prev);
                              deltas.push({
                                key,
                                label: fieldLabels[key],
                                prev,
                                curr,
                                diff
                              });
                            }
                          });

                          return (
                            <div key={h.id} className="p-3 border border-slate-150 rounded-xl bg-slate-550/5 text-[10px] space-y-2">
                              <div className="flex justify-between font-bold text-slate-550">
                                <span>Modifications by <span className="text-slate-800">{h.changedBy}</span></span>
                                <span>{new Date(h.changedAt).toLocaleDateString()}</span>
                              </div>
                              
                              {deltas.length === 0 ? (
                                <div className="text-slate-400 italic">No value changes (notes updated)</div>
                              ) : (
                                <div className="flex flex-wrap gap-1.5">
                                  {deltas.map(d => {
                                    const isInc = d.diff > 0;
                                    return (
                                      <span
                                        key={d.key}
                                        className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-bold ${
                                          isInc
                                            ? 'bg-emerald-50 text-emerald-750 border border-emerald-200'
                                            : 'bg-rose-50 text-rose-750 border border-rose-200'
                                        }`}
                                      >
                                        {d.label}: {d.prev}" ➔ {d.curr}" ({isInc ? '+' : ''}{d.diff.toFixed(1)}")
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/60 rounded-3xl p-10 text-center text-slate-400 shadow-premium">
                  No custom sizing profiles configured for this user. Create one by clicking "+ Add Profile" above.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
