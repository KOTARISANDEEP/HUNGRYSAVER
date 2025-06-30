import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import donationController from '../controllers/donationController.js';

const router = express.Router();

// Create new donation
router.post('/',
  authenticateToken,
  [
    body('initiative').isIn(['annamitra-seva', 'vidya-jyothi', 'suraksha-setu', 'punarasha', 'raksha-jyothi', 'jyothi-nilayam']),
    body('location').isLength({ min: 1 }).trim(),
    body('address').isLength({ min: 1 }).trim(),
    body('donorName').isLength({ min: 1 }).trim(),
    body('donorContact').isLength({ min: 10, max: 15 }).trim(),
    body('description').isLength({ min: 1 }).trim()
  ],
  validateRequest,
  donationController.createDonation
);

// Get donations by location
router.get('/location/:location',
  authenticateToken,
  [
    param('location').isLength({ min: 1 }).trim(),
    query('status').optional().isIn(['pending', 'accepted', 'picked', 'delivered']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  donationController.getDonationsByLocation
);

// Get user's donations
router.get('/user/:userId',
  authenticateToken,
  [
    param('userId').isLength({ min: 1 }).trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  donationController.getUserDonations
);

// Get donation by ID
router.get('/:id',
  authenticateToken,
  [param('id').isLength({ min: 1 }).trim()],
  validateRequest,
  donationController.getDonationById
);

// Update donation status
router.patch('/:id/status',
  authenticateToken,
  [
    param('id').isLength({ min: 1 }).trim(),
    body('status').isIn(['accepted', 'picked', 'delivered']),
    body('volunteerId').optional().isLength({ min: 1 }).trim()
  ],
  validateRequest,
  donationController.updateDonationStatus
);

// Delete donation (only if pending)
router.delete('/:id',
  authenticateToken,
  [param('id').isLength({ min: 1 }).trim()],
  validateRequest,
  donationController.deleteDonation
);

// Get donation statistics
router.get('/stats/summary',
  authenticateToken,
  donationController.getDonationStats
);

export default router;