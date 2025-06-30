import express from 'express';
import { param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import dashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// Get volunteer dashboard data
router.get('/volunteer/:volunteerId',
  authenticateToken,
  [
    param('volunteerId').isLength({ min: 1 }).trim(),
    query('days').optional().isInt({ min: 1, max: 365 })
  ],
  validateRequest,
  dashboardController.getVolunteerDashboard
);

// Get donor dashboard data
router.get('/donor/:donorId',
  authenticateToken,
  [
    param('donorId').isLength({ min: 1 }).trim(),
    query('days').optional().isInt({ min: 1, max: 365 })
  ],
  validateRequest,
  dashboardController.getDonorDashboard
);

// Get community dashboard data
router.get('/community/:userId',
  authenticateToken,
  [
    param('userId').isLength({ min: 1 }).trim(),
    query('days').optional().isInt({ min: 1, max: 365 })
  ],
  validateRequest,
  dashboardController.getCommunityDashboard
);

// Get admin dashboard data
router.get('/admin',
  authenticateToken,
  requireAdmin,
  [query('days').optional().isInt({ min: 1, max: 365 })],
  validateRequest,
  dashboardController.getAdminDashboard
);

// Get location dashboard data
router.get('/location/:location',
  authenticateToken,
  [
    param('location').isLength({ min: 1 }).trim(),
    query('days').optional().isInt({ min: 1, max: 365 })
  ],
  validateRequest,
  dashboardController.getLocationDashboard
);

export default router;