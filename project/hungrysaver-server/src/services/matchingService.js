import { getFirestore } from '../config/firebase.js';
import { COLLECTIONS, USER_TYPES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// Import locationService dynamically to avoid circular dependencies
let locationService = null;

class MatchingService {
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
      
      // Import location service dynamically
      if (!locationService) {
        import('./locationService.js').then(module => {
          locationService = module.default;
        });
      }
      
      this.initialized = true;
      logger.info('MatchingService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MatchingService:', error);
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
   * Find volunteers by location
   */
  async findVolunteersByLocation(location) {
    try {
      const db = this.getDb();
      
      // Validate location if locationService is available
      let standardizedLocation = location;
      if (locationService) {
        standardizedLocation = locationService.validateLocation(location);
      } else {
        standardizedLocation = location.toLowerCase().trim();
      }
      
      const volunteersSnapshot = await db.collection(COLLECTIONS.USERS)
        .where('userType', '==', USER_TYPES.VOLUNTEER)
        .where('status', '==', 'approved')
        .where('location', '==', standardizedLocation)
        .get();
      
      const volunteers = volunteersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      logger.info(`Found ${volunteers.length} volunteers in ${standardizedLocation}`);
      return volunteers;
    } catch (error) {
      logger.error('Error finding volunteers by location:', error);
      throw error;
    }
  }

  /**
   * Find donors by location
   */
  async findDonorsByLocation(location) {
    try {
      const db = this.getDb();
      
      // Validate location if locationService is available
      let standardizedLocation = location;
      if (locationService) {
        standardizedLocation = locationService.validateLocation(location);
      } else {
        standardizedLocation = location.toLowerCase().trim();
      }
      
      const donorsSnapshot = await db.collection(COLLECTIONS.USERS)
        .where('userType', '==', USER_TYPES.DONOR)
        .where('status', '==', 'approved')
        .get();
      
      // Filter by location if they have location data
      const donors = donorsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(donor => !donor.location || donor.location === standardizedLocation);
      
      logger.info(`Found ${donors.length} donors for ${standardizedLocation}`);
      return donors;
    } catch (error) {
      logger.error('Error finding donors by location:', error);
      throw error;
    }
  }

  /**
   * Find available volunteers with fallback to nearby cities
   */
  async findAvailableVolunteers(location, radiusKm = 50) {
    try {
      // First, try exact location match
      let volunteers = await this.findVolunteersByLocation(location);
      
      // If no volunteers found and locationService is available, try nearby cities
      if (volunteers.length === 0 && locationService) {
        const nearbyCities = locationService.findNearbyCities(location, radiusKm);
        
        for (const nearbyCity of nearbyCities) {
          const nearbyVolunteers = await this.findVolunteersByLocation(nearbyCity);
          volunteers = volunteers.concat(nearbyVolunteers);
          
          if (volunteers.length > 0) {
            logger.info(`Found volunteers in nearby city: ${nearbyCity}`);
            break;
          }
        }
      }
      
      return volunteers;
    } catch (error) {
      logger.error('Error finding available volunteers:', error);
      throw error;
    }
  }

  /**
   * Match donation with volunteers
   */
  async matchDonationWithVolunteers(donationId) {
    try {
      const db = this.getDb();
      const donationDoc = await db.collection(COLLECTIONS.DONATIONS).doc(donationId).get();
      
      if (!donationDoc.exists) {
        throw new Error('Donation not found');
      }
      
      const donation = donationDoc.data();
      const volunteers = await this.findAvailableVolunteers(donation.location_lowercase);
      
      return {
        donation: { id: donationId, ...donation },
        matchedVolunteers: volunteers,
        matchCount: volunteers.length
      };
    } catch (error) {
      logger.error('Error matching donation with volunteers:', error);
      throw error;
    }
  }

  /**
   * Match community request with donors
   */
  async matchRequestWithDonors(requestId) {
    try {
      const db = this.getDb();
      const requestDoc = await db.collection(COLLECTIONS.REQUESTS).doc(requestId).get();
      
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }
      
      const request = requestDoc.data();
      const donors = await this.findDonorsByLocation(request.location_lowercase);
      
      return {
        request: { id: requestId, ...request },
        matchedDonors: donors,
        matchCount: donors.length
      };
    } catch (error) {
      logger.error('Error matching request with donors:', error);
      throw error;
    }
  }

  /**
   * Get volunteer workload (number of active assignments)
   */
  async getVolunteerWorkload(volunteerId) {
    try {
      const db = this.getDb();
      const [donationsSnapshot, requestsSnapshot] = await Promise.all([
        db.collection(COLLECTIONS.DONATIONS)
          .where('assignedTo', '==', volunteerId)
          .where('status', 'in', ['accepted', 'picked'])
          .get(),
        db.collection(COLLECTIONS.REQUESTS)
          .where('assignedTo', '==', volunteerId)
          .where('status', 'in', ['accepted', 'picked'])
          .get()
      ]);
      
      return {
        activeDonations: donationsSnapshot.size,
        activeRequests: requestsSnapshot.size,
        totalActive: donationsSnapshot.size + requestsSnapshot.size
      };
    } catch (error) {
      logger.error('Error getting volunteer workload:', error);
      throw error;
    }
  }

  /**
   * Find best volunteer for assignment (based on workload and location)
   */
  async findBestVolunteer(location, excludeVolunteers = []) {
    try {
      const volunteers = await this.findAvailableVolunteers(location);
      
      // Filter out excluded volunteers
      const availableVolunteers = volunteers.filter(v => !excludeVolunteers.includes(v.id));
      
      if (availableVolunteers.length === 0) {
        return null;
      }
      
      // Get workload for each volunteer
      const volunteersWithWorkload = await Promise.all(
        availableVolunteers.map(async (volunteer) => {
          const workload = await this.getVolunteerWorkload(volunteer.id);
          return { ...volunteer, workload: workload.totalActive };
        })
      );
      
      // Sort by workload (ascending) to find least busy volunteer
      volunteersWithWorkload.sort((a, b) => a.workload - b.workload);
      
      return volunteersWithWorkload[0];
    } catch (error) {
      logger.error('Error finding best volunteer:', error);
      throw error;
    }
  }

  /**
   * Get matching statistics for a location
   */
  async getMatchingStats(location) {
    try {
      const db = this.getDb();
      
      // Validate location if locationService is available
      let standardizedLocation = location;
      if (locationService) {
        standardizedLocation = locationService.validateLocation(location);
      } else {
        standardizedLocation = location.toLowerCase().trim();
      }
      
      const [volunteers, pendingDonations, pendingRequests] = await Promise.all([
        this.findVolunteersByLocation(standardizedLocation),
        db.collection(COLLECTIONS.DONATIONS)
          .where('location_lowercase', '==', standardizedLocation)
          .where('status', '==', 'pending')
          .get(),
        db.collection(COLLECTIONS.REQUESTS)
          .where('location_lowercase', '==', standardizedLocation)
          .where('status', '==', 'pending')
          .get()
      ]);
      
      return {
        location: standardizedLocation,
        availableVolunteers: volunteers.length,
        pendingDonations: pendingDonations.size,
        pendingRequests: pendingRequests.size,
        matchingRatio: volunteers.length > 0 ? 
          (pendingDonations.size + pendingRequests.size) / volunteers.length : 0
      };
    } catch (error) {
      logger.error('Error getting matching stats:', error);
      throw error;
    }
  }
}

export default new MatchingService();