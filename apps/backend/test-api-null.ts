import { PrismaClient } from '@prisma/client';
import * as http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: 'd:\\Zippy\\MARCOS\\apps\\backend\\.env' });
const secret = process.env.JWT_ACCESS_SECRET || 'secret';
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'SUPERADMIN' } });
  if (!admin) throw new Error("No admin");

  const category = await prisma.category.findFirst({ include: { subCategories: true } });
  if (!category) throw new Error("No category");
  
  const token = jwt.sign({ id: admin.id, role: 'SUPERADMIN', fullName: 'Test' }, secret, { expiresIn: '1h' });

  const payload = JSON.stringify({
    name: 'Test Product Null Sub',
    description: 'Testing 123',
    price: 50,
    materialInfo: 'Cotton',
    categoryId: category.id,
    subCategoryId: null,
    inventoryQty: 10,
    targetGender: 'UNISEX',
  });

  console.log("Sending payload:", payload);

  const req = http.request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/admin/products',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    },
    (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', data);
      });
    }
  );

  req.on('error', (e) => console.error(e));
  req.write(payload);
  req.end();
}

main();
