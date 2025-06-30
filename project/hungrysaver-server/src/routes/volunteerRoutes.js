import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken, requireVolunteer, requireAdmin } from '../middleware/auth.js';
import volunteerController from '../controllers/volunteerController.js';

const router = express.Router();

// Get volunteer profile
router.get('/profile/:id',
  authenticateToken,
  [param('id').isLength({ min: 1 }).trim()],
  validateRequest,
  volunteerController.getVolunteerProfile
);

// Update volunteer profile
router.patch('/profile/:id',
  authenticateToken,
  requireVolunteer,
  [
    param('id').isLength({ min: 1 }).trim(),
    body('firstName').optional().isLength({ min: 1 }).trim(),
    body('location').optional().isLength({ min: 1 }).trim(),
    body('education').optional().isLength({ min: 1 }).trim(),
    body('fcmToken').optional().isLength({ min: 1 }).trim()
  ],
  validateRequest,
  volunteerController.updateVolunteerProfile
);

// Get volunteers by location
router.get('/location/:location',
  authenticateToken,
  [
    param('location').isLength({ min: 1 }).trim(),
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  volunteerController.getVolunteersByLocation
);

// Get volunteer assignments
router.get('/:id/assignments',
  authenticateToken,
  requireVolunteer,
  [
    param('id').isLength({ min: 1 }).trim(),
    query('status').optional().isIn(['accepted', 'picked', 'delivered']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  volunteerController.getVolunteerAssignments
);

// Get volunteer statistics
router.get('/:id/stats',
  authenticateToken,
  [
    param('id').isLength({ min: 1 }).trim(),
    query('days').optional().isInt({ min: 1, max: 365 })
  ],
  validateRequest,
  volunteerController.getVolunteerStats
);

// Approve volunteer (admin only)
router.patch('/:id/approve',
  authenticateToken,
  requireAdmin,
  [param('id').isLength({ min: 1 }).trim()],
  validateRequest,
  volunteerController.approveVolunteer
);

// Reject volunteer (admin only)
router.patch('/:id/reject',
  authenticateToken,
  requireAdmin,
  [
    param('id').isLength({ min: 1 }).trim(),
    body('reason').optional().isLength({ max: 500 }).trim()
  ],
  validateRequest,
  volunteerController.rejectVolunteer
);

// Get pending volunteers (admin only)
router.get('/pending',
  authenticateToken,
  requireAdmin,
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  volunteerController.getPendingVolunteers
);

export default router;