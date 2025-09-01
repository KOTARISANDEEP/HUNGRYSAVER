import { COLLECTIONS } from '../config/constants.js';
import { getFirestore } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

class VolunteerRequestStatusService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firestore connection
   */
  initialize() {
    if (!this.initialized) {
      this.db = getFirestore();
      this.initialized = true;
    }
  }

  /**
   * Get Firestore instance with lazy initialization
   */
  getDb() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Create a new volunteer request status entry
   */
  async createVolunteerRequestStatus(donationId, volunteerId, status, additionalData = {}) {
    try {
      const db = this.getDb();
      
      // Get volunteer details from users collection
      const volunteerDoc = await db.collection(COLLECTIONS.USERS).doc(volunteerId).get();
      if (!volunteerDoc.exists) {
        throw new Error('Volunteer not found');
      }
      
      const volunteerData = volunteerDoc.data();
      
      // Create volunteer request status document
      const volunteerRequestStatusData = {
        donationId,
        volunteerId,
        volunteerName: volunteerData.firstName,
        volunteerContact: volunteerData.contactNumber,
        status,
        timestamp: new Date(),
        ...additionalData
      };
      
      const docRef = await db.collection(COLLECTIONS.VOLUNTEER_REQUESTS_STATUS).add(volunteerRequestStatusData);
      
      logger.info(`Created volunteer request status entry: ${docRef.id} for donation ${donationId}`);
      
      return {
        id: docRef.id,
        ...volunteerRequestStatusData
      };
    } catch (error) {
      logger.error('Error creating volunteer request status:', error);
      throw error;
    }
  }

  /**
   * Update volunteer request status
   */
  async updateVolunteerRequestStatus(donationId, volunteerId, newStatus, additionalData = {}) {
    try {
      const db = this.getDb();
      
      // Find existing entry for this donation and volunteer
      const querySnapshot = await db.collection(COLLECTIONS.VOLUNTEER_REQUESTS_STATUS)
        .where('donationId', '==', donationId)
        .where('volunteerId', '==', volunteerId)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        // Create new entry if none exists
        return await this.createVolunteerRequestStatus(donationId, volunteerId, newStatus, additionalData);
      }
      
      // Update existing entry
      const docRef = querySnapshot.docs[0].ref;
      const updateData = {
        status: newStatus,
        timestamp: new Date(),
        ...additionalData
      };
      
      await docRef.update(updateData);
      
      logger.info(`Updated volunteer request status for donation ${donationId}: ${newStatus}`);
      
      return {
        id: docRef.id,
        ...updateData
      };
    } catch (error) {
      logger.error('Error updating volunteer request status:', error);
      throw error;
    }
  }

  /**
   * Get volunteer request status history for a donation
   */
  async getVolunteerRequestStatusHistory(donationId) {
    try {
      const db = this.getDb();
      
      const querySnapshot = await db.collection(COLLECTIONS.VOLUNTEER_REQUESTS_STATUS)
        .where('donationId', '==', donationId)
        .orderBy('timestamp', 'desc')
        .get();
      
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return history;
    } catch (error) {
      logger.error('Error getting volunteer request status history:', error);
      throw error;
    }
  }

  /**
   * Get volunteer request status history for a volunteer
   */
  async getVolunteerRequestStatusByVolunteer(volunteerId) {
    try {
      const db = this.getDb();
      
      const querySnapshot = await db.collection(COLLECTIONS.VOLUNTEER_REQUESTS_STATUS)
        .where('volunteerId', '==', volunteerId)
        .orderBy('timestamp', 'desc')
        .get();
      
      const history = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return history;
    } catch (error) {
      logger.error('Error getting volunteer request status by volunteer:', error);
      throw error;
    }
  }

  /**
   * Get current volunteer request status for a donation
   */
  async getCurrentVolunteerRequestStatus(donationId) {
    try {
      const db = this.getDb();
      
      const querySnapshot = await db.collection(COLLECTIONS.VOLUNTEER_REQUESTS_STATUS)
        .where('donationId', '==', donationId)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    } catch (error) {
      logger.error('Error getting current volunteer request status:', error);
      throw error;
    }
  }
}

export default new VolunteerRequestStatusService();
