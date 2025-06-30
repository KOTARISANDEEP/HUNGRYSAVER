import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS } from '../config/constants.js';
import notificationService from '../services/notificationService.js';
import { logger } from '../utils/logger.js';

class NotificationController {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize Firestore connection
   */
  initialize() {
    if (!this.db) {
      this.db = getFirestore();
    }
  }

  /**
   * Get Firestore database instance with lazy initialization
   */
  getDb() {
    if (!this.db) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Get user notifications
   */
  getUserNotifications = async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0, unreadOnly = false } = req.query;

      // Check if user is requesting their own notifications or is admin
      if (req.user.uid !== userId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      let query = this.getDb().collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', userId);

      if (unreadOnly === 'true') {
        query = query.where('read', '==', false);
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: notifications,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: notifications.length
        }
      });
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Mark notification as read
   */
  markAsRead = async (req, res) => {
    try {
      const { id } = req.params;

      const notificationDoc = await this.getDb().collection(COLLECTIONS.NOTIFICATIONS).doc(id).get();

      if (!notificationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      const notification = notificationDoc.data();

      // Check if user owns the notification
      if (notification.userId !== req.user.uid && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      await notificationService.markNotificationAsRead(id);

      res.json({
        success: true,
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Mark all notifications as read
   */
  markAllAsRead = async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user is updating their own notifications or is admin
      if (req.user.uid !== userId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const snapshot = await this.getDb().collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      const batch = this.getDb().batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true, readAt: new Date() });
      });

      await batch.commit();

      logger.info(`Marked ${snapshot.size} notifications as read for user ${userId}`);

      res.json({
        success: true,
        message: `${snapshot.size} notifications marked as read`
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get unread notification count
   */
  getUnreadCount = async (req, res) => {
    try {
      const { userId } = req.params;

      // Check if user is requesting their own count or is admin
      if (req.user.uid !== userId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update FCM token
   */
  updateFCMToken = async (req, res) => {
    try {
      const { fcmToken } = req.body;
      const userId = req.user.uid;

      await this.getDb().collection(COLLECTIONS.USERS).doc(userId).update({
        fcmToken,
        fcmTokenUpdatedAt: new Date()
      });

      logger.info(`FCM token updated for user ${userId}`);

      res.json({
        success: true,
        message: 'FCM token updated successfully'
      });
    } catch (error) {
      logger.error('Error updating FCM token:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Send test notification (admin only)
   */
  sendTestNotification = async (req, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { userId, title, message } = req.body;

      // Get user's FCM token
      const userDoc = await this.getDb().collection(COLLECTIONS.USERS).doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const user = userDoc.data();

      if (user.fcmToken) {
        await notificationService.sendPushNotification(user.fcmToken, {
          title,
          body: message,
          data: { type: 'test' }
        });
      }

      // Also save as in-app notification
      await this.getDb().collection(COLLECTIONS.NOTIFICATIONS).add({
        userId,
        type: 'test',
        title,
        message,
        data: { sentBy: req.user.uid },
        createdAt: new Date(),
        read: false
      });

      logger.info(`Test notification sent to user ${userId} by admin ${req.user.uid}`);

      res.json({
        success: true,
        message: 'Test notification sent successfully'
      });
    } catch (error) {
      logger.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

export default new NotificationController();