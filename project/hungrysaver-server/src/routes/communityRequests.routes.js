import express from 'express';
import { authenticateToken, requireVolunteer, requireDonor, requireCommunity, requireApproved } from '../middleware/auth.js';
import {
  createRequest,
  getUserRequests,
  getVolunteerRequests,
  acceptRequest,
  denyRequest,
  markReached,
  makeDecision,
  getApprovedRequests,
  donorClaim,
  testEmailService
} from '../controllers/communityRequests.controller.js';

const router = express.Router();

/**
 * Community Support Request Routes
 * 
 * Status Flow:
 * pending → VOLUNTEER_ACCEPTED → REACHED_COMMUNITY → APPROVED_BY_VOLUNTEER → DONOR_CLAIMED
 *                                    ↓
 *                              REJECTED_BY_VOLUNTEER (closed)
 */

// Community user routes - require community role and approval
router.post('/', authenticateToken, requireCommunity, requireApproved, createRequest);
router.get('/user/:userId', authenticateToken, requireApproved, getUserRequests);

// Volunteer routes - require volunteer role and approval
router.get('/volunteer', authenticateToken, requireVolunteer, requireApproved, getVolunteerRequests);
router.post('/:id/accept', authenticateToken, requireVolunteer, requireApproved, acceptRequest);
router.post('/:id/deny', authenticateToken, requireVolunteer, requireApproved, denyRequest);
router.post('/:id/mark-reached', authenticateToken, requireVolunteer, requireApproved, markReached);
router.post('/:id/decision', authenticateToken, requireVolunteer, requireApproved, makeDecision);

// Donor routes - require donor role and approval
router.get('/approved', authenticateToken, requireDonor, requireApproved, getApprovedRequests);
router.post('/:id/donor-claim', authenticateToken, requireDonor, requireApproved, donorClaim);

// Test route for email service (remove in production)
router.post('/test-email', testEmailService);

export default router;
