const https = require('https');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImages() {
  const products = await prisma.product.findMany();
  for (const p of products) {
    const url = p.images[0];
    https.get(url, (res) => {
      if (res.statusCode !== 200 && res.statusCode !== 302 && res.statusCode !== 301) {
        console.log(`${p.name}: FAILED with status ${res.statusCode} -> ${url}`);
      }
    }).on('error', (e) => {
      console.log(`${p.name}: ERROR -> ${e.message}`);
    });
  }
}
checkImages();
