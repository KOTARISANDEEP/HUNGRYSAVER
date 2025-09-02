import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import requestController from '../controllers/requestController.js';

const router = express.Router();

// Create new community request
router.post('/',
  authenticateToken,
  [
    body('initiative').isIn(['annamitra-seva', 'vidya-jyothi', 'suraksha-setu', 'punarasha', 'raksha-jyothi', 'jyothi-nilayam']),
    body('location').isLength({ min: 1 }).trim(),
    body('address').isLength({ min: 1 }).trim(),
    body('beneficiaryName').isLength({ min: 1 }).trim(),
    body('beneficiaryContact').isLength({ min: 10, max: 15 }).trim(),
    body('description').isLength({ min: 1 }).trim()
  ],
  validateRequest,
  requestController.createRequest
);

// Get requests by location
router.get('/location/:location',
  authenticateToken,
  [
    param('location').isLength({ min: 1 }).trim(),
    query('status').optional().isIn(['pending', 'accepted', 'picked', 'delivered', 'completed']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  requestController.getRequestsByLocation
);

// Get user's requests
router.get('/user/:userId',
  authenticateToken,
  [
    param('userId').isLength({ min: 1 }).trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  requestController.getUserRequests
);

// Get request by ID
router.get('/:id',
  authenticateToken,
  [param('id').isLength({ min: 1 }).trim()],
  validateRequest,
  requestController.getRequestById
);

// Update request status
router.patch('/:id/status',
  authenticateToken,
  [
    param('id').isLength({ min: 1 }).trim(),
    body('status').isIn(['accepted', 'picked', 'delivered', 'completed']),
    body('volunteerId').optional().isLength({ min: 1 }).trim()
  ],
  validateRequest,
  requestController.updateRequestStatus
);

// Delete request (only if pending)
router.delete('/:id',
  authenticateToken,
  [param('id').isLength({ min: 1 }).trim()],
  validateRequest,
  requestController.deleteRequest
);

export default router;