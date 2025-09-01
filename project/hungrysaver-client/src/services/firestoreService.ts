import { collection, addDoc, query, where, getDocs, doc, updateDoc, orderBy, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DonationData, RequestData } from '../types/formTypes';

// Collection references
export const donationsCollection = collection(db, 'donations');
export const requestsCollection = collection(db, 'community_requests');

// Helper to safely parse JSON
const safeParseJson = async (response: Response): Promise<any | null> => {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// Donation operations
export const submitDonation = async (data: DonationData): Promise<string> => {
  try {
    // Get the current user's ID token for authentication
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await user.getIdToken();
    
    // Call the backend API instead of writing directly to Firestore
    const response = await fetch('https://hungrysaver.onrender.com/api/donations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorJson = await safeParseJson(response);
      const message = errorJson?.message || `Failed to submit donation (HTTP ${response.status})`;
      throw new Error(message);
    }
    
    const resultJson = await safeParseJson(response);
    if (!resultJson || !resultJson.data?.id) {
      throw new Error('Failed to submit donation. Invalid server response.');
    }
    console.log('✅ Donation submitted successfully via API:', resultJson.data.id);
    return resultJson.data.id;
  } catch (error) {
    console.error('❌ Error submitting donation:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to submit donation. Please try again.');
  }
};

// Request operations
export const submitRequest = async (data: RequestData): Promise<string> => {
  try {
    // Get the current user's ID token for authentication
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await user.getIdToken();
    
    // Call the backend API instead of writing directly to Firestore
    const response = await fetch('https://hungrysaver.onrender.com/api/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorJson = await safeParseJson(response);
      const message = errorJson?.message || `Failed to submit request (HTTP ${response.status})`;
      throw new Error(message);
    }
    
    const resultJson = await safeParseJson(response);
    if (!resultJson || !resultJson.data?.id) {
      throw new Error('Failed to submit request. Invalid server response.');
    }
    console.log('✅ Request submitted successfully via API:', resultJson.data.id);
    return resultJson.data.id;
  } catch (error) {
    console.error('❌ Form submission error (request):', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to submit request. Please try again.');
  }
};

// Get donations by location (with strict location filtering for volunteers)
export const getDonationsByLocation = async (location: string) => {
  try {
    console.log('🔍 Fetching donations for location:', location);
    const q = query(
      donationsCollection,
      where('location_lowercase', '==', location.toLowerCase()),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const donations = snapshot.docs.map(doc => ({
      id: doc.id,
      type: 'donation' as const,
      ...doc.data()
    }));
    console.log('✅ Found donations:', donations.length);
    return donations;
  } catch (error) {
    console.error('❌ Error fetching donations:', error);
    throw new Error('Failed to fetch donations. Please try again.');
  }
};

// Get requests by location (with strict location filtering for volunteers)
export const getRequestsByLocation = async (location: string) => {
  try {
    console.log('🔍 Fetching requests for location:', location);
    const q = query(
      requestsCollection,
      where('location_lowercase', '==', location.toLowerCase()),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      type: 'request' as const,
      ...doc.data()
    }));
    console.log('✅ Found requests:', requests.length);
    return requests;
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    throw new Error('Failed to fetch requests. Please try again.');
  }
};

// Get user's donations
export const getUserDonations = async (userId: string) => {
  try {
    console.log('🔍 Fetching donations for user:', userId);
    const q = query(
      donationsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const donations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('✅ Found user donations:', donations.length);
    return donations;
  } catch (error) {
    console.error('❌ Error fetching user donations:', error);
    throw new Error('Failed to fetch your donations. Please try again.');
  }
};

// Get user's requests
export const getUserRequests = async (userId: string) => {
  try {
    console.log('🔍 Fetching requests for user:', userId);
    const q = query(
      requestsCollection,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('✅ Found user requests:', requests.length);
    return requests;
  } catch (error) {
    console.error('❌ Error fetching user requests:', error);
    throw new Error('Failed to fetch your requests. Please try again.');
  }
};

// Update task status with real-time updates
export const updateTaskStatus = async (
  taskId: string, 
  taskType: 'donation' | 'request', 
  status: string, 
  additionalData?: any
) => {
  try {
    console.log('🔄 Updating task status via backend API:', { taskId, taskType, status, additionalData });
    
    // Get the current user's ID token for authentication
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const idToken = await user.getIdToken();
    
    // Filter out undefined values to prevent backend errors
    const cleanAdditionalData: any = {};
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        if (additionalData[key] !== undefined && additionalData[key] !== null) {
          cleanAdditionalData[key] = additionalData[key];
        }
      });
    }
    
    // Call the backend API instead of writing directly to Firestore
    const endpoint = taskType === 'donation' ? 'donations' : 'requests';
    const response = await fetch(`https://hungrysaver.onrender.com/api/${endpoint}/${taskId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        status,
        ...cleanAdditionalData
      })
    });

    if (!response.ok) {
      const errorJson = await safeParseJson(response);
      const message = errorJson?.message || `Failed to update task status (HTTP ${response.status})`;
      throw new Error(message);
    }
    
    const resultJson = await safeParseJson(response);
    console.log('✅ Task status updated successfully via API:', resultJson);
    
    return { success: true, taskId, newStatus: status, ...resultJson };
  } catch (error) {
    console.error('❌ Error updating task status:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update task status. Please try again.');
  }
};

// Get combined tasks for volunteers (STRICT location filtering)
export const getTasksByLocation = async (location: string) => {
  try {
    console.log('🔍 Fetching all tasks for location:', location);
    
    // Ensure location is lowercase for consistent filtering
    const normalizedLocation = location.toLowerCase();
    
    const [donations, requests] = await Promise.all([
      getDonationsByLocation(normalizedLocation),
      getRequestsByLocation(normalizedLocation)
    ]);
    
    // Double-check location filtering on client side for security
    const filteredDonations = donations.filter(d => 
      d.location_lowercase === normalizedLocation
    );
    const filteredRequests = requests.filter(r => 
      r.location_lowercase === normalizedLocation
    );
    
    // Combine and sort by creation date
    const allTasks = [...filteredDonations, ...filteredRequests].sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });
    
    console.log('✅ Total tasks found:', allTasks.length, {
      donations: filteredDonations.length,
      requests: filteredRequests.length
    });
    
    return allTasks;
  } catch (error) {
    console.error('❌ Error fetching tasks by location:', error);
    throw new Error('Failed to fetch tasks. Please try again.');
  }
};

// Real-time status monitoring
export const subscribeToTaskUpdates = (location: string, callback: (tasks: any[]) => void) => {
  // This would implement real-time listeners in a production environment
  console.log('🔄 Setting up real-time task monitoring for:', location);
  
  // For now, we'll use polling as a fallback
  const interval = setInterval(async () => {
    try {
      const tasks = await getTasksByLocation(location);
      callback(tasks);
    } catch (error) {
      console.error('❌ Error in real-time update:', error);
    }
  }, 30000); // Poll every 30 seconds

  return () => clearInterval(interval);
};

// Validate data before submission
export const validateDonationData = (data: any): boolean => {
  const required = ['initiative', 'location', 'address', 'donorName', 'donorContact', 'description'];
  
  for (const field of required) {
    if (!data[field] || data[field].trim() === '') {
      console.error('❌ Missing required field:', field);
      return false;
    }
  }
  
  // Validate location is in allowed cities (updated list)
  const allowedCities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur',
    'kalasalingam academy of research and education', 'krishnan koil',
    'srivilliputtur', 'rajapalayam', 'virudhunagar'
  ];
  
  if (!allowedCities.includes(data.location.toLowerCase())) {
    console.error('❌ Invalid location:', data.location);
    return false;
  }
  
  // If location is Kalasalingam Academy, hostel field is required
  if (data.location.toLowerCase() === 'kalasalingam academy of research and education' && 
      (!data.hostel || data.hostel.trim() === '')) {
    console.error('❌ Hostel field is required for Kalasalingam Academy location');
    return false;
  }
  
  console.log('✅ Donation data validation passed');
  return true;
};

export const validateRequestData = (data: any): boolean => {
  const required = ['initiative', 'location', 'address', 'beneficiaryName', 'beneficiaryContact', 'description'];
  
  for (const field of required) {
    if (!data[field] || data[field].trim() === '') {
      console.error('❌ Missing required field:', field);
      return false;
    }
  }
  
  // Validate location is in allowed cities (updated list)
  const allowedCities = [
    'vijayawada', 'guntur', 'visakhapatnam', 'tirupati', 'kakinada',
    'nellore', 'kurnool', 'rajahmundry', 'kadapa', 'anantapur',
    'kalasalingam academy of research and education', 'krishnan koil',
    'srivilliputtur', 'rajapalayam', 'virudhunagar'
  ];
  
  if (!allowedCities.includes(data.location.toLowerCase())) {
    console.error('❌ Invalid location:', data.location);
    return false;
  }
  
  console.log('✅ Request data validation passed');
  return true;
};

// Fetch pending volunteers for admin dashboard
export const fetchPendingVolunteers = async () => {
  try {
    const pendingQuery = query(
      collection(db, 'users'),
      where('userType', '==', 'volunteer'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(pendingQuery);
    const volunteers = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    console.log('✅ Fetched pending volunteers:', volunteers.length);
    return volunteers;
  } catch (error) {
    console.error('❌ Error fetching pending volunteers:', error);
    throw error;
  }
};

// Check if user is admin
export const checkIsAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return userData.userType === 'admin';
    }
    return false;
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    return false;
  }
};

// Update volunteer status (approve/reject)
export const updateVolunteerStatus = async (uid: string, status: 'approved' | 'rejected', reason?: string) => {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (status === 'approved') {
      updateData.approvedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      if (reason) {
        updateData.rejectionReason = reason;
      }
    }

    await updateDoc(doc(db, 'users', uid), updateData);
    console.log(`✅ Volunteer ${uid} status updated to ${status}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating volunteer status:', error);
    throw error;
  }
};

// Fetch user data by UID
export const fetchUserData = async (uid: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return { uid: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    throw error;
  }
};

// Listen to user status changes
export const listenToUserStatus = (uid: string, callback: (status: string) => void) => {
  return onSnapshot(
    doc(db, 'users', uid),
    (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        callback(userData.status);
      }
    },
    (error) => {
      console.error('❌ Error listening to user status:', error);
    }
  );
};