import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS, STATUS_STAGES } from '../config/constants.js';
import locationService from '../services/locationService.js';
import matchingService from '../services/matchingService.js';
import { logger } from '../utils/logger.js';

class DashboardController {
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
   * Get Firestore database instance with lazy initialization
   */
  getDb() {
    if (!this.initialized) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Get volunteer dashboard data
   */
  getVolunteerDashboard = async (req, res) => {
    try {
      const { volunteerId } = req.params;
      const { days = 30 } = req.query;

      // Check if user is requesting their own dashboard or is admin
      if (req.user.uid !== volunteerId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const db = this.getDb();

      // Get volunteer info
      const volunteerDoc = await db.collection(COLLECTIONS.USERS).doc(volunteerId).get();
      const volunteer = volunteerDoc.data();

      // Get assignments
      const [donationsSnapshot, requestsSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.DONATIONS)
          .where('assignedTo', '==', volunteerId)
          .get(),
        db.collection(COLLECTIONS.REQUESTS)
          .where('assignedTo', '==', volunteerId)
          .get()
      ]);

      // Get available tasks in volunteer's location
      const availableTasks = await this.getAvailableTasksForLocation(volunteer.location);

      // Calculate statistics
      const totalAssignments = donationsSnapshot.size + requestsSnapshot.size;
      const completedAssignments = [...donationsSnapshot.docs, ...requestsSnapshot.docs]
        .filter(doc => doc.data().status === STATUS_STAGES.DELIVERED).length;

      const recentAssignments = [...donationsSnapshot.docs, ...requestsSnapshot.docs]
        .filter(doc => doc.data().createdAt?.toDate() >= startDate).length;

      const dashboardData = {
        volunteer: {
          id: volunteerId,
          name: volunteer.firstName,
          location: volunteer.location,
          status: volunteer.status
        },
        statistics: {
          totalAssignments,
          completedAssignments,
          recentAssignments,
          completionRate: totalAssignments > 0 ? (completedAssignments / totalAssignments * 100).toFixed(1) : 0,
          availableTasks: availableTasks.length
        },
        availableTasks: availableTasks.slice(0, 10), // Limit to 10 most recent
        recentActivity: await this.getRecentActivity(volunteerId, 5)
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting volunteer dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get donor dashboard data
   */
  getDonorDashboard = async (req, res) => {
    try {
      const { donorId } = req.params;
      const { days = 30 } = req.query;

      // Check if user is requesting their own dashboard or is admin
      if (req.user.uid !== donorId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const db = this.getDb();

      // Get donor info
      const donorDoc = await db.collection(COLLECTIONS.USERS).doc(donorId).get();
      const donor = donorDoc.data();

      // Get donations
      const donationsSnapshot = await db.collection(COLLECTIONS.DONATIONS)
        .where('userId', '==', donorId)
        .get();

      const donations = donationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const totalDonations = donations.length;
      const completedDonations = donations.filter(d => d.status === STATUS_STAGES.DELIVERED).length;
      const recentDonations = donations.filter(d => d.createdAt?.toDate() >= startDate).length;
      const estimatedPeopleHelped = donations
        .filter(d => d.status === STATUS_STAGES.DELIVERED)
        .reduce((total, d) => total + (d.estimatedBeneficiaries || 1), 0);

      const dashboardData = {
        donor: {
          id: donorId,
          name: donor.firstName,
          email: donor.email
        },
        statistics: {
          totalDonations,
          completedDonations,
          recentDonations,
          estimatedPeopleHelped,
          completionRate: totalDonations > 0 ? (completedDonations / totalDonations * 100).toFixed(1) : 0
        },
        recentDonations: donations
          .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
          .slice(0, 10),
        impactSummary: await this.getDonorImpactSummary(donorId)
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting donor dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get community dashboard data
   */
  getCommunityDashboard = async (req, res) => {
    try {
      const { userId } = req.params;
      const { days = 30 } = req.query;

      // Check if user is requesting their own dashboard or is admin
      if (req.user.uid !== userId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const db = this.getDb();

      // Get user info
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
      const user = userDoc.data();

      // Get requests
      const requestsSnapshot = await db.collection(COLLECTIONS.REQUESTS)
        .where('userId', '==', userId)
        .get();

      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const totalRequests = requests.length;
      const fulfilledRequests = requests.filter(r => r.status === STATUS_STAGES.DELIVERED).length;
      const recentRequests = requests.filter(r => r.createdAt?.toDate() >= startDate).length;
      const pendingRequests = requests.filter(r => r.status === STATUS_STAGES.PENDING).length;

      const dashboardData = {
        user: {
          id: userId,
          name: user.firstName,
          email: user.email
        },
        statistics: {
          totalRequests,
          fulfilledRequests,
          recentRequests,
          pendingRequests,
          fulfillmentRate: totalRequests > 0 ? (fulfilledRequests / totalRequests * 100).toFixed(1) : 0
        },
        recentRequests: requests
          .sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate())
          .slice(0, 10),
        availableInitiatives: await this.getAvailableInitiatives()
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting community dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get admin dashboard data
   */
  getAdminDashboard = async (req, res) => {
    try {
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const db = this.getDb();

      // Get overall statistics
      const [
        donationsSnapshot,
        requestsSnapshot,
        volunteersSnapshot,
        pendingVolunteersSnapshot
      ] = await Promise.all([
        db.collection(COLLECTIONS.DONATIONS).get(),
        db.collection(COLLECTIONS.REQUESTS).get(),
        db.collection(COLLECTIONS.USERS)
          .where('userType', '==', 'volunteer')
          .where('status', '==', 'approved')
          .get(),
        db.collection(COLLECTIONS.USERS)
          .where('userType', '==', 'volunteer')
          .where('status', '==', 'pending')
          .get()
      ]);

      const donations = donationsSnapshot.docs.map(doc => doc.data());
      const requests = requestsSnapshot.docs.map(doc => doc.data());

      // Calculate statistics
      const totalDonations = donations.length;
      const totalRequests = requests.length;
      const completedDonations = donations.filter(d => d.status === STATUS_STAGES.DELIVERED).length;
      const completedRequests = requests.filter(r => r.status === STATUS_STAGES.DELIVERED).length;
      const activeVolunteers = volunteersSnapshot.size;
      const pendingVolunteers = pendingVolunteersSnapshot.size;

      // Get location-wise breakdown
      const locationStats = await this.getLocationBreakdown();

      const dashboardData = {
        overview: {
          totalDonations,
          totalRequests,
          completedDonations,
          completedRequests,
          activeVolunteers,
          pendingVolunteers,
          overallCompletionRate: (totalDonations + totalRequests) > 0 ? 
            ((completedDonations + completedRequests) / (totalDonations + totalRequests) * 100).toFixed(1) : 0
        },
        locationStats,
        pendingApprovals: pendingVolunteersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).slice(0, 10),
        recentActivity: await this.getSystemRecentActivity(10)
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting admin dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get location dashboard data
   */
  getLocationDashboard = async (req, res) => {
    try {
      const { location } = req.params;
      const { days = 30 } = req.query;

      const standardizedLocation = locationService.validateLocation(location);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const db = this.getDb();

      // Get location statistics
      const locationStats = await locationService.getLocationStats(db, standardizedLocation);
      const matchingStats = await matchingService.getMatchingStats(standardizedLocation);

      // Get recent activity in location
      const [donationsSnapshot, requestsSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.DONATIONS)
          .where('location_lowercase', '==', standardizedLocation)
          .where('createdAt', '>=', startDate)
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get(),
        db.collection(COLLECTIONS.REQUESTS)
          .where('location_lowercase', '==', standardizedLocation)
          .where('createdAt', '>=', startDate)
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get()
      ]);

      const recentActivity = [
        ...donationsSnapshot.docs.map(doc => ({ id: doc.id, type: 'donation', ...doc.data() })),
        ...requestsSnapshot.docs.map(doc => ({ id: doc.id, type: 'request', ...doc.data() }))
      ].sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());

      const dashboardData = {
        location: {
          name: standardizedLocation.charAt(0).toUpperCase() + standardizedLocation.slice(1),
          value: standardizedLocation
        },
        statistics: {
          ...locationStats,
          ...matchingStats
        },
        recentActivity: recentActivity.slice(0, 10)
      };

      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting location dashboard:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  // Helper methods

  async getAvailableTasksForLocation(location) {
    try {
      const db = this.getDb();
      
      const [donationsSnapshot, requestsSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.DONATIONS)
          .where('location_lowercase', '==', location.toLowerCase())
          .where('status', '==', STATUS_STAGES.PENDING)
          .orderBy('createdAt', 'desc')
          .get(),
        db.collection(COLLECTIONS.REQUESTS)
          .where('location_lowercase', '==', location.toLowerCase())
          .where('status', '==', STATUS_STAGES.PENDING)
          .orderBy('createdAt', 'desc')
          .get()
      ]);

      return [
        ...donationsSnapshot.docs.map(doc => ({ id: doc.id, type: 'donation', ...doc.data() })),
        ...requestsSnapshot.docs.map(doc => ({ id: doc.id, type: 'request', ...doc.data() }))
      ].sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
    } catch (error) {
      logger.error('Error getting available tasks:', error);
      return [];
    }
  }

  async getRecentActivity(userId, limit = 5) {
    try {
      const db = this.getDb();
      
      const auditSnapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      return [];
    }
  }

  async getDonorImpactSummary(donorId) {
    try {
      const db = this.getDb();
      
      const donationsSnapshot = await db.collection(COLLECTIONS.DONATIONS)
        .where('userId', '==', donorId)
        .where('status', '==', STATUS_STAGES.DELIVERED)
        .get();

      const donations = donationsSnapshot.docs.map(doc => doc.data());

      const impactByInitiative = {};
      donations.forEach(donation => {
        if (!impactByInitiative[donation.initiative]) {
          impactByInitiative[donation.initiative] = 0;
        }
        impactByInitiative[donation.initiative] += donation.estimatedBeneficiaries || 1;
      });

      return {
        totalPeopleHelped: donations.reduce((total, d) => total + (d.estimatedBeneficiaries || 1), 0),
        initiativesSupported: Object.keys(impactByInitiative).length,
        impactByInitiative
      };
    } catch (error) {
      logger.error('Error getting donor impact summary:', error);
      return {};
    }
  }

  async getAvailableInitiatives() {
    return [
      { id: 'annamitra-seva', name: 'Annamitra Seva', description: 'Food assistance' },
      { id: 'vidya-jyothi', name: 'Vidya Jyothi', description: 'Educational support' },
      { id: 'suraksha-setu', name: 'Suraksha Setu', description: 'Emergency support' },
      { id: 'punarasha', name: 'PunarAsha', description: 'Rehabilitation support' },
      { id: 'raksha-jyothi', name: 'Raksha Jyothi', description: 'Emergency response' },
      { id: 'jyothi-nilayam', name: 'Jyothi Nilayam', description: 'Shelter support' }
    ];
  }

  async getLocationBreakdown() {
    try {
      const db = this.getDb();
      const cities = locationService.getValidCities();
      const locationStats = {};

      for (const city of cities) {
        const stats = await locationService.getLocationStats(db, city);
        locationStats[city] = stats;
      }

      return locationStats;
    } catch (error) {
      logger.error('Error getting location breakdown:', error);
      return {};
    }
  }

  async getSystemRecentActivity(limit = 10) {
    try {
      const db = this.getDb();
      
      const auditSnapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return auditSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting system recent activity:', error);
      return [];
    }
  }
}

export default new DashboardController();