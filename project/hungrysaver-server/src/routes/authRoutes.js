import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import emailService from '../services/emailService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Send registration confirmation email
router.post('/send-confirmation-email',
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').isLength({ min: 1 }).trim(),
    body('userType').isIn(['volunteer', 'donor', 'community', 'admin'])
  ],
  validateRequest,
  async (req, res) => {
    const { email, firstName, userType } = req.body;
    // TODO: Use your email service to send the email here
    // For now, just log and return success
    console.log('Send confirmation email to:', email, firstName, userType);
    res.json({ success: true, message: 'Confirmation email sent (mock).' });
  }
);

export default router;