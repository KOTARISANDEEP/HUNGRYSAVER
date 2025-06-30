import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

class AuditService {
  constructor() {
    // Don't initialize Firebase services in constructor
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firebase services (called lazily)
   */
  initialize() {
    if (this.initialized) return;
    
    try {
      this.db = getFirestore();
      this.initialized = true;
      logger.info('AuditService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AuditService:', error);
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
   * Log status change
   */
  async logStatusChange(itemId, itemType, fromStatus, toStatus, userId, additionalData = {}) {
    try {
      const db = this.getDb();
      const auditLog = {
        itemId,
        itemType,
        action: 'status_change',
        fromStatus,
        toStatus,
        userId,
        timestamp: new Date(),
        additionalData,
        userAgent: additionalData.userAgent || null,
        ipAddress: additionalData.ipAddress || null
      };

      await db.collection(COLLECTIONS.AUDIT_LOGS).add(auditLog);
      
      logger.info(`Audit log created: ${itemType} ${itemId} status changed from ${fromStatus} to ${toStatus} by ${userId}`);
    } catch (error) {
      logger.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Log user action
   */
  async logUserAction(userId, action, details = {}) {
    try {
      const db = this.getDb();
      const auditLog = {
        userId,
        action,
        details,
        timestamp: new Date(),
        userAgent: details.userAgent || null,
        ipAddress: details.ipAddress || null
      };

      await db.collection(COLLECTIONS.AUDIT_LOGS).add(auditLog);
      
      logger.info(`User action logged: ${userId} performed ${action}`);
    } catch (error) {
      logger.error('Error logging user action:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for an item
   */
  async getItemAuditLogs(itemId, itemType) {
    try {
      const db = this.getDb();
      const snapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
        .where('itemId', '==', itemId)
        .where('itemType', '==', itemType)
        .orderBy('timestamp', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting item audit logs:', error);
      throw error;
    }
  }

  /**
   * Get user audit logs
   */
  async getUserAuditLogs(userId, limit = 50) {
    try {
      const db = this.getDb();
      const snapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting user audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit logs by date range
   */
  async getAuditLogsByDateRange(startDate, endDate, limit = 100) {
    try {
      const db = this.getDb();
      const snapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
        .where('timestamp', '>=', startDate)
        .where('timestamp', '<=', endDate)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting audit logs by date range:', error);
      throw error;
    }
  }

  /**
   * Get system statistics from audit logs
   */
  async getSystemStats(days = 30) {
    try {
      const db = this.getDb();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const snapshot = await db.collection(COLLECTIONS.AUDIT_LOGS)
        .where('timestamp', '>=', startDate)
        .get();

      const logs = snapshot.docs.map(doc => doc.data());

      const stats = {
        totalActions: logs.length,
        statusChanges: logs.filter(log => log.action === 'status_change').length,
        uniqueUsers: new Set(logs.map(log => log.userId)).size,
        actionsByType: {},
        dailyActivity: {}
      };

      // Count actions by type
      logs.forEach(log => {
        stats.actionsByType[log.action] = (stats.actionsByType[log.action] || 0) + 1;
        
        const date = log.timestamp.toDate().toDateString();
        stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
      });

      return stats;
    } catch (error) {
      logger.error('Error getting system stats:', error);
      throw error;
    }
  }
}

export default new AuditService();