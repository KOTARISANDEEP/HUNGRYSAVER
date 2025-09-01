import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup,
  sendPasswordResetEmail,
  AuthError,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
import LoadingSpinner from '../components/LoadingSpinner';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  userType: 'volunteer' | 'donor' | 'community' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  contactNumber?: string;
  location?: string;
  education?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<UserData, 'uid'> & { password: string }) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if user is admin
      if (checkIsAdmin(userCredential.user.email)) {
        setIsAdmin(true);
        // For admin, create minimal user data if it doesn't exist
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) {
          const adminData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email || '',
            firstName: 'Admin',
            userType: 'admin' as const,
            status: 'approved' as const,
            createdAt: new Date(),
          };
          await setDoc(doc(db, 'users', userCredential.user.uid), adminData);
          setUserData(adminData);
        }
      }
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError));
    }
  };

  const register = async (userData: Omit<UserData, 'uid'> & { password: string }) => {
    const { password, ...userInfo } = userData;
    
    // Validate required fields
    if (!userInfo.firstName?.trim()) {
      throw new Error('First name is required');
    }
    if (!userInfo.email?.trim()) {
      throw new Error('Email is required');
    }
    if (!userInfo.userType) {
      throw new Error('Please select a user type');
    }
    
    // Validate volunteer-specific fields
    if (userInfo.userType === 'volunteer') {
      if (!userInfo.contactNumber?.trim()) {
        throw new Error('Contact number is required for volunteers');
      }
      if (!userInfo.location?.trim()) {
        throw new Error('Location is required for volunteers');
      }
      if (!userInfo.education?.trim()) {
        throw new Error('Education is required for volunteers');
      }
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userInfo.email.trim(), password);
      
      // Determine initial status based on user type
      let initialStatus: 'pending' | 'approved' = 'approved';
      if (userInfo.userType === 'volunteer') {
        initialStatus = 'pending'; // Volunteers need approval
      }
      
      // Prepare user document data with proper validation
      const userDocData = {
        uid: userCredential.user.uid,
        firstName: userInfo.firstName.trim(),
        email: userInfo.email.trim().toLowerCase(),
        userType: userInfo.userType,
        status: initialStatus,
        createdAt: new Date(),
        // Only include volunteer-specific fields if they exist and are not empty
        ...(userInfo.contactNumber?.trim() && { contactNumber: userInfo.contactNumber.trim() }),
        ...(userInfo.location?.trim() && { location: userInfo.location.trim().toLowerCase() }),
        ...(userInfo.education?.trim() && { education: userInfo.education.trim() })
      };
      
      // CRITICAL: Create Firestore document for the user
      await setDoc(doc(db, 'users', userCredential.user.uid), userDocData);
      
      // Set user data in context
      setUserData(userDocData);
      
      // Send confirmation email (non-blocking)
      sendRegistrationConfirmationEmail(userDocData);
      
    } catch (error) {
      // If it's a Firebase Auth error, use our error handler
      if (error && typeof error === 'object' && 'code' in error) {
        throw new Error(getErrorMessage(error as AuthError));
      }
      // For other errors (like Firestore errors), throw a generic message
      throw new Error('Failed to create account. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
      setIsAdmin(false);
    } catch {
      throw new Error('Failed to log out. Please try again.');
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      // Check if user is admin
      if (checkIsAdmin(result.user.email)) {
        setIsAdmin(true);
      }
      
      // Check if user exists in Firestore, if not create a basic profile
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      if (!userDoc.exists()) {
        const userDocData = {
          uid: result.user.uid,
          email: result.user.email || '',
          firstName: result.user.displayName?.split(' ')[0] || 'User',
          userType: checkIsAdmin(result.user.email) ? 'admin' as const : 'community' as const,
          status: 'approved' as const,
          createdAt: new Date(),
        };
        
        await setDoc(doc(db, 'users', result.user.uid), userDocData);
        setUserData(userDocData);
        
        // Send confirmation email for new Google users
        sendRegistrationConfirmationEmail(userDocData);
      }
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError));
    }
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Check if user is admin
        const adminStatus = checkIsAdmin(user.email);
        setIsAdmin(adminStatus);
        
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            // Override userType to admin if email matches
            if (adminStatus) {
              data.userType = 'admin';
              data.status = 'approved';
            }
            setUserData(data);
          } else if (adminStatus) {
            // Create admin user data if it doesn't exist
            const adminData = {
              uid: user.uid,
              email: user.email || '',
              firstName: 'Admin',
              userType: 'admin' as const,
              status: 'approved' as const,
              createdAt: new Date(),
            };
            await setDoc(doc(db, 'users', user.uid), adminData);
            setUserData(adminData);
          } else {
            // User exists in Auth but not in Firestore - this shouldn't happen with proper registration
            console.warn('User exists in Auth but not in Firestore:', user.uid);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Don't throw error here, just log it and continue
          // This allows the app to function even if Firestore is temporarily unavailable
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value: AuthContextType = {
    currentUser,
    userData,
    login,
    register,
    logout,
    loginWithGoogle,
    resetPassword,
    loading,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingSpinner /> : children}
    </AuthContext.Provider>
  );
};

// ✅ Correct export
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper function to get user-friendly error messages
const getErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please try logging in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Only one sign-in popup is allowed at a time.';
    case 'auth/unavailable':
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

// Check if user is admin
const checkIsAdmin = (email: string | null): boolean => {
  const adminEmail = 'hungrysaver198@gmail.com'; // Hardcoded admin email
  const isAdminByEmail = email === adminEmail;
  console.log('🔍 Admin check:', { email, isAdminByEmail });
  return isAdminByEmail;
};

// Send registration confirmation email
const sendRegistrationConfirmationEmail = async (userData: UserData) => {
  try {
    const response = await fetch('https://hungrysaver.onrender.com/api/auth/send-confirmation-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      console.warn('Failed to send confirmation email:', response.statusText);
    }
  } catch (error) {
    console.warn('Error sending confirmation email:', error);
    // Don't throw error to avoid breaking registration
  }
};