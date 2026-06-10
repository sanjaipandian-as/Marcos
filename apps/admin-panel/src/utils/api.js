import { MockDB } from './mockData';

// API Configuration
const BASE_URL = 'http://localhost:5000/api/v1';

class APIClient {
  constructor() {
    const saved = localStorage.getItem('marcos_api_mode');
    this.isLiveMode = saved === 'live';
  }

  setLiveMode(live) {
    this.isLiveMode = live;
    localStorage.setItem('marcos_api_mode', live ? 'live' : 'demo');
  }

  getLiveMode() {
    return this.isLiveMode;
  }

  async request(endpoint, options) {
    if (!this.isLiveMode) {
      throw new Error('Fallback to mock database');
    }
    
    // Set default JSON headers
    const headers = new Headers(options?.headers);
    if (!headers.has('Content-Type') && !(options?.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = localStorage.getItem('marcos_admin_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('marcos_admin_token');
        localStorage.removeItem('marcos_admin_user');
        window.location.reload();
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  async login(email, password) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.success && data.accessToken) {
      localStorage.setItem('marcos_admin_token', data.accessToken);
      localStorage.setItem('marcos_admin_user', JSON.stringify(data.user));
      this.setLiveMode(true);
    }
    return data;
  }

  logout() {
    localStorage.removeItem('marcos_admin_token');
    localStorage.removeItem('marcos_admin_user');
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('marcos_admin_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }

  // PRODUCTS CRUD
  async getProducts() {
    try {
      const res = await this.request('/products');
      return res.data;
    } catch (e) {
      return MockDB.get('m_products');
    }
  }

  async createProduct(product) {
    try {
      const res = await this.request('/admin/products', {
        method: 'POST',
        body: JSON.stringify(product),
      });
      return res.data;
    } catch (e) {
      const products = MockDB.get('m_products');
      const newProduct = {
        ...product,
        id: `prod-${Date.now()}`,
        createdAt: new Date().toISOString(),
        stockStatus: product.inventoryQty <= 0 ? 'OUT_OF_STOCK' : (product.inventoryQty <= MockDB.getSettings().lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK'),
      };
      products.push(newProduct);
      MockDB.set('m_products', products);
      MockDB.addAuditLog('PRODUCT_CREATED', { message: `Product '${newProduct.name}' created in Catalog.`, productId: newProduct.id }, 'INFO');
      return newProduct;
    }
  }

  async updateProduct(id, updates) {
    try {
      const res = await this.request(`/admin/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.data;
    } catch (e) {
      const products = MockDB.get('m_products');
      const idx = products.findIndex(p => p.id === id);
      if (idx === -1) throw new Error('Product not found');
      
      const updated = { 
        ...products[idx], 
        ...updates,
      };
      
      if (updates.inventoryQty !== undefined) {
        updated.stockStatus = updated.inventoryQty <= 0 
          ? 'OUT_OF_STOCK' 
          : (updated.inventoryQty <= MockDB.getSettings().lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK');
      }

      products[idx] = updated;
      MockDB.set('m_products', products);
      MockDB.addAuditLog('PRODUCT_UPDATED', { message: `Product '${updated.name}' modified in Catalog.`, productId: id, updates }, 'INFO');
      return updated;
    }
  }

  async deleteProduct(id) {
    try {
      await this.request(`/admin/products/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      const products = MockDB.get('m_products');
      const filtered = products.filter(p => p.id !== id);
      MockDB.set('m_products', filtered);
      MockDB.addAuditLog('PRODUCT_DELETED', { message: `Product ID: ${id} deleted from Catalog.` }, 'WARNING');
      return true;
    }
  }

  async toggleTrending(id, isTrending) {
    try {
      const res = await this.request(`/admin/products/${id}/trending`, {
        method: 'PUT',
        body: JSON.stringify({ isTrending, trendingScheduledAt: isTrending ? new Date().toISOString() : null }),
      });
      return res.data;
    } catch (e) {
      return this.updateProduct(id, { 
        isTrending, 
        trendingScheduledAt: isTrending ? new Date().toISOString() : undefined 
      });
    }
  }

  // CATEGORIES CRUD & ORDERING
  async getCategories() {
    try {
      const res = await this.request('/categories');
      return res.data;
    } catch (e) {
      return MockDB.get('m_categories').sort((a,b) => a.order - b.order);
    }
  }

  async createCategory(category) {
    try {
      const res = await this.request('/admin/categories', {
        method: 'POST',
        body: JSON.stringify(category),
      });
      return res.data;
    } catch (e) {
      const categories = MockDB.get('m_categories');
      const newCat = {
        ...category,
        id: `cat-${Date.now()}`,
      };
      categories.push(newCat);
      MockDB.set('m_categories', categories);
      MockDB.addAuditLog('CATEGORY_CREATED', { message: `Category '${newCat.name}' created.`, categoryId: newCat.id }, 'INFO');
      return newCat;
    }
  }

  async updateCategory(id, name) {
    try {
      const res = await this.request(`/admin/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, slug: name.toLowerCase().replace(/ /g, '-') }),
      });
      return res.data;
    } catch (e) {
      const categories = MockDB.get('m_categories');
      const idx = categories.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Category not found');
      categories[idx].name = name;
      categories[idx].slug = name.toLowerCase().replace(/ /g, '-');
      MockDB.set('m_categories', categories);
      MockDB.addAuditLog('CATEGORY_UPDATED', { message: `Category updated. New Name: '${name}'.`, categoryId: id }, 'INFO');
      return categories[idx];
    }
  }

  async deleteCategory(id) {
    try {
      await this.request(`/admin/categories/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      const categories = MockDB.get('m_categories');
      const filtered = categories.filter(c => c.id !== id);
      MockDB.set('m_categories', filtered);
      MockDB.addAuditLog('CATEGORY_DELETED', { message: `Category ID: ${id} deleted.` }, 'WARNING');
      return true;
    }
  }

  async reorderCategories(orderedIds) {
    try {
      const res = await this.request('/admin/categories/reorder', {
        method: 'PUT',
        body: JSON.stringify({ orderedIds }),
      });
      return res.data;
    } catch (e) {
      const categories = MockDB.get('m_categories');
      const updated = orderedIds.map((id, index) => {
        const cat = categories.find(c => c.id === id);
        if (!cat) throw new Error('Category mismatch');
        return { ...cat, order: index + 1 };
      });
      MockDB.set('m_categories', updated);
      MockDB.addAuditLog('CATEGORIES_REORDERED', { message: `Categories reordered.`, orderedIds }, 'INFO');
      return updated.sort((a,b) => a.order - b.order);
    }
  }

  // CUSTOMERS & MEASUREMENTS
  async getCustomers() {
    try {
      const res = await this.request('/admin/customers');
      return res.data;
    } catch (e) {
      return MockDB.get('m_users').filter(u => u.role === 'CUSTOMER');
    }
  }

  async getCustomerDetails(id) {
    try {
      const res = await this.request(`/admin/customers/${id}`);
      return {
        user: res.data,
        profiles: res.data.measurementProfiles || [],
      };
    } catch (e) {
      const users = MockDB.get('m_users');
      const user = users.find(u => u.id === id);
      if (!user) throw new Error('Customer not found');
      const profiles = MockDB.get('m_measurements').filter(m => m.userId === id);
      return { user, profiles };
    }
  }

  async deleteCustomer(id) {
    try {
      await this.request(`/admin/customers/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      const users = MockDB.get('m_users');
      const filtered = users.filter(u => u.id !== id);
      MockDB.set('m_users', filtered);
      MockDB.addAuditLog('CUSTOMER_DELETED', { message: `Customer ID: ${id} deleted.` }, 'CRITICAL');
      return true;
    }
  }

  async getMeasurements(userId) {
    try {
      const res = await this.request(`/measurements?userId=${userId}`);
      return res.data;
    } catch (e) {
      return MockDB.get('m_measurements').filter(m => m.userId === userId);
    }
  }

  async createMeasurementProfile(profile) {
    try {
      const res = await this.request('/measurements', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
      return res.data;
    } catch (e) {
      const measurements = MockDB.get('m_measurements');
      const newProfile = {
        ...profile,
        id: `meas-${Date.now()}`,
        updatedAt: new Date().toISOString(),
      };
      measurements.push(newProfile);
      MockDB.set('m_measurements', measurements);
      MockDB.addAuditLog('MEASUREMENT_PROFILE_CREATED', { message: `Measurement sub-profile '${profile.profileName}' created for customer.`, profileId: newProfile.id }, 'INFO');
      return newProfile;
    }
  }

  async updateMeasurements(id, updates) {
    try {
      const res = await this.request(`/measurements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.data;
    } catch (e) {
      const measurements = MockDB.get('m_measurements');
      const idx = measurements.findIndex(m => m.id === id);
      if (idx === -1) throw new Error('Measurement profile not found');

      const previous = { ...measurements[idx] };
      const updated = {
        ...measurements[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      measurements[idx] = updated;
      MockDB.set('m_measurements', measurements);

      // Save to Measurement History
      const history = MockDB.get('m_measurement_history');
      const newHist = {
        id: `hist-${Date.now()}`,
        profileId: id,
        changedBy: 'Marcus George',
        previousValues: previous,
        newValues: updated,
        changedAt: new Date().toISOString(),
      };
      history.push(newHist);
      MockDB.set('m_measurement_history', history);
      return updated;
    }
  }

  async deleteMeasurementProfile(id) {
    try {
      await this.request(`/measurements/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      const measurements = MockDB.get('m_measurements');
      const filtered = measurements.filter(m => m.id !== id);
      MockDB.set('m_measurements', filtered);
      return true;
    }
  }

  async getMeasurementHistory(profileId) {
    try {
      const res = await this.request(`/measurements/${profileId}/history`);
      return res.data;
    } catch (e) {
      return MockDB.get('m_measurement_history').filter(h => h.profileId === profileId);
    }
  }

  // APPOINTMENTS
  async getAppointments() {
    try {
      const res = await this.request('/appointments?limit=100');
      return res.data.map(appt => ({
        ...appt,
        userName: appt.user?.fullName || 'Customer',
      }));
    } catch (e) {
      return MockDB.get('m_appointments').sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
  }

  async updateAppointmentStatus(id, status) {
    try {
      const res = await this.request(`/appointments/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return res.data;
    } catch (e) {
      const appointments = MockDB.get('m_appointments');
      const idx = appointments.findIndex(a => a.id === id);
      if (idx === -1) throw new Error('Appointment not found');
      appointments[idx].status = status;
      MockDB.set('m_appointments', appointments);
      return appointments[idx];
    }
  }

  // STORE VISITS
  async getStoreVisits() {
    try {
      const res = await this.request('/visits');
      return res.data.map(visit => ({
        ...visit,
        customerName: visit.customer?.fullName || 'Customer',
        assignedStaffName: visit.assignedStaff?.fullName || '',
      }));
    } catch (e) {
      return MockDB.get('m_store_visits').sort((a,b) => new Date(a.preferredDate).getTime() - new Date(b.preferredDate).getTime());
    }
  }

  async assignStaffToVisit(visitId, staffId) {
    try {
      const res = await this.request(`/visits/${visitId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({
          assignedStaffId: staffId,
          confirmedDate: new Date().toISOString(),
        }),
      });
      return res.data;
    } catch (e) {
      const visits = MockDB.get('m_store_visits');
      const idx = visits.findIndex(v => v.id === visitId);
      if (idx === -1) throw new Error('Visit not found');
      
      const staff = MockDB.get('m_users').find(u => u.id === staffId);
      if (!staff) throw new Error('Staff not found');

      visits[idx].assignedStaffId = staffId;
      visits[idx].assignedStaffName = staff.fullName;
      visits[idx].status = 'ASSIGNED';
      
      MockDB.set('m_store_visits', visits);
      return visits[idx];
    }
  }

  async completeStoreVisit(visitId, completionNotes, mediaUrls) {
    try {
      const res = await this.request(`/visits/${visitId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'COMPLETED',
          completionNotes,
          mediaUrls,
        }),
      });
      return res.data;
    } catch (e) {
      const visits = MockDB.get('m_store_visits');
      const idx = visits.findIndex(v => v.id === visitId);
      if (idx === -1) throw new Error('Visit not found');

      visits[idx].completionNotes = completionNotes;
      visits[idx].mediaUrls = mediaUrls;
      visits[idx].status = 'COMPLETED';
      
      MockDB.set('m_store_visits', visits);
      return visits[idx];
    }
  }

  // LOYALTY & REWARDS
  async adjustLoyaltyPoints(userId, points, reason) {
    try {
      await this.request('/admin/loyalty/adjust', {
        method: 'POST',
        body: JSON.stringify({ userId, points, reason }),
      });
      return true;
    } catch (e) {
      const users = MockDB.get('m_users');
      const idx = users.findIndex(u => u.id === userId);
      if (idx === -1) throw new Error('User not found');
      
      const user = users[idx];
      const newBal = user.pointsBalance + points;
      if (newBal < 0) throw new Error('Loyalty balance cannot drop below zero');
      
      user.pointsBalance = newBal;
      MockDB.set('m_users', users);

      // Record transaction
      const pts = MockDB.get('m_point_transactions');
      pts.unshift({
        id: `pt-${Date.now()}`,
        userId,
        userName: user.fullName,
        points,
        reason,
        createdAt: new Date().toISOString(),
      });
      MockDB.set('m_point_transactions', pts);

      MockDB.addAuditLog('POINTS_MANUALLY_ADJUSTED', { 
        message: `Manual adjustment of ${points} points for ${user.fullName}. Reason: ${reason}`,
        targetUserId: userId,
        delta: points,
        reason 
      }, points < 0 ? 'WARNING' : 'INFO');
      
      return true;
    }
  }

  async getPointTransactions() {
    try {
      const res = await this.request('/admin/loyalty/transactions');
      return res.data;
    } catch (e) {
      return MockDB.get('m_point_transactions').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  // BANNERS MANAGEMENT
  async getBanners() {
    try {
      const res = await this.request('/banners/admin');
      return res.data;
    } catch (e) {
      return MockDB.get('m_banners');
    }
  }

  async createBanner(banner) {
    try {
      const res = await this.request('/banners/admin', {
        method: 'POST',
        body: JSON.stringify(banner),
      });
      return res.data;
    } catch (e) {
      const banners = MockDB.get('m_banners');
      const newBanner = {
        ...banner,
        id: `ban-${Date.now()}`,
        clicks: 0,
        createdAt: new Date().toISOString(),
      };
      banners.push(newBanner);
      MockDB.set('m_banners', banners);
      MockDB.addAuditLog('BANNER_CREATED', { message: `Banner '${banner.title}' added to location ${banner.location}.` }, 'INFO');
      return newBanner;
    }
  }

  async toggleBannerActive(id, isActive) {
    try {
      const res = await this.request(`/banners/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
      return res.data;
    } catch (e) {
      const banners = MockDB.get('m_banners');
      const idx = banners.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Banner not found');
      banners[idx].isActive = isActive;
      MockDB.set('m_banners', banners);
      MockDB.addAuditLog('BANNER_STATUS_CHANGED', { message: `Banner '${banners[idx].title}' status toggled to ${isActive ? 'Active' : 'Inactive'}.` }, 'INFO');
      return banners[idx];
    }
  }

  async updateBannerOrder(id, order) {
    try {
      const res = await this.request(`/banners/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ order }),
      });
      return res.data;
    } catch (e) {
      const banners = MockDB.get('m_banners');
      const idx = banners.findIndex(b => b.id === id);
      if (idx === -1) throw new Error('Banner not found');
      banners[idx].order = order;
      MockDB.set('m_banners', banners);
      MockDB.addAuditLog('BANNER_ORDER_CHANGED', { message: `Banner '${banners[idx].title}' display order changed to ${order}.` }, 'INFO');
      return banners[idx];
    }
  }

  async deleteBanner(id) {
    try {
      await this.request(`/banners/admin/${id}`, { method: 'DELETE' });
      return true;
    } catch (e) {
      const banners = MockDB.get('m_banners');
      const filtered = banners.filter(b => b.id !== id);
      MockDB.set('m_banners', filtered);
      MockDB.addAuditLog('BANNER_DELETED', { message: `Banner ID: ${id} deleted.` }, 'WARNING');
      return true;
    }
  }

  // COUPON MANAGEMENT
  async getCoupons() {
    try {
      const res = await this.request('/admin/coupons');
      return res.data;
    } catch (e) {
      return MockDB.get('m_coupons');
    }
  }

  async createCoupon(coupon) {
    try {
      const res = await this.request('/admin/coupons', {
        method: 'POST',
        body: JSON.stringify(coupon),
      });
      return res.data;
    } catch (e) {
      const coupons = MockDB.get('m_coupons');
      if (coupons.some(c => c.code.toUpperCase() === coupon.code.toUpperCase())) {
        throw new Error('Coupon code already exists');
      }
      const newCoupon = {
        ...coupon,
        id: `coup-${Date.now()}`,
        usedCount: 0,
        isActive: true,
      };
      coupons.push(newCoupon);
      MockDB.set('m_coupons', coupons);
      MockDB.addAuditLog('COUPON_CREATED', { message: `Coupon Code '${newCoupon.code}' generated with discount percent ${newCoupon.discountPercent}%` }, 'INFO');
      return newCoupon;
    }
  }

  async deactivateCoupon(id) {
    try {
      const res = await this.request(`/admin/coupons/${id}/deactivate`, {
        method: 'PUT',
      });
      return res.data;
    } catch (e) {
      const coupons = MockDB.get('m_coupons');
      const idx = coupons.findIndex(c => c.id === id);
      if (idx === -1) throw new Error('Coupon not found');
      coupons[idx].isActive = false;
      MockDB.set('m_coupons', coupons);
      MockDB.addAuditLog('COUPON_DEACTIVATED', { message: `Coupon Code '${coupons[idx].code}' deactivated.` }, 'WARNING');
      return coupons[idx];
    }
  }

  // NOTIFICATION MANAGEMENT
  async getNotifications() {
    try {
      const res = await this.request('/notifications/history');
      return res.data.map(notif => ({
        ...notif,
        targetAudience: notif.recipients && notif.recipients.length > 0 ? `${notif.recipients.length} Users` : 'All Customers',
      }));
    } catch (e) {
      return MockDB.get('m_notifications');
    }
  }

  async createNotification(notification) {
    try {
      const res = await this.request('/notifications/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          title: notification.title,
          body: notification.body,
          channels: ['EMAIL', 'SMS', 'PUSH'],
        }),
      });
      return res.data;
    } catch (e) {
      const notifications = MockDB.get('m_notifications');
      const newNotification = {
        ...notification,
        id: `notif-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      notifications.push(newNotification);
      MockDB.set('m_notifications', notifications);
      MockDB.addAuditLog('NOTIFICATION_BROADCAST_CREATED', { message: `Broadcast alert '${notification.title}' sent/scheduled for target: ${notification.targetAudience}` }, 'WARNING');
      return newNotification;
    }
  }

  // SUPPORT TICKETS
  async getSupportTickets() {
    try {
      const res = await this.request('/tickets/admin?limit=100');
      return res.data.map(ticket => ({
        ...ticket,
        userName: ticket.user?.fullName || 'Customer',
      }));
    } catch (e) {
      return MockDB.get('m_support_tickets');
    }
  }

  async updateTicketStatus(id, status) {
    try {
      const res = await this.request(`/tickets/admin/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return res.data;
    } catch (e) {
      const tickets = MockDB.get('m_support_tickets');
      const idx = tickets.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Ticket not found');
      tickets[idx].status = status;
      MockDB.set('m_support_tickets', tickets);
      MockDB.addAuditLog('TICKET_STATUS_CHANGED', { message: `Support Ticket ID: ${id} updated status to ${status}.` }, 'INFO');
      return tickets[idx];
    }
  }

  async getTicketMessages(ticketId) {
    try {
      const res = await this.request(`/tickets/admin/${ticketId}/messages`);
      return res.data;
    } catch (e) {
      const tickets = MockDB.get('m_support_tickets');
      const ticket = tickets.find(t => t.id === ticketId);
      return ticket ? ticket.messages : [];
    }
  }

  async sendTicketMessage(id, text) {
    try {
      const res = await this.request(`/tickets/admin/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      return res.data;
    } catch (e) {
      const tickets = MockDB.get('m_support_tickets');
      const idx = tickets.findIndex(t => t.id === id);
      if (idx === -1) throw new Error('Ticket not found');
      
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'ADMIN',
        senderName: 'Marcus George',
        text,
        sentAt: new Date().toISOString(),
      };
      tickets[idx].messages.push(newMsg);
      
      if (tickets[idx].status === 'OPEN') {
        tickets[idx].status = 'IN_PROGRESS';
      }

      MockDB.set('m_support_tickets', tickets);
      return tickets[idx];
    }
  }

  // AUDIT LOGS
  async getAuditLogs() {
    try {
      const res = await this.request('/admin/audits');
      return res.data;
    } catch (e) {
      return MockDB.get('m_audit_logs').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  // STAFF MANAGEMENT
  async getStaffList() {
    try {
      const res = await this.request('/admin/users');
      return res.data;
    } catch (e) {
      return MockDB.get('m_users').filter(u => u.role !== 'CUSTOMER');
    }
  }

  async createStaff(staff) {
    try {
      const res = await this.request('/admin/users', {
        method: 'POST',
        body: JSON.stringify(staff),
      });
      return res.data;
    } catch (e) {
      const users = MockDB.get('m_users');
      const newStaff = {
        ...staff,
        id: `usr-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      users.push(newStaff);
      MockDB.set('m_users', users);
      MockDB.addAuditLog('STAFF_CREATED', {
        message: `Admin created new team member ${newStaff.fullName} with role ${newStaff.role}`,
        staffId: newStaff.id,
      }, 'INFO');
      return newStaff;
    }
  }

  async updateStaff(id, updates) {
    try {
      const res = await this.request(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return res.data;
    } catch (e) {
      const users = MockDB.get('m_users');
      const idx = users.findIndex(u => u.id === id);
      if (idx === -1) throw new Error('Staff not found');
      users[idx] = { ...users[idx], ...updates };
      MockDB.set('m_users', users);
      MockDB.addAuditLog('STAFF_PROFILE_UPDATED', {
        message: `Admin modified details for team member ${users[idx].fullName}`,
        targetUserId: id,
      }, 'INFO');
      return users[idx];
    }
  }

  async updateUserRole(id, role) {
    return this.updateStaff(id, { role });
  }

  // MANUAL OFFLINE CHECKOUT
  async checkoutOfflineSale(sale) {
    try {
      const products = await this.getProducts();
      const invoiceItems = sale.items.map(item => {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) throw new Error(`Product not found: ${item.productId}`);
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: Number(prod.price),
        };
      });

      let discountAmount = 0;
      if (sale.couponCode) {
        try {
          const coupons = await this.getCoupons();
          const coupon = coupons.find(c => c.code.toUpperCase() === sale.couponCode.toUpperCase());
          if (coupon && coupon.isActive) {
            const subtotal = invoiceItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            if (coupon.discountPercent > 0) {
              discountAmount = (subtotal * coupon.discountPercent) / 100;
              if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
                discountAmount = Number(coupon.maxDiscount);
              }
            } else if (coupon.discountFlat > 0) {
              discountAmount = Number(coupon.discountFlat);
            }
          }
        } catch (e) {
          // Ignore
        }
      }

      const res = await this.request('/billing/invoice', {
        method: 'POST',
        body: JSON.stringify({
          userId: undefined,
          customerName: sale.customerName,
          items: invoiceItems,
          discountAmount,
          paymentMethod: sale.paymentMethod.toUpperCase(),
          isOfflineSales: true,
        }),
      });

      return {
        ...res.data,
        customerName: sale.customerName,
        items: sale.items.map(item => {
          const prod = products.find(p => p.id === item.productId);
          return {
            id: item.productId,
            productName: prod ? prod.name : 'Unknown Item',
            quantity: item.quantity,
            price: prod ? Number(prod.price) : 0,
          };
        }),
      };
    } catch (e) {
      const products = MockDB.get('m_products');
      const orders = MockDB.get('m_orders');
      
      const orderItems = [];
      let subtotal = 0;

      for (const item of sale.items) {
        const prod = products.find(p => p.id === item.productId);
        if (!prod) throw new Error('Product not found');
        if (prod.inventoryQty < item.quantity) {
          throw new Error(`Insufficient inventory for product '${prod.name}'. Available: ${prod.inventoryQty}, Requested: ${item.quantity}`);
        }
        
        prod.inventoryQty -= item.quantity;
        prod.stockStatus = prod.inventoryQty <= 0 
          ? 'OUT_OF_STOCK' 
          : (prod.inventoryQty <= MockDB.getSettings().lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK');

        orderItems.push({
          id: `oi-${Date.now()}-${Math.random()}`,
          productId: item.productId,
          productName: prod.name,
          quantity: item.quantity,
          price: prod.price,
        });

        subtotal += prod.price * item.quantity;
      }

      MockDB.set('m_products', products);

      let discount = 0;
      if (sale.couponCode) {
        const coupons = MockDB.get('m_coupons');
        const couponIdx = coupons.findIndex(c => c.code.toUpperCase() === sale.couponCode?.toUpperCase());
        if (couponIdx !== -1) {
          const c = coupons[couponIdx];
          if (c.isActive && new Date(c.expiryDate).getTime() > Date.now() && c.usedCount < c.maxUses) {
            if (c.discountPercent > 0) {
              discount = (subtotal * c.discountPercent) / 100;
              if (c.maxDiscount && discount > c.maxDiscount) {
                discount = c.maxDiscount;
              }
            } else if (c.discountFlat > 0) {
              discount = c.discountFlat;
            }
            c.usedCount += 1;
            MockDB.set('m_coupons', coupons);
          }
        }
      }

      const tax = Number(((subtotal - discount) * 0.18).toFixed(2));
      const payable = Number((subtotal - discount + tax).toFixed(2));

      const newOrder = {
        id: `ord-${Date.now()}`,
        customerName: sale.customerName,
        status: 'PAID',
        totalAmount: subtotal,
        taxAmount: tax,
        discountAmount: discount,
        payableAmount: payable,
        paymentMethod: sale.paymentMethod,
        isOfflineSales: true,
        invoiceNumber: `INV_OFFLINE_${Date.now().toString().slice(-6)}`,
        paymentStatus: 'COMPLETED',
        createdAt: new Date().toISOString(),
        items: orderItems,
      };

      orders.unshift(newOrder);
      MockDB.set('m_orders', orders);

      MockDB.addAuditLog('OFFLINE_SALE_COMPLETED', {
        message: `Offline sale registered for '${sale.customerName}' with invoice ${newOrder.invoiceNumber}. Subtotal: $${subtotal}, Payable: $${payable}`,
        orderId: newOrder.id,
        invoiceNumber: newOrder.invoiceNumber,
        payableAmount: payable,
      }, 'INFO');

      window.dispatchEvent(new CustomEvent('ws_mock_alert', {
        detail: { type: 'order', data: newOrder }
      }));

      return newOrder;
    }
  }

  // ORDER RETRIEVAL
  async getOrders() {
    try {
      const res = await this.request('/orders/admin/list?limit=100');
      return res.data.map(order => ({
        ...order,
        customerName: order.user ? order.user.fullName : (order.gatewayResponse?.guestCustomerName || 'Offline Customer (Guest)'),
        items: (order.orderItems || []).map(item => ({
          id: item.id,
          productName: item.product?.name || 'Unknown Item',
          quantity: item.quantity,
          price: Number(item.price),
        })),
      }));
    } catch (e) {
      return MockDB.get('m_orders').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  async updateOrderStatus(id, status) {
    try {
      const res = await this.request(`/orders/admin/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return res.data;
    } catch (e) {
      const orders = MockDB.get('m_orders');
      const idx = orders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error('Order not found');
      orders[idx].status = status;
      MockDB.set('m_orders', orders);

      MockDB.addAuditLog('ORDER_STATUS_CHANGED', {
        message: `Order ${orders[idx].invoiceNumber} status shifted to ${status}.`,
        orderId: id,
        status,
      }, 'INFO');

      return orders[idx];
    }
  }

  async getPackingSlip(orderId) {
    try {
      const res = await this.request(`/orders/admin/${orderId}/packing-slip`);
      return res.data;
    } catch (e) {
      return {
        invoiceNumber: 'INV-MOCK',
        packingItems: [
          { name: 'Bridal Gown Custom', qty: 1, sku: 'BG-CUST' }
        ],
      };
    }
  }

  // ANALYTICS & EXTENDED REPORTS
  async getDashboardReport() {
    try {
      const res = await this.request('/admin/dashboard');
      return res.data;
    } catch (e) {
      const orders = MockDB.get('m_orders');
      const visits = MockDB.get('m_store_visits');
      const appointments = MockDB.get('m_appointments');

      const totalRevenue = orders
        .filter(o => o.status === 'PAID' || o.status === 'DELIVERED')
        .reduce((sum, o) => sum + o.payableAmount, 0);

      const chartData = [
        { month: 'Jan 26', revenue: 45000 },
        { month: 'Feb 26', revenue: 52000 },
        { month: 'Mar 26', revenue: 68000 },
        { month: 'Apr 26', revenue: 58000 },
        { month: 'May 26', revenue: 84000 },
        { month: 'Jun 26', revenue: Number(totalRevenue.toFixed(0)) }
      ];

      // Calculate dynamic top categories sales from MockDB
      const mockCategories = MockDB.get('m_categories') || [];
      const catMap = {};
      mockCategories.forEach(c => { catMap[c.id] = { name: c.name, value: 0 }; });
      
      orders.forEach(order => {
        if (order.status === 'PAID') {
          (order.items || []).forEach(item => {
            const products = MockDB.get('m_products') || [];
            const prod = products.find(p => p.id === item.productId);
            if (prod && catMap[prod.categoryId]) {
              catMap[prod.categoryId].value += Number(item.price) * item.quantity;
            }
          });
        }
      });
      const topCategories = Object.values(catMap).sort((a, b) => b.value - a.value);

      // Fallback if no mock sales exist yet
      if (topCategories.reduce((acc, cat) => acc + cat.value, 0) === 0) {
        topCategories.length = 0;
        mockCategories.forEach((cat, idx) => {
          topCategories.push({
            name: cat.name,
            value: idx === 0 ? 85000 : (idx === 1 ? 65000 : (idx === 2 ? 45000 : 32000))
          });
        });
      }

      // Calculate dynamic India active users from MockDB
      const mockUsers = MockDB.get('m_users') || [];
      const indiaUsersMap = {};
      mockUsers.forEach(u => {
        if (u.role === 'CUSTOMER' && u.address) {
          const parts = u.address.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            const state = parts[parts.length - 2];
            const district = parts[parts.length - 3];
            const key = `${district}, ${state}`;
            indiaUsersMap[key] = (indiaUsersMap[key] || 0) + 1;
          }
        }
      });
      const indiaActiveUsers = Object.entries(indiaUsersMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

      if (indiaActiveUsers.length === 0) {
        indiaActiveUsers.push(
          { name: 'Bangalore, Karnataka', count: 5 },
          { name: 'Mumbai, Maharashtra', count: 2 },
          { name: 'New Delhi, Delhi', count: 1 }
        );
      }

      // Calculate dynamic product traffic popularity from MockDB
      const mockProducts = MockDB.get('m_products') || [];
      let totalQty = 0;
      const productSales = {};
      mockProducts.forEach(p => { productSales[p.id] = { name: p.name, qty: 0 }; });
      
      orders.forEach(order => {
        if (order.status === 'PAID') {
          (order.items || []).forEach(item => {
            if (productSales[item.productId]) {
              productSales[item.productId].qty += item.quantity;
              totalQty += item.quantity;
            }
          });
        }
      });
      let productTraffic = Object.values(productSales).map(ps => ({
        name: ps.name,
        percentage: totalQty > 0 ? Math.round((ps.qty / totalQty) * 100) : 0
      })).sort((a, b) => b.percentage - a.percentage);

      if (totalQty === 0 && mockProducts.length > 0) {
        productTraffic = mockProducts.map((p, idx) => ({
          name: p.name,
          percentage: idx === 0 ? 40 : (idx === 1 ? 30 : (idx === 2 ? 15 : (idx === 3 ? 10 : 5)))
        }));
      }

      return {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        orderCount: orders.length,
        pendingVisits: visits.filter(v => v.status === 'PENDING').length,
        pendingAppointments: appointments.filter(a => a.status === 'PENDING').length,
        recentOrders: orders.slice(0, 5),
        revenueChart: chartData,
        topCategories,
        indiaActiveUsers,
        productTraffic,
        conversionRates: [
          { name: 'Product Views', value: 25000, change: '+9%' },
          { name: 'Add to Cart', value: 12000, change: '+6%' },
          { name: 'Proceed to Checkout', value: 8500, change: '+4%' },
          { name: 'Completed Purchases', value: 6200, change: '+7%' },
          { name: 'Abandoned Carts', value: 3000, change: '-5%' },
        ]
      };
    }
  }

  async getExtendedReports() {
    try {
      const res = await this.request('/admin/reports');
      return res.data;
    } catch (e) {
      const users = MockDB.get('m_users').filter(u => u.role === 'CUSTOMER');
      const products = MockDB.get('m_products');
      
      const customerGrowth = [
        { month: 'Jan 26', count: 12 },
        { month: 'Feb 26', count: 18 },
        { month: 'Mar 26', count: 24 },
        { month: 'Apr 26', count: 32 },
        { month: 'May 26', count: 45 },
        { month: 'Jun 26', count: users.length },
      ];

      const productPerformance = products.map(p => ({
        productId: p.id,
        productName: p.name,
        quantitySold: p.id === 'prod-1' ? 8 : (p.id === 'prod-2' ? 5 : 2),
        revenueGenerated: p.price * (p.id === 'prod-1' ? 8 : (p.id === 'prod-2' ? 5 : 2)),
      })).sort((a,b) => b.revenueGenerated - a.revenueGenerated);

      const lowStockAlerts = products.filter(p => p.inventoryQty <= MockDB.getSettings().lowStockThreshold);

      return {
        customerGrowth,
        productPerformance,
        lowStockAlerts,
      };
    }
  }

  // SETTINGS
  async getSettings() {
    try {
      const res = await this.request('/admin/settings');
      return res.data;
    } catch (e) {
      return MockDB.getSettings();
    }
  }

  async saveSettings(settings) {
    try {
      const res = await this.request('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      return res.data;
    } catch (e) {
      MockDB.saveSettings(settings);
    }
  }

  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await this.request('/admin/upload', {
        method: 'POST',
        body: formData,
      });
      return res.data.url;
    } catch (e) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
    }
  }
}

export const api = new APIClient();
export default api;
