"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Clearing old seed data...');
    await prisma.orderItem.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.favorite.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.subCategory.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.banner.deleteMany({});
    console.log('Seeding data...');
    // 1. Categories
    const categoriesData = [
        { name: 'Bespoke Suits', slug: 'bespoke-suits', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop' },
        { name: 'Designer Shirts', slug: 'designer-shirts', img: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=800&auto=format&fit=crop' },
        { name: 'Ethnic Wear', slug: 'ethnic-wear', img: 'https://images.unsplash.com/photo-1583391733959-1c51bf69941a?q=80&w=800&auto=format&fit=crop' },
        { name: 'Winter Collection', slug: 'winter-collection', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800&auto=format&fit=crop' },
        { name: 'Premium Accessories', slug: 'premium-accessories', img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=800&auto=format&fit=crop' },
    ];
    const categoryMap = {};
    for (const cat of categoriesData) {
        const created = await prisma.category.create({
            data: {
                name: cat.name,
                slug: cat.slug,
                order: categoriesData.indexOf(cat),
            },
        });
        categoryMap[cat.slug] = created;
        console.log(`Created category: ${created.name}`);
    }
    // 2. Subcategories structure (3 per category)
    const subCategoriesData = {
        'bespoke-suits': [
            { name: 'Tuxedos', slug: 'tuxedos', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop' },
            { name: 'Business Suits', slug: 'business-suits', imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop' },
            { name: 'Casual Blazer Suits', slug: 'casual-blazer-suits', imageUrl: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=600&auto=format&fit=crop' },
        ],
        'designer-shirts': [
            { name: 'Formal Shirts', slug: 'formal-shirts', imageUrl: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop' },
            { name: 'Casual Shirts', slug: 'casual-shirts', imageUrl: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=600&auto=format&fit=crop' },
            { name: 'Party Wear Shirts', slug: 'party-wear-shirts', imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop' },
        ],
        'ethnic-wear': [
            { name: 'Sherwanis', slug: 'sherwanis', imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop' },
            { name: 'Kurta Pajamas', slug: 'kurta-pajamas', imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop' },
            { name: 'Nehru Jackets', slug: 'nehru-jackets', imageUrl: 'https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=600&auto=format&fit=crop' },
        ],
        'winter-collection': [
            { name: 'Overcoats', slug: 'overcoats', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop' },
            { name: 'Sweaters & Cardigans', slug: 'sweaters-cardigans', imageUrl: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop' },
            { name: 'Leather Jackets', slug: 'leather-jackets', imageUrl: 'https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=600&auto=format&fit=crop' },
        ],
        'premium-accessories': [
            { name: 'Ties & Pocket Squares', slug: 'ties-pocket-squares', imageUrl: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=600&auto=format&fit=crop' },
            { name: 'Leather Belts & Wallets', slug: 'belts-wallets', imageUrl: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=600&auto=format&fit=crop' },
            { name: 'Cufflinks & Watches', slug: 'cufflinks-watches', imageUrl: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop' },
        ]
    };
    const subCategoryMap = {};
    for (const catSlug of Object.keys(subCategoriesData)) {
        const parentCategory = categoryMap[catSlug];
        subCategoryMap[catSlug] = {};
        const subList = subCategoriesData[catSlug];
        for (const sub of subList) {
            const created = await prisma.subCategory.create({
                data: {
                    name: sub.name,
                    slug: sub.slug,
                    imageUrl: sub.imageUrl,
                    categoryId: parentCategory.id,
                    order: subList.indexOf(sub),
                }
            });
            subCategoryMap[catSlug][sub.slug] = created;
            console.log(`Created subcategory: ${created.name} under ${parentCategory.name}`);
        }
    }
    // 3. Precise matched products with correct images & banners (5 per subcategory)
    const productsData = {
        'bespoke-suits': {
            'tuxedos': [
                {
                    name: 'Classic Black Velvet Tuxedo',
                    description: 'A masterpiece of tailored elegance, featuring satin shawl lapels and premium velvet texture.',
                    price: 18999,
                    materialInfo: '80% Velvet, 20% Mulberry Silk Lining',
                    images: ['https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Midnight Blue Silk Tuxedo',
                    description: 'Deep midnight blue tuxedo structured for evening gatherings and bespoke black-tie affairs.',
                    price: 21999,
                    materialInfo: '100% Raw Italian Silk',
                    images: ['https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'White Shawl Lapel Tuxedo',
                    description: 'Bespoke ivory white jacket paired with midnight tuxedo trousers for striking class.',
                    price: 19500,
                    materialInfo: 'High-thread count Cotton-Satin Blend',
                    images: ['https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Double-Breasted Tuxedo Suit',
                    description: 'Timeless double-breasted cut with custom silk buttons and structure.',
                    price: 23000,
                    materialInfo: 'Super 120s Premium Wool',
                    images: ['https://images.unsplash.com/photo-1598808503746-f34c53b9323e?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Burgundy Velvet Evening Tuxedo',
                    description: 'Make a bold statement with our velvet tuxedo in rich burgundy shade.',
                    price: 20500,
                    materialInfo: 'Premium English Velvet',
                    images: ['https://images.unsplash.com/photo-1585435421671-0c16764628ce?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'business-suits': [
                {
                    name: 'Charcoal Grey Wool Suit',
                    description: 'The ultimate professional power suit, designed for the executive lifestyle.',
                    price: 15499,
                    materialInfo: '100% Merino Wool, Hand-stitched lining',
                    images: ['https://images.unsplash.com/photo-1603252109303-2751441dd157?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Navy Blue Pinstripe Suit',
                    description: 'Sharp pinstripe detailing combined with standard comfort tailoring.',
                    price: 16999,
                    materialInfo: 'Super 150s Pure Wool',
                    images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Slim-Fit Herringbone Suit',
                    description: 'Herringbone weave adds visual depth to this slate blue luxury suit.',
                    price: 14800,
                    materialInfo: 'Wool-Silk blended texture',
                    images: ['https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Classic Three-Piece Suit',
                    description: 'Complete with a tailored vest, jacket, and trousers for full formal flair.',
                    price: 19999,
                    materialInfo: 'Super 130s Merino Wool',
                    images: ['https://images.unsplash.com/photo-1620012253295-c05518e993be?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Light Grey Plaid Suit',
                    description: 'Light grey check patterned suit perfect for day conferences and summer business.',
                    price: 16200,
                    materialInfo: 'Lightweight Wool-Linen blend',
                    images: ['https://images.unsplash.com/photo-1592844533775-f938b8130983?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'casual-blazer-suits': [
                {
                    name: 'Tan Linen Blazer Suit',
                    description: 'Relaxed and breathable suit for warm weather social events.',
                    price: 11999,
                    materialInfo: '100% Breathable Organic Linen',
                    images: ['https://images.unsplash.com/photo-1555069519-03000b2ec0cd?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Olive Green Tweed Suit',
                    description: 'Textured tweed blazer suit providing a rustic yet premium appearance.',
                    price: 13500,
                    materialInfo: 'Heavy British Tweed',
                    images: ['https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Navy Corduroy Blazer Suit',
                    description: 'Soft corduroy fabric tailor-made for high-end smart-casual dining.',
                    price: 12800,
                    materialInfo: 'Fine-wale Italian Corduroy Cotton',
                    images: ['https://images.unsplash.com/photo-1618244972963-dbee1a7edc95?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Beige Summer Blend Suit',
                    description: 'Lighter unstructured style for a premium resort look.',
                    price: 11200,
                    materialInfo: 'Linen-Silk-Cotton Blend',
                    images: ['https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Teal Cotton Blend Suit',
                    description: 'Modern teal coloring crafted for youthful events and celebrations.',
                    price: 12500,
                    materialInfo: 'Premium Mercerized Cotton',
                    images: ['https://images.unsplash.com/photo-1505022610485-0249ba5b3675?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                }
            ]
        },
        'designer-shirts': {
            'formal-shirts': [
                {
                    name: 'White Egyptian Cotton Shirt',
                    description: 'High-density luxury weave dress shirt, crispy collar, standard fit.',
                    price: 3499,
                    materialInfo: '100% Egyptian Giza Cotton',
                    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Light Blue Herringbone Dress Shirt',
                    description: 'Premium light blue shirt with a distinctive herringbone texture.',
                    price: 3899,
                    materialInfo: '100% Double-ply Cotton',
                    images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Classic French Cuff Dress Shirt',
                    description: 'Formal shirt designed for double cufflinks, double cuffs, tailored finish.',
                    price: 4200,
                    materialInfo: '120s Two-fold Luxury Cotton',
                    images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Grey Structured Twill Shirt',
                    description: 'Premium twill shirt featuring structured texture and easy iron treatment.',
                    price: 3600,
                    materialInfo: '100% Twill Cotton',
                    images: ['https://images.unsplash.com/photo-1626497764746-6dc36546b388?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Micro-Pinstripe Formal Shirt',
                    description: 'Clean pinstripe design ideal under bespoke charcoal and navy suits.',
                    price: 3500,
                    materialInfo: '100% Supima Cotton',
                    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'casual-shirts': [
                {
                    name: 'Slim-Fit Denim Shirt',
                    description: 'Rugged yet luxurious indigo denim shirt, washed effect.',
                    price: 3200,
                    materialInfo: 'Lightweight washed Indigo Cotton',
                    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Linen Mandarin Collar Shirt',
                    description: 'Mandarin collar shirt in pure linen for premium beach clubs and summer.',
                    price: 2999,
                    materialInfo: '100% Pure French Linen',
                    images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Olive Green Utility Shirt',
                    description: 'Double chest pocket utility shirt designed for weekend travel comfort.',
                    price: 3100,
                    materialInfo: 'Structured Cotton Canvas',
                    images: ['https://images.unsplash.com/photo-1626497764746-6dc36546b388?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Classic Navy Oxford Shirt',
                    description: 'Soft oxford cloth shirt structured for smart casual dressing.',
                    price: 3400,
                    materialInfo: '100% Combed Oxford Cotton',
                    images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Striped Summer Vacation Shirt',
                    description: 'Open cuban collar shirt perfect for tropical holidays and luxury yachting.',
                    price: 2800,
                    materialInfo: 'Viscose-Linen blend',
                    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'party-wear-shirts': [
                {
                    name: 'Black Silk Satin Shirt',
                    description: 'Lustrous premium black silk shirt designed for cocktail clubs.',
                    price: 5999,
                    materialInfo: '100% Pure Mulberry Silk',
                    images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Printed Floral Luxury Shirt',
                    description: 'Elegant custom floral print design on luxury modal satin fabric.',
                    price: 4999,
                    materialInfo: 'Premium Modal Satin',
                    images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Burgundy Velvet Accent Shirt',
                    description: 'Luxurious evening party shirt featuring micro velvet trim.',
                    price: 4800,
                    materialInfo: 'Satin Cotton with Velvet details',
                    images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Jacquard Pattern Dress Shirt',
                    description: 'Subtle woven self jacquard pattern adding premium details.',
                    price: 4500,
                    materialInfo: '100% Premium Cotton Jacquard',
                    images: ['https://images.unsplash.com/photo-1626497764746-6dc36546b388?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Gold Embroidered Dress Shirt',
                    description: 'Sleek luxury party shirt with subtle gold stitching details along the cuff.',
                    price: 5200,
                    materialInfo: 'Luxury Stretch Cotton',
                    images: ['https://images.unsplash.com/photo-1581655353564-df123a1eb820?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                }
            ]
        },
        'ethnic-wear': {
            'sherwanis': [
                {
                    name: 'Royal Ivory Embroidered Sherwani',
                    description: 'Beautifully hand-crafted wedding sherwani featuring detailed zardozi artwork.',
                    price: 34999,
                    materialInfo: 'Banarasi Silk, Zari embroidery',
                    images: ['https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Deep Velvet Groom Sherwani',
                    description: 'Rich royal blue velvet fabric detailed with gold embroidery.',
                    price: 39999,
                    materialInfo: 'Micro-Velvet base, Silk lining',
                    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Classic Art Silk Sherwani',
                    description: 'Lightweight elegant sherwani designed for high-class family functions.',
                    price: 24900,
                    materialInfo: 'Art Silk with thread embroidery',
                    images: ['https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Gold Zardozi Detailed Sherwani',
                    description: 'A royal heritage piece customized with gold thread and pearls.',
                    price: 45000,
                    materialInfo: 'Premium Silk Blend with Pearls',
                    images: ['https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Peach Floral Jacquard Sherwani',
                    description: 'Contemporary color palette for day weddings, modern slim groom design.',
                    price: 28500,
                    materialInfo: 'Silk Jacquard',
                    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'kurta-pajamas': [
                {
                    name: 'Linen Mandarin Kurta Set',
                    description: 'Soft linen kurta with premium tailored pajama, comfortable festive wear.',
                    price: 4500,
                    materialInfo: '100% Pure Organic Linen',
                    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Silk Blend Asymmetric Kurta',
                    description: 'Trendy diagonal cut ethnic kurta set for premium sangeet events.',
                    price: 5200,
                    materialInfo: 'Silk-Cotton Blend',
                    images: ['https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Cotton Embroidered Festive Kurta',
                    description: 'White cotton kurta with intricate Chikankari hand embroidery.',
                    price: 3900,
                    materialInfo: '100% Lucknowi Cotton',
                    images: ['https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Royal Blue Pathani Kurta',
                    description: 'Classic Pathani style kurta with front flap pockets and cuffs.',
                    price: 4800,
                    materialInfo: 'Fine Mercerized Cotton',
                    images: ['https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Pastel Mint Green Kurta Set',
                    description: 'Calming summer shade styled with a simple churidar bottom.',
                    price: 4100,
                    materialInfo: 'Chanderi Silk Blend',
                    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'nehru-jackets': [
                {
                    name: 'Silk Woven Nehru Jacket',
                    description: 'Premium Banarasi silk waist jacket featuring metallic button closure.',
                    price: 6500,
                    materialInfo: 'Banarasi Brocade Silk',
                    images: ['https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Velvet Embroidered Modi Jacket',
                    description: 'Stately velvet Modi style vest, hand embroidered collar.',
                    price: 7999,
                    materialInfo: 'Royal Velvet base, Brass buttons',
                    images: ['https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Linen Textured Nehru Vest',
                    description: 'Ideal light layer to pair over formal kurtas or classic shirts.',
                    price: 5200,
                    materialInfo: '100% Textured Linen',
                    images: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Floral Brocade Nehru Jacket',
                    description: 'Vibrant woven floral pattern Nehru vest for premium festive look.',
                    price: 6800,
                    materialInfo: 'Brocade Silk with Polyester satin lining',
                    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Classic Khadi Nehru Vest',
                    description: 'Hand-spun authentic khadi cotton vest, clean wood button elements.',
                    price: 4500,
                    materialInfo: '100% Hand-woven Khadi Cotton',
                    images: ['https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                }
            ]
        },
        'winter-collection': {
            'overcoats': [
                {
                    name: 'Classic Camel Wool Overcoat',
                    description: 'Luxurious camel overcoat structured for winter business layers.',
                    price: 18500,
                    materialInfo: '90% Wool, 10% Cashmere',
                    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Double-Breasted Cashmere Coat',
                    description: 'The peak of winter luxury, soft cashmere shell, double breasted front.',
                    price: 24999,
                    materialInfo: '100% Mongolian Cashmere',
                    images: ['https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Charcoal Trench Coat',
                    description: 'Water-resistant structured trench coat, adjustable belts and straps.',
                    price: 16800,
                    materialInfo: 'Wool-Polyester blended gabardine',
                    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Herringbone Tweed Long Coat',
                    description: 'Textured long coat offering exceptional warmth and retro style.',
                    price: 17500,
                    materialInfo: '100% British Tweed Wool',
                    images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Navy Slim-Fit Woolen Coat',
                    description: 'Minimalist sleek modern coat designed for daily business wear.',
                    price: 15900,
                    materialInfo: '100% Combed Wool',
                    images: ['https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'sweaters-cardigans': [
                {
                    name: 'Cable Knit Crewneck Sweater',
                    description: 'Classic heavy cable knit sweater, thick crewneck collar design.',
                    price: 4999,
                    materialInfo: '100% Merino Wool',
                    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Cashmere Mockneck Cardigan',
                    description: 'Premium button cardigan with mockneck structure and rib knit cuffs.',
                    price: 8999,
                    materialInfo: '100% Pure Italian Cashmere',
                    images: ['https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Merino Wool Turtleneck Sweater',
                    description: 'Sleek luxury turtleneck ideal under bespoke suit blazers.',
                    price: 5500,
                    materialInfo: 'Superfine Merino Wool',
                    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Ribbed Knit Shawl Collar Cardigan',
                    description: 'Heavy knit cardigan with a classic cozy shawl collar design.',
                    price: 7200,
                    materialInfo: 'Lambswool-Alpaca Blend',
                    images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'V-Neck Knit Pullover',
                    description: 'Lightweight V-Neck layered knitwear, excellent for semi-formal shirts.',
                    price: 4500,
                    materialInfo: 'Combed Cotton-Cashmere Blend',
                    images: ['https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'leather-jackets': [
                {
                    name: 'Classic Black Biker Jacket',
                    description: 'Asymmetric zipper biker jacket in premium top-grain leather.',
                    price: 14999,
                    materialInfo: '100% Top-Grain Sheepskin, Satin lining',
                    images: ['https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Brown Suede Bomber Jacket',
                    description: 'Exquisite brown suede leather bomber jacket with rib collar details.',
                    price: 16500,
                    materialInfo: 'Premium Italian Goat Suede',
                    images: ['https://images.unsplash.com/photo-1550246140-5119ae4790b8?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Distressed Cafe Racer Jacket',
                    description: 'Vintage cafe racer snap collar leather jacket, aged look.',
                    price: 13900,
                    materialInfo: 'Heavy-Duty Cowhide Leather',
                    images: ['https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Sherpa-Lined Leather Jacket',
                    description: 'Warm thick leather jacket with sherpa fleece lining collar.',
                    price: 18000,
                    materialInfo: 'Sheepskin leather, Polyester Sherpa lining',
                    images: ['https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Sleek Black Leather Trench',
                    description: 'Long tailored leather trench coat, premium button adjustments.',
                    price: 21000,
                    materialInfo: 'Ultra-Soft Napa Leather',
                    images: ['https://images.unsplash.com/photo-1544642899-f0d6e5f6ed6f?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                }
            ]
        },
        'premium-accessories': {
            'ties-pocket-squares': [
                {
                    name: 'Mulberry Silk Jacquard Tie',
                    description: 'Woven silk tie featuring a classic paisley pattern for bespoke suits.',
                    price: 1899,
                    materialInfo: '100% Mulberry Silk',
                    images: ['https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Satin Silk Bowtie Set',
                    description: 'Matching bowtie and pocket square set designed for luxury tuxedo wear.',
                    price: 2200,
                    materialInfo: 'Pure Silk Satin',
                    images: ['https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Floral Linen Pocket Square',
                    description: 'Hand-rolled edges, lightweight linen pocket square, summer colors.',
                    price: 999,
                    materialInfo: '100% French Linen',
                    images: ['https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Paisley Pattern Silk Cravat',
                    description: 'Vintage styling cravat, extremely soft neck wrap.',
                    price: 2499,
                    materialInfo: '100% Habotai Silk',
                    images: ['https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Knit Wool Slim Tie',
                    description: 'Textured knitted tie, square bottom cut, ideal for smart-casual blazers.',
                    price: 1600,
                    materialInfo: '100% Merino Wool',
                    images: ['https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'belts-wallets': [
                {
                    name: 'Full Grain Leather Dress Belt',
                    description: 'Sleek dress belt with polished silver buckle, detailed edging.',
                    price: 2499,
                    materialInfo: 'Full-Grain Calfskin Leather',
                    images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Bifold Italian Leather Wallet',
                    description: 'Classic luxury bifold wallet with 8 card slots and bill dividers.',
                    price: 3499,
                    materialInfo: 'Vegetable-Tanned Italian Leather',
                    images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1509941943102-10c232535736?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Minimalist Carbon Cardholder',
                    description: 'RFID blocking carbon fiber cardholder with custom cash strap.',
                    price: 2999,
                    materialInfo: 'Carbon Fiber and Aerospace Aluminum',
                    images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Reversible Suede Belt',
                    description: 'Double-sided wear luxury belt, suede on one side, smooth calf on other.',
                    price: 2800,
                    materialInfo: 'Suede and Smooth Leather',
                    images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Premium Leather Travel Organizer',
                    description: 'Perfect travel accessory, holds passport, cards, tickets, cash.',
                    price: 4999,
                    materialInfo: 'Saffiano Leather',
                    images: ['https://images.unsplash.com/photo-1617038220319-276d3cfab638?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop'
                }
            ],
            'cufflinks-watches': [
                {
                    name: 'Silver Plated Onyx Cufflinks',
                    description: 'Elegant round cufflinks inlaid with black natural onyx stones.',
                    price: 3500,
                    materialInfo: 'Sterling Silver plating, Natural Onyx',
                    images: ['https://images.unsplash.com/photo-1509941943102-10c232535736?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1509941943102-10c232535736?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Minimalist Chronograph Wristwatch',
                    description: 'Matte black case watch, quartz movement, premium leather strap.',
                    price: 12500,
                    materialInfo: 'Stainless Steel Case, Genuine Leather Strap',
                    images: ['https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Classic Rose Gold Dress Watch',
                    description: 'Ultra-thin rose gold casing dress watch with a white textured dial.',
                    price: 14999,
                    materialInfo: 'Rose Gold Plating, Sapphire Glass',
                    images: ['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Engine-Turned Brass Cufflinks',
                    description: 'Textured diamond-pattern brass cufflinks, t-bar back design.',
                    price: 2800,
                    materialInfo: 'Solid Brass with gold electroplating',
                    images: ['https://images.unsplash.com/photo-1509941943102-10c232535736?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop'
                },
                {
                    name: 'Vintage Skeleton Automatic Watch',
                    description: 'See the mechanical beauty through the open-heart automatic dial.',
                    price: 18500,
                    materialInfo: 'Automatic Mechanical, Steel bracelet',
                    images: ['https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop'],
                    bannerImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop'
                }
            ]
        }
    };
    // Seed Products
    for (const catSlug of Object.keys(productsData)) {
        const parentCategory = categoryMap[catSlug];
        const subCats = productsData[catSlug];
        for (const subSlug of Object.keys(subCats)) {
            const parentSubCategory = subCategoryMap[catSlug][subSlug];
            const items = subCats[subSlug];
            for (const item of items) {
                await prisma.product.create({
                    data: {
                        name: item.name,
                        description: item.description,
                        price: item.price,
                        materialInfo: item.materialInfo,
                        images: item.images,
                        bannerImage: item.bannerImage,
                        categoryId: parentCategory.id,
                        subCategoryId: parentSubCategory.id,
                        inventoryQty: 50,
                        stockStatus: 'IN_STOCK',
                        isTrending: Math.random() < 0.3, // ~30% trending
                    }
                });
            }
            console.log(`Created 5 products under subcategory: ${parentSubCategory.name}`);
        }
    }
    // 4. Promo Banners (4)
    const bannersData = [
        { title: 'Summer Collection Sale', imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1200&auto=format&fit=crop' },
        { title: 'Wedding Specials', imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop' },
        { title: 'New Arrivals', imageUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop' },
        { title: 'Exclusive Bespoke Experience', imageUrl: 'https://images.unsplash.com/photo-1589310243389-96a5483213a8?q=80&w=1200&auto=format&fit=crop' },
    ];
    for (const banner of bannersData) {
        await prisma.banner.create({
            data: {
                title: banner.title,
                imageUrl: banner.imageUrl,
                location: 'HOME_SLIDER',
                isActive: true,
            }
        });
    }
    console.log('Created 4 Promo Banners');
    console.log('Seeding complete!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
