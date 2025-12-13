// Test Email Service
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function testEmail() {
  console.log('🧪 Testing Email Service...');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  // Check SendGrid config
  const hasSendGrid = !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM);
  console.log('\n📧 SendGrid Configuration:');
  console.log('   SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('   SENDGRID_FROM:', process.env.SENDGRID_FROM || '❌ Not set');
  
  // Check SMTP config
  const hasSMTP = !!(process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS);
  console.log('\n📧 SMTP Configuration:');
  console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Not set');
  console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Not set');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ Not set');
  console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set (hidden)' : '❌ Not set');
  
  if (!hasSendGrid && !hasSMTP) {
    console.error('\n❌ Email service is NOT configured!');
    console.error('   Please set either SendGrid or SMTP credentials in .env file');
    return false;
  }
  
  try {
    const emailService = (await import('./src/services/emailService.js')).default;
    
    console.log('\n🔍 Testing email connection...');
    try {
      const connectionTest = await emailService.testEmailConnection();
      
      if (connectionTest && connectionTest.success) {
        console.log('✅ Email connection test PASSED');
      } else {
        console.log('⚠️ Connection test returned:', connectionTest);
        // Continue anyway to test sending
      }
      
      // Try sending a test email
      console.log('\n📨 Sending test email...');
      const testEmailResult = await emailService.sendEmail({
        to: process.env.EMAIL_USER || 'test@example.com',
        subject: '🧪 Hungry Saver - Email Service Test',
        html: `
          <h2>Email Service Test</h2>
          <p>This is a test email from Hungry Saver server.</p>
          <p>If you receive this, the email service is working correctly! ✅</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        `,
        text: 'This is a test email from Hungry Saver server. If you receive this, the email service is working correctly!'
      });
      
      if (testEmailResult && testEmailResult.messageId && testEmailResult.messageId !== 'failed' && testEmailResult.messageId !== 'disabled') {
        console.log('✅ Test email sent successfully!');
        console.log('   Message ID:', testEmailResult.messageId);
        console.log('   Check your inbox:', process.env.EMAIL_USER || 'test@example.com');
        return true;
      } else {
        console.error('❌ Failed to send test email');
        console.error('   Result:', testEmailResult);
        return false;
      }
    } catch (error) {
      console.error('❌ Email test ERROR:', error.message);
      console.error('Stack:', error.stack);
      return false;
    }
  } catch (error) {
    console.error('❌ Email service test ERROR:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

testEmail().then(success => {
  process.exit(success ? 0 : 1);
});

