import { z } from 'zod';

const productCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    price: z.coerce.number().positive(),
    materialInfo: z.string().optional(),
    images: z.array(z.string()).default([]),
    bannerImage: z.string().optional().nullable(),
    categoryId: z.string().uuid(),
    subCategoryId: z.string().uuid().optional().nullable(),
    inventoryQty: z.coerce.number().int().nonnegative().default(0),
    targetGender: z.enum(['MEN', 'WOMEN', 'KIDS', 'UNISEX']).default('UNISEX'),
  }),
});

const payload = {
  name: "Test",
  description: "Test description",
  price: 250,
  materialInfo: "Cotton",
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  subCategoryId: "550e8400-e29b-41d4-a716-446655440001",
  inventoryQty: 10,
  targetGender: "UNISEX",
  isTrending: false,
  images: ["https://example.com/img.jpg"],
  bannerImage: null
};

try {
  productCreateSchema.parse({ body: payload });
  console.log("Validation passed");
} catch (e) {
  console.log("Validation failed:");
  console.log(JSON.stringify(e.errors, null, 2));
}
