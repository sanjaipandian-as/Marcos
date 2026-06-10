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

const defaultUsers = [
  { id: 'usr-admin', email: 'marcus.george@marcos.com', phoneNumber: '+919876543210', fullName: 'Marcus George', role: 'SUPERADMIN', pointsBalance: 0, referralCode: 'MARCUS10', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'usr-staff1', email: 'sanjay@marcos.com', phoneNumber: '+919988776655', fullName: 'Sanjay Kumar', role: 'STAFF', pointsBalance: 120, referralCode: 'SANJAY99', createdAt: '2026-02-15T09:00:00Z' },
  { id: 'usr-cust1', email: 'priya.sharma@gmail.com', phoneNumber: '+919999988888', fullName: 'Priya Sharma', role: 'CUSTOMER', pointsBalance: 450, referralCode: 'PRIYA80', referredById: 'usr-cust2', createdAt: '2026-03-20T10:30:00Z' },
  { id: 'usr-cust2', email: 'amit.patel@yahoo.com', phoneNumber: '+918888877777', fullName: 'Amit Patel', role: 'CUSTOMER', pointsBalance: 800, referralCode: 'AMIT90', createdAt: '2026-03-01T14:15:00Z' },
  { id: 'usr-cust3', email: 'amrit.singh@outlook.com', phoneNumber: '+917777766666', fullName: 'Amrit Singh', role: 'CUSTOMER', pointsBalance: 0, referralCode: 'AMRIT77', createdAt: '2026-05-18T16:00:00Z' },
  { id: 'usr-cust4', email: 'siddharth.m@gmail.com', phoneNumber: '+919822334455', fullName: 'Siddharth Malhotra', role: 'CUSTOMER', pointsBalance: 1500, referralCode: 'SID99', createdAt: '2026-04-05T11:00:00Z' },
];

const defaultMeasurements = [
  {
    id: 'meas-1',
    userId: 'usr-cust1',
    profileName: 'Bridal Selection',
    fullLength: 58.5,
    shoulderWidth: 16.5,
    upperChest: 34.0,
    bust: 36.5,
    waist: 30.0,
    hip: 39.5,
    armLength: 22.0,
    sleeveLength: 20.0,
    neck: 14.5,
    skirtLength: 40.0,
    pantLength: 38.0,
    tailorNotes: 'Prefers slightly loose bust fit, strict shoulder width.',
    updatedAt: '2026-05-20T11:00:00Z',
  },
  {
    id: 'meas-2',
    userId: 'usr-cust2',
    profileName: 'Sherwani Fitting',
    fullLength: 61.0,
    shoulderWidth: 18.0,
    upperChest: 38.5,
    bust: 40.0,
    waist: 34.0,
    hip: 41.0,
    armLength: 25.5,
    sleeveLength: 24.0,
    neck: 16.5,
    skirtLength: 0.0,
    pantLength: 40.0,
    tailorNotes: 'Heavy brocade pattern, reinforce side-slits structure.',
    updatedAt: '2026-06-02T15:30:00Z',
  },
];

const defaultMeasurementHistory = [
  {
    id: 'hist-1',
    profileId: 'meas-1',
    changedBy: 'Marcus George',
    previousValues: { bust: 35.5, waist: 29.0 },
    newValues: { bust: 36.5, waist: 30.0 },
    changedAt: '2026-05-20T11:00:00Z',
  }
];

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

const defaultCoupons = [
  { id: 'coup-1', code: 'MARCOSGOLD', discountPercent: 15, discountFlat: 0, maxDiscount: 15000, expiryDate: '2026-12-31T23:59:59Z', isActive: true, maxUses: 100, usedCount: 12 },
  { id: 'coup-2', code: 'WELCOME5000', discountPercent: 0, discountFlat: 5000.00, expiryDate: '2026-08-31T23:59:59Z', isActive: true, maxUses: 50, usedCount: 5 },
  { id: 'coup-3', code: 'FESTIVE50', discountPercent: 50, discountFlat: 0, maxDiscount: 20000, expiryDate: '2026-06-15T23:59:59Z', isActive: false, maxUses: 10, usedCount: 10 },
];

const defaultUserCoupons = [
  { id: 'uc-1', userId: 'usr-cust1', couponId: 'coup-1', usedAt: '2026-04-12T14:00:00Z' },
  { id: 'uc-2', userId: 'usr-cust2', couponId: 'coup-2', usedAt: '2026-05-02T11:30:00Z' },
];

const defaultAppointments = [
  { id: 'app-1', userId: 'usr-cust1', userName: 'Priya Sharma', date: '2026-06-10T10:00:00Z', timeSlot: '10:00 - 11:00', productType: 'Sherwani', type: 'MEASUREMENT', status: 'CONFIRMED', notes: 'Groom outfit size verification.', createdAt: '2026-06-05T09:30:00Z' },
  { id: 'app-2', userId: 'usr-cust2', userName: 'Amit Patel', date: '2026-06-12T14:30:00Z', timeSlot: '14:00 - 15:00', productType: 'Lehenga', type: 'CONSULTATION', status: 'PENDING', notes: 'Needs specific border embroidery consultation.', createdAt: '2026-06-06T15:00:00Z' },
  { id: 'app-3', userId: 'usr-cust3', userName: 'Amrit Singh', date: '2026-06-07T11:00:00Z', timeSlot: '11:00 - 12:00', productType: 'Suit', type: 'PRODUCT_SELECTION', status: 'CONFIRMED', notes: 'Selecting wool material fabric.', createdAt: '2026-06-01T12:00:00Z' },
];

const defaultStoreVisits = [
  {
    id: 'visit-1',
    customerId: 'usr-cust1',
    customerName: 'Priya Sharma',
    assignedStaffId: 'usr-staff1',
    assignedStaffName: 'Sanjay Kumar',
    preferredDate: '2026-06-08T10:00:00Z',
    address: 'DLF Phase 3, Gurgaon, Haryana',
    requirements: 'Custom fittings for bridesmaids dresses.',
    status: 'ASSIGNED',
    createdAt: '2026-06-04T11:00:00Z',
  },
  {
    id: 'visit-2',
    customerId: 'usr-cust3',
    customerName: 'Amrit Singh',
    preferredDate: '2026-06-15T15:00:00Z',
    address: 'Saket District Centre, New Delhi',
    requirements: 'Tailoring measurement visit for family members.',
    status: 'PENDING',
    createdAt: '2026-06-07T09:00:00Z',
  },
];

const defaultOrders = [
  {
    id: 'ord-1',
    userId: 'usr-cust1',
    customerName: 'Priya Sharma',
    status: 'DELIVERED',
    totalAmount: 135000.00,
    taxAmount: 24300.00,
    discountAmount: 15000.00,
    payableAmount: 144300.00,
    paymentMethod: 'Online',
    isOfflineSales: false,
    invoiceNumber: 'INV_000076',
    paymentStatus: 'COMPLETED',
    transactionId: 'tx_stripe_99a8s7d98',
    paymentGateway: 'STRIPE',
    createdAt: '2026-05-10T14:30:00Z',
    items: [
      { id: 'oi-1', productId: 'prod-1', productName: 'Imperial Emerald Sherwani', quantity: 1, price: 135000.00 }
    ],
  },
  {
    id: 'ord-2',
    userId: 'usr-cust2',
    customerName: 'Amit Patel',
    status: 'PAID',
    totalAmount: 85000.00,
    taxAmount: 15300.00,
    discountAmount: 5000.00,
    payableAmount: 95300.00,
    paymentMethod: 'Online',
    isOfflineSales: false,
    invoiceNumber: 'INV_000077',
    paymentStatus: 'COMPLETED',
    transactionId: 'tx_razorpay_8712361',
    paymentGateway: 'RAZORPAY',
    createdAt: '2026-06-03T11:15:00Z',
    items: [
      { id: 'oi-2', productId: 'prod-2', productName: 'Midnight Royal Tuxedo', quantity: 1, price: 85000.00 }
    ],
  },
  {
    id: 'ord-3',
    customerName: 'Siddharth Malhotra',
    status: 'PAID',
    totalAmount: 37000.00,
    taxAmount: 6660.00,
    discountAmount: 0.00,
    payableAmount: 43660.00,
    paymentMethod: 'Cash',
    isOfflineSales: true,
    invoiceNumber: 'INV_OFFLINE_001',
    paymentStatus: 'COMPLETED',
    createdAt: '2026-06-07T12:00:00Z',
    items: [
      { id: 'oi-3', productId: 'prod-3', productName: 'Crimson Ivory Kurta Set', quantity: 2, price: 18500.00 }
    ],
  }
];

const defaultSupportTickets = [
  {
    id: 'tick-1',
    userId: 'usr-cust1',
    userName: 'Priya Sharma',
    subject: 'Incorrect Sleeve Length on Delivery',
    description: 'Received the Sherwani, but sleeves are 2 inches shorter than the requested 22 inches in my profile.',
    status: 'OPEN',
    createdAt: '2026-06-05T16:00:00Z',
    messages: [
      { id: 'msg-1', sender: 'CUSTOMER', senderName: 'Priya Sharma', text: 'Hi, I received my custom Sherwani today. The body fit is nice, but the sleeves are noticeably short. Please check.', sentAt: '2026-06-05T16:00:00Z' }
    ],
  },
  {
    id: 'tick-2',
    userId: 'usr-cust2',
    userName: 'Amit Patel',
    subject: 'Reschedule measurement appointment',
    description: 'Requesting to push my slot on 12th June from 14:00 to 16:00.',
    status: 'RESOLVED',
    createdAt: '2026-06-06T10:00:00Z',
    messages: [
      { id: 'msg-2', sender: 'CUSTOMER', senderName: 'Amit Patel', text: 'Hi! Can I move my timing to 4 PM on June 12?', sentAt: '2026-06-06T10:00:00Z' },
      { id: 'msg-3', sender: 'ADMIN', senderName: 'Marcus George', text: 'Sure, Amit! I have updated your slot on the scheduler. Status is marked resolved.', sentAt: '2026-06-06T11:30:00Z' }
    ]
  }
];

const defaultAuditLogs = [
  { id: 'log-1', userId: 'usr-admin', userName: 'Marcus George', action: 'USER_ROLE_CHANGED', details: { message: 'SuperAdmin Marcus George changed role of user Sanjay Kumar from STAFF to ADMIN.', targetUserId: 'usr-staff1', previousRole: 'STAFF', newRole: 'ADMIN' }, ipAddress: '192.168.1.5', createdAt: '2026-06-06T09:00:00Z', severity: 'WARNING' },
  { id: 'log-2', userId: 'usr-admin', userName: 'Marcus George', action: 'POINTS_MANUALLY_ADJUSTED', details: { message: 'Admin Marcus George adjusted user Priya Sharma points. Delta: 100, New Balance: 450.', targetUserId: 'usr-cust1', delta: 100, reason: 'Campaign Bonus' }, ipAddress: '192.168.1.5', createdAt: '2026-06-07T10:30:00Z', severity: 'INFO' },
  { id: 'log-3', userId: 'usr-staff1', userName: 'Sanjay Kumar', action: 'COUPON_CREATED', details: { message: 'Coupon code MARCOSGOLD created with 15% discount rate.', couponId: 'coup-1' }, ipAddress: '192.168.1.20', createdAt: '2026-06-04T12:00:00Z', severity: 'INFO' },
  { id: 'log-4', userId: 'usr-admin', userName: 'Marcus George', action: 'PRODUCT_CREATED', details: { message: 'Admin Marcus George created product Midnight Royal Tuxedo.', productId: 'prod-2' }, ipAddress: '192.168.1.5', createdAt: '2026-04-15T08:00:00Z', severity: 'INFO' },
];

const defaultPointTransactions = [
  { id: 'pt-1', userId: 'usr-cust1', userName: 'Priya Sharma', points: 100, reason: 'Campaign Bonus', createdAt: '2026-06-07T10:30:00Z' },
  { id: 'pt-2', userId: 'usr-cust1', userName: 'Priya Sharma', points: 350, reason: 'Purchase Reward (INV_000076)', createdAt: '2026-05-10T14:30:00Z' },
  { id: 'pt-3', userId: 'usr-cust2', userName: 'Amit Patel', points: 800, reason: 'Wedding Referral Bonus', createdAt: '2026-03-01T14:15:00Z' },
];

const defaultSettings = {
  lowStockThreshold: 10,
  businessHoursStart: '09:00',
  businessHoursEnd: '18:00',
  pointsEarnRate: 10, // 1 point per $10 spent
  pointsRedeemRate: 0.1, // $0.1 discount per point
  otpCooldownMinutes: 15,
  maxOtpFailures: 3,
};

// WALLETS DATA with Indian Rupee
const defaultWallets = [
  { id: 'w-1', code: 'INR Main', symbol: '₹', balance: 250520, limit: 'Limit is ₹50k a month', status: 'Active', flag: '🇮🇳' },
  { id: 'w-2', code: 'INR Savings', symbol: '₹', balance: 158004, limit: 'Limit is ₹10k a month', status: 'Active', flag: '🇮🇳' },
  { id: 'w-3', code: 'INR Investment', symbol: '₹', balance: 501207, limit: 'Limit is ₹20k a month', status: 'Active', flag: '🇮🇳' },
  { id: 'w-4', code: 'INR Rewards', symbol: '₹', balance: 15000, limit: 'Limit is ₹5k a month', status: 'Inactive', flag: '🇮🇳' },
];

// MONTHLY CALENDAR CASH FLOW (mock data for the calendar selector)
const defaultCalendarCashFlow = {
  '2026-01': { total: 245000, inflow: 15000, outflow: 8000, list: [40000, 35000, 42000, 38000, 48000, 42000] },
  '2026-02': { total: 280000, inflow: 18000, outflow: 7500, list: [45000, 40000, 48000, 42000, 55000, 50000] },
  '2026-03': { total: 342323, inflow: 33847, outflow: 7456, list: [30000, 26000, 68000, 20000, 78000, 64000] },
  '2026-04': { total: 310000, inflow: 22000, outflow: 9000, list: [50000, 45000, 52000, 48000, 60000, 55000] },
  '2026-05': { total: 395000, inflow: 42000, outflow: 11000, list: [60000, 55000, 68000, 62000, 78000, 72000] },
  '2026-06': { total: 420000, inflow: 48000, outflow: 12000, list: [70000, 65000, 78000, 72000, 85000, 80000] },
  '2026-07': { total: 460000, inflow: 54000, outflow: 14000, list: [75000, 70000, 85000, 78000, 92000, 87000] },
};

// INITIALIZATION
const initKey = 'marcos_db_init_v2';
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
