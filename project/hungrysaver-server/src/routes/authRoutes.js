import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';
import emailService from '../services/emailService.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// On User Registration: Send a welcome email
router.post('/send-confirmation-email',
  // [
  //   body('email').isEmail().normalizeEmail(),
  //   body('firstName').isLength({ min: 1 }).trim(),
  //   body('userType').isIn(['volunteer', 'donor', 'community', 'admin'])
  // ],
  // validateRequest,
  async (req, res) => {
    try {
      logger.info('Received request for /send-confirmation-email with body:', req.body);
      await emailService.sendUserRegistrationConfirmation(req.body);
      res.json({ success: true, message: 'Confirmation email sent successfully.' });
    } catch (error) {
      logger.error('Failed to send confirmation email:', error);
      res.status(500).json({ success: false, message: 'Failed to send confirmation email.' });
    }
  }
);

export default router;