import express from 'express';
import volunteerDetailsController from '../controllers/volunteerDetailsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create volunteer details when accepting a donation
router.post('/:donationId', volunteerDetailsController.createVolunteerDetails);

// Get volunteer details for a specific donation
router.get('/:donationId', volunteerDetailsController.getVolunteerDetails);

// Update volunteer details
router.put('/:donationId', volunteerDetailsController.updateVolunteerDetails);

// Delete volunteer details
router.delete('/:donationId', volunteerDetailsController.deleteVolunteerDetails);

export default router;
