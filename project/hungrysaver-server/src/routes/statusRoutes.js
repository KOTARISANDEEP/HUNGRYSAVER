import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken, requireVolunteer } from '../middleware/auth.js';
import statusController from '../controllers/statusController.js';

const router = express.Router();

// Update donation status
router.patch('/donation/:id',
  authenticateToken,
  requireVolunteer,
  [
    param('id').isLength({ min: 1 }).trim(),
    body('status').isIn(['accepted', 'picked', 'delivered']),
    body('notes').optional().isLength({ max: 500 }).trim()
  ],
  validateRequest,
  statusController.updateDonationStatus
);

// Update request status
router.patch('/request/:id',
  authenticateToken,
  requireVolunteer,
  [
    param('id').isLength({ min: 1 }).trim(),
    body('status').isIn(['accepted', 'picked', 'delivered']),
    body('notes').optional().isLength({ max: 500 }).trim()
  ],
  validateRequest,
  statusController.updateRequestStatus
);

// Get status history
router.get('/history/:itemType/:itemId',
  authenticateToken,
  [
    param('itemType').isIn(['donation', 'request']),
    param('itemId').isLength({ min: 1 }).trim()
  ],
  validateRequest,
  statusController.getStatusHistory
);

// Get items by status
router.get('/items/:status',
  authenticateToken,
  [
    param('status').isIn(['pending', 'accepted', 'picked', 'delivered']),
    query('location').optional().isLength({ min: 1 }).trim(),
    query('itemType').optional().isIn(['donation', 'request']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  statusController.getItemsByStatus
);

export default router;