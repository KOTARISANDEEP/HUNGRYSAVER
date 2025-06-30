import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS } from '../config/constants.js';
import auditService from '../services/auditService.js';
import { logger } from '../utils/logger.js';

class HistoryController {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database connection
   */
  initialize() {
    if (!this.db) {
      this.db = getFirestore();
    }
  }

  /**
   * Get database instance with lazy initialization
   */
  getDb() {
    if (!this.db) {
      this.initialize();
    }
    return this.db;
  }

  /**
   * Get user history
   */
  getUserHistory = async (req, res) => {
    try {
      const { userId } = req.params;
      const { type = 'all', status, limit = 20, offset = 0 } = req.query;

      // Check if user is requesting their own history or is admin
      if (req.user.uid !== userId && req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      let donations = [];
      let requests = [];

      // Get donations if requested
      if (type === 'all' || type === 'donation') {
        let donationsQuery = this.getDb().collection(COLLECTIONS.DONATIONS)
          .where('userId', '==', userId);

        if (status) {
          donationsQuery = donationsQuery.where('status', '==', status);
        }

        const donationsSnapshot = await donationsQuery
          .orderBy('createdAt', 'desc')
          .get();

        donations = donationsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'donation',
          ...doc.data()
        }));
      }

      // Get requests if requested
      if (type === 'all' || type === 'request') {
        let requestsQuery = this.getDb().collection(COLLECTIONS.REQUESTS)
          .where('userId', '==', userId);

        if (status) {
          requestsQuery = requestsQuery.where('status', '==', status);
        }

        const requestsSnapshot = await requestsQuery
          .orderBy('createdAt', 'desc')
          .get();

        requests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'request',
          ...doc.data()
        }));
      }

      // Combine and sort by creation date
      const allHistory = [...donations, ...requests].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedHistory = allHistory.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedHistory,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: allHistory.length
        }
      });
    } catch (error) {
      logger.error('Error getting user history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get item history (status changes)
   */
  getItemHistory = async (req, res) => {
    try {
      const { itemType, itemId } = req.params;

      // Get the item to check permissions
      const collection = itemType === 'donation' ? COLLECTIONS.DONATIONS : COLLECTIONS.REQUESTS;
      const itemDoc = await this.getDb().collection(collection).doc(itemId).get();

      if (!itemDoc.exists) {
        return res.status(404).json({
          success: false,
          message: `${itemType} not found`
        });
      }

      const item = itemDoc.data();

      // Check if user has access to this item
      if (req.user.uid !== item.userId && 
          req.user.uid !== item.assignedTo && 
          req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const history = await auditService.getItemAuditLogs(itemId, itemType);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error getting item history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get audit logs (admin only)
   */
  getAuditLogs = async (req, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { userId, action, startDate, endDate, limit = 50, offset = 0 } = req.query;

      let query = this.getDb().collection(COLLECTIONS.AUDIT_LOGS);

      if (userId) {
        query = query.where('userId', '==', userId);
      }

      if (action) {
        query = query.where('action', '==', action);
      }

      if (startDate) {
        query = query.where('timestamp', '>=', new Date(startDate));
      }

      if (endDate) {
        query = query.where('timestamp', '<=', new Date(endDate));
      }

      const snapshot = await query
        .orderBy('timestamp', 'desc')
        .limit(parseInt(limit))
        .offset(parseInt(offset))
        .get();

      const auditLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        data: auditLogs,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: auditLogs.length
        }
      });
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get system statistics (admin only)
   */
  getSystemStats = async (req, res) => {
    try {
      if (req.user.userType !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const { days = 30 } = req.query;

      const stats = await auditService.getSystemStats(parseInt(days));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting system stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

export default new HistoryController();