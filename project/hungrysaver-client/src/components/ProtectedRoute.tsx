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

  console.log("ProtectedRoute", { 
    currentUser: !!currentUser, 
    userData: userData ? { userType: userData.userType, status: userData.status } : null, 
    isAdmin, 
    requireApproved,
    windowPath: window.location.pathname 
  });

  // If no user is authenticated, redirect to login
  if (!currentUser) {
    console.log("❌ No current user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Admin-only route protection
  if (adminOnly && !isAdmin) {
    console.log("❌ Admin access required, redirecting to home");
    return <Navigate to="/" replace />;
  }

  // Admin bypass - admins can access any route
  if (isAdmin) {
    console.log("✅ Admin access granted");
    return <>{children}</>;
  }

  // Check if user data exists
  if (!userData) {
    console.log("⏳ Loading user data...");
    return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Loading user data...</div>;
  }

  // Handle volunteer approval flow
  if (userData.userType === 'volunteer') {
    const currentPath = window.location.pathname;
    console.log("🔍 Volunteer flow check:", { status: userData.status, currentPath });
    
    // If volunteer is pending and not on pending-approval page, redirect there
    if (userData.status === 'pending' && !currentPath.includes('/pending-approval')) {
      console.log("🔄 Pending volunteer, redirecting to pending-approval");
      return <Navigate to="/pending-approval" replace />;
    }
    
    // If volunteer is approved and on pending-approval page, redirect to dashboard
    if (userData.status === 'approved' && userData.location && currentPath.includes('/pending-approval')) {
      console.log("✅ Approved volunteer, redirecting to dashboard");
      return <Navigate to={`/dashboard/${userData.location}`} replace />;
    }

    // If volunteer is rejected, redirect to login
    if (userData.status === 'rejected') {
      console.log("❌ Rejected volunteer, redirecting to login");
      return <Navigate to="/login" replace />;
    }

    // For volunteer dashboard access, require approval unless requireApproved is false
    if (requireApproved && userData.status !== 'approved' && currentPath.includes('/dashboard/')) {
      console.log("🔄 Volunteer not approved, redirecting to pending-approval");
      return <Navigate to="/pending-approval" replace />;
    }
  }

  // For other user types, check approval if required
  if (requireApproved && userData.status !== 'approved' && userData.userType !== 'admin') {
    console.log("🔄 User not approved, redirecting to pending-approval");
    return <Navigate to="/pending-approval" replace />;
  }

  console.log("✅ Access granted");
  return <>{children}</>;
};

export default ProtectedRoute;