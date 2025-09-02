import admin, { getFirestore, initializeFirebase } from '../config/firebase.js';
import { logger } from '../utils/logger.js';

// Ensure Firebase is initialized once and reuse db instance
const db = getFirestore();

// Import notification service
let notificationService = null;
const getNotificationService = async () => {
  if (!notificationService) {
    const { default: NotificationServiceInstance } = await import('../services/notificationService.js');
    notificationService = NotificationServiceInstance;
  }
  return notificationService;
};

/**
 * Community Support Request Status Enums:
 * - pending: New request; visible only to volunteers in same city (existing status)
 * - VOLUNTEER_ACCEPTED: Volunteer took the task (new status)
 * - REACHED_COMMUNITY: Volunteer reached the address (new status)
 * - APPROVED_BY_VOLUNTEER: Visible to all donors (new status)
 * - REJECTED_BY_VOLUNTEER: Request closed (new status)
 * - DONOR_CLAIMED: Donor submitted address and created a linked donation record (new status)
 * 
 * Note: We maintain backward compatibility with existing 'pending' status
 */

/**
 * Fetch all requests for volunteer by city
 * Statuses: pending, plus their own VOLUNTEER_ACCEPTED or REACHED_COMMUNITY
 */
export const getVolunteerRequests = async (req, res) => {
  try {
    const { uid, location: volunteerCity } = req.user;
    
    if (!volunteerCity) {
      return res.status(400).json({
        success: false,
        message: 'Volunteer city not found'
      });
    }

    // Get requests that are pending for volunteers in the same city
    const pendingRequests = await db
      .collection('community_requests')
      .where('location_lowercase', '==', volunteerCity.toLowerCase())
      .where('status', '==', 'pending')
      .get();

    // Get requests that this volunteer has accepted or is working on
    const volunteerRequests = await db
      .collection('community_requests')
      .where('volunteerId', '==', uid)
      .where('status', 'in', ['VOLUNTEER_ACCEPTED', 'REACHED_COMMUNITY'])
      .get();

    const requests = [];
    
    pendingRequests.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data(),
        type: 'pending'
      });
    });

    volunteerRequests.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data(),
        type: 'assigned'
      });
    });

    logger.info(`Fetched ${requests.length} community requests for volunteer ${uid} in city ${volunteerCity}`);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    logger.error('Error fetching volunteer requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
};

/**
 * Volunteer accepts a community request
 */
export const acceptRequest = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const requestRef = db.collection('community_requests').doc(id);
    
    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      
      if (requestData.status !== 'pending') {
        throw new Error('Request is not pending volunteer assignment');
      }

      if (requestData.volunteerId) {
        throw new Error('Request already assigned to another volunteer');
      }

      // Update request status
      transaction.update(requestRef, {
        status: 'VOLUNTEER_ACCEPTED',
        volunteerId: uid,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    logger.info(`Volunteer ${uid} accepted community request ${id}`);

    res.json({
      success: true,
      message: 'Request accepted successfully'
    });

  } catch (error) {
    logger.error('Error accepting request:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to accept request'
    });
  }
};

/**
 * Volunteer denies a community request
 */
export const denyRequest = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const requestRef = db.collection('community_requests').doc(id);
    
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      
      if (requestData.status !== 'pending') {
        throw new Error('Request is not pending volunteer assignment');
      }

      // Update request status
      transaction.update(requestRef, {
        status: 'REJECTED_BY_VOLUNTEER',
        deniedBy: uid,
        deniedAt: admin.firestore.FieldValue.serverTimestamp(),
        denialReason: reason || 'No reason provided',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    logger.info(`Volunteer ${uid} denied community request ${id}`);

    res.json({
      success: true,
      message: 'Request denied successfully'
    });

  } catch (error) {
    logger.error('Error denying request:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to deny request'
    });
  }
};

/**
 * Volunteer marks that they have reached the community house
 */
export const markReached = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const requestRef = db.collection('community_requests').doc(id);
    
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      
      if (requestData.status !== 'VOLUNTEER_ACCEPTED') {
        throw new Error('Request must be accepted before marking as reached');
      }

      if (requestData.volunteerId !== uid) {
        throw new Error('Only the assigned volunteer can mark as reached');
      }

      // Update request status
      transaction.update(requestRef, {
        status: 'REACHED_COMMUNITY',
        reachedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    logger.info(`Volunteer ${uid} marked community request ${id} as reached`);

    res.json({
      success: true,
      message: 'Request marked as reached successfully'
    });

  } catch (error) {
    logger.error('Error marking request as reached:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to mark request as reached'
    });
  }
};

/**
 * Volunteer makes final decision after visiting (approve or reject)
 */
export const makeDecision = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;
    const { decision, notes } = req.body; // decision: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Decision must be either "approve" or "reject"'
      });
    }

    const requestRef = db.collection('community_requests').doc(id);
    
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();
      
      if (requestData.status !== 'REACHED_COMMUNITY') {
        throw new Error('Request must be marked as reached before making decision');
      }

      if (requestData.volunteerId !== uid) {
        throw new Error('Only the assigned volunteer can make decision');
      }

      const newStatus = decision === 'approve' ? 'APPROVED_BY_VOLUNTEER' : 'REJECTED_BY_VOLUNTEER';
      
      // Update request status
      transaction.update(requestRef, {
        status: newStatus,
        decisionAt: admin.firestore.FieldValue.serverTimestamp(),
        decisionNotes: notes || '',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    logger.info(`Volunteer ${uid} ${decision}ed community request ${id}`);

    res.json({
      success: true,
      message: `Request ${decision}d successfully`
    });

  } catch (error) {
    logger.error('Error making decision on request:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to make decision on request'
    });
  }
};

/**
 * Fetch all approved requests for donors (no city filter)
 */
export const getApprovedRequests = async (req, res) => {
  try {
    const approvedRequests = await db
      .collection('community_requests')
      .where('status', '==', 'APPROVED_BY_VOLUNTEER')
      .get();

    const requests = [];
    approvedRequests.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    logger.info(`Fetched ${requests.length} approved community requests for donors`);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    logger.error('Error fetching approved requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approved requests'
    });
  }
};

/**
 * Get community requests by user ID
 */
export const getUserRequests = async (req, res) => {
  try {
    const { uid } = req.user;
    const { userId } = req.params;

    // Users can only access their own requests (unless admin)
    if (uid !== userId && req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const userRequests = await db
      .collection('community_requests')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const requests = [];
    userRequests.forEach(doc => {
      requests.push({
        id: doc.id,
        ...doc.data()
      });
    });

    logger.info(`Fetched ${requests.length} community requests for user ${userId}`);

    res.json({
      success: true,
      data: requests
    });

  } catch (error) {
    logger.error('Error fetching user requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user requests'
    });
  }
};

/**
 * Create a new community support request
 */
export const createRequest = async (req, res) => {
  try {
    const { uid, userType } = req.user;
    const { initiative, location, address, beneficiaryName, beneficiaryContact, description, urgency, imageUrl, imageUrls } = req.body;

    if (userType !== 'community') {
      return res.status(403).json({
        success: false,
        message: 'Only community users can create support requests'
      });
    }

    // Validate required fields
    if (!initiative || !location || !address || !beneficiaryName || !beneficiaryContact || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    const requestData = {
      userId: uid,
      initiative,
      location,
      location_lowercase: location.toLowerCase(),
      address,
      beneficiaryName,
      beneficiaryContact,
      description,
      urgency: urgency || 'medium',
      // Optional image fields when provided by client
      ...(Array.isArray(imageUrls) && imageUrls.length > 0 ? { imageUrls } : {}),
      ...(typeof imageUrl === 'string' && imageUrl ? { imageUrl } : {}),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('community_requests').add(requestData);

    // Notify volunteers in the specific city about the new request
    try {
      const notificationService = await getNotificationService();
      await notificationService.notifyCityVolunteersNewRequest({
        ...requestData,
        id: docRef.id
      });
    } catch (notificationError) {
      logger.warn('Failed to send city-based notifications to volunteers:', notificationError);
      // Don't fail the main operation if notification fails
    }

    logger.info(`Community request created by user ${uid} with ID ${docRef.id}`);

    res.status(201).json({
      success: true,
      message: 'Community request created successfully',
      data: {
        id: docRef.id,
        ...requestData
      }
    });

  } catch (error) {
    logger.error('Error creating community request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create community request'
    });
  }
};

/**
 * Donor claims an approved request and creates linked donation
 */
export const donorClaim = async (req, res) => {
  try {
    const { uid, userType } = req.user;
    const { id } = req.params;
    const { donorAddress, notes } = req.body;

    if (userType !== 'donor') {
      return res.status(403).json({
        success: false,
        message: 'Only donors can claim community requests'
      });
    }

    if (!donorAddress) {
      return res.status(400).json({
        success: false,
        message: 'Donor address is required'
      });
    }

    const requestRef = db.collection('community_requests').doc(id);
    let requestData = null;
    
    // Use transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }

      requestData = requestDoc.data();
      
      if (requestData.status !== 'APPROVED_BY_VOLUNTEER') {
        throw new Error('Request is not approved for donor claiming');
      }

      // Update community request status
      transaction.update(requestRef, {
        status: 'DONOR_CLAIMED',
        donorId: uid,
        donorAddress,
        donorNotes: notes || '',
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create linked donation document
      const donationData = {
        communityRequestId: id,
        donorId: uid,
        donorAddress,
        donorNotes: notes || '',
        status: 'pending',
        city: requestData.location_lowercase || requestData.location,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const donationRef = db.collection('donations').doc();
      transaction.set(donationRef, donationData);
    });

    // Notify the volunteer about the claimed request
    try {
      const notificationService = await getNotificationService();
      await notificationService.notifyVolunteerCommunityRequestClaimed(
        { ...requestData, id },
        { donorAddress, donorNotes: notes || '' }
      );
    } catch (notificationError) {
      logger.warn('Failed to send notification to volunteer:', notificationError);
      // Don't fail the main operation if notification fails
    }

    logger.info(`Donor ${uid} claimed community request ${id} and created donation`);

    res.json({
      success: true,
      message: 'Request claimed successfully. Donation created and linked.'
    });

  } catch (error) {
    logger.error('Error claiming request:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to claim request'
    });
  }
};

/**
 * Test email service functionality
 */
export const testEmailService = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Import email service
    const { default: emailService } = await import('../services/emailService.js');
    
    // Test email
    const testRequest = {
      id: 'test-request-id',
      initiative: 'annamitra-seva',
      location: 'tirupati',
      location_lowercase: 'tirupati',
      beneficiaryName: 'Test Beneficiary',
      beneficiaryContact: '1234567890',
      address: 'Test Address, Tirupati',
      description: 'This is a test community request'
    };

    const testVolunteer = {
      firstName: 'Test Volunteer',
      email: email
    };

    await emailService.sendNewCommunityRequestEmail(testRequest, testVolunteer);

    logger.info(`Test email sent successfully to ${email}`);

    res.json({
      success: true,
      message: 'Test email sent successfully'
    });

  } catch (error) {
    logger.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};
