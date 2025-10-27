# Email Notification Setup Guide

## Overview
Hungry Saver supports email notifications for volunteers when new community requests are created in their city. This ensures volunteers are immediately notified about requests that need their attention.

## ⚠️ Common Issues & Solutions

### Connection Timeout Issues (ETIMEDOUT)
If you're experiencing connection timeouts like `Connection timeout` or `ETIMEDOUT`, this is common in cloud environments. Here are the solutions:

#### Solution 1: Use Gmail with App Password (Recommended)
```bash
# In your .env file
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Steps to set up Gmail App Password:**
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings → Security → App passwords
3. Generate a new app password for "Mail"
4. Use this 16-character password (not your regular Gmail password)

#### Solution 2: Use Outlook/Hotmail
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

#### Solution 3: Use Yahoo Mail
```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

## Configuration Required

### 1. Create .env file
Create a file named `.env` in the `hungrysaver-server` directory.

### 2. Add Email Configuration
```bash
# Email Service Settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client URL for email links
CLIENT_URL=http://localhost:5173
```

## Email Service Options

### Option 1: Gmail (Recommended for testing)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Note:** For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password" from Google Account settings
3. Use the app password instead of your regular password

### Option 2: Outlook/Hotmail
```bash
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Option 3: Custom SMTP Server
```bash
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Cloud Platform Specific Settings

### For Render.com Deployment
If deploying on Render.com, add these environment variables in your Render dashboard:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
NODE_ENV=production
```

### For Heroku Deployment
```bash
heroku config:set EMAIL_HOST=smtp.gmail.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=your-gmail@gmail.com
heroku config:set EMAIL_PASS=your-app-password
```

## Enhanced Error Handling Features

The updated email service now includes:

1. **Connection Health Monitoring**: Automatically detects and recovers from connection issues
2. **Timeout Protection**: Prevents hanging connections with 25-second timeouts
3. **Retry Logic**: Automatically retries failed sends with exponential backoff
4. **Graceful Degradation**: Continues to work even if email fails
5. **Detailed Logging**: Better error messages for debugging

## Testing Email Notifications

### 1. Test Connection
The server will automatically test the email connection on startup. Check the logs for:
```
✅ Email connection test successful
```

### 2. Test Email Sending
1. Create a community request in any city (e.g., "tirupati")
2. Check if volunteers in that city receive email notifications
3. Verify email content and links work correctly

### 3. Monitor Email Health
Check the `/health` endpoint to see email service status:
```bash
curl https://your-server.com/health
```

## Troubleshooting

### Emails Not Sending
- ✅ Check if `.env` file exists and has correct credentials
- ✅ Verify email service credentials are valid
- ✅ Check server logs for email errors
- ✅ Ensure email service is not blocked by firewall
- ✅ Try using Gmail with App Password (most reliable)

### Connection Timeout Errors
- ✅ Use Gmail with App Password (recommended)
- ✅ Try different email providers (Outlook, Yahoo)
- ✅ Check if your hosting provider blocks SMTP ports
- ✅ Verify firewall settings allow outbound SMTP connections

### Email Configuration Issues
- ✅ Verify EMAIL_HOST and EMAIL_PORT are correct
- ✅ Check if EMAIL_USER and EMAIL_PASS are properly set
- ✅ Test SMTP connection manually if needed
- ✅ Ensure no extra spaces in environment variables

### Gmail App Password Issues
- ✅ Make sure 2-Factor Authentication is enabled
- ✅ Generate a new app password if the old one doesn't work
- ✅ Use the 16-character app password, not your regular password
- ✅ Check if "Less secure app access" is enabled (if not using app passwords)

## Security Notes

- ✅ Never commit `.env` file to version control
- ✅ Use app passwords for Gmail (not regular passwords)
- ✅ Consider using environment variables in production
- ✅ Regularly rotate email credentials
- ✅ Use different email accounts for development and production

## Production Recommendations

### For Production Deployment:
1. **Use a dedicated email service** like SendGrid, Mailgun, or AWS SES
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor email delivery rates** and bounce rates
4. **Implement email templates** for better deliverability
5. **Set up email analytics** to track open rates and engagement

### Example Production Setup with SendGrid:
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

## Support

If you encounter issues with email setup:

1. **Check the server logs** for detailed error messages
2. **Test with Gmail App Password** first (most reliable)
3. **Verify your hosting provider** allows SMTP connections
4. **Contact support** with specific error messages and logs

The system will continue to work without email notifications, but volunteers will only receive in-app notifications.

## Quick Fix for Timeout Issues

If you're getting timeout errors, try this quick fix:

1. **Switch to Gmail with App Password**:
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-16-char-app-password
   ```

2. **Restart your server** to apply the new configuration

3. **Check the logs** for successful connection test

This should resolve most timeout issues in cloud environments.
