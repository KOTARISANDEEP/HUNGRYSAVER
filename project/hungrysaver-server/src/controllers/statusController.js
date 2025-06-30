import statusService from '../services/statusService.js';
import { logger } from '../utils/logger.js';

class StatusController {
  /**
   * Update donation status
   */
  updateDonationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const volunteerId = req.user.uid;

      const result = await statusService.updateDonationStatus(
        id,
        status,
        volunteerId,
        { notes, updatedBy: volunteerId }
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
   * Update request status
   */
  updateRequestStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const volunteerId = req.user.uid;

      const result = await statusService.updateRequestStatus(
        id,
        status,
        volunteerId,
        { notes, updatedBy: volunteerId }
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
   * Get status history
   */
  getStatusHistory = async (req, res) => {
    try {
      const { itemType, itemId } = req.params;

      const history = await statusService.getStatusHistory(itemId, itemType);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      logger.error('Error getting status history:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get items by status
   */
  getItemsByStatus = async (req, res) => {
    try {
      const { status } = req.params;
      const { location, itemType = 'donation', limit = 20, offset = 0 } = req.query;

      const items = await statusService.getItemsByStatus(status, location, itemType);

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedItems = items.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedItems,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: items.length
        }
      });
    } catch (error) {
      logger.error('Error getting items by status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
}

export default new StatusController();