import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/db.js';
import AuthService from '../src/services/auth.service.js';
import { Role } from '@prisma/client';

describe('Products Catalog & Cart operations', () => {
  let customerToken: string;
  let customer: any;
  let category: any;
  let product1: any;
  let product2: any;

  beforeEach(async () => {
    // 1. Create a customer user
    customer = await prisma.user.create({
      data: {
        email: 'cust.prod@marcosapp.com',
        phoneNumber: '+919900112233',
        passwordHash: 'hash',
        fullName: 'Cart Customer',
        role: Role.CUSTOMER,
        referralCode: 'REF-CCUST',
      },
    });
    customerToken = AuthService.generateAccessToken(customer);

    // 2. Create category and products
    category = await prisma.category.create({
      data: {
        name: 'Ethic Wear',
        slug: 'ethnic-wear',
      },
    });

    product1 = await prisma.product.create({
      data: {
        name: 'Designer Sherwani',
        description: 'Embroidered silk sherwani for weddings',
        price: 500.00,
        inventoryQty: 5,
        stockStatus: 'IN_STOCK',
        categoryId: category.id,
      },
    });

    product2 = await prisma.product.create({
      data: {
        name: 'Kurta Pyjama',
        description: 'Cotton comfort fit kurta pyjama',
        price: 120.00,
        inventoryQty: 12,
        stockStatus: 'IN_STOCK',
        categoryId: category.id,
      },
    });
  });

  test('GET /products lists products with search, pagination, and sorting', async () => {
    // Basic search and filtering
    const res = await request(app)
      .get('/api/v1/products')
      .query({ search: 'sherwani', category: 'ethnic-wear' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Designer Sherwani');

    // Sorting by price asc
    const resSort = await request(app)
      .get('/api/v1/products')
      .query({ sortBy: 'price', sortOrder: 'asc' });
    expect(resSort.status).toBe(200);
    expect(resSort.body.data[0].name).toBe('Kurta Pyjama'); // $120 < $500
  });

  test('GET /products/:id returns product details', async () => {
    const res = await request(app).get(`/api/v1/products/${product1.id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Designer Sherwani');

    const res404 = await request(app).get('/api/v1/products/00000000-0000-0000-0000-000000000000');
    expect(res404.status).toBe(404);
  });

  test('GET /cart and POST /cart handles product limits and logins', async () => {
    // 1. Unauthenticated gets 401
    const resUnauth = await request(app).get('/api/v1/products/cart');
    expect(resUnauth.status).toBe(401);

    // 2. Authenticated gets empty cart
    const resEmpty = await request(app)
      .get('/api/v1/products/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.data.length).toBe(0);

    // 3. Add to cart with insufficient inventory -> 400 Bad Request
    const resOverlimit = await request(app)
      .post('/api/v1/products/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1.id, quantity: 10 }); // available is 5
    expect(resOverlimit.status).toBe(400);
    expect(resOverlimit.body.message).toContain('Insufficient inventory');

    // 4. Add to cart with sufficient inventory -> 200 OK
    const resAdd = await request(app)
      .post('/api/v1/products/cart')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: product1.id, quantity: 3 });
    expect(resAdd.status).toBe(200);
    expect(resAdd.body.data.quantity).toBe(3);

    // 5. Verify cart is populated
    const resPopulated = await request(app)
      .get('/api/v1/products/cart')
      .set('Authorization', `Bearer ${customerToken}`);
    expect(resPopulated.status).toBe(200);
    expect(resPopulated.body.data.length).toBe(1);
    expect(resPopulated.body.data[0].product.name).toBe('Designer Sherwani');
  });

  test('POST /cart/coupon verifies active, expiry, and count validations', async () => {
    // 1. Valid coupon
    const couponValid = await prisma.coupon.create({
      data: {
        code: 'WELCOME10',
        discountPercent: 10,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        isActive: true,
        maxUses: 100,
        usedCount: 5,
      },
    });

    const resValid = await request(app)
      .post('/api/v1/products/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'WELCOME10' });
    expect(resValid.status).toBe(200);
    expect(resValid.body.coupon.discountPercent).toBe(10);

    // 2. Inactive coupon -> 400 Bad Request
    await prisma.coupon.create({
      data: {
        code: 'INACTIVE50',
        discountPercent: 50,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: false,
      },
    });

    const resInactive = await request(app)
      .post('/api/v1/products/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'INACTIVE50' });
    expect(resInactive.status).toBe(400);
    expect(resInactive.body.message).toContain('inactive');

    // 3. Expired coupon -> 400 Bad Request
    await prisma.coupon.create({
      data: {
        code: 'EXPIRED20',
        discountPercent: 20,
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        isActive: true,
      },
    });

    const resExpired = await request(app)
      .post('/api/v1/products/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'EXPIRED20' });
    expect(resExpired.status).toBe(400);
    expect(resExpired.body.message).toContain('expired');

    // 4. Max uses reached -> 400 Bad Request
    await prisma.coupon.create({
      data: {
        code: 'LIMIT5',
        discountPercent: 5,
        expiryDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
        maxUses: 5,
        usedCount: 5,
      },
    });

    const resLimit = await request(app)
      .post('/api/v1/products/cart/coupon')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ code: 'LIMIT5' });
    expect(resLimit.status).toBe(400);
    expect(resLimit.body.message).toContain('limit reached');
  });
});
