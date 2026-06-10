import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LiveAlertsFeed from './components/LiveAlertsFeed';

// Component Imports
import OripioFinView from './components/OripioFinView';
import EzMartView from './components/EzMartView';
import ProductManager from './components/ProductManager';
import CategoryManager from './components/CategoryManager';
import ManualCheckout from './components/ManualCheckout';
import OrderManager from './components/OrderManager';
import CustomerManager from './components/CustomerManager';
import LoyaltyManager from './components/LoyaltyManager';
import ReferralManager from './components/ReferralManager';
import AppointmentManager from './components/AppointmentManager';
import BannerManager from './components/BannerManager';
import NotificationManager from './components/NotificationManager';
import CouponManager from './components/CouponManager';
import SupportTicketManager from './components/SupportTicketManager';
import AuditLogViewer from './components/AuditLogViewer';
import StaffManager from './components/StaffManager';
import ReportPanel from './components/ReportPanel';
import SettingsManager from './components/SettingsManager';
import Login from './components/Login';

import api from './utils/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [theme, setTheme] = useState('oripiofin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLiveFeedOpen, setIsLiveFeedOpen] = useState(false);
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [apiMode, setApiMode] = useState('demo');

  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EzMartView theme={theme} />;
      case 'reports':
        return <ReportPanel />;
      case 'checkout':
        return <ManualCheckout />;
      case 'orders':
        return <OrderManager />;
      case 'products':
        return <ProductManager />;
      case 'categories':
        return <CategoryManager />;
      case 'customers':
        return <CustomerManager />;
      case 'appointments':
        return <AppointmentManager />;
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
      case 'support':
        return <SupportTicketManager />;
      case 'audits':
        return <AuditLogViewer />;
      case 'staff':
        return <StaffManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return theme === 'oripiofin' ? <OripioFinView /> : <EzMartView />;
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
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
