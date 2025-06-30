import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import { authenticateToken } from '../middleware/auth.js';
import notificationController from '../controllers/notificationController.js';

const router = express.Router();

// Get user notifications
router.get('/user/:userId',
  authenticateToken,
  [
    param('userId').isLength({ min: 1 }).trim(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
    query('unreadOnly').optional().isBoolean()
  ],
  validateRequest,
  notificationController.getUserNotifications
);

// Mark notification as read
router.patch('/:id/read',
  authenticateToken,
  [param('id').isLength({ min: 1 }).trim()],
  validateRequest,
  notificationController.markAsRead
);

// Mark all notifications as read
router.patch('/user/:userId/read-all',
  authenticateToken,
  [param('userId').isLength({ min: 1 }).trim()],
  validateRequest,
  notificationController.markAllAsRead
);

// Get unread count
router.get('/user/:userId/unread-count',
  authenticateToken,
  [param('userId').isLength({ min: 1 }).trim()],
  validateRequest,
  notificationController.getUnreadCount
);

// Update FCM token
router.patch('/fcm-token',
  authenticateToken,
  [body('fcmToken').isLength({ min: 1 }).trim()],
  validateRequest,
  notificationController.updateFCMToken
);

// Send test notification (admin only)
router.post('/test',
  authenticateToken,
  [
    body('userId').isLength({ min: 1 }).trim(),
    body('title').isLength({ min: 1 }).trim(),
    body('message').isLength({ min: 1 }).trim()
  ],
  validateRequest,
  notificationController.sendTestNotification
);

export default router;