import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LiveAlertsFeed from './components/LiveAlertsFeed';

// Component Imports
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ProductManager from './components/ProductManager';
import CategoryManager from './components/CategoryManager';
import ManualCheckout from './components/ManualCheckout';
import OrderManager from './components/OrderManager';
import CustomerManager from './components/CustomerManager';
import LoyaltyManager from './components/LoyaltyManager';
import ReferralManager from './components/ReferralManager';
import BannerManager from './components/BannerManager';
import NotificationManager from './components/NotificationManager';
import CouponManager from './components/CouponManager';
import SupportTicketManager from './components/SupportTicketManager';
import AuditLogViewer from './components/AuditLogViewer';
import ReportPanel from './components/ReportPanel';
import OfferManager from './components/OfferManager';
import SettingsManager from './components/SettingsManager';
import Login from './components/Login';
import OripioFinView from './components/OripioFinView';
import EzMartView from './components/EzMartView';
import MasterDashboard from './components/MasterDashboard';
import AppCustomerManager from './components/AppCustomerManager';
import StoreLocationManager from './components/StoreLocationManager';
import PromoContentManager from './components/PromoContentManager';
import BookingsAppointments from './components/BookingsAppointments';

import api from './utils/api';

export default function App() {
  const initialUser = api.getCurrentUser();
  const [currentUser, setCurrentUser] = useState(initialUser);

  const getInitialTab = () => {
    const saved = localStorage.getItem('admin_active_tab');
    if (saved && saved !== 'notifications' && saved !== 'promos') return saved;
    return initialUser && initialUser.role === 'STAFF' ? 'orders' : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [theme, setTheme] = useState('oripiofin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [mountedTabs, setMountedTabs] = useState(() => {
    const initial = {};
    let base = getInitialTab();
    if (base.startsWith('reports-')) base = 'reports';
    if (base.startsWith('orders-') || base === 'orders') base = 'orders';
    initial[base] = true;
    return initial;
  });

  useEffect(() => {
    let base = activeTab;
    if (base.startsWith('reports-')) base = 'reports';
    if (base.startsWith('orders-') || base === 'orders') base = 'orders';
    setMountedTabs(prev => prev[base] ? prev : { ...prev, [base]: true });
    if (activeTab) {
      localStorage.setItem('admin_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      if (user.role === 'STAFF' && (activeTab === 'dashboard' || activeTab === 'reports' || activeTab === 'checkout' || activeTab === 'coupons' || activeTab === 'banners' || activeTab === 'loyalty' || activeTab === 'notifications' || activeTab === 'audits' || activeTab === 'settings')) {
        setActiveTab('orders');
      }
    }
  }, []);

  useEffect(() => {
    // Sync theme with HTML data-theme attribute
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    // Setup listener for real-time WebSocket mockup alarms to flash the notification bell
    const handleMockAlert = () => {
      if (!isLiveFeedOpen) {
        setHasUnreadAlerts(true);
      }
    };
    window.addEventListener('ws_mock_alert', handleMockAlert);
    return () => window.removeEventListener('ws_mock_alert', handleMockAlert);
  }, [isLiveFeedOpen]);

  const isTabAllowed = (tabId, role) => {
    if (!role) return false;
    if (role === 'SUPERADMIN' || role === 'ADMIN') return true;
    if (role === 'STAFF') {
      const allowedTabs = ['orders', 'orders-bookings', 'orders-fittings', 'orders-visits', 'orders-quick', 'orders-print', 'products', 'categories', 'customers', 'app-customers', 'stores', 'support', 'bookings'];
      return allowedTabs.includes(tabId);
    }
    return false;
  };

  const renderActiveTab = () => {
    if (currentUser && !isTabAllowed(activeTab, currentUser.role)) {
      return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-sm text-slate-500">
            You do not have permission to view this page. If you believe this is an error, please contact your administrator.
          </p>
          <button 
            onClick={() => setActiveTab('orders')}
            className="px-6 py-2.5 bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md hover:bg-brand-600 transition-colors"
          >
            Go to Bookings & Fittings
          </button>
        </div>
      );
    }

    const isBaseMatch = (base) => {
      if (base === 'reports') return activeTab.startsWith('reports-') || activeTab === 'reports';
      if (base === 'orders') return activeTab.startsWith('orders-') || activeTab === 'orders';
      return activeTab === base;
    };

    return (
      <>
        {mountedTabs['dashboard'] && (
          <div className={isBaseMatch('dashboard') ? 'block' : 'hidden'}>
            <MasterDashboard setActiveTab={setActiveTab} isActive={isBaseMatch('dashboard')} />
          </div>
        )}
        
        {mountedTabs['reports'] && (
          <div className={isBaseMatch('reports') ? 'block' : 'hidden'}>
            <AnalyticsDashboard currentTab={activeTab.startsWith('reports-') ? activeTab.replace('reports-', '') : 'customer'} isActive={isBaseMatch('reports')} />
          </div>
        )}

        {mountedTabs['checkout'] && (
          <div className={isBaseMatch('checkout') ? 'block' : 'hidden'}>
            <ManualCheckout isActive={isBaseMatch('checkout')} />
          </div>
        )}

        {mountedTabs['bookings'] && (
          <div className={isBaseMatch('bookings') ? 'block' : 'hidden'}>
            <BookingsAppointments setActiveTab={setActiveTab} isActive={isBaseMatch('bookings')} />
          </div>
        )}

        {mountedTabs['orders'] && (
          <div className={isBaseMatch('orders') ? 'block' : 'hidden'}>
            <OrderManager initialTab={{
              'orders-bookings': 'bookings',
              'orders-fittings': 'fittings',
              'orders-visits': 'visits',
              'orders-quick': 'quick_orders',
              'orders-print': 'print_schedule'
            }[activeTab] || 'bookings'} isActive={isBaseMatch('orders')} />
          </div>
        )}

        {mountedTabs['products'] && (
          <div className={isBaseMatch('products') ? 'block' : 'hidden'}>
            <ProductManager isActive={isBaseMatch('products')} />
          </div>
        )}

        {mountedTabs['categories'] && (
          <div className={isBaseMatch('categories') ? 'block' : 'hidden'}>
            <CategoryManager isActive={isBaseMatch('categories')} />
          </div>
        )}

        {mountedTabs['customers'] && (
          <div className={isBaseMatch('customers') ? 'block' : 'hidden'}>
            <CustomerManager isActive={isBaseMatch('customers')} />
          </div>
        )}

        {mountedTabs['app-customers'] && (
          <div className={isBaseMatch('app-customers') ? 'block' : 'hidden'}>
            <AppCustomerManager isActive={isBaseMatch('app-customers')} />
          </div>
        )}

        {mountedTabs['stores'] && (
          <div className={isBaseMatch('stores') ? 'block' : 'hidden'}>
            <StoreLocationManager isActive={isBaseMatch('stores')} />
          </div>
        )}

        {mountedTabs['loyalty'] && (
          <div className={isBaseMatch('loyalty') ? 'block' : 'hidden'}>
            <div className="space-y-10">
              <LoyaltyManager isActive={isBaseMatch('loyalty')} />
              <ReferralManager isActive={isBaseMatch('loyalty')} />
            </div>
          </div>
        )}

        {mountedTabs['banners'] && (
          <div className={isBaseMatch('banners') ? 'block' : 'hidden'}>
            <BannerManager isActive={isBaseMatch('banners')} />
          </div>
        )}

        {mountedTabs['notifications'] && (
          <div className={isBaseMatch('notifications') ? 'block' : 'hidden'}>
            <NotificationManager isActive={isBaseMatch('notifications')} />
          </div>
        )}

        {mountedTabs['coupons'] && (
          <div className={isBaseMatch('coupons') ? 'block' : 'hidden'}>
            <CouponManager isActive={isBaseMatch('coupons')} />
          </div>
        )}

        {mountedTabs['offers'] && (
          <div className={isBaseMatch('offers') ? 'block' : 'hidden'}>
            <OfferManager isActive={isBaseMatch('offers')} />
          </div>
        )}

        {mountedTabs['support'] && (
          <div className={isBaseMatch('support') ? 'block' : 'hidden'}>
            <SupportTicketManager isActive={isBaseMatch('support')} />
          </div>
        )}

        {mountedTabs['promos'] && (
          <div className={isBaseMatch('promos') ? 'block' : 'hidden'}>
            <PromoContentManager isActive={isBaseMatch('promos')} />
          </div>
        )}

        {mountedTabs['audits'] && (
          <div className={isBaseMatch('audits') ? 'block' : 'hidden'}>
            <AuditLogViewer isActive={isBaseMatch('audits')} />
          </div>
        )}

        {mountedTabs['settings'] && (
          <div className={isBaseMatch('settings') ? 'block' : 'hidden'}>
            <SettingsManager isActive={isBaseMatch('settings')} />
          </div>
        )}
      </>
    );
  };

  const handleLogout = async () => {
    localStorage.removeItem('admin_active_tab');
    await api.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => {
      setCurrentUser(user);
      if (user.role === 'STAFF') {
        setActiveTab('orders');
      } else {
        setActiveTab('dashboard');
      }
    }} />;
  }

  return (
    <div className="min-h-screen flex transition-colors duration-300">
      
      {/* Persisted responsive sidebar drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        setTheme={setTheme}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        
        {/* Dynamic header */}
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          theme={theme}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onToggleLiveFeed={() => setIsLiveFeedOpen(!isLiveFeedOpen)}
          hasUnreadAlerts={hasUnreadAlerts}
          currentUser={currentUser}
        />

        {/* Inner panel contents with smooth layouts transition */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full p-6 transition-theme bg-bg-main">
          <div className="max-w-7xl mx-auto">
            {renderActiveTab()}
          </div>
        </main>
      </div>

      {/* Slide-out WebSocket alerts notification drawer */}
      <LiveAlertsFeed
        isOpen={isLiveFeedOpen}
        onClose={() => setIsLiveFeedOpen(false)}
        onAlertsRead={() => setHasUnreadAlerts(false)}
      />
    </div>
  );
}
