import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

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

function App() {
  return (
    <AuthProvider>
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="min-h-screen bg-gray-900">
          <Navbar />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route 
                path="/pending-approval" 
                element={
                  <ProtectedRoute>
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
            </Routes>
          </Suspense>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;