# Hungry Saver Platform

A comprehensive community support platform connecting donors, volunteers, and community members across Andhra Pradesh.

## Project Structure

```
project/                # Frontend React application
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts (Auth, etc.)
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and Firebase services
│   ├── types/         # TypeScript type definitions
│   └── config/        # Configuration files
├── public/            # Static assets
└── package.json       # Dependencies and scripts
```

## Getting Started

### Frontend (Client)

1. Navigate to the project directory:
```bash
cd project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The client application will be available at `http://localhost:5173`

## Features

### Six Community Initiatives

1. **🍛 Annamitra Seva** - Food distribution and surplus food management
2. **📚 Vidya Jyothi** - Educational support for children
3. **🛡️ Suraksha Setu** - Emergency support for vulnerable communities
4. **🏠 PunarAsha** - Rehabilitation support for families
5. **⚡ Raksha Jyothi** - Emergency response for humans and animals
6. **🏛️ Jyothi Nilayam** - Shelter support for humans and animals

### User Types

- **Volunteers** - Help distribute resources and coordinate community support
- **Donors** - Contribute resources and support various causes
- **Community Members** - Access support and submit requests for help
- **Admins** - Manage volunteer approvals and platform operations

### Key Features

- Location-based matching (Vijayawada, Guntur, Visakhapatnam, etc.)
- Real-time status tracking (Pending → Accepted → Picked → Delivered)
- Firebase authentication and Firestore database
- Responsive design with Tailwind CSS
- Role-based access control

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Lucide React** for icons
- **Firebase SDK** for authentication and database

### Backend (Coming Soon)
- Node.js with Express
- Firebase Admin SDK
- Real-time notifications
- Location-based matching service
- Status workflow engine

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Environment Variables

Create a `.env` file in the project directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.