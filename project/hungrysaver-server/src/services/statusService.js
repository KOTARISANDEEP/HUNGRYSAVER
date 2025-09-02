import { STATUS_STAGES, VALID_TRANSITIONS, COLLECTIONS } from '../config/constants.js';
import { getFirestore } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

// Import services dynamically to avoid circular dependencies
let notificationService = null;
let auditService = null;
let volunteerRequestStatusService = null;
let volunteerDetailsService = null;

class StatusService {
  constructor() {
    // Don't initialize Firebase services in constructor
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase services (called lazily)
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      this.db = getFirestore();
      
      // Import services dynamically
      if (!notificationService) {
        import('./notificationService.js').then(module => {
          notificationService = module.default;
        });
      }
      
      if (!auditService) {
        import('./auditService.js').then(module => {
          auditService = module.default;
        });
      }
      
      if (!volunteerRequestStatusService) {
        try {
          const module = await import('./volunteerRequestStatusService.js');
          volunteerRequestStatusService = module.default;
          logger.info('VolunteerRequestStatusService loaded successfully');
        } catch (error) {
          logger.error('Failed to load VolunteerRequestStatusService:', error);
        }
      }
      
      if (!volunteerDetailsService) {
        try {
          const module = await import('./volunteerDetailsService.js');
          volunteerDetailsService = module.default;
          logger.info('VolunteerDetailsService loaded successfully');
        } catch (error) {
          logger.error('Failed to load VolunteerDetailsService:', error);
        }
      }
      
      this.initialized = true;
      logger.info('StatusService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize StatusService:', error);
      throw error;
    }
  }

  /**
   * Get database instance (with lazy initialization)
   */
  async getDb() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.db;
  }

  /**
   * Validate status transition
   */
  validateTransition(currentStatus, newStatus) {
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      const errorMsg = `Invalid status transition from ${currentStatus} to ${newStatus}. ` +
        `Allowed transitions: ${allowedTransitions.join(', ')}`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    return true;
  }

  /**
   * Update donation status with workflow validation
   */
  async updateDonationStatus(donationId, newStatus, volunteerId, additionalData = {}) {
    try {
      const db = await this.getDb();
      const donationRef = db.collection(COLLECTIONS.DONATIONS).doc(donationId);
      const donationDoc = await donationRef.get();
      
      if (!donationDoc.exists) {
        throw new Error('Donation not found');
      }
      
      const donation = donationDoc.data();
      const currentStatus = donation.status;
      
      // Validate transition
      this.validateTransition(currentStatus, newStatus);
      
      // Filter out undefined values BEFORE preparing update data
      const cleanAdditionalData = {};
      Object.keys(additionalData).forEach(key => {
        if (additionalData[key] !== undefined && additionalData[key] !== null) {
          cleanAdditionalData[key] = additionalData[key];
        }
      });
      
      // Prepare update data with CLEAN data
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
        ...cleanAdditionalData
      };
      
      // Add volunteer assignment for accepted status
      if (newStatus === STATUS_STAGES.ACCEPTED && volunteerId) {
        // Get volunteer details from users collection
        const volunteerDoc = await db.collection(COLLECTIONS.USERS).doc(volunteerId).get();
        if (volunteerDoc.exists) {
          const volunteerData = volunteerDoc.data();
          
          // Log the complete volunteer document for debugging
          logger.info(`Complete volunteer document for ${volunteerId}:`, volunteerData);
          logger.info(`Volunteer fields check:`, {
            firstName: volunteerData.firstName,
            contactNumber: volunteerData.contactNumber,
            email: volunteerData.email,
            hasFirstName: !!volunteerData.firstName,
            hasContactNumber: !!volunteerData.contactNumber,
            hasEmail: !!volunteerData.email
          });
          
          updateData.volunteerId = volunteerId;
          updateData.assignedTo = volunteerId; // Add this field for frontend compatibility
          updateData.volunteerName = volunteerData.firstName || 'Unknown';
          
          // Handle contact number with fallback
          if (volunteerData.contactNumber && volunteerData.contactNumber.trim() !== '') {
            updateData.volunteerContact = volunteerData.contactNumber;
          } else {
            // If no contact number, use email as fallback
            updateData.volunteerContact = volunteerData.email || 'No contact info';
            logger.warn(`Volunteer ${volunteerId} has no contact number, using email as fallback`);
          }
          
          updateData.acceptedAt = new Date();
          
          // Log volunteer details for debugging
          logger.info(`Volunteer details fetched for donation ${donationId}:`, {
            volunteerId,
            volunteerName: volunteerData.firstName,
            volunteerContact: volunteerData.contactNumber,
            volunteerEmail: volunteerData.email,
            allFields: Object.keys(volunteerData)
          });
        } else {
          throw new Error('Volunteer details not found. Please ensure your profile is complete.');
        }
      }
      
      // Add timestamps for other stages
      if (newStatus === STATUS_STAGES.PICKED) {
        updateData.pickedAt = new Date();
      } else if (newStatus === STATUS_STAGES.DELIVERED) {
        updateData.deliveredAt = new Date();
      } else if (newStatus === STATUS_STAGES.COMPLETED) {
        updateData.completedAt = new Date();
        // Handle feedback for completed status
        if (cleanAdditionalData.feedback) {
          updateData.feedback = cleanAdditionalData.feedback;
          logger.info(`Feedback added to donation ${donationId}: ${cleanAdditionalData.feedback}`);
        }
      }
      
      // Final safety check: Remove any undefined values before Firestore update
      const finalUpdateData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          finalUpdateData[key] = updateData[key];
        }
      });
      
      // Update donation
      await donationRef.update(finalUpdateData);
      
      // Log the final update data for debugging
      logger.info(`Donation ${donationId} updated with data:`, updateData);
      logger.info(`Donation ${donationId} volunteer fields:`, {
        volunteerName: updateData.volunteerName,
        volunteerContact: updateData.volunteerContact,
        volunteerId: updateData.volunteerId
      });
      
      // Create volunteer request status entry (if volunteer request status service is available)
      if (volunteerRequestStatusService) {
        await volunteerRequestStatusService.createVolunteerRequestStatus(
          donationId,
          volunteerId,
          newStatus,
          cleanAdditionalData
        );
      }
      
      // Log the status change (if audit service is available)
      if (auditService) {
        await auditService.logStatusChange(
          donationId,
          'donation',
          currentStatus,
          newStatus,
          volunteerId,
          cleanAdditionalData
        );
      }
      
      // Send notifications (if notification service is available)
      if (notificationService) {
        await this.sendStatusNotifications(donationId, newStatus, donation, volunteerId);
      }
      
      logger.info(`Donation ${donationId} status updated: ${currentStatus} → ${newStatus}`);
      
      return { success: true, newStatus, previousStatus: currentStatus };
    } catch (error) {
      logger.error('Error updating donation status:', error);
      throw error;
    }
  }

  /**
   * Update request status
   */
  async updateRequestStatus(requestId, newStatus, volunteerId, additionalData = {}) {
    try {
      const db = await this.getDb();
      const requestRef = db.collection(COLLECTIONS.REQUESTS).doc(requestId);
      const requestDoc = await requestRef.get();
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }
      
      const request = requestDoc.data();
      const currentStatus = request.status;
      
      // Validate transition
      this.validateTransition(currentStatus, newStatus);
      
      // Filter out undefined values BEFORE preparing update data
      const cleanAdditionalData = {};
      Object.keys(additionalData).forEach(key => {
        if (additionalData[key] !== undefined && additionalData[key] !== null) {
          cleanAdditionalData[key] = additionalData[key];
        }
      });
      
      // Prepare update data with CLEAN data
      const updateData = {
        status: newStatus,
        updatedAt: new Date(),
        ...cleanAdditionalData
      };
      
      if (newStatus === STATUS_STAGES.ACCEPTED && volunteerId) {
        // Get volunteer details from users collection
        const volunteerDoc = await db.collection(COLLECTIONS.USERS).doc(volunteerId).get();
        if (volunteerDoc.exists) {
          const volunteerData = volunteerDoc.data();
          
          // Log the complete volunteer document for debugging
          logger.info(`Complete volunteer document for request ${requestId}:`, volunteerData);
          logger.info(`Volunteer fields check:`, {
            firstName: volunteerData.firstName,
            contactNumber: volunteerData.contactNumber,
            email: volunteerData.email,
            hasFirstName: !!volunteerData.firstName,
            hasContactNumber: !!volunteerData.contactNumber,
            hasEmail: !!volunteerData.email
          });
          
          updateData.assignedTo = volunteerId;
          updateData.volunteerName = volunteerData.firstName || 'Unknown';
          
          // Handle contact number with fallback
          if (volunteerData.contactNumber && volunteerData.contactNumber.trim() !== '') {
            updateData.volunteerContact = volunteerData.contactNumber;
          } else {
            // If no contact number, use email as fallback
            updateData.volunteerContact = volunteerData.email || 'No contact info';
            logger.warn(`Volunteer ${volunteerId} has no contact number, using email as fallback`);
          }
          
          updateData.acceptedAt = new Date();
          
          // Log volunteer details for debugging
          logger.info(`Volunteer details fetched for request ${requestId}:`, {
            volunteerId,
            volunteerName: volunteerData.firstName,
            volunteerContact: volunteerData.contactNumber,
            volunteerEmail: volunteerData.email,
            allFields: Object.keys(volunteerData)
          });
        } else {
          updateData.assignedTo = volunteerId;
          updateData.acceptedAt = new Date();
          logger.warn(`Volunteer document not found for ID: ${volunteerId}`);
        }
      }
      
      // Final safety check: Remove any undefined values before Firestore update
      const finalUpdateData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined && updateData[key] !== null) {
          finalUpdateData[key] = updateData[key];
        }
      });
      
      // Update request
      await requestRef.update(finalUpdateData);
      
      // Log the final update data for debugging
      logger.info(`Request ${requestId} updated with data:`, updateData);
      logger.info(`Request ${requestId} volunteer fields:`, {
        volunteerName: updateData.volunteerName,
        volunteerContact: updateData.volunteerContact,
        assignedTo: updateData.assignedTo
      });
      
      // Create volunteer request status entry (if volunteer request status service is available)
      if (volunteerRequestStatusService) {
        await volunteerRequestStatusService.createVolunteerRequestStatus(
          requestId,
          volunteerId,
          newStatus,
          cleanAdditionalData
        );
      }
      
      // Log the status change (if audit service is available)
      if (auditService) {
        await auditService.logStatusChange(
          requestId,
          'request',
          currentStatus,
          newStatus,
          volunteerId,
          cleanAdditionalData
        );
      }
      
      // Send notifications (if notification service is available)
      if (notificationService) {
        await this.sendStatusNotifications(requestId, newStatus, request, volunteerId);
      }
      
      logger.info(`Request ${requestId} status updated: ${currentStatus} → ${newStatus}`);
      
      return { success: true, newStatus, previousStatus: currentStatus };
    } catch (error) {
      logger.error('Error updating request status:', error);
      throw error;
    }
  }

  /**
   * Send notifications based on status change
   */
  async sendStatusNotifications(itemId, newStatus, itemData, volunteerId) {
    try {
      if (!notificationService) return;
      
      switch (newStatus) {
        case STATUS_STAGES.ACCEPTED:
          await notificationService.sendDonationAcceptedNotification(itemData, volunteerId);
          break;
        case STATUS_STAGES.PICKED:
          await notificationService.sendDonationPickedNotification(itemData, volunteerId);
          break;
        case STATUS_STAGES.DELIVERED:
          await notificationService.sendDonationDeliveredNotification(itemData, volunteerId);
          break;
      }
    } catch (error) {
      logger.error('Error sending status notifications:', error);
      // Don't throw error here to avoid breaking the status update
    }
  }

  /**
   * Get status history for an item
   */
  async getStatusHistory(itemId, itemType) {
    try {
      const db = await this.getDb();
      const auditSnapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
        .where('itemId', '==', itemId)
        .where('itemType', '==', itemType)
        .orderBy('timestamp', 'asc')
        .get();
      
      return auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting status history:', error);
      throw error;
    }
  }

  /**
   * Get items by status and location
   */
  async getItemsByStatus(status, location, itemType = 'donation') {
    try {
      const db = await this.getDb();
      const collection = itemType === 'donation' ? COLLECTIONS.DONATIONS : COLLECTIONS.REQUESTS;
      
      let query = db.collection(collection).where('status', '==', status);
      
      if (location) {
        query = query.where('location_lowercase', '==', location.toLowerCase());
      }
      
      const snapshot = await query.orderBy('createdAt', 'desc').get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting items by status:', error);
      throw error;
    }
  }
}

export default new StatusService();