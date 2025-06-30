# Hungry Saver Backend Server

A comprehensive Node.js/Express backend server for the Hungry Saver community platform with Firebase integration.

## Features

### Core Functionality
- **4-Stage Status Workflow**: Pending → Accepted → Picked → Delivered
- **Location-Based Matching**: Strict location matching for volunteers and donations
- **Real-time Notifications**: FCM push notifications and email alerts
- **Audit Logging**: Complete audit trail of all actions and status changes
- **Role-Based Access Control**: Admin, Volunteer, Donor, and Community user types

### Services
- **Location Service**: Validates and standardizes city locations
- **Matching Service**: Connects volunteers with donations in their area
- **Status Service**: Manages workflow transitions and validations
- **Notification Service**: Handles push notifications and motivational messages
- **Email Service**: Sends transactional emails for key events
- **Audit Service**: Logs all system activities for compliance

## Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase project with Admin SDK credentials
- Email service credentials (Gmail/SMTP)

### Installation

1. **Clone and setup**:
```bash
cd hungrysaver-server
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your Firebase and email credentials
```

3. **Start Development Server**:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
All endpoints require Firebase ID token in Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### Donations
- `POST /api/donations` - Create new donation
- `GET /api/donations/location/:location` - Get donations by location
- `GET /api/donations/user/:userId` - Get user's donations
- `GET /api/donations/:id` - Get donation by ID
- `PATCH /api/donations/:id/status` - Update donation status
- `DELETE /api/donations/:id` - Delete pending donation

### Status Management
- `PATCH /api/status/donation/:id` - Update donation status
- `PATCH /api/status/request/:id` - Update request status
- `GET /api/status/history/:itemType/:itemId` - Get status history
- `GET /api/status/items/:status` - Get items by status

### Locations
- `GET /api/locations` - Get valid cities
- `GET /api/locations/:location/stats` - Get location statistics
- `GET /api/locations/:location/volunteers` - Get volunteers in location

## Status Workflow

### Valid Transitions
```
pending → accepted → picked → delivered
```

### Status Validation
- Only volunteers can accept donations
- Only assigned volunteer can update to picked/delivered
- Invalid transitions are rejected with error

### Automatic Notifications
- **New Donation**: All volunteers in location notified
- **Accepted**: Donor receives confirmation
- **Picked**: Donor notified of pickup
- **Delivered**: Both parties receive motivational message

## Location System

### Supported Cities
```javascript
[
  'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 
  'kakinada', 'nellore', 'kurnool', 'rajahmundry', 
  'kadapa', 'anantapur'
]
```

### Location Matching
- Exact location match required for volunteer assignments
- Fallback to nearby cities if no volunteers available
- All locations stored in lowercase for consistency

## Security Features

### Authentication
- Firebase Admin SDK token verification
- Role-based access control
- User permission validation

### Rate Limiting
- 100 requests per 15 minutes per IP
- Configurable via environment variables

### Input Validation
- Express-validator for all inputs
- Joi schemas for complex validations
- SQL injection prevention

### Audit Logging
- All status changes logged
- User actions tracked
- System statistics generated

## Notification System

### Push Notifications (FCM)
```javascript
// Example notification payload
{
  title: "New donation in Vijayawada!",
  body: "Annamitra Seva donation available",
  data: {
    type: "new_donation",
    donationId: "abc123"
  }
}
```

### Email Notifications
- Donation accepted confirmation
- Delivery completion with impact message
- Volunteer welcome emails

### Motivational Messages
```javascript
[
  "Your donation fed {count} families in {location} today! 🍛",
  "Because of you, {count} children will sleep with full stomachs tonight 😊",
  "Hunger ends where kindness begins - thank you for making a difference! ❤️"
]
```

## Database Schema

### Collections
- `donations` - Donation records
- `community_requests` - Community support requests  
- `users` - User profiles and roles
- `notifications` - In-app notifications
- `audit_logs` - System audit trail

### Donation Document
```javascript
{
  userId: "user123",
  initiative: "annamitra-seva",
  location: "vijayawada",
  location_lowercase: "vijayawada",
  donorName: "John Doe",
  donorContact: "9876543210",
  address: "123 Main St",
  description: "Fresh food available",
  status: "pending",
  assignedTo: null,
  createdAt: Timestamp,
  acceptedAt: Timestamp,
  pickedAt: Timestamp,
  deliveredAt: Timestamp
}
```

## Development

### Scripts
```bash
npm run dev      # Start with nodemon
npm start        # Production start
npm test         # Run tests
npm run lint     # ESLint check
npm run format   # Prettier format
```

### Logging
- Winston logger with file rotation
- Different log levels for development/production
- Structured JSON logging in production

### Error Handling
- Global error middleware
- Firebase-specific error handling
- Validation error formatting
- 404 handling

## Deployment

### Environment Variables
```bash
# Required
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Optional
PORT=5000
NODE_ENV=production
LOG_LEVEL=info
```

### Production Considerations
- Use PM2 for process management
- Set up log rotation
- Configure reverse proxy (nginx)
- Enable HTTPS
- Set up monitoring and alerts

## Monitoring

### Health Check
```bash
GET /health
```

Returns server status, uptime, and environment info.

### Metrics Available
- Donation completion rates
- Volunteer response times
- Location-wise statistics
- User activity patterns

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## License

MIT License - see LICENSE file for details.