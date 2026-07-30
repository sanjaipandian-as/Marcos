import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { PRODUCT_NAME } from '../config/productName';

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
  setIsSidebarOpen,
  onToggleLiveFeed,
  hasUnreadAlerts,
  currentUser
}) {
  const getBreadcrumbs = () => {
    const brandName = PRODUCT_NAME;
    
    if (activeTab === 'dashboard') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-[#7A6B7A] font-medium">
          <span className="text-[#8F5C8F] font-bold">{brandName}</span>
          <span>&gt;</span>
          <span className="text-[#3D2E3D] font-semibold">Dashboard</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#7A6B7A] font-medium">
        <span className="text-[#8F5C8F] font-bold">{brandName}</span>
        <span>&gt;</span>
        <span>Dashboard</span>
        <span>&gt;</span>
        <span className="text-[#3D2E3D] font-semibold">{formatTabName(activeTab)}</span>
      </div>
    );
  };

  return (
    <header className="h-16 bg-[#FDFBFD] border-b border-[#F0E5F0] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 shrink-0 transition-theme">
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
        <div className="hidden sm:block lg:hidden text-xs font-extrabold text-[#3D2E3D]">
          {PRODUCT_NAME} &gt; {formatTabName(activeTab)}
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <button
          onClick={onToggleLiveFeed}
          className="relative p-2 rounded-xl text-[#7A6B7A] hover:bg-[#F0E5F0]/40 transition-colors focus:outline-none group"
          title="Toggle Live WebSocket Feed"
        >
          <Bell className="w-5 h-5" />
          {hasUnreadAlerts && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white animate-pulse" />
          )}
        </button>

        <div className="w-px h-6 bg-[#F0E5F0]" />

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
            alt="Profile Avatar"
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#F0E5F0]"
          />
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-bold text-[#3D2E3D] leading-tight">
              {currentUser?.fullName || 'Marcos SuperAdmin'}
            </span>
            <span className="text-[10px] text-[#7A6B7A] leading-none">
              {currentUser?.role === 'SUPERADMIN' ? 'Super Admin' : currentUser?.role === 'ADMIN' ? 'Admin' : currentUser?.role === 'STAFF' ? 'Staff' : 'Guest'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
