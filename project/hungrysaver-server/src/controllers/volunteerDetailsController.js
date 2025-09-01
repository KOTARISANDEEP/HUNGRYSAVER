import { COLLECTIONS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

class VolunteerDetailsController {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  /**
   * Initialize Firestore connection
   */
  initialize() {
    if (!this.initialized) {
      const { getFirestore } = require('../config/firebase.js');
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
  createVolunteerDetails = async (req, res) => {
    try {
      const { donationId } = req.params;
      const { volunteerName, volunteerContact, expectedArrivalTime } = req.body;
      const volunteerId = req.user.uid;

      // Validate required fields
      if (!volunteerName || !volunteerContact || !expectedArrivalTime) {
        return res.status(400).json({
          success: false,
          message: 'Volunteer name, contact, and expected arrival time are required'
        });
      }

      // Import volunteer details service dynamically
      const { default: volunteerDetailsService } = await import('../services/volunteerDetailsService.js');

      // Create volunteer details
      const result = await volunteerDetailsService.createVolunteerDetails(
        donationId,
        volunteerId,
        {
          volunteerName,
          volunteerContact,
          expectedArrivalTime
        }
      );

      logger.info(`Volunteer details created for donation ${donationId} by volunteer ${volunteerId}`);

      res.status(201).json({
        success: true,
        message: 'Volunteer details created successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error creating volunteer details:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  };

  /**
   * Get volunteer details for a specific donation
   */
  getVolunteerDetails = async (req, res) => {
    try {
      const { donationId } = req.params;

      // Import volunteer details service dynamically
      const { default: volunteerDetailsService } = await import('../services/volunteerDetailsService.js');

      // Get volunteer details
      const volunteerDetails = await volunteerDetailsService.getVolunteerDetailsByDonationId(donationId);

      if (!volunteerDetails) {
        return res.status(404).json({
          success: false,
          message: 'Volunteer details not found for this donation'
        });
      }

      res.json({
        success: true,
        data: volunteerDetails
      });
    } catch (error) {
      logger.error('Error getting volunteer details:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  };

  /**
   * Update volunteer details
   */
  updateVolunteerDetails = async (req, res) => {
    try {
      const { donationId } = req.params;
      const updateData = req.body;
      const volunteerId = req.user.uid;

      // Import volunteer details service dynamically
      const { default: volunteerDetailsService } = await import('../services/volunteerDetailsService.js');

      // Update volunteer details
      const result = await volunteerDetailsService.updateVolunteerDetails(
        donationId,
        volunteerId,
        updateData
      );

      logger.info(`Volunteer details updated for donation ${donationId} by volunteer ${volunteerId}`);

      res.json({
        success: true,
        message: 'Volunteer details updated successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error updating volunteer details:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  };

  /**
   * Delete volunteer details
   */
  deleteVolunteerDetails = async (req, res) => {
    try {
      const { donationId } = req.params;
      const volunteerId = req.user.uid;

      // Import volunteer details service dynamically
      const { default: volunteerDetailsService } = await import('../services/volunteerDetailsService.js');

      // Delete volunteer details
      const result = await volunteerDetailsService.deleteVolunteerDetails(donationId);

      logger.info(`Volunteer details deleted for donation ${donationId} by volunteer ${volunteerId}`);

      res.json({
        success: true,
        message: 'Volunteer details deleted successfully',
        data: result
      });
    } catch (error) {
      logger.error('Error deleting volunteer details:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Internal server error'
      });
    }
  };
}

export default new VolunteerDetailsController();
