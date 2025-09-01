import { COLLECTIONS } from '../config/constants.js';
import { getFirestore } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

class VolunteerDetailsService {
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
   * Create volunteer details when accepting a donation
   */
  async createVolunteerDetails(donationId, volunteerId, volunteerData) {
    try {
      const db = this.getDb();
      
      const volunteerDetailsData = {
        donationId,
        volunteerId,
        volunteerName: volunteerData.volunteerName,
        volunteerContact: volunteerData.volunteerContact,
        expectedArrivalTime: volunteerData.expectedArrivalTime,
        createdAt: new Date(),
        status: 'accepted'
      };
      
      const docRef = await db.collection(COLLECTIONS.VOLUNTEER_DETAILS).add(volunteerDetailsData);
      
      logger.info(`Created volunteer details: ${docRef.id} for donation ${donationId}`);
      
      return {
        id: docRef.id,
        ...volunteerDetailsData
      };
    } catch (error) {
      logger.error('Error creating volunteer details:', error);
      throw error;
    }
  }

  /**
   * Get volunteer details for a specific donation
   */
  async getVolunteerDetailsByDonationId(donationId) {
    try {
      const db = this.getDb();
      
      const querySnapshot = await db.collection(COLLECTIONS.VOLUNTEER_DETAILS)
        .where('donationId', '==', donationId)
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
      logger.error('Error getting volunteer details:', error);
      throw error;
    }
  }

  /**
   * Update volunteer details
   */
  async updateVolunteerDetails(donationId, volunteerId, updateData) {
    try {
      const db = this.getDb();
      
      const querySnapshot = await db.collection(COLLECTIONS.VOLUNTEER_DETAILS)
        .where('donationId', '==', donationId)
        .where('volunteerId', '==', volunteerId)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        throw new Error('Volunteer details not found');
      }
      
      const docRef = querySnapshot.docs[0].ref;
      await docRef.update({
        ...updateData,
        updatedAt: new Date()
      });
      
      logger.info(`Updated volunteer details for donation ${donationId}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error updating volunteer details:', error);
      throw error;
    }
  }

  /**
   * Delete volunteer details
   */
  async deleteVolunteerDetails(donationId) {
    try {
      const db = this.getDb();
      
      const querySnapshot = await db.collection(COLLECTIONS.VOLUNTEER_DETAILS)
        .where('donationId', '==', donationId)
        .get();
      
      const batch = db.batch();
      querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      logger.info(`Deleted volunteer details for donation ${donationId}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error deleting volunteer details:', error);
      throw error;
    }
  }
}

export default new VolunteerDetailsService();
