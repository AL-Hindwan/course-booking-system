import { Router } from 'express';
import adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Get pending verifications
router.get('/verifications/pending', adminController.getPendingVerifications);

// Trainer verification actions
router.post('/verifications/trainer/:id/approve', adminController.approveTrainer);
router.post('/verifications/trainer/:id/reject', adminController.rejectTrainer);

// Institute verification actions
router.post('/verifications/institute/:id/approve', adminController.approveInstitute);
router.post('/verifications/institute/:id/reject', adminController.rejectInstitute);

// Dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);

// Get all trainers
router.get('/trainers', adminController.getAllTrainers);

// Get all institutes
router.get('/institutes', adminController.getAllInstitutes);

// Institute management actions
router.post('/institutes/:id/suspend', adminController.suspendInstitute);
router.post('/institutes/:id/reactivate', adminController.reactivateInstitute);
router.delete('/institutes/:id', adminController.deleteInstitute);
router.put('/institutes/:id', adminController.updateInstitute);

// Trainer management actions
router.put('/trainers/:id', adminController.updateTrainer);

// Student management actions
router.get('/students', adminController.getAllStudents);
router.put('/students/:id', adminController.updateStudent);
router.post('/students/:id/suspend', adminController.suspendStudent);
router.delete('/students/:id', adminController.deleteStudent);

// Course management actions
router.get('/courses', adminController.getAllCourses);
router.put('/courses/:id', adminController.updateCourse);
router.delete('/courses/:id', adminController.deleteCourse);
router.post('/courses/:id/suspend', adminController.suspendCourse);

// Announcement management
router.get('/announcements', adminController.getAnnouncements.bind(adminController));
router.post('/announcements', adminController.createAnnouncement.bind(adminController));
router.put('/announcements/:id', adminController.updateAnnouncement.bind(adminController));
router.delete('/announcements/:id', adminController.deleteAnnouncement.bind(adminController));
router.post('/announcements/:id/send', adminController.sendAnnouncement.bind(adminController));

export default router;

