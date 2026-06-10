import { Router } from 'express';
import { ProductController, productQuerySchema, cartAddSchema, couponValidateSchema, favoriteAddSchema } from '../controllers/product.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Cart
router.get('/cart', authenticate, ProductController.getCart);
router.post('/cart', authenticate, validate(cartAddSchema), ProductController.addToCart);
router.delete('/cart/:productId', authenticate, ProductController.removeFromCart);
router.post('/cart/coupon', authenticate, validate(couponValidateSchema), ProductController.validateCoupon);

// Favorites
router.get('/favorites', authenticate, ProductController.getFavorites);
router.post('/favorites', authenticate, validate(favoriteAddSchema), ProductController.addToFavorites);
router.delete('/favorites/:productId', authenticate, ProductController.removeFromFavorites);

// Product catalog
router.get('/', validate(productQuerySchema), ProductController.getProducts);
router.get('/:id', ProductController.getProductById);

export default router;
