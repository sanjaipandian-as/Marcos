import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  HelpCircle, 
  Mail, 
  Bell, 
  Share2, 
  Check,
  X,
  ChevronRight,
  Info,
  BookOpen
} from 'lucide-react';
import api from '../utils/api';

const formatTabName = (str) => {
  if (str === 'checkout') return 'Manual Checkout';
  if (str === 'orders') return 'Orders & Invoices';
  if (str === 'coupons') return 'Coupon Builder';
  if (str === 'banners') return 'Promo Banners';
  if (str === 'products') return 'Products & Trending';
  if (str === 'categories') return 'Category CRUD';
  if (str === 'customers') return 'Customers & Sizing';
  if (str === 'appointments') return 'Fittings & Visits';
  if (str === 'support') return 'Support Tickets';
  if (str === 'audits') return 'Audit Log Viewer';
  if (str === 'staff') return 'Staff Roles';
  if (str === 'settings') return 'Platform Settings';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default function Header({
  activeTab,
  setActiveTab,
  theme,
  setIsSidebarOpen,
  apiMode,
  onToggleLiveFeed,
  hasUnreadAlerts
}) {
  const [copied, setCopied] = useState(false);
  const [showMailDropdown, setShowMailDropdown] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [openTickets, setOpenTickets] = useState([]);

  useEffect(() => {
    async function fetchTickets() {
      try {
        const list = await api.getSupportTickets();
        setOpenTickets(list.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS'));
      } catch (err) {
        console.error(err);
      }
    }
    fetchTickets();
  }, [activeTab]);

  const getBreadcrumbs = () => {
    const brandName = 'MARCOS';
    
    if (activeTab === 'dashboard') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-brand-600 font-bold">{brandName}</span>
          <span>&gt;</span>
          <span className="text-slate-800 font-semibold">Dashboard</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <span className="text-brand-600 font-bold">{brandName}</span>
        <span>&gt;</span>
        <span>Dashboard</span>
        <span>&gt;</span>
        <span className="text-slate-800 font-semibold">{formatTabName(activeTab)}</span>
      </div>
    );
  };

  const handleShare = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
      } else {
        const temp = document.createElement('input');
        temp.value = window.location.href;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <header className="h-16 bg-bg-card border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0 transition-theme">
      <div className="flex items-center gap-2 sm:gap-4 flex-1 lg:flex-initial">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden lg:block">
          {getBreadcrumbs()}
        </div>
        <div className="hidden sm:block lg:hidden text-xs font-extrabold text-slate-800">
          MARCOS &gt; {formatTabName(activeTab)}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3.5">
        <div className="relative hidden xl:block">
          <input
            type="text"
            placeholder="Search records, products..."
            className="w-48 xl:w-64 pl-9 pr-12 py-1.5 text-xs rounded-xl bg-slate-100 border border-transparent focus:bg-white focus:border-slate-300 focus:outline-none transition-all placeholder-slate-400"
          />
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <span className="absolute right-3 top-2 bg-white text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">
            ⌘ K
          </span>
        </div>

        <button
          onClick={onToggleLiveFeed}
          className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none group"
          title="Toggle Live WebSocket Feed"
        >
          <Bell className="w-4.5 h-4.5" />
          {hasUnreadAlerts && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        <div className="relative">
          <button 
            onClick={() => { setShowMailDropdown(!showMailDropdown); }}
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none"
            title="Support Inbox"
          >
            <Mail className="w-4.5 h-4.5" />
            {openTickets.length > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {openTickets.length}
              </span>
            )}
          </button>

          {showMailDropdown && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMailDropdown(false)} />
              <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 w-72 z-40 text-xs text-slate-655 animate-fadeIn">
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center bg-slate-550/5">
                  <span className="font-extrabold text-slate-800">Support Inbox</span>
                  <span className="text-[10px] text-brand-650 font-bold">{openTickets.length} Active Queries</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {openTickets.length === 0 ? (
                    <p className="px-4 py-6 text-center text-slate-400">No open customer queries</p>
                  ) : (
                    openTickets.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveTab('support');
                          setShowMailDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex flex-col gap-0.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 truncate max-w-[150px]">{t.subject}</span>
                          <span className="text-[8px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                            {t.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">From: {t.userName}</p>
                      </button>
                    ))
                  )}
                </div>
                <button
                  onClick={() => {
                    setActiveTab('support');
                    setShowMailDropdown(false);
                  }}
                  className="w-full text-center py-2 text-[10px] font-extrabold text-brand-650 hover:underline border-t border-slate-100 block"
                >
                  View All Tickets
                </button>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={() => setShowHelpModal(true)}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none hidden sm:block"
          title="Administrator Guide"
        >
          <HelpCircle className="w-4.5 h-4.5" />
        </button>

        <div className="w-px h-6 bg-slate-200 hidden sm:block" />

        <div className="flex items-center gap-1.5 sm:gap-3">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
            alt="Profile Avatar"
            className="w-8 h-8 sm:w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100"
          />
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-bold text-slate-800 leading-tight">Marcus George</span>
            <span className="text-[10px] text-slate-400 leading-none">Super Admin</span>
          </div>
        </div>

        <button
          onClick={handleShare}
          className="flex items-center justify-center p-2 sm:py-1.5 sm:px-3 rounded-xl bg-brand-500 hover:bg-brand-600 transition-colors text-white text-xs font-semibold shadow-premium shadow-brand-500/10 focus:outline-none shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>

      {showHelpModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto animate-scaleUp">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-655 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <BookOpen className="w-5.5 h-5.5 text-brand-500" />
              <h3 className="font-extrabold text-slate-800 text-base">MARCOS Administration Manual</h3>
            </div>

            <div className="space-y-5 py-4 text-xs text-slate-600 leading-relaxed overflow-y-auto">
              <p>
                Welcome to the <strong>MARCOS Operations Panel</strong>. This platform provides real-time custom tailoring and inventory management systems synced with the central Neon PostgreSQL database.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1">
                    <Info className="w-4 h-4 text-brand-500" />
                    <span>Currency Ledger</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    All calculations, manual checkout offline logs, and product prices strictly use the Indian Rupee (₹).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1">
                    <Info className="w-4 h-4 text-brand-500" />
                    <span>Sizing & Custom Fits</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Manage client measurements grouped by categories (Upper Body, Lower Body). Version snapshots are stored in history logs with green/red delta comparisons.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1">
                    <Info className="w-4 h-4 text-brand-500" />
                    <span>Dynamic Uploads</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Product wizard forms and Promo Banners allow uploading physical media direct to local storage base64 strings or remote R2 buckets.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1">
                    <Info className="w-4 h-4 text-brand-500" />
                    <span>Access Control</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    SuperAdmin can assign staff, update names, customize settings cooldown metrics, and verify background WebSocket audit logs.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl space-y-1">
                <span className="font-bold text-emerald-900 block">Keyboard & Navigation Shortcuts</span>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-800">
                  <li><strong>⌘ K</strong> Focus search bar to query database files</li>
                  <li><strong>Live Indicator</strong> Click the Bell icon to toggle real-time WebSockets feed</li>
                  <li><strong>Theme Toggler</strong> Toggle sidebar bottom switch to shift dashboards visual styles</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-colors block text-center mt-2"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
