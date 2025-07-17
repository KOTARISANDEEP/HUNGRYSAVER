import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS, STATUS_STAGES } from '../config/constants.js';
import locationService from '../services/locationService.js';
import statusService from '../services/statusService.js';
import matchingService from '../services/matchingService.js';
import notificationService from '../services/notificationService.js';
import auditService from '../services/auditService.js';
import { logger } from '../utils/logger.js';

class RequestController {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firestore database connection
   */
  initialize() {
    if (!this.initialized) {
      this.db = getFirestore();
      this.initialized = true;
    }
  }

  /**
   * Get Firestore database instance with lazy initialization
   */
  getDb() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Create new community request
   */
  createRequest = async (req, res) => {
    try {
      const { initiative, location, address, beneficiaryName, beneficiaryContact, description, details } = req.body;
      const userId = req.user.uid;

      // Validate and standardize location
      const standardizedLocation = locationService.validateLocation(location);

      // Create request document
      const requestData = {
        ...req.body, // Spread all fields from the request body (initiative-specific fields)
        userId,
        initiative,
        location: standardizedLocation,
        location_lowercase: standardizedLocation,
        address,
        beneficiaryName,
        beneficiaryContact,
        description,
        details: details || {},
        status: STATUS_STAGES.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const requestRef = await this.getDb().collection(COLLECTIONS.REQUESTS).add(requestData);
      const requestId = requestRef.id;

      // Log the creation
      await auditService.logUserAction(userId, 'request_created', {
        requestId,
        initiative,
        location: standardizedLocation
      });

      // Find and notify volunteers
      const volunteers = await matchingService.findVolunteersByLocation(standardizedLocation);
      if (volunteers.length > 0) {
        await notificationService.notifyVolunteersNewRequest(
          { id: requestId, ...requestData },
          volunteers
        );
      }

      logger.info(`New request created: ${requestId} in ${standardizedLocation}`);

      res.status(201).json({
        success: true,
        data: {
          id: requestId,
          ...requestData
        },
        message: 'Request created successfully',
        volunteersNotified: volunteers.length
      });
    } catch (error) {
      logger.error('Error creating request:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get requests by location
   */
  getRequestsByLocation = async (req, res) => {
    try {
      const { location } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      const standardizedLocation = locationService.validateLocation(location);

      let query = this.getDb().collection(COLLECTIONS.REQUESTS)
        .where('location_lowercase', '==', standardizedLocation);

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: requests,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: requests.length
        }
      });
    } catch (error) {
      logger.error('Error getting requests by location:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get user's requests
   */
  getUserRequests = async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Check if user is requesting their own requests or is admin
      if (req.user.uid !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const snapshot = await this.getDb().collection(COLLECTIONS.REQUESTS)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: requests,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: requests.length
        }
      });
    } catch (error) {
      logger.error('Error getting user requests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get request by ID
   */
  getRequestById = async (req, res) => {
    try {
      const { id } = req.params;

      const requestDoc = await this.getDb().collection(COLLECTIONS.REQUESTS).doc(id).get();

      if (!requestDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      const request = { id: requestDoc.id, ...requestDoc.data() };

      // Check if user has access to this request
      if (req.user.uid !== request.userId && 
          req.user.uid !== request.assignedTo && 
          req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: request
      });
    } catch (error) {
      logger.error('Error getting request by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Update request status
   */
  updateRequestStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, volunteerId } = req.body;
      const userId = req.user.uid;

      // Get request to verify permissions
      const requestDoc = await this.getDb().collection(COLLECTIONS.REQUESTS).doc(id).get();
      
      if (!requestDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      const request = requestDoc.data();

      // Check permissions
      if (status === STATUS_STAGES.ACCEPTED) {
        // Any volunteer can accept
        if (req.user.userType !== 'volunteer') {
          return res.status(403).json({
            success: false,
            message: 'Only volunteers can accept requests'
          });
        }
      } else {
        // Only assigned volunteer can update other statuses
        if (request.assignedTo !== userId && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Only assigned volunteer can update this request'
          });
        }
      }

      // Update status using status service
      const result = await statusService.updateRequestStatus(
        id, 
        status, 
        volunteerId || userId,
        { updatedBy: userId }
      );

      res.json({
        success: true,
        data: result,
        message: `Request status updated to ${status}`
      });
    } catch (error) {
      logger.error('Error updating request status:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Delete request (only if pending)
   */
  deleteRequest = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.uid;

      const requestDoc = await this.getDb().collection(COLLECTIONS.REQUESTS).doc(id).get();
      
      if (!requestDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Request not found'
        });
      }

      const request = requestDoc.data();

      // Check if user owns the request
      if (request.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Only allow deletion if status is pending
      if (request.status !== STATUS_STAGES.PENDING) {
        return res.status(400).json({
          success: false,
          message: 'Can only delete pending requests'
        });
      }

      await this.getDb().collection(COLLECTIONS.REQUESTS).doc(id).delete();

      // Log the deletion
      await auditService.logUserAction(userId, 'request_deleted', {
        requestId: id,
        initiative: request.initiative,
        location: request.location_lowercase
      });

      logger.info(`Request deleted: ${id} by ${userId}`);

      res.json({
        success: true,
        message: 'Request deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting request:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

export default new RequestController();