import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    
    // Only initialize if email credentials are provided
    if (this.hasEmailConfig()) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT, 10) || 587,
          secure: process.env.EMAIL_PORT === '465', // Common for port 465
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        this.isConfigured = true;
        logger.info('Email service configured successfully');
      } catch (error) {
        logger.warn('Email service configuration failed:', error.message);
        this.isConfigured = false;
      }
    } else {
      logger.info('Email service disabled - no credentials provided');
    }
  }

  /**
   * Check if email configuration is available
   */
  hasEmailConfig() {
    return !!(
      process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    );
  }

  /**
   * Send email if service is configured, otherwise log the attempt
   */
  async sendEmail(mailOptions) {
    if (!this.isConfigured) {
      logger.info(`Email not sent (service disabled): To: ${mailOptions.to}, Subject: ${mailOptions.subject}`);
      return { messageId: 'disabled' };
    }

    try {
      const result = await this.transporter.sendMail({
        ...mailOptions,
        from: `"Hungry Saver" <${process.env.EMAIL_USER}>`
      });
      logger.info(`Email sent successfully to ${mailOptions.to}`);
      return result;
    } catch (error) {
      logger.error(`Error sending email to ${mailOptions.to}:`, error);
      throw error;
    }
  }

  /**
   * Send welcome confirmation email for new user registration
   */
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
                <a href="${process.env.FRONTEND_URL || 'https://hungrysaver.com'}" 
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
        const mailOptions = {
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
                    <a href="${process.env.FRONTEND_URL || 'https://hungrysaver.com'}/dashboard/${donation.location}" 
                       style="background-color: #16a34a; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; margin-right: 10px;">
                      ✅ Accept Donation
                    </a>
                    <a href="${process.env.FRONTEND_URL || 'https://hungrysaver.com'}/dashboard/${donation.location}" 
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
   * Send donation accepted email
   */
  async sendDonationAcceptedEmail(donation, volunteer) {
    try {
      const mailOptions = {
        to: donation.donorEmail || donation.donorContact,
        subject: 'Your Donation Has Been Accepted! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Great News! Your Donation Has Been Accepted</h2>
            
            <p>Dear ${donation.donorName},</p>
            
            <p>We're excited to let you know that your generous donation has been accepted by one of our volunteers!</p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">Donation Details:</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Initiative:</strong> ${donation.initiative.replace('-', ' ')}</li>
                <li><strong>Location:</strong> ${donation.location}</li>
                <li><strong>Volunteer:</strong> ${volunteer.firstName}</li>
                <li><strong>Status:</strong> Accepted - Pickup scheduled</li>
              </ul>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ol>
              <li>Our volunteer will contact you to arrange pickup</li>
              <li>Your donation will be collected at the scheduled time</li>
              <li>We'll notify you once it's delivered to those in need</li>
            </ol>
            
            <p>Thank you for making a difference in your community! 🙏</p>
            
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
      logger.error('Error sending donation accepted email:', error);
      // Don't throw error to avoid breaking the main flow
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
}

export default new EmailService();