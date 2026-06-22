import React, { useState, useEffect } from 'react';
import { 
  UsersRound, 
  Search, 
  ShieldCheck, 
  UserPlus, 
  Lock,
  ChevronDown,
  X,
  Mail,
  Phone,
  Edit
} from 'lucide-react';
import api from '../utils/api';

export default function StaffManager() {
  const [staff, setStaff] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit staff member state
  const [targetUser, setTargetUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectedRole, setSelectedRole] = useState('STAFF');

  // Add staff member state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 'STAFF'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const list = await api.getStaffList();
      setStaff(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!targetUser) return;
    if (!editName.trim()) {
      setError('Please input full name.');
      return;
    }

    try {
      await api.updateStaff(targetUser.id, { 
        fullName: editName.trim(), 
        role: selectedRole 
      });
      setSuccess(`Updated details for ${editName}`);
      setTargetUser(null);
      loadStaff();
    } catch (err) {
      setError(err.message || 'Details modification failed.');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newStaff.fullName || !newStaff.email || !newStaff.phoneNumber || !newStaff.password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      await api.createStaff({
        fullName: newStaff.fullName.trim(),
        email: newStaff.email.trim(),
        phoneNumber: newStaff.phoneNumber.trim(),
        password: newStaff.password,
        role: newStaff.role
      });
      setSuccess(`Team member '${newStaff.fullName}' created successfully!`);
      setShowAddModal(false);
      setNewStaff({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: 'STAFF'
      });
      loadStaff();
    } catch (err) {
      setError(err.message || 'Create team member failed.');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Staff & Team Roles</h2>
          <p className="text-xs text-slate-500 font-medium">Verify team profiles, audit logins, and update system authorization roles</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setError('');
            setSuccess('');
          }}
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-premium shadow-brand-500/10"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold animate-fadeIn">
          {success}
        </div>
      )}

      {/* Roster overview */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search team name, email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
        </div>

        <span className="text-xs text-slate-400 font-bold">
          Roster Size: {staff.length} Members
        </span>
      </div>

      {/* Staff grid cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((s) => (
          <div 
            key={s.id} 
            className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-premium flex flex-col justify-between h-52 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-emerald-500 text-white flex items-center justify-center font-black text-sm shadow-sm transition-all duration-300">
                  {s.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{s.fullName}</h4>
                  <span className={`
                    inline-block px-2 py-0.5 mt-1 rounded text-[8px] font-extrabold uppercase border
                    ${s.role === 'SUPERADMIN' 
                      ? 'bg-red-50 border-red-100 text-red-700' 
                      : s.role === 'ADMIN'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-blue-50 border-blue-100 text-blue-700'}
                  `}>
                    {s.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact details */}
            <div className="space-y-1.5 py-3 text-[11px] text-slate-550 border-t border-b border-slate-50 mt-3">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{s.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{s.phoneNumber || 'No phone recorded'}</span>
              </div>
            </div>

            {/* Quick edit actions */}
            <div className="pt-3 flex items-center justify-between mt-2">
              <span className="text-[9px] text-slate-400 font-semibold">Joined: {new Date(s.createdAt).toLocaleDateString()}</span>
              
              {s.role !== 'SUPERADMIN' && (
                <button
                  onClick={() => {
                    setTargetUser(s);
                    setEditName(s.fullName);
                    setSelectedRole(s.role);
                    setError('');
                  }}
                  className="flex items-center gap-1 text-[10px] font-extrabold text-brand-650 hover:underline border border-slate-200 py-1 px-3.5 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Team Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-base">Add New Team Member</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4 overflow-y-auto">
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Full Name *</label>
                <input
                  type="text"
                  value={newStaff.fullName}
                  onChange={e => setNewStaff({ ...newStaff, fullName: e.target.value })}
                  placeholder="e.g. Sanjay Kumar"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Email Address *</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="sanjay@marcos.com"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Phone Number *</label>
                <input
                  type="text"
                  value={newStaff.phoneNumber}
                  onChange={e => setNewStaff({ ...newStaff, phoneNumber: e.target.value })}
                  placeholder="+919988776655"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Password *</label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">System Role</label>
                <select
                  value={newStaff.role}
                  onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="STAFF">Staff (Standard)</option>
                  <option value="ADMIN">Admin (Manager)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-sm transition-colors mt-2"
              >
                Register Team Member
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {targetUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h4 className="font-extrabold text-slate-800 text-base">Edit Team Member Profile</h4>
              <button
                onClick={() => setTargetUser(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-650 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              {error && <div className="text-xs font-bold text-red-500">{error}</div>}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">Full Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 focus:outline-none focus:border-brand-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase block">System Role</label>
                <select
                  value={selectedRole}
                  onChange={e => setSelectedRole(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl py-2.5 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"
                >
                  <option value="STAFF">Staff (Standard)</option>
                  <option value="ADMIN">Admin (Manager)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold text-xs shadow-sm transition-colors mt-2"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
