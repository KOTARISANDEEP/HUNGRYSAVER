import './config/firebase';
import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { getAuth } from 'firebase/auth';

declare global {
  interface Window {
    getFirebaseToken: () => void;
  }
}

// Lazy load components for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const VolunteerDashboard = React.lazy(() => import('./pages/VolunteerDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const CommunityDashboard = React.lazy(() => import('./pages/CommunityDashboard'));
const CommunitySupportDashboard = React.lazy(() => import('./pages/CommunitySupportDashboard'));
const DonorDashboard = React.lazy(() => import('./pages/DonorDashboard'));
const PendingApproval = React.lazy(() => import('./pages/PendingApproval'));
const CommunityDonorAnnamitraSeva = React.lazy(() => import('./components/DonorForms/CommunityDonorAnnamitraSeva'));
const CommunityDonorVidyaJyothi = React.lazy(() => import('./components/DonorForms/CommunityDonorVidyaJyothi'));
const CommunityDonorSurakshaSetu = React.lazy(() => import('./components/DonorForms/CommunityDonorSurakshaSetu'));
const CommunityDonorPunarAsha = React.lazy(() => import('./components/DonorForms/CommunityDonorPunarAsha'));
const CommunityDonorRakshaJyothi = React.lazy(() => import('./components/DonorForms/CommunityDonorRakshaJyothi'));
const CommunityDonorJyothiNilayam = React.lazy(() => import('./components/DonorForms/CommunityDonorJyothiNilayam'));

function App() {
  // Removed unused token and error state
  // Removed unused handleGetToken function

  window.getFirebaseToken = () => {
    const auth = getAuth();
    if (auth.currentUser) {
      auth.currentUser.getIdToken(true).then(token => {
        console.log("Firebase ID Token:", token);
      });
    } else {
      console.log("No user is signed in.");
    }
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          {/* Removed token fetch UI for debugging */}
          <Navbar />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/pending-approval" 
                element={
                  <ProtectedRoute requireApproved={false}>
                    <PendingApproval />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard/:location" 
                element={
                  <ProtectedRoute>
                    <VolunteerDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/community" 
                element={
                  <ProtectedRoute>
                    <CommunityDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/community-dashboard" 
                element={
                  <ProtectedRoute>
                    <CommunitySupportDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/donor-dashboard" 
                element={
                  <ProtectedRoute>
                    <DonorDashboard />
                  </ProtectedRoute>
                } 
              />
              {/* Community Donor Forms for each initiative */}
              <Route
                path="/community-donor/annamitra-seva/:requestId"
                element={
                  <ProtectedRoute>
                    <CommunityDonorAnnamitraSeva />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-donor/vidya-jyothi/:requestId"
                element={
                  <ProtectedRoute>
                    <CommunityDonorVidyaJyothi />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-donor/suraksha-setu/:requestId"
                element={
                  <ProtectedRoute>
                    <CommunityDonorSurakshaSetu />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-donor/punar-asha/:requestId"
                element={
                  <ProtectedRoute>
                    <CommunityDonorPunarAsha />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-donor/raksha-jyothi/:requestId"
                element={
                  <ProtectedRoute>
                    <CommunityDonorRakshaJyothi />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/community-donor/jyothi-nilayam/:requestId"
                element={
                  <ProtectedRoute>
                    <CommunityDonorJyothiNilayam />
                  </ProtectedRoute>
                }
              />
              {/* Catch-all route - redirect to home for unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;