import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS, STATUS_STAGES } from '../config/constants.js';
import locationService from '../services/locationService.js';
import statusService from '../services/statusService.js';
import matchingService from '../services/matchingService.js';
import notificationService from '../services/notificationService.js';
import emailService from '../services/emailService.js';
import auditService from '../services/auditService.js';
import { logger } from '../utils/logger.js';

class DonationController {
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
   * Create new donation
   */
  createDonation = async (req, res) => {
    try {
      const { initiative, location, address, donorName, donorContact, description, details } = req.body;
      const userId = req.user.uid;

      // Validate and standardize location
      const standardizedLocation = locationService.validateLocation(location);

      // Create donation document
      const donationData = {
        userId,
        initiative,
        location: standardizedLocation,
        location_lowercase: standardizedLocation,
        address,
        donorName,
        donorContact,
        description,
        details: details || {},
        status: STATUS_STAGES.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const donationRef = await this.getDb().collection(COLLECTIONS.DONATIONS).add(donationData);
      const donationId = donationRef.id;

      // Log the creation
      await auditService.logUserAction(userId, 'donation_created', {
        donationId,
        initiative,
        location: standardizedLocation
      });

      // Find volunteers in the same location
      const volunteers = await matchingService.findVolunteersByLocation(standardizedLocation);
      
      if (volunteers.length > 0) {
        // Send email notifications to volunteers
        await emailService.sendDonationNotificationToVolunteers(
          { id: donationId, ...donationData },
          volunteers
        );

        // Also send push notifications
        await notificationService.notifyVolunteersNewDonation(
          { id: donationId, ...donationData },
          volunteers
        );
      }

      logger.info(`New donation created: ${donationId} in ${standardizedLocation}, notified ${volunteers.length} volunteers`);

      res.status(201).json({
        success: true,
        data: {
          id: donationId,
          ...donationData
        },
        message: 'Donation created successfully',
        volunteersNotified: volunteers.length
      });
    } catch (error) {
      logger.error('Error creating donation:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get donations by location
   */
  getDonationsByLocation = async (req, res) => {
    try {
      const { location } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      const standardizedLocation = locationService.validateLocation(location);

      let query = this.getDb().collection(COLLECTIONS.DONATIONS)
        .where('location_lowercase', '==', standardizedLocation);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const donations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: donations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: donations.length
        }
      });
    } catch (error) {
      logger.error('Error getting donations by location:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get user's donations
   */
  getUserDonations = async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check if user is requesting their own donations or is admin
      if (req.user.uid !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const snapshot = await this.getDb().collection(COLLECTIONS.DONATIONS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const donations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: donations,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: donations.length
        }
      });
    } catch (error) {
      logger.error('Error getting user donations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get donation by ID
   */
  getDonationById = async (req, res) => {
    try {
      const { id } = req.params;

      const donationDoc = await this.getDb().collection(COLLECTIONS.DONATIONS).doc(id).get();

      if (!donationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Donation not found'
        });
      }

      const donation = { id: donationDoc.id, ...donationDoc.data() };

      // Check if user has access to this donation
      if (req.user.uid !== donation.userId && 
          req.user.uid !== donation.assignedTo && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: donation
      });
    } catch (error) {
      logger.error('Error getting donation by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update donation status
   */
  updateDonationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, volunteerId } = req.body;
      const userId = req.user.uid;

      // Get donation to verify permissions
      const donationDoc = await this.getDb().collection(COLLECTIONS.DONATIONS).doc(id).get();
      
      if (!donationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Donation not found'
        });
      }

      const donation = donationDoc.data();

      // Check permissions
      if (status === STATUS_STAGES.ACCEPTED) {
        // Any volunteer can accept
        if (req.user.userType !== 'volunteer') {
          return res.status(403).json({
            success: false,
            message: 'Only volunteers can accept donations'
          });
        }
      } else {
        // Only assigned volunteer can update other statuses
        if (donation.assignedTo !== userId && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Only assigned volunteer can update this donation'
          });
        }
      }

      // Update status using status service
      const result = await statusService.updateDonationStatus(
        id, 
        status, 
        volunteerId || userId,
        { updatedBy: userId }
      );

      res.json({
        success: true,
        data: result,
        message: `Donation status updated to ${status}`
      });
    } catch (error) {
      logger.error('Error updating donation status:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Delete donation (only if pending)
   */
  deleteDonation = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      const donationDoc = await this.getDb().collection(COLLECTIONS.DONATIONS).doc(id).get();
      
      if (!donationDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Donation not found'
        });
      }

      const donation = donationDoc.data();

      // Check if user owns the donation
      if (donation.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Only allow deletion if status is pending
      if (donation.status !== STATUS_STAGES.PENDING) {
        return res.status(400).json({
          success: false,
          message: 'Can only delete pending donations'
        });
      }

      await this.getDb().collection(COLLECTIONS.DONATIONS).doc(id).delete();

      // Log the deletion
      await auditService.logUserAction(userId, 'donation_deleted', {
        donationId: id,
        initiative: donation.initiative,
        location: donation.location_lowercase
      });

      logger.info(`Donation deleted: ${id} by ${userId}`);

      res.json({
        success: true,
        message: 'Donation deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting donation:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get donation statistics
   */
  getDonationStats = async (req, res) => {
    try {
      const { location, days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      let query = this.getDb().collection(COLLECTIONS.DONATIONS)
        .where('createdAt', '>=', startDate);

      if (location) {
        const standardizedLocation = locationService.validateLocation(location);
        query = query.where('location_lowercase', '==', standardizedLocation);
      }

      const snapshot = await query.get();
      const donations = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: donations.length,
        byStatus: {},
        byInitiative: {},
        byLocation: {},
        completionRate: 0
      };

      donations.forEach(donation => {
        // Count by status
        stats.byStatus[donation.status] = (stats.byStatus[donation.status] || 0) + 1;
        
        // Count by initiative
        stats.byInitiative[donation.initiative] = (stats.byInitiative[donation.initiative] || 0) + 1;
        
        // Count by location
        stats.byLocation[donation.location_lowercase] = (stats.byLocation[donation.location_lowercase] || 0) + 1;
      });

      // Calculate completion rate
      const completed = stats.byStatus[STATUS_STAGES.DELIVERED] || 0;
      stats.completionRate = donations.length > 0 ? (completed / donations.length * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: stats,
        period: `Last ${days} days`
      });
    } catch (error) {
      logger.error('Error getting donation stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

export default new DonationController();