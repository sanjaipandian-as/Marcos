// Mock Database for the MARCOS Admin Panel
// Persists items in LocalStorage for testing CRUD and layout functionality offline in Javascript.

// SEED DATA
const defaultCategories = [
  { id: 'cat-1', name: 'Sherwanis', slug: 'sherwanis', order: 1 },
  { id: 'cat-2', name: 'Suits & Tuxedos', slug: 'suits-tuxedos', order: 2 },
  { id: 'cat-3', name: 'Designer Kurtas', slug: 'designer-kurtas', order: 3 },
  { id: 'cat-4', name: 'Indo-Western Wear', slug: 'indo-western', order: 4 },
];

const defaultProducts = [
  {
    id: 'prod-1',
    name: 'Imperial Emerald Sherwani',
    description: 'A hand-woven luxury silk sherwani with detailed gold zardozi embroidery work. Perfect for grooms.',
    price: 135000,
    materialInfo: 'Banarasi Raw Silk & Velvet lining',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500'],
    categoryId: 'cat-1',
    isTrending: true,
    trendingScheduledAt: '2026-06-01T00:00:00Z',
    inventoryQty: 12,
    stockStatus: 'IN_STOCK',
    createdAt: '2026-04-10T12:00:00Z',
  },
  {
    id: 'prod-2',
    name: 'Midnight Royal Tuxedo',
    description: 'Classic black velvet lapel tuxedo with matching slim-fit satin-lined trousers.',
    price: 85000,
    materialInfo: '100% Merino Wool, Satin Lapels',
    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500'],
    categoryId: 'cat-2',
    isTrending: true,
    trendingScheduledAt: '2026-06-05T00:00:00Z',
    inventoryQty: 4,
    stockStatus: 'LOW_STOCK',
    createdAt: '2026-04-15T08:00:00Z',
  },
  {
    id: 'prod-3',
    name: 'Crimson Ivory Kurta Set',
    description: 'Sleek asymmetric cotton silk kurta with matching slim pajama trousers.',
    price: 18500,
    materialInfo: 'Cotton Silk Blend',
    images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500'],
    categoryId: 'cat-3',
    isTrending: false,
    inventoryQty: 35,
    stockStatus: 'IN_STOCK',
    createdAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'prod-4',
    name: 'Brocade Bandhgala Jacket',
    description: 'Gold-bronze brocade patterned bandhgala jacket with high mandarin collar.',
    price: 45000,
    materialInfo: 'Jacquard Brocade Silk',
    images: ['https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=500'],
    categoryId: 'cat-4',
    isTrending: false,
    inventoryQty: 0,
    stockStatus: 'OUT_OF_STOCK',
    createdAt: '2026-05-12T14:30:00Z',
  },
];

const defaultUsers = [];

const defaultMeasurements = [];

const defaultMeasurementHistory = [];

const defaultBanners = [
  {
    id: 'ban-1',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
    title: 'Grand Wedding Season Launch',
    targetUrl: '/collections/wedding',
    location: 'HOME_SLIDER',
    scheduledStart: '2026-06-01T00:00:00Z',
    scheduledEnd: '2026-07-31T23:59:59Z',
    isActive: true,
    clicks: 1240,
    createdAt: '2026-05-28T09:00:00Z',
  },
  {
    id: 'ban-2',
    imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
    title: 'Up to 30% Off Indo-Western',
    targetUrl: '/collections/indo-western',
    location: 'PROMOTIONAL_SECTION',
    scheduledStart: '2026-06-05T00:00:00Z',
    scheduledEnd: '2026-06-25T23:59:59Z',
    isActive: true,
    clicks: 432,
    createdAt: '2026-06-04T10:00:00Z',
  },
];

const defaultCoupons = [];

const defaultUserCoupons = [];

const defaultAppointments = [];

const defaultStoreVisits = [];

const defaultOrders = [];

const defaultSupportTickets = [];

const defaultAuditLogs = [];

const defaultPointTransactions = [];

const defaultSettings = {
  lowStockThreshold: 10,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
  pointsEarnRate: 10,
  pointsRedeemRate: 0.1,
  otpCooldownMinutes: 15,
  maxOtpFailures: 3,
};

const defaultWallets = [];

const defaultCalendarCashFlow = {};


// INITIALIZATION
const initKey = 'marcos_db_init_v3';
export const initMockDatabase = () => {
  if (localStorage.getItem(initKey)) return;
  
  localStorage.setItem('m_categories', JSON.stringify(defaultCategories));
  localStorage.setItem('m_products', JSON.stringify(defaultProducts));
  localStorage.setItem('m_users', JSON.stringify(defaultUsers));
  localStorage.setItem('m_measurements', JSON.stringify(defaultMeasurements));
  localStorage.setItem('m_measurement_history', JSON.stringify(defaultMeasurementHistory));
  localStorage.setItem('m_banners', JSON.stringify(defaultBanners));
  localStorage.setItem('m_coupons', JSON.stringify(defaultCoupons));
  localStorage.setItem('m_user_coupons', JSON.stringify(defaultUserCoupons));
  localStorage.setItem('m_appointments', JSON.stringify(defaultAppointments));
  localStorage.setItem('m_store_visits', JSON.stringify(defaultStoreVisits));
  localStorage.setItem('m_orders', JSON.stringify(defaultOrders));
  localStorage.setItem('m_support_tickets', JSON.stringify(defaultSupportTickets));
  localStorage.setItem('m_audit_logs', JSON.stringify(defaultAuditLogs));
  localStorage.setItem('m_point_transactions', JSON.stringify(defaultPointTransactions));
  localStorage.setItem('m_settings', JSON.stringify(defaultSettings));
  localStorage.setItem('m_wallets', JSON.stringify(defaultWallets));
  localStorage.setItem('m_calendar_cashflow', JSON.stringify(defaultCalendarCashFlow));
  
  localStorage.setItem(initKey, 'true');
};

// GETTERS AND MUTATORS helper class
export class MockDB {
  static get(key) {
    initMockDatabase();
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  
  static set(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  static getSettings() {
    initMockDatabase();
    return JSON.parse(localStorage.getItem('m_settings') || JSON.stringify(defaultSettings));
  }

  static saveSettings(settings) {
    localStorage.setItem('m_settings', JSON.stringify(settings));
    this.addAuditLog('PLATFORM_SETTINGS_UPDATED', {
      message: `System configurations updated by Admin. Low Stock: ${settings.lowStockThreshold}, Business Hours: ${settings.businessHoursStart}-${settings.businessHoursEnd}`,
      settings
    }, 'WARNING');
  }

  static addAuditLog(action, details, severity = 'INFO') {
    const logs = this.get('m_audit_logs');
    const newLog = {
      id: `log-${Date.now()}`,
      userId: 'usr-admin',
      userName: 'Marcus George',
      action,
      details,
      ipAddress: '127.0.0.1',
      createdAt: new Date().toISOString(),
      severity,
    };
    logs.unshift(newLog);
    this.set('m_audit_logs', logs);
    
    window.dispatchEvent(new CustomEvent('ws_mock_alert', { 
      detail: { type: 'audit_log', data: newLog } 
    }));
  }
}
