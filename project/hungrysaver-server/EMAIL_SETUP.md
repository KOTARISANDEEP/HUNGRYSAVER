# Email Notification Setup Guide

## Overview
Hungry Saver now supports email notifications for volunteers when new community requests are created in their city. This ensures volunteers are immediately notified about requests that need their attention.

## Configuration Required

To enable email notifications, you need to create a `.env` file in the `hungrysaver-server` directory with the following email configuration:

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

## How It Works

1. **Community Request Creation**: When someone submits a community request
2. **City-Based Matching**: System finds all volunteers in that specific city
3. **Email Notifications**: Each volunteer receives a detailed email with:
   - Request details (initiative, location, beneficiary info)
   - How they can help
   - Direct link to their volunteer dashboard
   - Step-by-step instructions

## Testing Email Notifications

1. Create a community request in any city (e.g., "tirupati")
2. Check if volunteers in that city receive email notifications
3. Verify email content and links work correctly

## Troubleshooting

### Emails Not Sending
- Check if `.env` file exists and has correct credentials
- Verify email service credentials are valid
- Check server logs for email errors
- Ensure email service is not blocked by firewall

### Email Configuration Issues
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Check if EMAIL_USER and EMAIL_PASS are properly set
- Test SMTP connection manually if needed

## Security Notes

- Never commit `.env` file to version control
- Use app passwords for Gmail (not regular passwords)
- Consider using environment variables in production
- Regularly rotate email credentials

## Support

If you encounter issues with email setup, check the server logs for detailed error messages. The system will continue to work without email notifications, but volunteers will only receive in-app notifications.
