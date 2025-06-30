import express from 'express';
import { param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import historyController from '../controllers/historyController.js';

const router = express.Router();

// Get user history
router.get('/user/:userId',
  authenticateToken,
  [
    param('userId').isLength({ min: 1 }).trim(),
    query('type').optional().isIn(['donation', 'request', 'all']),
    query('status').optional().isIn(['pending', 'accepted', 'picked', 'delivered']),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  historyController.getUserHistory
);

// Get item history
router.get('/item/:itemType/:itemId',
  authenticateToken,
  [
    param('itemType').isIn(['donation', 'request']),
    param('itemId').isLength({ min: 1 }).trim()
  ],
  validateRequest,
  historyController.getItemHistory
);

// Get audit logs (admin only)
router.get('/audit',
  authenticateToken,
  [
    query('userId').optional().isLength({ min: 1 }).trim(),
    query('action').optional().isLength({ min: 1 }).trim(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  validateRequest,
  historyController.getAuditLogs
);

// Get system statistics (admin only)
router.get('/stats/system',
  authenticateToken,
  [query('days').optional().isInt({ min: 1, max: 365 })],
  validateRequest,
  historyController.getSystemStats
);

export default router;