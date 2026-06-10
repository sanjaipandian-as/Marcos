import { Router } from 'express';
import { AdminCategoryController } from '../controllers/adminCategory.controller.js';

const router = Router();

router.get('/', AdminCategoryController.listCategories);

export default router;
