import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS, STATUS_STAGES } from '../config/constants.js';
import locationService from '../services/locationService.js';
import auditService from '../services/auditService.js';
import emailService from '../services/emailService.js';
import { logger } from '../utils/logger.js';

class VolunteerController {
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
   * Get volunteer profile
   */
  getVolunteerProfile = async (req, res) => {
    try {
      const { id } = req.params;

      // Check if user is requesting their own profile or is admin
      if (req.user.uid !== id && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const volunteerDoc = await this.getDb().collection(COLLECTIONS.USERS).doc(id).get();

      if (!volunteerDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Volunteer not found'
        });
      }

      const volunteer = volunteerDoc.data();

      // Remove sensitive information
      delete volunteer.fcmToken;

      res.json({
        success: true,
        data: { id: volunteerDoc.id, ...volunteer }
      });
    } catch (error) {
      logger.error('Error getting volunteer profile:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update volunteer profile
   */
  updateVolunteerProfile = async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if user is updating their own profile
      if (req.user.uid !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Validate location if provided
      if (updates.location) {
        updates.location = locationService.validateLocation(updates.location);
      }

      // Add update timestamp
      updates.updatedAt = new Date();

      await this.getDb().collection(COLLECTIONS.USERS).doc(id).update(updates);

      // Log the update
      await auditService.logUserAction(id, 'profile_updated', updates);

      logger.info(`Volunteer profile updated: ${id}`);

      res.json({
        success: true,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Error updating volunteer profile:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get volunteers by location
   */
  getVolunteersByLocation = async (req, res) => {
    try {
      const { location } = req.params;
      const { status = 'approved', limit = 20, offset = 0 } = req.query;

      const standardizedLocation = locationService.validateLocation(location);

      const snapshot = await this.getDb().collection(COLLECTIONS.USERS)
        .where('userType', '==', 'volunteer')
        .where('location', '==', standardizedLocation)
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const volunteers = snapshot.docs.map(doc => {
        const data = doc.data();
        // Remove sensitive information
        delete data.fcmToken;
        return { id: doc.id, ...data };
      });

      res.json({
        success: true,
        data: volunteers,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: volunteers.length
        }
      });
    } catch (error) {
      logger.error('Error getting volunteers by location:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get volunteer assignments
   */
  getVolunteerAssignments = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      // Check if user is requesting their own assignments or is admin
      if (req.user.uid !== id && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get donations assigned to volunteer
      let donationsQuery = this.getDb().collection(COLLECTIONS.DONATIONS)
        .where('assignedTo', '==', id);

      if (status) {
        donationsQuery = donationsQuery.where('status', '==', status);
      }

      // Get requests assigned to volunteer
      let requestsQuery = this.getDb().collection(COLLECTIONS.REQUESTS)
        .where('assignedTo', '==', id);

      if (status) {
        requestsQuery = requestsQuery.where('status', '==', status);
      }

      const [donationsSnapshot, requestsSnapshot] = await Promise.all([
        donationsQuery.orderBy('createdAt', 'desc').get(),
        requestsQuery.orderBy('createdAt', 'desc').get()
      ]);

      const donations = donationsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'donation',
        ...doc.data()
      }));

      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'request',
        ...doc.data()
      }));

      // Combine and sort by creation date
      const allAssignments = [...donations, ...requests].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedAssignments = allAssignments.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedAssignments,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: allAssignments.length
        }
      });
    } catch (error) {
      logger.error('Error getting volunteer assignments:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get volunteer statistics
   */
  getVolunteerStats = async (req, res) => {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      // Check if user is requesting their own stats or is admin
      if (req.user.uid !== id && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get completed donations and requests
      const [donationsSnapshot, requestsSnapshot] = await Promise.all([
        this.getDb().collection(COLLECTIONS.DONATIONS)
          .where('assignedTo', '==', id)
          .where('status', '==', STATUS_STAGES.DELIVERED)
          .where('deliveredAt', '>=', startDate)
          .get(),
        this.getDb().collection(COLLECTIONS.REQUESTS)
          .where('assignedTo', '==', id)
          .where('status', '==', STATUS_STAGES.DELIVERED)
          .where('deliveredAt', '>=', startDate)
          .get()
      ]);

      const completedDonations = donationsSnapshot.size;
      const completedRequests = requestsSnapshot.size;
      const totalCompleted = completedDonations + completedRequests;

      // Calculate estimated people helped
      const estimatedPeopleHelped = donationsSnapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        return total + (data.estimatedBeneficiaries || 1);
      }, 0) + requestsSnapshot.docs.reduce((total, doc) => {
        const data = doc.data();
        return total + (data.estimatedBeneficiaries || 1);
      }, 0);

      res.json({
        success: true,
        data: {
          period: `Last ${days} days`,
          completedDonations,
          completedRequests,
          totalCompleted,
          estimatedPeopleHelped,
          averagePerDay: (totalCompleted / parseInt(days)).toFixed(1)
        }
      });
    } catch (error) {
      logger.error('Error getting volunteer stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Approve volunteer (admin only)
   */
  approveVolunteer = async (req, res) => {
    try {
      const { id } = req.params;

      const volunteerDoc = await this.getDb().collection(COLLECTIONS.USERS).doc(id).get();

      if (!volunteerDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Volunteer not found'
        });
      }

      const volunteer = volunteerDoc.data();

      if (volunteer.userType !== 'volunteer') {
        return res.status(400).json({
          success: false,
          message: 'User is not a volunteer'
        });
      }

      if (volunteer.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Volunteer is already approved'
        });
      }

      // Update volunteer status
      await this.getDb().collection(COLLECTIONS.USERS).doc(id).update({
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: req.user.uid
      });

      // Send welcome email
      try {
        await emailService.sendVolunteerWelcomeEmail(volunteer);
      } catch (emailError) {
        logger.error('Error sending welcome email:', emailError);
        // Don't fail the approval if email fails
      }

      // Log the approval
      await auditService.logUserAction(req.user.uid, 'volunteer_approved', {
        volunteerId: id,
        volunteerEmail: volunteer.email,
        location: volunteer.location
      });

      logger.info(`Volunteer approved: ${id} by ${req.user.uid}`);

      res.json({
        success: true,
        message: 'Volunteer approved successfully'
      });
    } catch (error) {
      logger.error('Error approving volunteer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Reject volunteer (admin only)
   */
  rejectVolunteer = async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const volunteerDoc = await this.getDb().collection(COLLECTIONS.USERS).doc(id).get();

      if (!volunteerDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Volunteer not found'
        });
      }

      const volunteer = volunteerDoc.data();

      if (volunteer.userType !== 'volunteer') {
        return res.status(400).json({
          success: false,
          message: 'User is not a volunteer'
        });
      }

      // Update volunteer status
      await this.getDb().collection(COLLECTIONS.USERS).doc(id).update({
        status: 'rejected',
        rejectedAt: new Date(),
        rejectedBy: req.user.uid,
        rejectionReason: reason || 'No reason provided'
      });

      // Log the rejection
      await auditService.logUserAction(req.user.uid, 'volunteer_rejected', {
        volunteerId: id,
        volunteerEmail: volunteer.email,
        reason: reason || 'No reason provided'
      });

      logger.info(`Volunteer rejected: ${id} by ${req.user.uid}`);

      res.json({
        success: true,
        message: 'Volunteer rejected successfully'
      });
    } catch (error) {
      logger.error('Error rejecting volunteer:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get pending volunteers (admin only)
   */
  getPendingVolunteers = async (req, res) => {
    try {
      const { limit = 20, offset = 0 } = req.query;

      const snapshot = await this.getDb().collection(COLLECTIONS.USERS)
        .where('userType', '==', 'volunteer')
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'asc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const volunteers = snapshot.docs.map(doc => {
        const data = doc.data();
        // Remove sensitive information
        delete data.fcmToken;
        return { id: doc.id, ...data };
      });

      res.json({
        success: true,
        data: volunteers,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: volunteers.length
        }
      });
    } catch (error) {
      logger.error('Error getting pending volunteers:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

export default new VolunteerController();