import { CommunityRequest, CommunityRequestAction } from '../types/formTypes';

const API_BASE_URL = '/api/community-requests';

// Get Firebase ID token for authentication
const getIdToken = async (): Promise<string> => {
  const { getAuth } = await import('firebase/auth');
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return await user.getIdToken();
};

// Fetch community requests for volunteers by city
export const getVolunteerCommunityRequests = async (): Promise<CommunityRequest[]> => {
  try {
    const idToken = await getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/volunteer`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch community requests');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching volunteer community requests:', error);
    throw error;
  }
};

// Fetch approved community requests for donors
export const getApprovedCommunityRequests = async (): Promise<CommunityRequest[]> => {
  try {
    const idToken = await getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/approved`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch approved requests');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching approved community requests:', error);
    throw error;
  }
};

// Update community request status (for volunteers)
export const updateCommunityRequestStatus = async (action: CommunityRequestAction): Promise<boolean> => {
  try {
    const idToken = await getIdToken();
    const { type, requestId, data } = action;
    
    let endpoint = '';
    let method = 'POST';
    
    switch (type) {
      case 'accept':
        endpoint = `/${requestId}/accept`;
        break;
      case 'deny':
        endpoint = `/${requestId}/deny`;
        break;
      case 'mark-reached':
        endpoint = `/${requestId}/mark-reached`;
        break;
      case 'approve':
      case 'reject':
        endpoint = `/${requestId}/decision`;
        break;
      default:
        throw new Error('Invalid action type');
    }

    const body: any = {};
    if (type === 'deny' && data?.reason) {
      body.reason = data.reason;
    }
    if ((type === 'approve' || type === 'reject') && data?.notes) {
      body.notes = data.notes;
    }
    if (type === 'approve' || type === 'reject') {
      body.decision = type;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to ${type} request`);
    }

    return true;
  } catch (error) {
    console.error(`Error ${action.type}ing community request:`, error);
    throw error;
  }
};

// Donor claims an approved community request
export const claimCommunityRequest = async (requestId: string, donorAddress: string, notes?: string): Promise<boolean> => {
  try {
    const idToken = await getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/${requestId}/donor-claim`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        donorAddress,
        notes: notes || ''
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to claim request');
    }

    return true;
  } catch (error) {
    console.error('Error claiming community request:', error);
    throw error;
  }
};

// Get community requests by user ID
export const getUserCommunityRequests = async (userId: string): Promise<CommunityRequest[]> => {
  try {
    const idToken = await getIdToken();
    
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch user requests');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching user community requests:', error);
    throw error;
  }
};
