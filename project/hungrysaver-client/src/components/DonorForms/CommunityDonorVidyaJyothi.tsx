import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface NeededItems {
  fees: boolean;
  books: boolean;
  uniform: boolean;
}

interface RequestData {
  location: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  childName: string;
  childAge: string;
  schoolName: string;
  className: string;
  neededItems: NeededItems;
  urgency: string;
  description: string;
}

interface CommunityRequest extends RequestData {
  id: string;
  initiative: string;
  submittedAt: string;
  source: string;
  donorName?: string;
  donorContact?: string;
  donorAddress?: string;
  availableTime?: string;
}

const CommunityDonorVidyaJyothi: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestId } = useParams<{ requestId: string }>();
  const [request, setRequest] = useState<CommunityRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Donor input state
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [availableTime, setAvailableTime] = useState('');

  // Fetch request data if not available from navigation state
  useEffect(() => {
    const fetchRequestData = async () => {
      try {
        console.log('Fetching community request with ID:', requestId);
        // First try to get data from navigation state
        const stateRequest = location.state?.request;
        
        if (stateRequest && stateRequest.id && stateRequest.initiative) {
          console.log('Using navigation state for request:', stateRequest);
          setRequest(stateRequest);
          setFetching(false);
          return;
        }

        // If no navigation state or incomplete, fetch from Firestore
        if (!requestId) {
          setError('Request ID not found');
          setFetching(false);
          return;
        }

        const requestDoc = await getDoc(doc(db, 'community_requests', requestId));
        console.log('Document exists:', requestDoc.exists());
        if (!requestDoc.exists()) {
          setError('Community request not found');
          setFetching(false);
          return;
        }

        const requestData = { id: requestDoc.id, ...requestDoc.data() };
        console.log('Fetched request data:', requestData);
        setRequest(requestData);
      } catch (err) {
        console.error('Error fetching request:', err);
        setError('Failed to load community request');
      } finally {
        setFetching(false);
      }
    };

    fetchRequestData();
  }, [location.state, requestId]);

  // Show loading while fetching request data
  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading community request...</p>
        </div>
      </div>
    );
  }

  // Show error if request not found
  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <p className="text-gray-800 mb-4">{error || 'Community request not found'}</p>
          <button
            onClick={() => navigate('/donor-dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setError('You must be logged in to submit a donation.');
        setLoading(false);
        return;
      }
      const idToken = await user.getIdToken();
      const payload = {
        ...request,
        donorName,
        donorContact,
        donorAddress,
        availableTime,
        submittedAt: new Date(),
        details: {
          ...request.details,
          originalRequestId: request.id,
        },
      };
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Submission failed');
      }
      setSuccess(true);
      setTimeout(() => navigate('/donor-dashboard'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-xl p-8 mt-8 shadow-lg">
      <h2 className="text-2xl font-bold text-blue-400 mb-6">📚 Vidya Jyothi - Community Donor Response</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Request Overview */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Request Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm">City</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.location} readOnly />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">Urgency</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.urgency} readOnly />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm">Address</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.address} readOnly />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">Parent/Guardian Name</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.beneficiaryName} readOnly />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">Contact Number</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.beneficiaryContact} readOnly />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">Child Name</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.childName} readOnly />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">Child Age</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.childAge} readOnly />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">School Name</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.schoolName} readOnly />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">Class</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.className} readOnly />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm">Description</label>
              <textarea className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={request.description} readOnly />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm">Needed Items</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(request.neededItems || {}).map(([key, value]) =>
                  value ? (
                    <span key={key} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </span>
                  ) : null
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Donor Information */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">Donor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm">Your Name</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={donorName} onChange={e => setDonorName(e.target.value)} required />
            </div>
            <div>
              <label className="block text-gray-400 text-sm">Mobile Number</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={donorContact} onChange={e => setDonorContact(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm">Your Address</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={donorAddress} onChange={e => setDonorAddress(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-gray-400 text-sm">Available Time</label>
              <input className="w-full bg-gray-700 rounded px-3 py-2 text-white" value={availableTime} onChange={e => setAvailableTime(e.target.value)} required />
            </div>
          </div>
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {success && <div className="text-green-400 text-sm">Thank you! Your donation has been submitted.</div>}
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Donation'}
        </button>
      </form>
    </div>
  );
};

export default CommunityDonorVidyaJyothi; 