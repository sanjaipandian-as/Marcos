import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newStores = [
  {
    name: 'MARCOS - Express Avenue',
    address: '17, Pattullos Rd, Express Estate, Royapettah',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600014',
    country: 'India',
    phone: '+91 44 2846 4646',
    email: 'ea@marcos.com',
    latitude: 13.0587,
    longitude: 80.2641,
    openingHours: '10:00',
    closingHours: '22:00',
    isActive: true,
    description: 'Our flagship store in Chennai located in the prestigious Express Avenue Mall.',
    imageUrl: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'MARCOS - Phoenix Marketcity',
    address: '142, Velachery Rd, Indira Gandhi Nagar, Velachery',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600042',
    country: 'India',
    phone: '+91 44 3008 3008',
    email: 'phoenix@marcos.com',
    latitude: 12.9915,
    longitude: 80.2170,
    openingHours: '10:00',
    closingHours: '22:00',
    isActive: true,
    description: 'Premium bespoke tailoring experience in Phoenix Marketcity, Velachery.',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'MARCOS - VR Chennai',
    address: '100 Feet Rd, Thirumangalam, Anna Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    country: 'India',
    phone: '+91 44 6666 6666',
    email: 'vrchennai@marcos.com',
    latitude: 13.0841,
    longitude: 80.1983,
    openingHours: '10:30',
    closingHours: '22:00',
    isActive: true,
    description: 'Explore fine fabrics and bespoke fashion at our Anna Nagar boutique.',
    imageUrl: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'MARCOS - Forum Vijaya Mall',
    address: '183, Arcot Rd, NSK Nagar, Vadapalani',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600026',
    country: 'India',
    phone: '+91 44 4904 9000',
    email: 'forum@marcos.com',
    latitude: 13.0494,
    longitude: 80.2117,
    openingHours: '10:00',
    closingHours: '21:30',
    isActive: true,
    description: 'Custom tailoring for men and women at the heart of Vadapalani.',
    imageUrl: 'https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=1000&auto=format&fit=crop',
  },
  {
    name: 'MARCOS - Chennai Citi Centre',
    address: '10, 11, Dr Radha Krishnan Salai, Loganathan Colony, Mylapore',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600004',
    country: 'India',
    phone: '+91 44 2847 7777',
    email: 'citicentre@marcos.com',
    latitude: 13.0425,
    longitude: 80.2741,
    openingHours: '10:30',
    closingHours: '21:30',
    isActive: true,
    description: 'Heritage location offering classic bespoke tailoring in Mylapore.',
    imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1000&auto=format&fit=crop',
  }
];

async function main() {
  console.log('Seeding 5 Chennai stores...');
  
  for (const store of newStores) {
    const created = await prisma.storeLocation.create({
      data: store
    });
    console.log(`Created store: ${created.name}`);
  }
  
  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
