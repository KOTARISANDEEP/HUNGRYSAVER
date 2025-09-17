import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { User, Camera, MapPin, Phone, Mail, Lock, Save, X, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  updatePassword,
  AuthError,
  linkWithCredential,
  reauthenticateWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';

interface SettingsProps {
  userType: 'donor' | 'volunteer' | 'community' | 'admin';
}

interface UserProfile {
  uid: string;
  firstName: string;
  email: string;
  phoneNumber?: string;
  city?: string;
  address?: string;
  profilePicture?: string;
  authProvider: 'email' | 'google';
}

const Settings: React.FC<SettingsProps> = ({ userType }) => {
  const { userData, currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Cities for dropdown
  const cities = [
    'Vijayawada', 'Guntur', 'Visakhapatnam', 'Tirupati', 'Kakinada',
    'Nellore', 'Kurnool', 'Rajahmundry', 'Kadapa', 'Anantapur',
    'Kalasalingam academy of research and education', 'Krishnan koil',
    'Srivilliputtur', 'Rajapalayam', 'Virudhunagar'
  ];

  useEffect(() => {
    if (userData && currentUser) {
      const fetchProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              uid: currentUser.uid,
              firstName: data.firstName || '',
              email: data.email || currentUser.email || '',
              phoneNumber: data.phoneNumber || '',
              city: data.city || '',
              address: data.address || '',
              profilePicture: data.profilePicture || '',
              authProvider: data.authProvider || 'email'
            });
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
          setError('Failed to load profile data');
        }
      };
      fetchProfile();
    }
  }, [userData, currentUser]);

  const handleProfileUpdate = async () => {
    if (!profile || !currentUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updateData: any = {
        firstName: profile.firstName,
        phoneNumber: profile.phoneNumber,
        city: profile.city,
        address: profile.address,
        updatedAt: new Date()
      };

      // Only update profile picture if it has changed
      if (profile.profilePicture) {
        updateData.profilePicture = profile.profilePicture;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), updateData);
      
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (!currentUser?.email) {
      setError('User email not found. Please try logging out and back in.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Re-authenticate the user with current password
      console.log('🔐 Starting password change process...');
      
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        passwordData.currentPassword
      );
      
      console.log('🔑 Re-authenticating user...');
      await reauthenticateWithCredential(currentUser, credential);
      console.log('✅ Re-authentication successful');
      
      // Step 2: Update the password
      console.log('🔒 Updating password...');
      await updatePassword(currentUser, passwordData.newPassword);
      console.log('✅ Password updated successfully');
      
      setSuccess('Password changed successfully! You can now use your new password to login.');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswords({ current: false, new: false, confirm: false });
      
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('❌ Error changing password:', err);
      const authError = err as AuthError;
      
      switch (authError.code) {
        case 'auth/wrong-password':
          setError('Current password is incorrect. Please try again.');
          break;
        case 'auth/weak-password':
          setError('New password is too weak. Please choose a stronger password.');
          break;
        case 'auth/requires-recent-login':
          setError('For security reasons, please log out and log back in before changing your password.');
          break;
        case 'auth/network-request-failed':
          setError('Network connection failed. Please check your internet connection and try again. If the problem persists, try refreshing the page.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please wait a few minutes before trying again.');
          break;
        case 'auth/user-token-expired':
          setError('Your session has expired. Please log out and log back in.');
          break;
        default:
          setError(`Failed to change password: ${authError.message}. Please try again or contact support if the problem persists.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real implementation, you would upload to Firebase Storage
      // For now, we'll just create a local URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfile(prev => prev ? { ...prev, profilePicture: e.target?.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eaa640]"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${userType === 'admin' ? 'max-w-5xl mx-auto' : ''}` }>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        {userType !== 'admin' && (
          <p className="text-gray-300 max-w-2xl">
            Manage your profile information, security settings, and notification preferences.
          </p>
        )}
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-400" />
          <span className="text-green-400">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-center space-x-3">
          <X className="h-5 w-5 text-red-400" />
          <span className="text-red-400">{error}</span>
        </div>
      )}

      <div className={`grid grid-cols-1 ${userType === 'admin' ? '' : 'lg:grid-cols-2'} gap-8`}>
        {/* Section 1: Profile Information */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaa640]/30">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <User className="h-5 w-5 mr-2 text-[#eaa640]" />
            Profile Information
          </h3>
          
          <div className="space-y-4">
            {/* Profile Picture */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profile.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-[#eaa640] p-2 rounded-full cursor-pointer hover:bg-[#ecae53] transition-colors">
                  <Camera className="w-4 h-4 text-black" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-white font-medium mb-2">Full Name</label>
              <input 
                type="text" 
                value={profile.firstName}
                onChange={(e) => setProfile(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none"
                placeholder="Enter your full name"
              />
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-white font-medium mb-2">Email</label>
              <input 
                type="email" 
                value={profile.email}
                disabled={profile.authProvider === 'google'}
                className={`w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none ${
                  profile.authProvider === 'google' 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'focus:border-[#eaa640]'
                }`}
                placeholder="Enter your email"
              />
              {profile.authProvider === 'google' && (
                <p className="text-gray-400 text-sm mt-1">Email cannot be changed for Google Sign-In accounts</p>
              )}
            </div>
            
            {/* Phone Number */}
            <div>
              <label className="block text-white font-medium mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={profile.phoneNumber}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phoneNumber: e.target.value } : null)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none"
                placeholder="Enter your phone number"
              />
            </div>

            {/* City - Important for notifications */}
            <div>
              <label className="block text-white font-medium mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-[#eaa640]" />
                City
                <span className="text-[#eaa640] text-sm ml-2">*</span>
              </label>
              <select
                value={profile.city}
                onChange={(e) => setProfile(prev => prev ? { ...prev, city: e.target.value } : null)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none"
              >
                <option value="">Select your city</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <p className="text-gray-400 text-sm mt-1">
                Your city helps us send you relevant community request notifications
              </p>
            </div>

            {/* Address */}
            <div>
              <label className="block text-white font-medium mb-2">Address</label>
              <textarea
                value={profile.address}
                onChange={(e) => setProfile(prev => prev ? { ...prev, address: e.target.value } : null)}
                rows={3}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none resize-none"
                placeholder="Enter your full address"
              />
            </div>

            <button 
              onClick={handleProfileUpdate}
              disabled={loading || !profile.city}
              className="w-full bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] to-[#eeb766] disabled:from-gray-600 disabled:to-gray-600 text-black py-3 rounded-lg font-medium transition-all duration-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </div>

        {/* Section 2: Password & Security */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaa640]/30">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center">
            <Lock className="h-5 w-5 mr-2 text-[#eaa640]" />
            Password & Security
          </h3>
          
          <div className="space-y-4">
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-300"
              >
                Update Password
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-white font-medium mb-2">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none"
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-white font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 pr-12 text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">❌ Passwords do not match</p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={async () => {
                      try {
                        setError(null);
                        setSuccess(null);
                        if (!currentUser?.email) {
                          setError('Missing account email.');
                          return;
                        }
                        if (passwordData.newPassword.length < 6 || passwordData.newPassword !== passwordData.confirmPassword) {
                          setError('Please enter matching passwords (min 6 characters).');
                          return;
                        }
                        const hasPassword = currentUser?.providerData?.some(p => p.providerId === 'password');
                        if (!hasPassword) {
                          const cred = EmailAuthProvider.credential(currentUser.email, passwordData.newPassword);
                          await linkWithCredential(currentUser, cred);
                          await currentUser.reload();
                          setSuccess('Linked successfully. You can now use Email/Password.');
                        } else {
                          await reauthenticateWithPopup(currentUser, new GoogleAuthProvider());
                          await updatePassword(currentUser, passwordData.newPassword);
                          setSuccess('Password updated successfully.');
                        }
                        setShowPasswordForm(false);
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      } catch (err: any) {
                        setError(err?.message || 'Failed to update password.');
                      }
                    }}
                    className="flex-1 bg-[#eaa640] hover:bg-[#ecae53] text-black py-3 rounded-lg font-medium transition-colors duration-300"
                  >
                    Update Password
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setShowPasswords({ current: false, new: false, confirm: false });
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-3 rounded-lg font-medium transition-colors duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

                     {/* Password Security Note */}
           <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
             <h5 className="text-blue-400 font-medium mb-2">🔒 Password Security</h5>
             <ul className="text-blue-300 text-sm space-y-1">
               <li>• Minimum 6 characters required</li>
               <li>• Use a mix of letters, numbers, and symbols for stronger passwords</li>
               <li>• Never share your password with anyone</li>
               <li>• Consider using a password manager for better security</li>
             </ul>
           </div>

           {/* Notification Preferences */}
           <div className="mt-8 pt-6 border-t border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Notification Preferences</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white text-sm">Community request notifications</span>
                <div className="w-12 h-6 rounded-full bg-[#eaa640] p-1">
                  <div className="w-4 h-4 rounded-full bg-white translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white text-sm">Donation updates</span>
                <div className="w-12 h-6 rounded-full bg-[#eaa640] p-1">
                  <div className="w-4 h-4 rounded-full bg-white translate-x-6"></div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <span className="text-white text-sm">Weekly impact reports</span>
                <div className="w-12 h-6 rounded-full bg-gray-600 p-1">
                  <div className="w-4 h-4 rounded-full bg-white"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">Important Information</h4>
        <ul className="text-blue-300 text-sm space-y-1">
          <li>• Your city setting is used to send you relevant community request notifications</li>
          <li>• Direct donation forms will use the city you enter during donation (not your profile city)</li>
          <li>• Profile updates are saved immediately to your account</li>
          {userType === 'donor' && (
            <li>• When community requests are approved in your city, you'll receive email notifications</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Settings;
