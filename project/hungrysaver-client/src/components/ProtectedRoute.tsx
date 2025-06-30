import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  requireApproved?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false, 
  requireApproved = true 
}) => {
  const { currentUser, userData, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route protection
  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Admin bypass - admins can access any route
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check if user data exists
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // Handle volunteer approval flow
  if (userData.userType === 'volunteer') {
    const currentPath = window.location.pathname;
    
    if (userData.status === 'pending' && !currentPath.includes('/pending-approval')) {
      return <Navigate to="/pending-approval" replace />;
    }
    
    if (userData.status === 'approved' && userData.location && 
        currentPath.includes('/pending-approval')) {
      return <Navigate to={`/dashboard/${userData.location}`} replace />;
    }

    if (userData.status === 'rejected') {
      return <Navigate to="/login" replace />;
    }

    // For volunteer dashboard access, require approval
    if (requireApproved && userData.status !== 'approved' && 
        currentPath.includes('/dashboard/')) {
      return <Navigate to="/pending-approval" replace />;
    }
  }

  // For other user types, check approval if required
  if (requireApproved && userData.status !== 'approved' && userData.userType !== 'admin') {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;