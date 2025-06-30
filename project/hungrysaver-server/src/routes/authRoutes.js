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
    try {
      const userData = req.body;
      
      await emailService.sendUserRegistrationConfirmation(userData);
      
      logger.info(`Registration confirmation email sent to ${userData.email}`);
      
      res.json({
        success: true,
        message: 'Confirmation email sent successfully'
      });
    } catch (error) {
      logger.error('Error sending confirmation email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send confirmation email'
      });
    }
  }
);

export default router;