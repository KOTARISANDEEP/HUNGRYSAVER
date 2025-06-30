import express from 'express';
import { param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import locationController from '../controllers/locationController.js';

const router = express.Router();

// Get all valid cities
router.get('/',
  authenticateToken,
  locationController.getValidCities
);

// Get location statistics
router.get('/:location/stats',
  authenticateToken,
  [
    param('location').isLength({ min: 1 }).trim(),
    query('days').optional().isInt({ min: 1, max: 365 })
  ],
  validateRequest,
  locationController.getLocationStats
);

// Get volunteers in location
router.get('/:location/volunteers',
  authenticateToken,
  [
    param('location').isLength({ min: 1 }).trim(),
    query('status').optional().isIn(['pending', 'approved', 'rejected']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  locationController.getVolunteersInLocation
);

// Get nearby cities
router.get('/:location/nearby',
  authenticateToken,
  [
    param('location').isLength({ min: 1 }).trim(),
    query('radius').optional().isInt({ min: 1, max: 200 })
  ],
  validateRequest,
  locationController.getNearbyCities
);

// Get matching statistics
router.get('/:location/matching-stats',
  authenticateToken,
  [param('location').isLength({ min: 1 }).trim()],
  validateRequest,
  locationController.getMatchingStats
);

export default router;