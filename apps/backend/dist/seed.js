"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_js_1 = __importDefault(require("./config/db.js"));
const crypto_js_1 = require("./utils/crypto.js");
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ⚠️  DANGER: THIS SCRIPT TRUNCATES ALL DATABASE TABLES WITH CASCADE  ⚠️  ║
// ║                                                                          ║
// ║  ALL existing users, orders, accounts, audit logs, and data will be     ║
// ║  PERMANENTLY DELETED before inserting fresh clean data.                  ║
// ║                                                                          ║
// ║  To run:  npm run seed:danger                                            ║
// ╚══════════════════════════════════════════════════════════════════════════╝
const FORCE_FLAG = process.argv.includes('--force');
if (!FORCE_FLAG) {
    console.error('\n');
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║  ❌  SEED ABORTED — MISSING REQUIRED --force FLAG           ║');
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error('║                                                              ║');
    console.error('║  This script will PERMANENTLY DELETE all database data.     ║');
    console.error('║  It will wipe: users, orders, accounts, audit logs, etc.    ║');
    console.error('║                                                              ║');
    console.error('║  If you are SURE, run:                                       ║');
    console.error('║    npm run seed:danger                                      ║');
    console.error('║                                                              ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    console.error('\n');
    process.exit(1);
}
// Also block in production environment
if (process.env.NODE_ENV === 'production') {
    console.error('\n❌  SEED BLOCKED: Cannot run destructive seed in production environment.\n');
    process.exit(1);
}
console.warn('\n⚠️  --force flag detected. Proceeding with FULL DATA WIPE in 3 seconds...\n');
(async () => {
    await new Promise(resolve => setTimeout(resolve, 3000));
    async function seed() {
        console.log('🌱 Starting database seeding with clean data...');
        try {
            // 1. Clear existing database records via TRUNCATE CASCADE
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
                'Favorite',
                'UserCoupon',
                'Coupon',
                'PointTransaction',
                'MeasurementHistory',
                'MeasurementProfile',
                'NotificationRecipient',
                'Notification',
                'Banner',
                'SupportTicketMessage',
                'SupportTicket',
                'Product',
                'Category',
                'User',
                'SystemSettings',
            ];
            const truncateQuery = `TRUNCATE TABLE ${tables.map(t => `"${t}"`).join(', ')} CASCADE;`;
            await db_js_1.default.$executeRawUnsafe(truncateQuery);
            console.log('✅ Tables cleared successfully.');
            // 2. Generate hashed passwords
            console.log('🔑 Generating hashed passwords...');
            const hashedSanjai = await (0, crypto_js_1.hashPassword)('Sanjai@123');
            const hashedAdmin = await (0, crypto_js_1.hashPassword)('Marcos@admin123');
            const hashedTailor = await (0, crypto_js_1.hashPassword)('Marcos@tailor123');
            // 3. Create Clean Users
            console.log('👤 Creating clean user profiles...');
            // Sanjai Customer
            await db_js_1.default.user.create({
                data: {
                    email: 'sanjaipandian.as@gmail.com',
                    phoneNumber: '+919000000002',
                    passwordHash: hashedSanjai,
                    fullName: 'Sanjai Pandian',
                    role: 'CUSTOMER',
                    referralCode: 'REF-SANJAI-0001',
                    pointsBalance: 500,
                },
            });
            // SuperAdmin
            await db_js_1.default.user.create({
                data: {
                    email: 'marcos@admin.com',
                    phoneNumber: '+919999998888',
                    passwordHash: hashedAdmin,
                    fullName: 'Marcos SuperAdmin',
                    role: 'SUPERADMIN',
                    referralCode: 'REF-MARCOSADMIN',
                },
            });
            // Tailor Staff
            await db_js_1.default.user.create({
                data: {
                    email: 'marcos@tailor.com',
                    phoneNumber: '+917777777777',
                    passwordHash: hashedTailor,
                    fullName: 'Marcos Tailor',
                    role: 'STAFF',
                    referralCode: 'REF-MARCOSTAILOR',
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
            await db_js_1.default.product.create({
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
            await db_js_1.default.product.create({
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
            await db_js_1.default.product.create({
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
            await db_js_1.default.product.create({
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
            await db_js_1.default.product.create({
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
            // 6. Create Banners
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
            // 7. System settings
            console.log('⚙️ Creating system settings...');
            await db_js_1.default.systemSettings.upsert({
                where: { id: 'default' },
                update: {},
                create: {
                    id: 'default',
                    lowStockThreshold: 10,
                    businessHoursStart: '09:00',
                    businessHoursEnd: '18:00',
                    pointsEarnRate: 10,
                    pointsRedeemRate: 0.10,
                    otpCooldownMinutes: 15,
                    maxOtpFailures: 3,
                }
            });
            console.log('✅ System settings ready.');
            console.log('🚀 Database seeding complete! You are ready to test all backend routes, encryption and verify the admin panel with clean, real-world data.');
        }
        catch (error) {
            console.error('❌ Error during seeding process:', error);
            process.exit(1);
        }
        finally {
            await db_js_1.default.$disconnect();
        }
    }
    await seed();
})();
