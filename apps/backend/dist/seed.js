"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
const crypto_js_1 = require("./utils/crypto.js");
async function seed() {
    console.log('🌱 Starting database seeding with dummy data...');
    try {
        // 1. Clear existing database records (sequential wipe to prevent dependency conflicts)
        console.log('🧹 Wiping existing tables...');
        const tables = [
            'AnalyticsEvent',
            'AuditLog',
            'VisitReport',
            'StoreVisit',
            'Appointment',
            'OrderItem',
            'Invoice',
            'Order',
            'CartItem',
            'UserCoupon',
            'Coupon',
            'PointTransaction',
            'MeasurementHistory',
            'MeasurementProfile',
            'NotificationRecipient',
            'Notification',
            'Banner',
            'SupportTicket',
            'Product',
            'Category',
            'User',
        ];
        for (const table of tables) {
            try {
                await db_js_1.default[table.charAt(0).toLowerCase() + table.slice(1)].deleteMany({});
            }
            catch (err) {
                console.warn(`⚠️ Warning: could not wipe table ${table}: ${err.message}`);
            }
        }
        console.log('✅ Tables cleared successfully.');
        // 2. Generate hashed passwords using Argon2
        console.log('🔑 Generating hashed passwords...');
        const hashedSuperAdmin = await (0, crypto_js_1.hashPassword)('Superadmin123!');
        const hashedAdmin = await (0, crypto_js_1.hashPassword)('Admin123!');
        const hashedStaff = await (0, crypto_js_1.hashPassword)('Staff123!');
        const hashedCustomer = await (0, crypto_js_1.hashPassword)('Customer123!');
        const hashedMarcos = await (0, crypto_js_1.hashPassword)('marcos@zippy');
        // 3. Create Users
        console.log('👤 Creating user profiles...');
        // Marcos SuperAdmin
        const marcos = await db_js_1.default.user.create({
            data: {
                email: 'marcos@zipppy.com',
                phoneNumber: '+919999998888',
                passwordHash: hashedMarcos,
                fullName: 'Marcos Bespoke (SuperAdmin)',
                gender: 'Male',
                address: 'HQ, Bangalore, Karnataka, India',
                role: 'SUPERADMIN',
                referralCode: 'REF-MARCOS-9999',
                pointsBalance: 2000,
            },
        });
        // SuperAdmin
        const superAdmin = await db_js_1.default.user.create({
            data: {
                email: 'superadmin@marcosapp.com',
                phoneNumber: '+919999999999',
                passwordHash: hashedSuperAdmin,
                fullName: 'Vikram Aditya (SuperAdmin)',
                gender: 'Male',
                address: 'Skyline Tower, Mumbai, Maharashtra, India',
                role: 'SUPERADMIN',
                referralCode: 'REF-VIKRAM-9999',
                pointsBalance: 1000,
            },
        });
        // Admin
        const admin = await db_js_1.default.user.create({
            data: {
                email: 'admin@marcosapp.com',
                phoneNumber: '+918888888888',
                passwordHash: hashedAdmin,
                fullName: 'Rajesh Kumar (Admin)',
                gender: 'Male',
                address: 'Regency Park, New Delhi, Delhi, India',
                role: 'ADMIN',
                referralCode: 'REF-RAJESH-8888',
                pointsBalance: 500,
            },
        });
        // Staff Tailor 1
        const staff1 = await db_js_1.default.user.create({
            data: {
                email: 'tailor1@marcosapp.com',
                phoneNumber: '+917777777777',
                passwordHash: hashedStaff,
                fullName: 'Master Ji (Senior Tailor)',
                gender: 'Male',
                address: 'Studio, Bangalore, Karnataka, India',
                role: 'STAFF',
                referralCode: 'REF-MASTERJI-7777',
            },
        });
        // Staff Tailor 2
        const staff2 = await db_js_1.default.user.create({
            data: {
                email: 'tailor2@marcosapp.com',
                phoneNumber: '+916666666666',
                passwordHash: hashedStaff,
                fullName: 'Suresh Verma (Assistant Designer)',
                gender: 'Male',
                address: 'Lab, Bangalore, Karnataka, India',
                role: 'STAFF',
                referralCode: 'REF-SURESH-6666',
            },
        });
        // Customer 1
        const customer1 = await db_js_1.default.user.create({
            data: {
                email: 'customer1@marcosapp.com',
                phoneNumber: '+919876543210',
                passwordHash: hashedCustomer,
                fullName: 'Jane Doe',
                gender: 'Female',
                address: 'Green Glen Layout, Bangalore, Karnataka, India',
                role: 'CUSTOMER',
                referralCode: 'REF-JANE-1234',
                pointsBalance: 1200,
            },
        });
        // Customer 2
        const customer2 = await db_js_1.default.user.create({
            data: {
                email: 'customer2@marcosapp.com',
                phoneNumber: '+919876543211',
                passwordHash: hashedCustomer,
                fullName: 'John Smith',
                gender: 'Male',
                address: 'Sobha Primrose, Bangalore, Karnataka, India',
                role: 'CUSTOMER',
                referralCode: 'REF-JOHN-5678',
                pointsBalance: 450,
            },
        });
        // Customer 3
        const customer3 = await db_js_1.default.user.create({
            data: {
                email: 'customer3@marcosapp.com',
                phoneNumber: '+919876543212',
                passwordHash: hashedCustomer,
                fullName: 'Aarav Mehta',
                gender: 'Male',
                address: 'Prestige Palms, Bangalore, Karnataka, India',
                role: 'CUSTOMER',
                referralCode: 'REF-AARAV-4321',
                pointsBalance: 100,
                referredById: customer1.id, // Referred by Jane Doe
            },
        });
        // Customer 4
        const customer4 = await db_js_1.default.user.create({
            data: {
                email: 'customer4@marcosapp.com',
                phoneNumber: '+919876543213',
                passwordHash: hashedCustomer,
                fullName: 'Priyanka Sen',
                gender: 'Female',
                address: 'Andheri West, Mumbai, Maharashtra, India',
                role: 'CUSTOMER',
                referralCode: 'REF-PRIYA-1111',
                pointsBalance: 300,
            },
        });
        // Customer 5
        const customer5 = await db_js_1.default.user.create({
            data: {
                email: 'customer5@marcosapp.com',
                phoneNumber: '+919876543214',
                passwordHash: hashedCustomer,
                fullName: 'Rahul Sharma',
                gender: 'Male',
                address: 'Saket, New Delhi, Delhi, India',
                role: 'CUSTOMER',
                referralCode: 'REF-RAHUL-2222',
                pointsBalance: 150,
            },
        });
        // Customer 6
        const customer6 = await db_js_1.default.user.create({
            data: {
                email: 'customer6@marcosapp.com',
                phoneNumber: '+919876543215',
                passwordHash: hashedCustomer,
                fullName: 'Ananya Iyer',
                gender: 'Female',
                address: 'Nungambakkam, Chennai, Tamil Nadu, India',
                role: 'CUSTOMER',
                referralCode: 'REF-ANANYA-3333',
                pointsBalance: 50,
            },
        });
        // Customer 7
        const customer7 = await db_js_1.default.user.create({
            data: {
                email: 'customer7@marcosapp.com',
                phoneNumber: '+919876543216',
                passwordHash: hashedCustomer,
                fullName: 'Siddharth Reddy',
                gender: 'Male',
                address: 'Jubilee Hills, Hyderabad, Telangana, India',
                role: 'CUSTOMER',
                referralCode: 'REF-SID-4444',
                pointsBalance: 0,
            },
        });
        // Customer 8
        const customer8 = await db_js_1.default.user.create({
            data: {
                email: 'customer8@marcosapp.com',
                phoneNumber: '+919876543217',
                passwordHash: hashedCustomer,
                fullName: 'Aditi Bose',
                gender: 'Female',
                address: 'Salt Lake, Kolkata, West Bengal, India',
                role: 'CUSTOMER',
                referralCode: 'REF-ADITI-5555',
                pointsBalance: 800,
            },
        });
        console.log('✅ Users populated.');
        // 4. Create Categories
        console.log('🏷️ Creating product categories...');
        const categoryLehengas = await db_js_1.default.category.create({
            data: { name: 'Bridal Lehengas', slug: 'bridal-lehengas', order: 1 },
        });
        const categorySherwanis = await db_js_1.default.category.create({
            data: { name: 'Sherwanis', slug: 'sherwanis', order: 2 },
        });
        const categorySuits = await db_js_1.default.category.create({
            data: { name: 'Blazers & Suits', slug: 'blazers-suits', order: 3 },
        });
        const categoryAnarkalis = await db_js_1.default.category.create({
            data: { name: 'Anarkali Sets', slug: 'anarkali-sets', order: 4 },
        });
        console.log('✅ Categories populated.');
        // 5. Create Products
        console.log('🛍️ Creating product catalog...');
        const productLehengaCrimson = await db_js_1.default.product.create({
            data: {
                name: 'Royal Crimson Velvet Lehenga',
                description: 'Exquisite deep crimson velvet lehenga hand-embroidered with gold zardozi motifs. Custom fit included.',
                price: 85000.00,
                materialInfo: 'Velvet, Silk lining, Net dupatta',
                images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
                categoryId: categoryLehengas.id,
                inventoryQty: 5,
                stockStatus: 'IN_STOCK',
                isTrending: true,
            },
        });
        const productSherwaniGold = await db_js_1.default.product.create({
            data: {
                name: 'Classic Maharaja Gold Sherwani',
                description: 'Luxurious raw silk gold sherwani with intricate hand embroidery. Comes with matching churidar and stole.',
                price: 65000.00,
                materialInfo: 'Banarasi Raw Silk, Cotton Silk blend backing',
                images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800'],
                categoryId: categorySherwanis.id,
                inventoryQty: 10,
                stockStatus: 'IN_STOCK',
                isTrending: true,
            },
        });
        const productLehengaMint = await db_js_1.default.product.create({
            data: {
                name: 'Pastel Mint organza Lehenga',
                description: 'Lightweight summer pastel mint green organza lehenga with delicate floral threadwork.',
                price: 52000.00,
                materialInfo: 'Organza, Shantoon lining',
                images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800'],
                categoryId: categoryLehengas.id,
                inventoryQty: 0,
                stockStatus: 'OUT_OF_STOCK',
            },
        });
        const productAnarkaliMidnight = await db_js_1.default.product.create({
            data: {
                name: 'Midnight Blue Silk Anarkali',
                description: 'An elegant floor-length silk Anarkali suit with gold gotta patti borders.',
                price: 32000.00,
                materialInfo: 'Chanderi Silk, Georgette dupatta',
                images: ['https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800'],
                categoryId: categoryAnarkalis.id,
                inventoryQty: 2,
                stockStatus: 'LOW_STOCK',
            },
        });
        const productSuitCharcoal = await db_js_1.default.product.create({
            data: {
                name: 'Classic Charcoal Tuxedo Suit',
                description: 'A bespoke charcoal gray tuxedo tailored with premium wool blends, suitable for black-tie galas.',
                price: 45000.00,
                materialInfo: 'Merino Wool blend, Satin lapel',
                images: ['https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=800'],
                categoryId: categorySuits.id,
                inventoryQty: 8,
                stockStatus: 'IN_STOCK',
            },
        });
        console.log('✅ Products populated.');
        // 6. Create Measurement Profiles
        console.log('📏 Creating measurement profiles...');
        const measurementJaneSelf = await db_js_1.default.measurementProfile.create({
            data: {
                userId: customer1.id,
                profileName: 'Jane (Self)',
                fullLength: 55.50,
                shoulderWidth: 14.50,
                upperChest: 34.00,
                bust: 36.50,
                waist: 28.00,
                hip: 38.50,
                armLength: 22.00,
                sleeveLength: 18.00,
                neck: 13.50,
                seat: 40.00,
                tailorNotes: 'Prefers a comfortable neck drop and slightly loose fit around the waist.',
            },
        });
        const measurementJohnSelf = await db_js_1.default.measurementProfile.create({
            data: {
                userId: customer2.id,
                profileName: 'John (Self)',
                fullLength: 58.00,
                shoulderWidth: 16.50,
                bust: 40.00,
                waist: 32.00,
                hip: 41.50,
                armLength: 25.00,
                sleeveLength: 23.50,
                neck: 15.00,
                tailorNotes: 'Standard slim fit cut for double-breasted blazers.',
            },
        });
        console.log('✅ Measurement profiles populated.');
        // 7. Create Measurement Updates in History
        await db_js_1.default.measurementHistory.create({
            data: {
                profileId: measurementJaneSelf.id,
                changedBy: admin.id,
                previousValues: {},
                newValues: {
                    fullLength: 55.50,
                    shoulderWidth: 14.50,
                    bust: 36.50,
                    waist: 28.00,
                },
            },
        });
        // 8. Create Coupons
        console.log('🎟️ Creating coupons...');
        const couponWelcome = await db_js_1.default.coupon.create({
            data: {
                code: 'WELCOME50',
                discountPercent: 50,
                maxDiscount: 5000.00,
                expiryDate: new Date('2028-12-31T23:59:59Z'),
                maxUses: 500,
                usedCount: 5,
                isActive: true,
            },
        });
        const couponFlat1500 = await db_js_1.default.coupon.create({
            data: {
                code: 'FESTIVE1500',
                discountFlat: 1500.00,
                expiryDate: new Date('2028-12-31T23:59:59Z'),
                maxUses: 100,
                usedCount: 0,
                isActive: true,
            },
        });
        const couponExpired = await db_js_1.default.coupon.create({
            data: {
                code: 'WINTER20',
                discountPercent: 20,
                expiryDate: new Date('2023-01-01T00:00:00Z'),
                maxUses: 50,
                usedCount: 50,
                isActive: false,
            },
        });
        console.log('✅ Coupons populated.');
        // 9. Apply coupon to User
        await db_js_1.default.userCoupon.create({
            data: {
                userId: customer1.id,
                couponId: couponWelcome.id,
            },
        });
        // 10. Create Appointments
        console.log('📅 Creating appointments...');
        // Tomorrow at 10:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await db_js_1.default.appointment.create({
            data: {
                userId: customer1.id,
                date: tomorrow,
                timeSlot: '10:00 - 11:00',
                productType: 'Lehenga',
                type: 'MEASUREMENT',
                status: 'CONFIRMED',
                notes: 'Needs to finalize borders and check sample fabrics.',
            },
        });
        // Day after tomorrow at 2:00 PM
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        await db_js_1.default.appointment.create({
            data: {
                userId: customer2.id,
                date: dayAfter,
                timeSlot: '14:00 - 15:00',
                productType: 'Tuxedo',
                type: 'CONSULTATION',
                status: 'PENDING',
                notes: 'Initial fitting and lapel material selection.',
            },
        });
        console.log('✅ Appointments populated.');
        // 11. Create Store Visits (Home/Offline Visits)
        console.log('🚗 Creating store home visits...');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const completedVisit = await db_js_1.default.storeVisit.create({
            data: {
                customerId: customer1.id,
                assignedStaffId: staff1.id,
                preferredDate: yesterday,
                confirmedDate: yesterday,
                address: 'Flat 405, Green Glen Layout, Bangalore',
                requirements: 'Provide fabric samples for bridal dresses and take physical sizing measurements.',
                status: 'COMPLETED',
            },
        });
        const pendingVisit = await db_js_1.default.storeVisit.create({
            data: {
                customerId: customer3.id,
                assignedStaffId: staff2.id,
                preferredDate: tomorrow,
                address: 'Apartment 7B, Prestige Palms, Bangalore',
                requirements: 'Trial fittings for customized Sherwani.',
                status: 'ASSIGNED',
            },
        });
        console.log('✅ Store visits populated.');
        // 12. Create Visit Report
        console.log('📝 Creating visit reports...');
        await db_js_1.default.visitReport.create({
            data: {
                visitId: completedVisit.id,
                staffId: staff1.id,
                completionNotes: 'All physical size parameters logged successfully. Chosen fabric color: Royal Crimson. Initial layout sketching approved by client.',
                mediaUrls: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf-test.pdf'],
            },
        });
        console.log('✅ Visit reports populated.');
        // 13. Create Orders & Order Items
        console.log('💳 Creating order records...');
        // Order 1 (Jane - Completed and Paid)
        const order1 = await db_js_1.default.order.create({
            data: {
                userId: customer1.id,
                status: 'PAID',
                totalAmount: 85000.00,
                taxAmount: 4250.00,
                discountAmount: 5000.00,
                payableAmount: 84250.00,
                paymentMethod: 'Online',
                invoiceNumber: 'INV-2026-0001',
                paymentStatus: 'COMPLETED',
                transactionId: 'pay_Hj823nsd81j',
                paymentGateway: 'STRIPE',
                gatewayResponse: { chargeId: 'ch_89234jsdf' },
            },
        });
        await db_js_1.default.orderItem.create({
            data: {
                orderId: order1.id,
                productId: productLehengaCrimson.id,
                quantity: 1,
                price: 85000.00,
            },
        });
        await db_js_1.default.invoice.create({
            data: {
                orderId: order1.id,
                pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf-test.pdf',
            },
        });
        // Order 2 (John - Processing, Cash payment)
        const order2 = await db_js_1.default.order.create({
            data: {
                userId: customer2.id,
                status: 'PROCESSING',
                totalAmount: 65000.00,
                taxAmount: 3250.00,
                discountAmount: 0.00,
                payableAmount: 68250.00,
                paymentMethod: 'Cash',
                invoiceNumber: 'INV-2026-0002',
                paymentStatus: 'PENDING',
            },
        });
        await db_js_1.default.orderItem.create({
            data: {
                orderId: order2.id,
                productId: productSherwaniGold.id,
                quantity: 1,
                price: 65000.00,
            },
        });
        console.log('✅ Orders populated.');
        // 14. Create Point Transactions (Loyalty history)
        console.log('💎 Creating loyalty point ledger entries...');
        await db_js_1.default.pointTransaction.create({
            data: {
                userId: customer1.id,
                points: 850,
                reason: 'Earned from purchase of Crimson Velvet Lehenga',
            },
        });
        await db_js_1.default.pointTransaction.create({
            data: {
                userId: customer1.id,
                points: -150,
                reason: 'Redeemed points discount during checkout',
            },
        });
        await db_js_1.default.pointTransaction.create({
            data: {
                userId: customer2.id,
                points: 450,
                reason: 'Earned from purchase of Maharaja Gold Sherwani',
            },
        });
        // Referral credits
        await db_js_1.default.pointTransaction.create({
            data: {
                userId: customer1.id,
                points: 100,
                reason: 'Referral bonus: Aarav Mehta registered via your link',
            },
        });
        await db_js_1.default.pointTransaction.create({
            data: {
                userId: customer3.id,
                points: 100,
                reason: 'Welcome referral bonus: Registered via code REF-JANE-1234',
            },
        });
        console.log('✅ Point transactions populated.');
        // 15. Create Support Tickets
        console.log('🎫 Creating customer support tickets...');
        await db_js_1.default.supportTicket.create({
            data: {
                userId: customer1.id,
                subject: 'Bust measurement correction',
                description: 'Can we change the bust size to 36.0 inches? I feel 36.5 might be slightly looser than required.',
                status: 'OPEN',
            },
        });
        await db_js_1.default.supportTicket.create({
            data: {
                userId: customer2.id,
                subject: 'Cash payment confirmation',
                description: 'I would like to pay in cash upon delivery. Please confirm if that is accepted.',
                status: 'RESOLVED',
            },
        });
        console.log('✅ Support tickets populated.');
        // 16. Create Banners
        console.log('🖼️ Creating marketing banners...');
        await db_js_1.default.banner.create({
            data: {
                title: 'Exquisite Bridal Collection 2026',
                imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800',
                targetUrl: '/categories/bridal-lehengas',
                location: 'HOME_SLIDER',
                isActive: true,
            },
        });
        await db_js_1.default.banner.create({
            data: {
                title: 'Maharaja Royal Groom collection',
                imageUrl: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800',
                targetUrl: '/categories/sherwanis',
                location: 'PROMOTIONAL_SECTION',
                isActive: true,
            },
        });
        console.log('✅ Banners populated.');
        // 17. Create Audit Logs
        console.log('📋 Creating audit logs...');
        await db_js_1.default.auditLog.create({
            data: {
                userId: superAdmin.id,
                action: 'CREATE_PRODUCT',
                details: {
                    message: 'SuperAdmin created a new trending product: Royal Crimson Velvet Lehenga',
                    productId: productLehengaCrimson.id,
                    price: 85000.00,
                },
                ipAddress: '127.0.0.1',
            },
        });
        await db_js_1.default.auditLog.create({
            data: {
                userId: staff1.id,
                action: 'SUBMIT_VISIT_REPORT',
                details: {
                    message: 'Tailor submitted a completion report for Visit ID: ' + completedVisit.id,
                    visitId: completedVisit.id,
                },
                ipAddress: '192.168.1.5',
            },
        });
        console.log('✅ Audit logs populated.');
        // 18. Create Analytics events for conversion funnel
        console.log('📊 Seeding analytics events for conversion rates...');
        const analyticsEvents = [];
        // Views
        for (let i = 0; i < 2500; i++) {
            analyticsEvents.push({ eventType: 'PRODUCT_VIEW' });
        }
        // Add to Cart
        for (let i = 0; i < 1200; i++) {
            analyticsEvents.push({ eventType: 'ADD_TO_CART' });
        }
        // Checkout Initiated
        for (let i = 0; i < 850; i++) {
            analyticsEvents.push({ eventType: 'CHECKOUT_INITIATED' });
        }
        // Purchase Completed
        for (let i = 0; i < 620; i++) {
            analyticsEvents.push({ eventType: 'PURCHASE_COMPLETED' });
        }
        // Abandoned Cart
        for (let i = 0; i < 300; i++) {
            analyticsEvents.push({ eventType: 'CART_ABANDONED' });
        }
        await db_js_1.default.analyticsEvent.createMany({
            data: analyticsEvents,
        });
        console.log('✅ Analytics events populated.');
        console.log('🚀 Database seeding complete! You are ready to test all backend routes, encryption and verify the admin panel with realistic data.');
    }
    catch (error) {
        console.error('❌ Error during seeding process:', error);
        process.exit(1);
    }
    finally {
        await db_js_1.default.$disconnect();
    }
}
seed();
