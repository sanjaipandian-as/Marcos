import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Plus, 
  Minus, 
  History,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import api from '../utils/api';

export default function LoyaltyManager() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Selected user
  const [selectedCustId, setSelectedCustId] = useState('');
  const [adjustPoints, setAdjustPoints] = useState('100');
  const [adjustReason, setAdjustReason] = useState('Campaign Bonus');
  const [isDeduct, setIsDeduct] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const custs = await api.getCustomers();
      const txs = await api.getPointTransactions();
      setCustomers(custs);
      setTransactions(txs);
      if (custs.length > 0 && !selectedCustId) {
        setSelectedCustId(custs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedCustId) {
      setError('Please select a customer.');
      return;
    }

    const delta = Number(adjustPoints) * (isDeduct ? -1 : 1);
    if (isNaN(delta) || delta === 0) {
      setError('Invalid points delta.');
      return;
    }
    if (!adjustReason.trim()) {
      setError('Please provide adjustment reason details.');
      return;
    }

    try {
      await api.adjustLoyaltyPoints(selectedCustId, delta, adjustReason.trim());
      setSuccess('Loyalty balance updated successfully!');
      setAdjustPoints('100');
      setAdjustReason('Campaign Bonus');
      loadData();
    } catch (err) {
      setError(err.message || 'Points adjustment failed.');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Loyalty & Rewards Program</h2>
        <p className="text-xs text-slate-500 font-medium">Add or deduct customer reward points and view the transactions history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Adjust Points Form (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Award className="w-4.5 h-4.5 text-brand-500" />
            <span>Manually Adjust Balance</span>
          </h3>

          <form onSubmit={handleAdjust} className="space-y-4">
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

            {/* Select Customer */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block font-sans">Target Customer</label>
              <select
                value={selectedCustId}
                onChange={e => setSelectedCustId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 bg-white focus:outline-none focus:border-brand-500 font-semibold"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.pointsBalance} pts)</option>
                ))}
              </select>
            </div>

            {/* Adjustment Type Toggle */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block font-sans">Adjustment Action</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeduct(false)}
                  className={`
                    py-1.5 rounded-xl text-xs font-bold border transition-all focus:outline-none
                    ${!isDeduct 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                      : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'}
                  `}
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Add Points
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeduct(true)}
                  className={`
                    py-1.5 rounded-xl text-xs font-bold border transition-all focus:outline-none
                    ${isDeduct 
                      ? 'bg-red-500 border-red-500 text-white shadow-sm' 
                      : 'border-slate-200 bg-white text-slate-650 hover:bg-slate-50'}
                  `}
                >
                  <Minus className="w-3.5 h-3.5 inline mr-1" /> Deduct Points
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block font-sans">Points Delta Amount</label>
              <input
                type="number"
                value={adjustPoints}
                onChange={e => setAdjustPoints(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500 font-semibold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase block font-sans">Adjustment Reason *</label>
              <input
                type="text"
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                placeholder="e.g. In-store goodwill refund"
                className="w-full text-xs border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-brand-500"
                required
              />
            </div>

            <button
              type="submit"
              className={`
                w-full py-2 rounded-xl text-white font-extrabold text-xs shadow-sm transition-colors focus:outline-none
                ${isDeduct ? 'bg-red-500 hover:bg-red-650' : 'bg-emerald-600 hover:bg-emerald-700'}
              `}
            >
              Apply Adjustment
            </button>
          </form>
        </div>

        {/* Transactions History List (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-slate-400" />
            <span>Adjustment Ledger History</span>
          </h3>

          <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto pr-1">
            {transactions.length === 0 ? (
              <p className="text-xs text-center text-slate-400 py-8">No point transactions found</p>
            ) : (
              transactions.map(tx => (
                <div key={tx.id} className="py-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{tx.userName}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">{tx.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-extrabold text-sm ${tx.points > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.points > 0 ? `+${tx.points}` : tx.points}
                    </span>
                    <p className="text-[9px] text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Customer Balances List */}
      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <UserCheck className="w-4.5 h-4.5 text-blue-500" />
          <span>Customer Point Balances</span>
        </h3>
        
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-transparent text-xs outline-none w-full font-medium"
          />
        </div>

        <div className="divide-y divide-slate-100 min-h-[100px]">
          {paginatedCustomers.length === 0 ? (
            <p className="text-xs text-center text-slate-400 py-8">No customers found</p>
          ) : (
            paginatedCustomers.map(c => (
              <div key={c.id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{c.fullName}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{c.email}</p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-brand-600">
                    {c.pointsBalance} pts
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-xs font-bold text-slate-500 hover:text-brand-600 disabled:opacity-50 disabled:hover:text-slate-500"
            >
              Previous
            </button>
            <span className="text-[10px] font-bold text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-xs font-bold text-slate-500 hover:text-brand-600 disabled:opacity-50 disabled:hover:text-slate-500"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
