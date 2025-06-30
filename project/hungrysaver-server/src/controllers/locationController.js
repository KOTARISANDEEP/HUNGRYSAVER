import locationService from '../services/locationService.js';
import matchingService from '../services/matchingService.js';
import { logger } from '../utils/logger.js';

class LocationController {
  /**
   * Get all valid cities
   */
  getValidCities = async (req, res) => {
    try {
      const cities = locationService.getValidCities();

      res.json({
        success: true,
        data: cities.map(city => ({
          id: city,
          name: city.charAt(0).toUpperCase() + city.slice(1),
          value: city
        }))
      });
    } catch (error) {
      logger.error('Error getting valid cities:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };

  /**
   * Get location statistics
   */
  getLocationStats = async (req, res) => {
    try {
      const { location } = req.params;
      const { days = 30 } = req.query;

      const stats = await locationService.getLocationStats(location, parseInt(days));

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting location stats:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get volunteers in location
   */
  getVolunteersInLocation = async (req, res) => {
    try {
      const { location } = req.params;
      const { status = 'approved', limit = 20, offset = 0 } = req.query;

      const volunteers = await matchingService.findVolunteersByLocation(location);

      // Filter by status if specified
      const filteredVolunteers = status ? 
        volunteers.filter(v => v.status === status) : 
        volunteers;

      // Apply pagination
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      const paginatedVolunteers = filteredVolunteers.slice(startIndex, endIndex);

      res.json({
        success: true,
        data: paginatedVolunteers,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: filteredVolunteers.length
        }
      });
    } catch (error) {
      logger.error('Error getting volunteers in location:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get nearby cities
   */
  getNearbyCities = async (req, res) => {
    try {
      const { location } = req.params;
      const { radius = 50 } = req.query;

      const nearbyCities = locationService.findNearbyCities(location, parseInt(radius));

      res.json({
        success: true,
        data: nearbyCities.map(city => ({
          id: city,
          name: city.charAt(0).toUpperCase() + city.slice(1),
          value: city,
          distance: locationService.getDistance(location, city)
        }))
      });
    } catch (error) {
      logger.error('Error getting nearby cities:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };

  /**
   * Get matching statistics
   */
  getMatchingStats = async (req, res) => {
    try {
      const { location } = req.params;

      const stats = await matchingService.getMatchingStats(location);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting matching stats:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  };
}

export default new LocationController();