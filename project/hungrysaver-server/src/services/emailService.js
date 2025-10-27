import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.connectionHealthy = false;
    this.lastConnectionTest = null;
    this.failedAttempts = 0;
    this.maxFailedAttempts = 3;
    this.alternativeProviders = [
      {
        name: 'Gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false
      },
      {
        name: 'Outlook',
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false
      },
      {
        name: 'Yahoo',
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false
      }
    ];
    
    // Only initialize if email credentials are provided
    if (this.hasEmailConfig()) {
      this.initializeTransporter();
    } else {
      logger.info('Email service disabled - no credentials provided');
    }
  }

  initializeTransporter() {
    try {
      // Enhanced configuration for cloud environments
      const config = {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Optimized timeout settings for cloud platforms
        connectionTimeout: 30000,    // 30 seconds (reduced from 60)
        greetingTimeout: 15000,      // 15 seconds (reduced from 30)
        socketTimeout: 30000,        // 30 seconds (reduced from 60)
        // Connection pooling with conservative settings
        pool: true,
        maxConnections: 2,           // Reduced for cloud stability
        maxMessages: 50,             // Reduced for cloud stability
        // Rate limiting
        rateDelta: 30000,            // 30 seconds
        rateLimit: 3,                // Max 3 emails per 30 seconds
        // Additional cloud-friendly settings
        tls: {
          rejectUnauthorized: false,  // For self-signed certificates
          ciphers: 'SSLv3'           // Fallback cipher
        },
        // Retry configuration
        retryDelay: 5000,            // 5 seconds between retries
        retryAttempts: 2              // Max 2 retry attempts
      };

      this.transporter = nodemailer.createTransport(config);
      this.isConfigured = true;
      logger.info('Email service configured successfully');
      
      // Test connection immediately
      this.testConnectionAsync();
    } catch (error) {
      logger.error('Email service configuration failed:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS ? '***HIDDEN***' : 'NOT SET'
        }
      });
      this.isConfigured = false;
    }
  }

  async testConnectionAsync() {
    if (!this.isConfigured) return;
    
    try {
      await this.transporter.verify();
      this.connectionHealthy = true;
      this.failedAttempts = 0;
      this.lastConnectionTest = new Date();
      logger.info('✅ Email connection verified successfully');
    } catch (error) {
      this.connectionHealthy = false;
      this.failedAttempts++;
      logger.warn(`❌ Email connection test failed (attempt ${this.failedAttempts}):`, error.message);
      
      // If too many failures, try to reinitialize
      if (this.failedAttempts >= this.maxFailedAttempts) {
        logger.warn('Too many connection failures, attempting to reinitialize...');
        this.initializeTransporter();
      }
    }
  }

  /**
   * Check if email configuration is available
   */
  hasEmailConfig() {
    const hasConfig = !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );
    
    // Debug logging
    logger.info('Email config check:', {
      EMAIL_HOST: process.env.EMAIL_HOST ? 'SET' : 'NOT SET',
      EMAIL_PORT: process.env.EMAIL_PORT ? 'SET' : 'NOT SET', 
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      EMAIL_PASS: process.env.EMAIL_PASS ? 'SET' : 'NOT SET',
      hasConfig,
      connectionHealthy: this.connectionHealthy,
      isConfigured: this.isConfigured
    });
    
    return hasConfig;
  }

  /**
   * Send email with enhanced error handling and fallback mechanisms
   */
  async sendEmail(mailOptions) {
    if (!this.isConfigured) {
      logger.info(`Email not sent (service disabled): To: ${mailOptions.to}, Subject: ${mailOptions.subject}`);
      return { messageId: 'disabled' };
    }

    // Check if connection is healthy, but don't block sending if it's not
    if (!this.connectionHealthy) {
      logger.warn('Email connection not healthy, attempting to reconnect...');
      await this.testConnectionAsync();
      
      // If still not healthy after retry, log warning but continue
      if (!this.connectionHealthy) {
        logger.warn('Email connection still not healthy, but attempting to send anyway...');
      }
    }

    const maxRetries = 2; // Reduced retries for faster feedback
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`Attempting to send email (attempt ${attempt}/${maxRetries}) to ${mailOptions.to}`);
        
        // Add timeout wrapper
        const sendPromise = this.transporter.sendMail({
          ...mailOptions,
          from: `"Hungry Saver" <${process.env.EMAIL_USER}>`
        });

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Email send timeout')), 25000); // 25 second timeout
        });

        const result = await Promise.race([sendPromise, timeoutPromise]);
        
        logger.info(`✅ Email sent successfully to ${mailOptions.to} on attempt ${attempt}`);
        logger.info(`📧 Email details: Subject="${mailOptions.subject}", MessageId="${result.messageId}"`);
        
        // Reset failed attempts on success
        this.failedAttempts = 0;
        this.connectionHealthy = true;
        
        return result;
      } catch (error) {
        lastError = error;
        logger.warn(`❌ Email send attempt ${attempt} failed for ${mailOptions.to}:`, error.message);
        logger.warn(`🔍 Error details:`, {
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode,
          timeout: error.message.includes('timeout')
        });
        
        // If it's a connection error, try to reconnect
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.message.includes('timeout')) {
          logger.warn('Connection error detected, attempting to reconnect...');
          await this.testConnectionAsync();
        }
        
        if (attempt < maxRetries) {
          const delay = attempt * 3000; // 3s, 6s delays
          logger.info(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error(`Failed to send email to ${mailOptions.to} after ${maxRetries} attempts:`, lastError);
    
    // Log the email content for debugging (without sensitive data)
    logger.error('Failed email details:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasHtml: !!mailOptions.html,
      htmlLength: mailOptions.html ? mailOptions.html.length : 0
    });
    
    // Don't throw error to avoid breaking the main flow
    return { messageId: 'failed', error: lastError.message };
  }

  /**
   * Send donation completion email to donor
   */
  async sendDonationCompletionEmail(donation) {
    try {
      const initiativeNames = {
        'annamitra-seva': 'Annamitra Seva (Food Distribution)',
        'vidya-jyothi': 'Vidya Jyothi (Educational Support)',
        'suraksha-setu': 'Suraksha Setu (Emergency Support)',
        'punarasha': 'PunarAsha (Rehabilitation Support)',
        'raksha-jyothi': 'Raksha Jyothi (Emergency Response)',
        'jyothi-nilayam': 'Jyothi Nilayam (Shelter Support)'
      };

      const initiativeName = initiativeNames[donation.initiative] || donation.initiative;

      const mailOptions = {
        to: donation.donorEmail,
        subject: `🎉 Your ${initiativeName} Donation Has Been Delivered Successfully!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #eaa640 0%, #d4963a 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                🍛 Hungry Saver
              </h1>
              <p style="color: #fef3c7; margin: 10px 0 0 0; font-size: 16px;">
                Your Generosity Has Reached Its Destination! 🎯
              </p>
            </div>

            <!-- Main Content -->
            <div style="background-color: white; padding: 40px 30px;">
              <h2 style="color: #eaa640; margin-top: 0; font-size: 24px;">
                🎉 Donation Successfully Delivered!
              </h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Dear ${donation.donorName},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Great news! Your <strong>${initiativeName}</strong> donation has been successfully delivered to the beneficiary. 
                Your generosity has made a real difference in someone's life today.
              </p>

              <!-- Donation Details -->
              <div style="background-color: #fef3c7; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #eaa640;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">
                  📦 Donation Details
                </h3>
                <div style="color: #a16207; font-size: 15px; line-height: 1.5;">
                  <p><strong>Initiative:</strong> ${initiativeName}</p>
                  <p><strong>Description:</strong> ${donation.description}</p>
                  <p><strong>Location:</strong> ${donation.location}</p>
                  <p><strong>Delivery Date:</strong> ${new Date(donation.deliveredAt).toLocaleDateString()}</p>
                </div>
              </div>

              <!-- Volunteer Feedback -->
              ${donation.feedback ? `
              <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #16a34a;">
                <h3 style="color: #15803d; margin-top: 0; font-size: 18px;">
                  💬 Volunteer Feedback
                </h3>
                <p style="color: #166534; margin: 0; font-size: 15px; line-height: 1.5; font-style: italic;">
                  "${donation.feedback}"
                </p>
                ${donation.feedbackImageUrl ? `
                <div style="margin-top: 15px;">
                  <img src="${donation.feedbackImageUrl}" alt="Delivery Proof" style="max-width: 200px; border-radius: 8px; border: 2px solid #16a34a;" />
                  <p style="color: #166534; margin: 5px 0 0 0; font-size: 12px;">📸 Delivery Proof Image</p>
                </div>
                ` : ''}
              </div>
              ` : ''}

              <!-- Impact Message -->
              <div style="background-color: #e0e7ff; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #6366f1;">
                <h3 style="color: #3730a3; margin-top: 0; font-size: 18px;">
                  🌟 Your Impact
                </h3>
                <p style="color: #4338ca; margin: 0; font-size: 15px; line-height: 1.5;">
                  Because of your donation, a family or individual in need has received essential support. 
                  Your act of kindness has created a ripple effect of hope and compassion in our community.
                </p>
              </div>

              <!-- Thank You Message -->
              <div style="text-align: center; margin: 30px 0; padding: 25px; background-color: #fef3c7; border-radius: 8px;">
                <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">
                  🙏 Thank You for Your Generosity!
                </h3>
                <p style="color: #a16207; margin: 0; font-size: 16px; line-height: 1.6;">
                  Your donation has been successfully delivered to those who needed it most. 
                  Together, we're building stronger, more compassionate communities.
                </p>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://hungrysaver.netlify.app" 
                   style="display: inline-block; background: linear-gradient(135deg, #eaa640 0%, #d4963a 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  🌐 Visit Our Website
                </a>
                <p style="color: #6b7280; margin: 10px 0 0 0; font-size: 14px;">
                  Track your impact and make more donations
                </p>
              </div>

              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Hungry Saver - Building Bridges of Hope Across Communities
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `
      };

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Error sending donation completion email:', error);
      throw error;
    }
  }

  async sendUserRegistrationConfirmation(user) {
    try {
      const userTypeMessages = {
        volunteer: {
          title: 'Welcome to the Hungry Saver Volunteer Family! 🌟',
          role: 'Volunteer',
          message: 'You\'re now part of our amazing community of changemakers! Your application is being reviewed and you\'ll be notified once approved.',
          impact: 'As a volunteer, you\'ll help coordinate food distribution, support community initiatives, and directly impact lives in your area.',
          nextSteps: [
            'Wait for admin approval (usually within 24-48 hours)',
            'Once approved, access your volunteer dashboard',
            'Start accepting donation requests in your location',
            'Track your impact and help statistics'
          ]
        },
        donor: {
          title: 'Thank You for Joining Hungry Saver! 💝',
          role: 'Donor',
          message: 'Your generosity will help feed families and support communities across Andhra Pradesh.',
          impact: 'Every donation you make will be matched with families in need, creating immediate impact in your community.',
          nextSteps: [
            'Access your donor dashboard immediately',
            'Submit your first donation through our 6 initiatives',
            'Track your donations and see their impact',
            'Receive updates when your donations reach families'
          ]
        },
        community: {
          title: 'Welcome to Hungry Saver Community Support! 🤝',
          role: 'Community Member',
          message: 'You now have access to community support through our 6 specialized initiatives.',
          impact: 'Our platform connects you with volunteers and donors who are ready to help when you need support.',
          nextSteps: [
            'Access your community dashboard immediately',
            'Submit support requests through our initiatives',
            'Connect with volunteers in your area',
            'Access resources and assistance when needed'
          ]
        }
      };

      const userMessage = userTypeMessages[user.userType] || userTypeMessages.community;

      const mailOptions = {
        to: user.email,
        subject: userMessage.title,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                🍛 Hungry Saver
              </h1>
              <p style="color: #dcfce7; margin: 10px 0 0 0; font-size: 16px;">
                Building Bridges of Hope Across Communities
              </p>
            </div>

            <!-- Main Content -->
            <div style="background-color: white; padding: 40px 30px;">
              <h2 style="color: #16a34a; margin-top: 0; font-size: 24px;">
                ${userMessage.title}
              </h2>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                Dear ${user.firstName},
              </p>
              
              <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                ${userMessage.message}
              </p>

              <!-- Impact Section -->
              <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #16a34a;">
                <h3 style="color: #15803d; margin-top: 0; font-size: 18px;">
                  🎯 Your Impact as a ${userMessage.role}
                </h3>
                <p style="color: #166534; margin: 0; font-size: 15px; line-height: 1.5;">
                  ${userMessage.impact}
                </p>
              </div>

              <!-- Next Steps -->
              <h3 style="color: #374151; font-size: 18px; margin-bottom: 15px;">
                🚀 What Happens Next:
              </h3>
              <ol style="color: #374151; font-size: 15px; line-height: 1.6; padding-left: 20px;">
                ${userMessage.nextSteps.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
              </ol>

              <!-- Our 6 Initiatives -->
              <div style="margin: 30px 0;">
                <h3 style="color: #374151; font-size: 18px; margin-bottom: 20px;">
                  🌟 Our 6 Community Initiatives:
                </h3>
                <div style="display: grid; gap: 15px;">
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #fef3c7; border-radius: 6px;">
                    <span style="font-size: 20px; margin-right: 12px;">🍛</span>
                    <div>
                      <strong style="color: #92400e;">Annamitra Seva</strong>
                      <span style="color: #a16207; font-size: 14px;"> - Food distribution & surplus management</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #dbeafe; border-radius: 6px;">
                    <span style="font-size: 20px; margin-right: 12px;">📚</span>
                    <div>
                      <strong style="color: #1e40af;">Vidya Jyothi</strong>
                      <span style="color: #2563eb; font-size: 14px;"> - Educational support for children</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #e0e7ff; border-radius: 6px;">
                    <span style="font-size: 20px; margin-right: 12px;">🛡️</span>
                    <div>
                      <strong style="color: #5b21b6;">Suraksha Setu</strong>
                      <span style="color: #7c3aed; font-size: 14px;"> - Emergency support for vulnerable communities</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #fce7f3; border-radius: 6px;">
                    <span style="font-size: 20px; margin-right: 12px;">🏠</span>
                    <div>
                      <strong style="color: #be185d;">PunarAsha</strong>
                      <span style="color: #db2777; font-size: 14px;"> - Rehabilitation support for families</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #fef2f2; border-radius: 6px;">
                    <span style="font-size: 20px; margin-right: 12px;">⚡</span>
                    <div>
                      <strong style="color: #dc2626;">Raksha Jyothi</strong>
                      <span style="color: #ef4444; font-size: 14px;"> - Emergency response for humans & animals</span>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; padding: 12px; background-color: #fffbeb; border-radius: 6px;">
                    <span style="font-size: 20px; margin-right: 12px;">🏛️</span>
                    <div>
                      <strong style="color: #d97706;">Jyothi Nilayam</strong>
                      <span style="color: #f59e0b; font-size: 14px;"> - Shelter support for humans & animals</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://hungrysaver.netlify.app" 
                   style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Access Your Dashboard
                </a>
              </div>

              <!-- Motivational Quote -->
              <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                <p style="font-style: italic; color: #475569; margin: 0; font-size: 16px;">
                  "Every small act of kindness creates ripples of change in our community."
                </p>
              </div>

              <p style="color: #374151; font-size: 15px; line-height: 1.6;">
                Thank you for choosing to make a difference. Together, we're not just changing lives—we're building a hunger-free, supportive community across Andhra Pradesh.
              </p>

              <p style="color: #374151; font-size: 15px;">
                With gratitude,<br>
                <strong>The Hungry Saver Team</strong>
              </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                This is an automated message from Hungry Saver Platform.<br>
                If you have any questions, please contact us at <a href="mailto:support@hungrysaver.com" style="color: #16a34a;">support@hungrysaver.com</a>
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                Hungry Saver - Building bridges of hope across communities in Andhra Pradesh
              </p>
            </div>
          </div>
        `
      };

      await this.sendEmail(mailOptions);
      logger.info(`Registration confirmation email sent to ${user.email} (${user.userType})`);
    } catch (error) {
      logger.error('Error sending registration confirmation email:', error);
      // Don't throw error to avoid breaking the registration flow
    }
  }

  /**
   * Send donation notification to volunteers in the same location
   */
  async sendDonationNotificationToVolunteers(donation, volunteers) {
    try {
      logger.info(`Starting email notification for donation ${donation.id} to ${volunteers?.length || 0} volunteers`);
      logger.info('Email service configured:', this.isConfigured);
      
      if (!volunteers || volunteers.length === 0) {
        logger.info('No volunteers found to notify for donation:', donation.id);
        return;
      }

      const donationTypeEmojis = {
        'annamitra-seva': '🍛',
        'vidya-jyothi': '📚',
        'suraksha-setu': '🛡️',
        'punarasha': '🏠',
        'raksha-jyothi': '⚡',
        'jyothi-nilayam': '🏛️'
      };

      const emoji = donationTypeEmojis[donation.initiative] || '💝';
      const initiativeName = donation.initiative.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Send email to each volunteer
      const emailPromises = volunteers.map(async (volunteer) => {
        logger.info(`Processing volunteer ${volunteer.id} with email: ${volunteer.email}`);
        
        if (!volunteer.email) {
          logger.warn(`Volunteer ${volunteer.id} has no email, skipping.`);
          return;
        }

        let mailOptions;
        // Community request donation: show both needy and donor info
        if (donation.source === 'community-request' || (donation.details && donation.details.originalRequestId)) {
          mailOptions = {
            to: volunteer.email,
            subject: `🚨 New Community Request Donation in ${donation.location.charAt(0).toUpperCase() + donation.location.slice(1)}!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
                <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
                    🚨 URGENT: New Community Request Donation!
                  </h1>
                  <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">
                    A family in ${donation.location} needs your help
                  </p>
                </div>
                <div style="background-color: white; padding: 30px;">
                  <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">
                    Hello ${volunteer.firstName}! 👋
                  </h2>
                  <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                    A new donation has been submitted in response to a community request and needs immediate volunteer coordination.
                  </p>
                  <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <h3 style="color: #991b1b; margin-top: 0; font-size: 18px; display: flex; align-items: center;">
                      ${emoji} ${initiativeName} Donation
                    </h3>
                    <div style="color: #7f1d1d; font-size: 15px; line-height: 1.6;">
                      <p style="margin: 8px 0;"><strong>🆘 Needy (Beneficiary) Details:</strong></p>
                      <ul style="margin: 0 0 10px 0; padding-left: 18px; color: #991b1b;">
                        <li><strong>Name:</strong> ${donation.beneficiaryName || (donation.details && donation.details.beneficiaryName) || '-'}</li>
                        <li><strong>Contact:</strong> ${donation.beneficiaryContact || (donation.details && donation.details.beneficiaryContact) || '-'}</li>
                        <li><strong>Address:</strong> ${donation.address || '-'}</li>
                      </ul>
                      <p style="margin: 8px 0;"><strong>🤝 Donor Details:</strong></p>
                      <ul style="margin: 0 0 10px 0; padding-left: 18px; color: #166534;">
                        <li><strong>Name:</strong> ${donation.donorName || '-'}</li>
                        <li><strong>Contact:</strong> ${donation.donorContact || '-'}</li>
                        <li><strong>Address:</strong> ${donation.donorAddress || '-'}</li>
                      </ul>
                      <p style="margin: 8px 0;"><strong>📝 Description:</strong> ${donation.description || '-'}</p>
                      <p style="margin: 8px 0;"><strong>⏰ Submitted:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                  </div>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://hungrysaver.netlify.app/dashboard/${donation.location}" 
                       style="background-color: #16a34a; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; margin-right: 10px;">
                      ✅ Accept Donation
                    </a>
                    <a href="https://hungrysaver.netlify.app/dashboard/${donation.location}"
                       style="background-color: #6b7280; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                      👀 View Details
                    </a>
                  </div>
                  <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
                    <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                      ⚡ <strong>Time Sensitive:</strong> Please respond within 2 hours to ensure timely delivery
                    </p>
                  </div>
                  <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h4 style="color: #15803d; margin-top: 0; font-size: 16px;">
                      🌟 Your Impact Matters
                    </h4>
                    <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">
                      By accepting this donation, you're directly helping families in need and strengthening our community support network. Every action creates ripples of hope!
                    </p>
                  </div>
                  <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                    Thank you for being a vital part of the Hungry Saver volunteer network. Your dedication makes real change possible.
                  </p>
                  <p style="color: #374151; font-size: 14px;">
                    Best regards,<br>
                    <strong>The Hungry Saver Team</strong>
                  </p>
                </div>
                <div style="background-color: #f8fafc; padding: 15px 30px; text-align: center; border-radius: 0 0 12px 12px;">
                  <p style="color: #6b7280; font-size: 11px; margin: 0;">
                    This is an automated notification from Hungry Saver Platform.<br>
                    If you have questions, contact us at <a href="mailto:support@hungrysaver.com" style="color: #16a34a;">support@hungrysaver.com</a>
                  </p>
                </div>
              </div>
            `
          };
        } else {
          mailOptions = {
            to: volunteer.email,
            subject: `🚨 New Donation Alert in ${donation.location.charAt(0).toUpperCase() + donation.location.slice(1)}!`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 25px; text-align: center; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">
                  🚨 URGENT: New Donation Available!
                </h1>
                <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">
                  A family in ${donation.location} needs your help
                </p>
              </div>

              <!-- Main Content -->
              <div style="background-color: white; padding: 30px;">
                <h2 style="color: #dc2626; margin-top: 0; font-size: 20px;">
                  Hello ${volunteer.firstName}! 👋
                </h2>
                
                <p style="font-size: 16px; line-height: 1.6; color: #374151;">
                  A new donation has been submitted in your area and needs immediate volunteer coordination.
                </p>

                <!-- Donation Details -->
                <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <h3 style="color: #991b1b; margin-top: 0; font-size: 18px; display: flex; align-items: center;">
                    ${emoji} ${initiativeName} Donation
                  </h3>
                  <div style="color: #7f1d1d; font-size: 15px; line-height: 1.6;">
                    <p style="margin: 8px 0;"><strong>📍 Location:</strong> ${donation.location.charAt(0).toUpperCase() + donation.location.slice(1)}</p>
                    <p style="margin: 8px 0;"><strong>👤 Donor:</strong> ${donation.donorName}</p>
                    <p style="margin: 8px 0;"><strong>📞 Contact:</strong> ${donation.donorContact}</p>
                    <p style="margin: 8px 0;"><strong>📍 Address:</strong> ${donation.address}</p>
                    <p style="margin: 8px 0;"><strong>📝 Description:</strong> ${donation.description}</p>
                    <p style="margin: 8px 0;"><strong>⏰ Submitted:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div style="text-align: center; margin: 30px 0;">
                  <div style="margin-bottom: 15px;">
                                      <a href="https://hungrysaver.netlify.app/dashboard/${donation.location}" 
                     style="background-color: #16a34a; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; margin-right: 10px;">
                    ✅ Accept Donation
                  </a>
                  <a href="https://hungrysaver.netlify.app/dashboard/${donation.location}" 
                     style="background-color: #6b7280; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                    👀 View Details
                  </a>
                  </div>
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">
                    Click "Accept Donation" to coordinate pickup and delivery
                  </p>
                </div>

                <!-- Urgency Notice -->
                <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px; text-align: center;">
                    ⚡ <strong>Time Sensitive:</strong> Please respond within 2 hours to ensure timely delivery
                  </p>
                </div>

                <!-- Impact Message -->
                <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h4 style="color: #15803d; margin-top: 0; font-size: 16px;">
                    🌟 Your Impact Matters
                  </h4>
                  <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.5;">
                    By accepting this donation, you're directly helping families in need and strengthening our community support network. Every action creates ripples of hope!
                  </p>
                </div>

                <p style="color: #374151; font-size: 14px; line-height: 1.6;">
                  Thank you for being a vital part of the Hungry Saver volunteer network. Your dedication makes real change possible.
                </p>

                <p style="color: #374151; font-size: 14px;">
                  Best regards,<br>
                  <strong>The Hungry Saver Team</strong>
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 15px 30px; text-align: center; border-radius: 0 0 12px 12px;">
                <p style="color: #6b7280; font-size: 11px; margin: 0;">
                  This is an automated notification from Hungry Saver Platform.<br>
                  If you have questions, contact us at <a href="mailto:support@hungrysaver.com" style="color: #16a34a;">support@hungrysaver.com</a>
                </p>
              </div>
            </div>
          `
        };
        }

        logger.info(`Sending email to volunteer ${volunteer.email} for donation ${donation.id}`);
        return this.sendEmail(mailOptions);
      });

      await Promise.all(emailPromises);
      logger.info(`Donation notification emails sent to ${volunteers.length} volunteers for donation ${donation.id}`);
    } catch (error) {
      logger.error('Error sending donation notification emails to volunteers:', error);
      // Don't throw error to avoid breaking the donation flow
    }
  }

  /**
   * Send donation accepted email to donor
   */
  async sendDonationAcceptedEmail(donation, volunteer) {
    try {
      const mailOptions = {
        to: donation.donorEmail,
        subject: '🎉 Your Donation Has Been Accepted!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #eaa640 0%, #ecae53 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Donation Accepted!</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Your generosity is making a difference!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${donation.donorName || 'Generous Donor'}!</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Great news! Your donation has been accepted by <strong>${volunteer.firstName} ${volunteer.lastName || ''}</strong>, 
                a volunteer in your area.
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eaa640;">
                <h3 style="color: #333; margin-top: 0;">📋 Donation Details</h3>
                <p><strong>Initiative:</strong> ${donation.initiative ? donation.initiative.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Community Support'}</p>
                <p><strong>Location:</strong> ${donation.location || 'Your area'}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Accepted for Pickup</span></p>
            </div>
            
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #155724; margin-top: 0;">📞 What Happens Next?</h3>
                <ol style="color: #155724; line-height: 1.8;">
                  <li><strong>${volunteer.firstName}</strong> will contact you within 2-6 hours to arrange pickup</li>
                  <li>They will coordinate the pickup time and location</li>
                  <li>Your donation will be delivered to families in need</li>
                  <li>You'll receive updates on the delivery status</li>
            </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-style: italic;">
                  "Your small step today can become someone's reason to survive tomorrow."
                </p>
              </div>
              
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7;">
                <h3 style="color: #856404; margin-top: 0;">💡 Need to Make Changes?</h3>
                <p style="color: #856404; margin-bottom: 0;">
                  If you need to modify pickup details or have questions, please contact us at 
                  <a href="mailto:support@hungrysaver.com" style="color: #eaa640;">support@hungrysaver.com</a>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>Thank you for being part of the Hungry Saver community! 🌟</p>
              <p>This email was sent from Hungry Saver - Connecting Generosity with Need</p>
            </div>
          </div>
        `
      };

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Error sending donation accepted email:', error);
      throw error;
    }
  }

  /**
   * Send community request claimed email to volunteer
   */
  async sendCommunityRequestClaimedEmail(request, volunteer, donorDetails) {
    try {
      const mailOptions = {
        to: volunteer.email,
        subject: `🎯 Community Request Claimed in ${request.location}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #eaa640 0%, #ecae53 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎯 Request Claimed!</h1>
              <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">A donor has claimed your approved community request!</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-top: 0;">Hello ${volunteer.firstName}!</h2>
              
              <p style="color: #555; line-height: 1.6;">
                Excellent news! A generous donor has claimed the community request you approved. 
                It's time to coordinate the pickup and delivery!
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #eaa640;">
                <h3 style="color: #333; margin-top: 0;">📋 Request Details</h3>
                <p><strong>Initiative:</strong> ${request.initiative ? request.initiative.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Community Support'}</p>
                <p><strong>Location:</strong> ${request.location || 'Your area'}</p>
                <p><strong>Beneficiary:</strong> ${request.beneficiaryName || 'Community Member'}</p>
                <p><strong>Description:</strong> ${request.description || 'Support needed'}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Claimed by Donor</span></p>
              </div>
              
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #155724; margin-top: 0;">📍 Pickup Information</h3>
                <p><strong>Donor Address:</strong> ${donorDetails.donorAddress}</p>
                ${donorDetails.donorNotes ? `<p><strong>Donor Notes:</strong> ${donorDetails.donorNotes}</p>` : ''}
                <p><strong>Claimed At:</strong> ${new Date().toLocaleString('en-IN')}</p>
              </div>
              
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border: 1px solid #ffeaa7;">
                <h3 style="color: #856404; margin-top: 0;">🚀 Next Steps</h3>
                <ol style="color: #856404; line-height: 1.8;">
                  <li><strong>Contact the donor</strong> within 2-6 hours to arrange pickup</li>
                  <li><strong>Coordinate pickup time</strong> and location with the donor</li>
                  <li><strong>Collect the donation</strong> from the donor's address</li>
                  <li><strong>Deliver to beneficiary</strong> at ${request.address || 'the specified location'}</li>
                  <li><strong>Update status</strong> in your volunteer dashboard</li>
                </ol>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #666; font-style: italic;">
                  "You're the bridge between generosity and need. Thank you for your service!"
                </p>
              </div>
              
              <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; border: 1px solid #bee5eb;">
                <h3 style="color: #0c5460; margin-top: 0;">📱 Dashboard Access</h3>
                <p style="color: #0c5460; margin-bottom: 0;">
                  Access your volunteer dashboard to track this request and update its status as you progress through the delivery process.
                </p>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
              <p>Thank you for your dedication to serving the community! 🌟</p>
              <p>This email was sent from Hungry Saver - Connecting Generosity with Need</p>
            </div>
          </div>
        `
      };

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Error sending community request claimed email:', error);
      throw error;
    }
  }

  /**
   * Send email notification to volunteers when a new community request is created in their city
   */
  async sendNewCommunityRequestEmail(request, volunteer) {
    try {
      // Get initiative details with emojis
      const initiativeDetails = {
        'annamitra-seva': { name: 'Annamitra Seva', emoji: '🍛', description: 'Food assistance for families in need' },
        'vidya-jyothi': { name: 'Vidya Jyothi', emoji: '📚', description: 'Educational support for children' },
        'suraksha-setu': { name: 'Suraksha Setu', emoji: '🛡️', description: 'Emergency support during crisis' },
        'punarasha': { name: 'PunarAsha', emoji: '🏠', description: 'Rehabilitation support for families' },
        'raksha-jyothi': { name: 'Raksha Jyothi', emoji: '⚡', description: 'Emergency response for critical situations' },
        'jyothi-nilayam': { name: 'Jyothi Nilayam', emoji: '🏛️', description: 'Support for shelters and sanctuaries' }
      };

      const initiative = initiativeDetails[request.initiative] || { 
        name: request.initiative.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
        emoji: '💝', 
        description: 'Community support request' 
      };

      const urgencyColors = {
        'low': '#10b981',
        'medium': '#f59e0b', 
        'high': '#ef4444'
      };

      const urgencyLabels = {
        'low': 'Low Priority',
        'medium': 'Medium Priority',
        'high': 'High Priority'
      };

      const mailOptions = {
        to: volunteer.email,
        subject: `${initiative.emoji} New ${initiative.name} Request in ${request.location}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #f8fafc;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #eaa640 0%, #ecae53 100%); padding: 35px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 4px 15px rgba(234, 166, 64, 0.3);">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                ${initiative.emoji} New Community Request!
              </h1>
              <p style="color: white; margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">
                A family in <strong>${request.location}</strong> needs your help
              </p>
              <div style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; display: inline-block; margin-top: 15px;">
                <span style="color: white; font-weight: bold; font-size: 14px;">
                  Priority: ${urgencyLabels[request.urgency]}
                </span>
              </div>
            </div>
            
            <!-- Main Content -->
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333; margin-top: 0; font-size: 24px;">Hello ${volunteer.firstName}! 👋</h2>
              
              <p style="color: #666; line-height: 1.7; font-size: 16px; margin-bottom: 25px;">
                A new <strong>${initiative.name}</strong> request has been submitted in <strong>${request.location}</strong> and needs your attention. 
                As a trusted volunteer in this area, you can help make a real difference in someone's life.
              </p>
              
              <!-- Initiative Info -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #0ea5e9;">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                  <span style="font-size: 28px; margin-right: 15px;">${initiative.emoji}</span>
                  <div>
                    <h3 style="color: #0c4a6e; margin: 0; font-size: 20px;">${initiative.name}</h3>
                    <p style="color: #0369a1; margin: 5px 0 0 0; font-size: 14px;">${initiative.description}</p>
                  </div>
                </div>
              </div>
              
              <!-- Request Details -->
              <div style="background: #f8f9fa; padding: 30px; border-radius: 12px; margin: 25px 0; border: 1px solid #e9ecef;">
                <h3 style="color: #333; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
                  📋 Request Details
                  <span style="background: ${urgencyColors[request.urgency]}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin-left: 15px; font-weight: normal;">
                    ${urgencyLabels[request.urgency]}
                  </span>
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                  <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #eaa640;">
                    <strong style="color: #555; font-size: 14px;">👤 BENEFICIARY NAME</strong><br>
                    <span style="color: #333; font-size: 16px; font-weight: 500;">${request.beneficiaryName}</span>
                  </div>
                  <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #eaa640;">
                    <strong style="color: #555; font-size: 14px;">📞 CONTACT NUMBER</strong><br>
                    <span style="color: #333; font-size: 16px; font-weight: 500;">${request.beneficiaryContact}</span>
                  </div>
                  <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #eaa640;">
                    <strong style="color: #555; font-size: 14px;">📍 LOCATION</strong><br>
                    <span style="color: #333; font-size: 16px; font-weight: 500;">${request.location}</span>
                  </div>
                  <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #eaa640;">
                    <strong style="color: #555; font-size: 14px;">🏠 ADDRESS</strong><br>
                    <span style="color: #333; font-size: 16px; font-weight: 500;">${request.address}</span>
                  </div>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #eaa640;">
                  <strong style="color: #555; font-size: 14px;">📝 DESCRIPTION</strong><br>
                  <span style="color: #333; font-size: 16px; line-height: 1.6;">${request.description}</span>
                </div>
              </div>
              
              <!-- How to Help -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; border-radius: 12px; margin: 25px 0; border-left: 5px solid #16a34a;">
                <h3 style="color: #15803d; margin-top: 0; font-size: 20px; display: flex; align-items: center;">
                  🎯 How You Can Help
                </h3>
                <ol style="color: #166534; line-height: 2; margin: 20px 0 0 0; padding-left: 25px; font-size: 16px;">
                  <li><strong>Review the request</strong> and assess if you can provide assistance</li>
                  <li><strong>Accept the request</strong> if you're available and capable of helping</li>
                  <li><strong>Visit the beneficiary</strong> to verify the need and gather more details</li>
                  <li><strong>Make a decision</strong> to approve or reject based on your verification</li>
                  <li><strong>Coordinate with donors</strong> once the request is approved</li>
                </ol>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://hungrysaver.netlify.app/dashboard/${request.location_lowercase}" 
                   style="background: linear-gradient(135deg, #eaa640 0%, #ecae53 100%); color: white; padding: 18px 40px; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 18px; display: inline-block; box-shadow: 0 4px 15px rgba(234, 166, 64, 0.4); transition: all 0.3s ease;">
                  📱 View Request in Dashboard
                </a>
              </div>
              
              <!-- Footer -->
              <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #f1f5f9; text-align: center;">
                <p style="color: #475569; margin: 0; font-size: 16px; font-weight: 500;">
                  Your dedication to helping families in ${request.location} is truly appreciated! 🌟
                </p>
                <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px;">
                  Please respond to this request within <strong>24 hours</strong> to ensure timely assistance.
                </p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
                  <p style="color: #64748b; margin: 0; font-size: 13px;">
                    <strong>Request ID:</strong> ${request.id} | <strong>Submitted:</strong> ${new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        `
      };

      return await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Error sending new community request email:', error);
      throw error;
    }
  }

  /**
   * Send donation delivered email
   */
  async sendDonationDeliveredEmail(donation, volunteer, motivationalMessage) {
    try {
      const mailOptions = {
        to: donation.donorEmail || donation.donorContact,
        subject: 'Delivery Complete - You Made a Difference! 🌟',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Mission Accomplished! 🎉</h2>
            
            <p>Dear ${donation.donorName},</p>
            
            <p>We're thrilled to share that your donation has been successfully delivered!</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #16a34a;">
              <h3 style="color: #15803d; margin-top: 0;">🎯 Impact Summary</h3>
              <p style="font-size: 18px; color: #15803d; font-weight: bold;">${motivationalMessage}</p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #334155; margin-top: 0;">Delivery Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Initiative:</strong> ${donation.initiative.replace('-', ' ')}</li>
                <li><strong>Location:</strong> ${donation.location}</li>
                <li><strong>Delivered by:</strong> ${volunteer.firstName}</li>
                <li><strong>Completed:</strong> ${new Date().toLocaleDateString()}</li>
              </ul>
            </div>
            
            <p>Your kindness has created ripples of hope in the community. Thank you for being part of the solution to hunger and need.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Make Another Donation
              </a>
            </div>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from Hungry Saver Platform.<br>
              If you have any questions, please contact us at support@hungrysaver.com
            </p>
          </div>
        `
      };

      await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Error sending donation delivered email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Send volunteer welcome email
   */
  async sendVolunteerWelcomeEmail(volunteer) {
    try {
      const mailOptions = {
        to: volunteer.email,
        subject: 'Welcome to Hungry Saver - You\'re Approved! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Welcome to the Hungry Saver Family! 🎉</h2>
            
            <p>Dear ${volunteer.firstName},</p>
            
            <p>Congratulations! Your volunteer application has been approved. You're now part of our amazing community of changemakers in ${volunteer.location}!</p>
            
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #15803d; margin-top: 0;">🌟 What You Can Do Now:</h3>
              <ul>
                <li>Access your volunteer dashboard</li>
                <li>View and accept donation requests in ${volunteer.location}</li>
                <li>Coordinate pickups and deliveries</li>
                <li>Track your impact and help statistics</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Access Your Dashboard
              </a>
            </div>
            
            <p>Thank you for choosing to make a difference. Together, we're building a hunger-free community!</p>
            
            <hr style="margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from Hungry Saver Platform.<br>
              If you have any questions, please contact us at support@hungrysaver.com
            </p>
          </div>
        `
      };

      await this.sendEmail(mailOptions);
    } catch (error) {
      logger.error('Error sending volunteer welcome email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async sendNewDonationAlert(...args) {
    return this.sendDonationNotificationToVolunteers(...args);
  }

  /**
   * Test email connection with enhanced error handling
   */
  async testEmailConnection() {
    if (!this.isConfigured) {
      logger.warn('Email service not configured - cannot test connection');
      return false;
    }

    try {
      logger.info('🔍 Testing email connection...');
      
      // Add timeout to prevent hanging
      const verifyPromise = this.transporter.verify();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection test timeout')), 20000); // 20 second timeout
      });

      await Promise.race([verifyPromise, timeoutPromise]);
      
      this.connectionHealthy = true;
      this.failedAttempts = 0;
      this.lastConnectionTest = new Date();
      logger.info('✅ Email connection test successful');
      return true;
    } catch (error) {
      this.connectionHealthy = false;
      this.failedAttempts++;
      logger.error('❌ Email connection test failed:', error);
      
      // Log specific error details for debugging
      logger.error('Connection error details:', {
        code: error.code,
        command: error.command,
        response: error.response,
        timeout: error.message.includes('timeout')
      });
      
      return false;
    }
  }

  /**
   * Get email service health status
   */
  getHealthStatus() {
    return {
      configured: this.isConfigured,
      healthy: this.connectionHealthy,
      lastTest: this.lastConnectionTest,
      failedAttempts: this.failedAttempts,
      maxFailedAttempts: this.maxFailedAttempts
    };
  }
}

export default new EmailService();