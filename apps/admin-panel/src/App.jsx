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
import AppCustomerManager from './components/AppCustomerManager';
import StoreLocationManager from './components/StoreLocationManager';
import PromoContentManager from './components/PromoContentManager';

import api from './utils/api';

export default function App() {
  const initialUser = api.getCurrentUser();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState(
    initialUser && initialUser.role === 'STAFF' ? 'orders' : 'dashboard'
  );
  const [theme, setTheme] = useState('oripiofin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [apiMode, setApiMode] = useState('demo');

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
    // Sync current API mode configuration
    const mode = api.getLiveMode() ? 'live' : 'demo';
    setApiMode(mode);

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
      const allowedTabs = ['orders', 'orders-bookings', 'orders-fittings', 'orders-visits', 'orders-quick', 'orders-print', 'products', 'categories', 'customers', 'app-customers', 'stores', 'support'];
      return allowedTabs.includes(tabId);
    }
    return false;
  };

  const renderActiveTab = () => {
    if (currentUser && !isTabAllowed(activeTab, currentUser.role)) {
      return (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-md mx-auto my-12 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-red-550/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
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
    switch (activeTab) {
      case 'dashboard':
        return theme === 'oripiofin' ? <OripioFinView setActiveTab={setActiveTab} /> : <EzMartView setActiveTab={setActiveTab} />;
      case 'reports':
      case 'reports-customer':
      case 'reports-orders':
      case 'reports-revenue':
      case 'reports-time':
      case 'reports-sales':
      case 'reports-promotions':
      case 'reports-inventory':
        return <AnalyticsDashboard currentTab={activeTab.startsWith('reports-') ? activeTab.replace('reports-', '') : 'customer'} />;
      case 'checkout':
        return <ManualCheckout />;
      case 'orders':
      case 'orders-bookings':
      case 'orders-fittings':
      case 'orders-visits':
      case 'orders-quick':
      case 'orders-print':
        const tabMap = {
          'orders-bookings': 'bookings',
          'orders-fittings': 'fittings',
          'orders-visits': 'visits',
          'orders-quick': 'quick_orders',
          'orders-print': 'print_schedule'
        };
        const initialTab = tabMap[activeTab] || 'bookings';
        return <OrderManager initialTab={initialTab} />;
      case 'products':
        return <ProductManager />;
      case 'categories':
        return <CategoryManager />;
      case 'customers':
        return <CustomerManager />;
      case 'app-customers':
        return <AppCustomerManager />;
      case 'stores':
        return <StoreLocationManager />;
      case 'loyalty':
        return (
          <div className="space-y-10">
            <LoyaltyManager />
            <ReferralManager />
          </div>
        );
      case 'banners':
        return <BannerManager />;
      case 'notifications':
        return <NotificationManager />;
      case 'coupons':
        return <CouponManager />;
      case 'offers':
        return <OfferManager />;
      case 'support':
        return <SupportTicketManager />;
      case 'promos':
        return <PromoContentManager />;
      case 'audits':
        return <AuditLogViewer />;
      case 'settings':
        return <SettingsManager />;
      default:
        return theme === 'oripiofin' ? <OripioFinView setActiveTab={setActiveTab} /> : <EzMartView setActiveTab={setActiveTab} />;
    }
  };

  const handleLogout = async () => {
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
        apiMode={apiMode}
        setApiMode={setApiMode}
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
          apiMode={apiMode}
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
