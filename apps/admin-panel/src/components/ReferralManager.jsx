import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  Users, 
  Gift, 
  Copy, 
  Check,
  Award
} from 'lucide-react';
import api from '../utils/api';

export default function ReferralManager() {
  const [customers, setCustomers] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

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

  const handleCopyLink = (code, id) => {
    const link = `https://marcos.platform/signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getReferredBy = (referredById) => {
    if (!referredById) return 'None';
    return customers.find(c => c.id === referredById)?.fullName || 'Other Member';
  };

  const getReferralsCount = (codeId) => {
    return customers.filter(c => c.referredById === codeId).length;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Referral Program Console</h2>
        <p className="text-xs text-slate-505 font-medium">Track customer sign-up networks, custom referral links, and campaign rewards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Referral Earning Rate</span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">50 Points / Valid Registration</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Total Referred Signups</span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">
              {customers.filter(c => c.referredById).length} Registered Clients
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase leading-none">Top Referrer Code</span>
            <span className="text-sm font-extrabold text-slate-800 mt-1 block">PRIYA80 (3 Signups)</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-3xl p-6 shadow-premium space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-800 text-sm">Customer Referral Status Ledger</h3>
          <span className="text-[10px] text-slate-400 font-bold">Updated Live</span>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4">Referred By</th>
                <th className="py-3 px-4 text-center">Referrals Count</th>
                <th className="py-3 px-4 text-right">Referral Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{c.fullName}</td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-650">{c.referralCode}</td>
                  <td className="py-3 px-4 text-slate-500 font-medium">{getReferredBy(c.referredById)}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-700">{getReferralsCount(c.id)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleCopyLink(c.referralCode, c.id)}
                      className="inline-flex items-center gap-1 py-1 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-505 text-[10px] font-bold transition-all focus:outline-none"
                    >
                      {copiedId === c.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy link</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 hover:bg-slate-50 transition-colors">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">{c.fullName}</span>
                <span className="font-mono font-bold text-slate-600 text-[11px] bg-white border border-slate-150 px-2 py-0.5 rounded">
                  {c.referralCode}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="text-slate-400 font-medium">Referred By</p>
                  <p className="text-slate-705 font-semibold">{getReferredBy(c.referredById)}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 font-medium">Referrals Count</p>
                  <p className="text-slate-705 font-bold">{getReferralsCount(c.id)}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => handleCopyLink(c.referralCode, c.id)}
                  className="inline-flex items-center gap-1 py-1 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-505 text-[10px] font-bold transition-all focus:outline-none"
                >
                  {copiedId === c.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
