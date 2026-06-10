import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Tags, 
  ShoppingCart, 
  Users, 
  Calendar, 
  Award, 
  Megaphone, 
  Image, 
  Ticket, 
  LifeBuoy, 
  ShieldAlert, 
  UsersRound, 
  BarChart3, 
  Settings,
  Flame,
  Globe,
  Database,
  Layers
} from 'lucide-react';
import api from '../utils/api';

export default function Sidebar({
  activeTab,
  setActiveTab,
  theme,
  setTheme,
  isSidebarOpen,
  setIsSidebarOpen,
  apiMode,
  setApiMode,
  onLogout
}) {
  const [counts, setCounts] = React.useState({
    products: 0,
    orders: 0,
    appointments: 0,
    support: 0
  });

  const fetchCounts = async () => {
    try {
      const [products, orders, appointments, visits, supportTickets] = await Promise.all([
        api.getProducts().catch(() => []),
        api.getOrders().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getStoreVisits().catch(() => []),
        api.getSupportTickets().catch(() => [])
      ]);

      // Count low stock/out of stock (original logic)
      const lowStockCount = (products || []).filter(
        p => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK' || p.inventoryQty <= 10
      ).length;

      // Count pending/processing orders
      const pendingOrdersCount = (orders || []).filter(
        o => o.status === 'PENDING' || o.status === 'PROCESSING'
      ).length;

      // Count pending appointments + active/assigned visits
      const pendingAppts = (appointments || []).filter(a => a.status === 'PENDING').length;
      const activeVisits = (visits || []).filter(v => v.status === 'PENDING' || v.status === 'ASSIGNED').length;

      // Count open/in-progress support tickets
      const pendingSupport = (supportTickets || []).filter(
        t => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
      ).length;

      setCounts({
        products: lowStockCount,
        orders: pendingOrdersCount,
        appointments: pendingAppts + activeVisits,
        support: pendingSupport
      });
    } catch (err) {
      console.error('Failed to load sidebar badge counts:', err);
    }
  };

  React.useEffect(() => {
    fetchCounts();
    
    // Listen to custom refresh events
    window.addEventListener('sidebar_badge_refresh', fetchCounts);
    window.addEventListener('ws_mock_alert', fetchCounts);

    const interval = setInterval(fetchCounts, 20000);

    return () => {
      window.removeEventListener('sidebar_badge_refresh', fetchCounts);
      window.removeEventListener('ws_mock_alert', fetchCounts);
      clearInterval(interval);
    };
  }, [apiMode, activeTab]);

  const menuGroups = [
    {
      title: 'MAIN',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      ]
    },
    {
      title: 'SALES & CHECKOUT',
      items: [
        { id: 'checkout', label: 'Manual Checkout', icon: ShoppingCart },
        { id: 'orders', label: 'Orders & Invoices', icon: ShoppingBag },
        { id: 'coupons', label: 'Coupon Builder', icon: Ticket },
        { id: 'banners', label: 'Promo Banners', icon: Image },
      ]
    },
    {
      title: 'CATALOG & INVENTORY',
      items: [
        { id: 'products', label: 'Products & Trending', icon: Flame },
        { id: 'categories', label: 'Category CRUD', icon: Layers },
      ]
    },
    {
      title: 'CORE OPERATIONS',
      items: [
        { id: 'customers', label: 'Customers & Sizing', icon: Users },
        { id: 'appointments', label: 'Fittings & Visits', icon: Calendar },
        { id: 'support', label: 'Support Tickets', icon: LifeBuoy },
      ]
    },
    {
      title: 'ENGAGEMENT',
      items: [
        { id: 'loyalty', label: 'Loyalty & Points', icon: Award },
        { id: 'notifications', label: 'Broadcast Alerts', icon: Megaphone },
      ]
    },
    {
      title: 'SECURITY & SYSTEM',
      items: [
        { id: 'audits', label: 'Audit Log Viewer', icon: ShieldAlert },
        { id: 'staff', label: 'Staff Roles', icon: UsersRound },
        { id: 'settings', label: 'Platform Settings', icon: Settings },
      ]
    }
  ];

  const toggleApiMode = () => {
    const nextMode = apiMode === 'live' ? 'demo' : 'live';
    api.setLiveMode(nextMode === 'live');
    setApiMode(nextMode);
    window.location.reload();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-bg-card border-r border-slate-200/80 
        flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-premium shadow-brand-500/20 transition-all duration-300">
              <span className="font-extrabold text-lg">M</span>
            </div>
            <div>
              <span className="font-bold text-slate-800 text-lg tracking-tight">
                MARCOS
              </span>
              <span className="text-[10px] block text-brand-600 font-semibold uppercase tracking-wider">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400/80 uppercase tracking-widest px-3 block">
                {group.title}
              </span>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const badgeCount = counts[item.id] || 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`
                      relative w-full flex items-center text-sm font-medium rounded-xl transition-all duration-200 group overflow-hidden
                      ${isActive 
                        ? 'bg-brand-500 text-white shadow-premium shadow-brand-500/20' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                      ${badgeCount > 0 ? 'pr-12' : 'pr-3'}
                      pl-3 py-2.5
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.label}</span>
                    </div>
                    {badgeCount > 0 && (
                      <span className={`
                        absolute top-0 bottom-0 right-0 w-10 flex items-center justify-center border-l font-extrabold text-xs transition-all duration-200
                        ${isActive 
                          ? 'border-white/20 text-white bg-white/10' 
                          : item.id === 'products'
                            ? 'border-red-200 text-red-600 bg-red-50'
                            : item.id === 'support'
                              ? 'border-amber-200 text-amber-600 bg-amber-50'
                              : item.id === 'orders'
                                ? 'border-indigo-200 text-indigo-650 bg-indigo-50'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50'}
                      `}>
                        {badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Configurations Controls Box at Sidebar Bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4 shrink-0">
          {/* Design Layout Toggler */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              DASHBOARD THEME
            </span>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setTheme('oripiofin')}
                className={`
                  py-1.5 px-2 text-xs font-semibold rounded-lg transition-all
                  ${theme === 'oripiofin' 
                    ? 'bg-white text-emerald-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'}
                `}
              >
                OripioFin
              </button>
              <button
                onClick={() => setTheme('ezmart')}
                className={`
                  py-1.5 px-2 text-xs font-semibold rounded-lg transition-all
                  ${theme === 'ezmart' 
                    ? 'bg-white text-orange-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'}
                `}
              >
                EzMart
              </button>
            </div>
          </div>

          {/* Fallback Mode Toggle */}
          <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-2">
              {apiMode === 'live' ? (
                <Globe className="w-4 h-4 text-emerald-600 animate-pulse" />
              ) : (
                <Database className="w-4 h-4 text-orange-600" />
              )}
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-700">
                  {apiMode === 'live' ? 'Live API Server' : 'Demo Mode'}
                </span>
                <span className="text-[9px] text-slate-400">
                  {apiMode === 'live' ? 'Port 5000 Active' : 'LocalStorage DB'}
                </span>
              </div>
            </div>
            <button
              onClick={toggleApiMode}
              className={`
                w-10 h-6 rounded-full transition-colors relative flex items-center px-0.5
                ${apiMode === 'live' ? 'bg-emerald-600' : 'bg-slate-300'}
              `}
            >
              <span className={`
                w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200
                ${apiMode === 'live' ? 'translate-x-4' : 'translate-x-0'}
              `} />
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-red-200/80 hover:bg-red-50 text-red-650 hover:text-red-700 text-xs font-bold transition-all duration-200"
          >
            <span>Log Out Account</span>
          </button>
        </div>
      </aside>
    </>
  );
}
