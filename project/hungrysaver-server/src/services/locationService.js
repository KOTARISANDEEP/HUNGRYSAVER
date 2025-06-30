import { VALID_CITIES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

class LocationService {
  /**
   * Standardize location to lowercase
   */
  standardizeLocation(location) {
    if (!location || typeof location !== 'string') {
      throw new Error('Location must be a non-empty string');
    }
    return location.toLowerCase().trim();
  }

  /**
   * Validate if location is in the allowed cities list
   */
  validateLocation(location) {
    const standardized = this.standardizeLocation(location);
    
    if (!VALID_CITIES.includes(standardized)) {
      throw new Error(`Invalid location: ${location}. Must be one of: ${VALID_CITIES.join(', ')}`);
    }
    
    return standardized;
  }

  /**
   * Get all valid cities
   */
  getValidCities() {
    return [...VALID_CITIES];
  }

  /**
   * Find nearby cities (for fallback matching)
   */
  findNearbyCities(location, radiusKm = 50) {
    // This is a simplified implementation
    // In a real-world scenario, you'd use actual geographic coordinates
    const cityGroups = {
      coastal: ['visakhapatnam', 'kakinada', 'nellore'],
      central: ['vijayawada', 'guntur', 'rajahmundry'],
      southern: ['tirupati', 'kadapa'],
      western: ['kurnool', 'anantapur']
    };

    const standardized = this.standardizeLocation(location);
    
    for (const [region, cities] of Object.entries(cityGroups)) {
      if (cities.includes(standardized)) {
        return cities.filter(city => city !== standardized);
      }
    }
    
    return [];
  }

  /**
   * Get location statistics
   */
  async getLocationStats(db, location) {
    try {
      const standardized = this.validateLocation(location);
      
      const [donationsSnapshot, requestsSnapshot, volunteersSnapshot] = await Promise.all([
        db.collection('donations').where('location_lowercase', '==', standardized).get(),
        db.collection('community_requests').where('location_lowercase', '==', standardized).get(),
        db.collection('users')
          .where('userType', '==', 'volunteer')
          .where('location', '==', standardized)
          .where('status', '==', 'approved')
          .get()
      ]);

      return {
        location: standardized,
        totalDonations: donationsSnapshot.size,
        totalRequests: requestsSnapshot.size,
        activeVolunteers: volunteersSnapshot.size,
        completedDonations: donationsSnapshot.docs.filter(doc => 
          doc.data().status === 'delivered'
        ).length
      };
    } catch (error) {
      logger.error('Error getting location stats:', error);
      throw error;
    }
  }

  /**
   * Get distance between two cities (simplified)
   */
  getDistance(city1, city2) {
    // Simplified distance calculation
    // In production, use actual coordinates and haversine formula
    const distances = {
      'vijayawada-guntur': 30,
      'visakhapatnam-kakinada': 60,
      'tirupati-kadapa': 80,
      // Add more city pairs as needed
    };

    const key1 = `${city1}-${city2}`;
    const key2 = `${city2}-${city1}`;
    
    return distances[key1] || distances[key2] || 100; // Default to 100km
  }
}

export default new LocationService();