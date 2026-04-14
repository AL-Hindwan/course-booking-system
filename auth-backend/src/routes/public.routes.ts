import { Router } from 'express';
import trainerController from '../controllers/trainer.controller';
import instituteController from '../controllers/institute.controller';
import publicController from '../controllers/public.controller';

const router = Router();

// Publicly accessible halls endpoint
router.get('/halls', trainerController.getHalls);
router.get('/halls/:hallId/availability', trainerController.getHallAvailability);

// Publicly accessible institutes endpoint
router.get('/institutes', instituteController.getPublicInstitutes);
router.get('/institutes/:id', instituteController.getPublicInstituteById);

// Publicly accessible homepage data endpoints
router.get('/stats', publicController.getStats);
router.get('/categories', publicController.getCategories);
router.get('/featured-courses', publicController.getFeaturedCourses);

export default router;
