import admin from '../config/firebase.js';
import { logger } from '../utils/logger.js';

/**
 * Authenticate Firebase token
 */
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    
    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Get user data from Firestore
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(decodedToken.uid)
      .get();
    
    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = userDoc.data();
    
    console.log('🔍 authenticateToken - Firestore user data:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      userType: userData.userType,
      status: userData.status,
      firstName: userData.firstName
    });
    
    // Attach user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      ...userData
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * Check if user is admin
 */
export const requireAdmin = (req, res, next) => {
  if (req.user.userType !== 'admin' && req.user.email !== 'hungrysaver198@gmail.com') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Check if user is volunteer
 */
export const requireVolunteer = (req, res, next) => {
  if (req.user.userType !== 'volunteer' && req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Volunteer access required'
    });
  }
  next();
};

/**
 * Check if user is donor
 */
export const requireDonor = (req, res, next) => {
  console.log('🔍 requireDonor middleware - User data:', {
    uid: req.user.uid,
    userType: req.user.userType,
    email: req.user.email,
    status: req.user.status
  });
  
  if (req.user.userType !== 'donor' && req.user.userType !== 'admin') {
    console.error('❌ requireDonor middleware - Access denied:', {
      userType: req.user.userType,
      expected: 'donor or admin'
    });
    return res.status(403).json({
      success: false,
      message: 'Only donors can claim community requests'
    });
  }
  
  console.log('✅ requireDonor middleware - Access granted');
  next();
};

/**
 * Check if user is community user
 */
export const requireCommunity = (req, res, next) => {
  if (req.user.userType !== 'community' && req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Community user access required'
    });
  }
  next();
};

/**
 * Check if user is approved
 */
export const requireApproved = (req, res, next) => {
  if (req.user.status !== 'approved' && req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Account not approved'
    });
  }
  next();
};