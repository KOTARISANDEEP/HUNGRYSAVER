import { getMessaging } from '../config/firebase.js';
import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS, NOTIFICATION_TYPES, MOTIVATIONAL_MESSAGES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// Import emailService dynamically to avoid circular dependencies
let emailService = null;

class NotificationService {
  constructor() {
    // Don't initialize Firebase services in constructor
    // They will be initialized when first accessed
    this.db = null;
    this.messaging = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase services (called lazily)
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      this.db = getFirestore();
      
      try {
        this.messaging = getMessaging();
      } catch (error) {
        logger.warn('FCM messaging not available:', error.message);
        this.messaging = null;
      }
      
      // Import email service dynamically
      if (!emailService) {
        import('./emailService.js').then(module => {
          emailService = module.default;
        });
      }
      
      this.initialized = true;
      logger.info('NotificationService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize NotificationService:', error);
      throw error;
    }
  }

  /**
   * Get database instance (with lazy initialization)
   */
  getDb() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Send notification to volunteers about new donation
   */
  async notifyVolunteersNewDonation(donation, volunteers) {
    try {
      const db = this.getDb();
      
      const notifications = volunteers.map(volunteer => ({
        userId: volunteer.id,
        type: NOTIFICATION_TYPES.NEW_DONATION,
        title: `New donation in ${donation.location}!`,
        message: `${donation.initiative.replace('-', ' ')} donation available for pickup`,
        data: {
          donationId: donation.id,
          initiative: donation.initiative,
          location: donation.location,
          donorName: donation.donorName
        },
        createdAt: new Date(),
        read: false
      }));

      // Save notifications to database
      const batch = db.batch();
      notifications.forEach(notification => {
        const notificationRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();
        batch.set(notificationRef, notification);
      });
      await batch.commit();

      // Send push notifications if FCM is available
      if (this.messaging) {
        const fcmTokens = volunteers
          .filter(v => v.fcmToken)
          .map(v => v.fcmToken);

        if (fcmTokens.length > 0) {
          await this.sendPushNotification(fcmTokens, {
            title: `New donation in ${donation.location}!`,
            body: `${donation.initiative.replace('-', ' ')} donation available`,
            data: {
              type: NOTIFICATION_TYPES.NEW_DONATION,
              donationId: donation.id
            }
          });
        }
      }

      logger.info(`Notified ${volunteers.length} volunteers about new donation ${donation.id}`);
    } catch (error) {
      logger.error('Error notifying volunteers about new donation:', error);
      throw error;
    }
  }

  /**
   * Send notification to volunteers about new request
   */
  async notifyVolunteersNewRequest(request, volunteers) {
    try {
      const db = this.getDb();
      
      const notifications = volunteers.map(volunteer => ({
        userId: volunteer.id,
        type: NOTIFICATION_TYPES.NEW_REQUEST,
        title: `New request in ${request.location}!`,
        message: `${request.initiative.replace('-', ' ')} support needed`,
        data: {
          requestId: request.id,
          initiative: request.initiative,
          location: request.location,
          beneficiaryName: request.beneficiaryName
        },
        createdAt: new Date(),
        read: false
      }));

      // Save notifications to database
      const batch = db.batch();
      notifications.forEach(notification => {
        const notificationRef = db.collection(COLLECTIONS.NOTIFICATIONS).doc();
        batch.set(notificationRef, notification);
      });
      await batch.commit();

      // Send push notifications if FCM is available
      if (this.messaging) {
        const fcmTokens = volunteers
          .filter(v => v.fcmToken)
          .map(v => v.fcmToken);

        if (fcmTokens.length > 0) {
          await this.sendPushNotification(fcmTokens, {
            title: `New request in ${request.location}!`,
            body: `${request.initiative.replace('-', ' ')} support needed`,
            data: {
              type: NOTIFICATION_TYPES.NEW_REQUEST,
              requestId: request.id
            }
          });
        }
      }

      logger.info(`Notified ${volunteers.length} volunteers about new request ${request.id}`);
    } catch (error) {
      logger.error('Error notifying volunteers about new request:', error);
      throw error;
    }
  }

  /**
   * Send notification when donation is accepted
   */
  async sendDonationAcceptedNotification(donation, volunteerId) {
    try {
      const db = this.getDb();
      
      // Get volunteer details
      const volunteerDoc = await db.collection(COLLECTIONS.USERS).doc(volunteerId).get();
      const volunteer = volunteerDoc.data();

      // Notify donor
      const notification = {
        userId: donation.userId,
        type: NOTIFICATION_TYPES.DONATION_ACCEPTED,
        title: 'Donation Accepted!',
        message: `${volunteer.firstName} has accepted your donation and will pick it up soon`,
        data: {
          donationId: donation.id,
          volunteerId,
          volunteerName: volunteer.firstName
        },
        createdAt: new Date(),
        read: false
      };

      await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification);

      // Send email notification if service is available
      if (emailService) {
        await emailService.sendDonationAcceptedEmail(donation, volunteer);
      }

      logger.info(`Sent donation accepted notification for ${donation.id}`);
    } catch (error) {
      logger.error('Error sending donation accepted notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when donation is picked up
   */
  async sendDonationPickedNotification(donation, volunteerId) {
    try {
      const db = this.getDb();
      const volunteerDoc = await db.collection(COLLECTIONS.USERS).doc(volunteerId).get();
      const volunteer = volunteerDoc.data();

      // Notify donor
      const notification = {
        userId: donation.userId,
        type: NOTIFICATION_TYPES.DONATION_PICKED,
        title: 'Donation Picked Up!',
        message: `${volunteer.firstName} has picked up your donation and is on the way to deliver it`,
        data: {
          donationId: donation.id,
          volunteerId,
          volunteerName: volunteer.firstName
        },
        createdAt: new Date(),
        read: false
      };

      await db.collection(COLLECTIONS.NOTIFICATIONS).add(notification);

      logger.info(`Sent donation picked notification for ${donation.id}`);
    } catch (error) {
      logger.error('Error sending donation picked notification:', error);
      throw error;
    }
  }

  /**
   * Send notification when donation is delivered
   */
  async sendDonationDeliveredNotification(donation, volunteerId) {
    try {
      const db = this.getDb();
      const volunteerDoc = await db.collection(COLLECTIONS.USERS).doc(volunteerId).get();
      const volunteer = volunteerDoc.data();

      // Generate motivational message
      const motivationalMessage = this.generateMotivationalMessage(
        donation.location,
        donation.estimatedBeneficiaries || 1
      );

      // Notify donor
      const donorNotification = {
        userId: donation.userId,
        type: NOTIFICATION_TYPES.DONATION_DELIVERED,
        title: 'Delivery Complete! 🎉',
        message: motivationalMessage,
        data: {
          donationId: donation.id,
          volunteerId,
          volunteerName: volunteer.firstName
        },
        createdAt: new Date(),
        read: false
      };

      // Notify volunteer
      const volunteerNotification = {
        userId: volunteerId,
        type: NOTIFICATION_TYPES.DONATION_DELIVERED,
        title: 'Mission Accomplished! 🌟',
        message: `You've successfully delivered the donation. ${motivationalMessage}`,
        data: {
          donationId: donation.id,
          impact: donation.estimatedBeneficiaries || 1
        },
        createdAt: new Date(),
        read: false
      };

      // Save both notifications
      const batch = db.batch();
      batch.set(db.collection(COLLECTIONS.NOTIFICATIONS).doc(), donorNotification);
      batch.set(db.collection(COLLECTIONS.NOTIFICATIONS).doc(), volunteerNotification);
      await batch.commit();

      // Send email notifications if service is available
      if (emailService) {
        await emailService.sendDonationDeliveredEmail(donation, volunteer, motivationalMessage);
      }

      logger.info(`Sent donation delivered notifications for ${donation.id}`);
    } catch (error) {
      logger.error('Error sending donation delivered notification:', error);
      throw error;
    }
  }

  /**
   * Send push notification via FCM
   */
  async sendPushNotification(tokens, payload) {
    try {
      if (!this.messaging) {
        logger.warn('FCM messaging not available, skipping push notification');
        return;
      }

      if (!Array.isArray(tokens)) {
        tokens = [tokens];
      }

      const message = {
        notification: {
          title: payload.title,
          body: payload.body
        },
        data: payload.data || {},
        tokens: tokens.filter(token => token) // Remove null/undefined tokens
      };

      if (message.tokens.length === 0) {
        logger.warn('No valid FCM tokens provided');
        return;
      }

      const response = await this.messaging.sendMulticast(message);
      
      logger.info(`FCM notification sent: ${response.successCount} successful, ${response.failureCount} failed`);
      
      return response;
    } catch (error) {
      logger.error('Error sending push notification:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Generate motivational message
   */
  generateMotivationalMessage(location, beneficiaryCount) {
    const template = MOTIVATIONAL_MESSAGES[
      Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
    ];
    
    return template
      .replace('{location}', location.charAt(0).toUpperCase() + location.slice(1))
      .replace('{count}', beneficiaryCount);
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, limit = 20) {
    try {
      const db = this.getDb();
      const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId) {
    try {
      const db = this.getDb();
      await db.collection(COLLECTIONS.NOTIFICATIONS)
        .doc(notificationId)
        .update({ read: true, readAt: new Date() });
      
      logger.info(`Marked notification ${notificationId} as read`);
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const db = this.getDb();
      const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS)
        .where('userId', '==', userId)
        .where('read', '==', false)
        .get();

      return snapshot.size;
    } catch (error) {
      logger.error('Error getting unread notification count:', error);
      throw error;
    }
  }
}

export default new NotificationService();