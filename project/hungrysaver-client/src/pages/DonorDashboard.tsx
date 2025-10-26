import React, { useState, useEffect } from 'react';
import { 
  Heart, BookOpen, Shield, Home, Zap, Building, Users, Calendar, MapPin, Clock, TrendingUp, Award, Star, Recycle,
  Menu, X, Bell, LogOut, User, Gift, History, BarChart3, MessageSquare, FileText, HelpCircle, Settings as SettingsIcon,
  CheckCircle, UserPlus, Truck, Users2
} from 'lucide-react';
import { collection, query, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { getApprovedCommunityRequests, claimCommunityRequest } from '../services/communityRequestService';
import ImpactSection from '../components/ImpactSection';
import SuccessStories from '../components/SuccessStories';
import ImageViewerModal from '../components/ImageViewerModal';
import AnimatedEmptyState from '../components/AnimatedIllustrations';
import DonorCommunityRequestCard from '../components/DonorCommunityRequestCard';
import AnnamitraSevaForm from '../components/DonorForms/AnnamitraSevaForm';
import VidyaJyothiForm from '../components/DonorForms/VidyaJyothiForm';
import SurakshaSetuForm from '../components/DonorForms/SurakshaSetuForm';
import PunarAshaForm from '../components/DonorForms/PunarAshaForm';
import RakshaJyothiForm from '../components/DonorForms/RakshaJyothiForm';
import JyothiNilayamForm from '../components/DonorForms/JyothiNilayamForm';
import { AnnamitraSevaFormData } from '../components/DonorForms/AnnamitraSevaForm';
import { VidyaJyothiFormData } from '../components/DonorForms/VidyaJyothiForm';
import { SurakshaSetuFormData } from '../components/DonorForms/SurakshaSetuForm';
import { PunarAshaFormData } from '../components/DonorForms/PunarAshaForm';
import { RakshaJyothiFormData } from '../components/DonorForms/RakshaJyothiForm';
import { JyothiNilayamFormData } from '../components/DonorForms/JyothiNilayamForm';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';

import { CommunityRequest } from '../types/formTypes';
import Settings from '../components/Settings';

type DonorFormData =
  | AnnamitraSevaFormData
  | VidyaJyothiFormData
  | SurakshaSetuFormData
  | PunarAshaFormData
  | RakshaJyothiFormData
  | JyothiNilayamFormData;

type ActiveSection = 'home' | 'donate' | 'contributions' | 'impact' | 'requests' | 'stories' | 'rewards' | 'notifications' | 'help' | 'settings';

// Type for donation history items
interface DonationHistoryItem {
  id: string;
  initiative: string;
  location_lowercase?: string;
  status: 'pending' | 'accepted' | 'picked' | 'delivered' | 'completed';
  createdAt: any;
  volunteerName?: string;
  volunteerContact?: string;
  expectedArrivalTime?: string;
  feedback?: string;
  feedbackImageUrl?: string;
}

const sidebarItems = [
  { key: 'home' as ActiveSection, label: 'Home', icon: Home, description: 'Dashboard Overview' },
  { key: 'donate' as ActiveSection, label: 'Donate Here', icon: Gift, description: 'Quick Donation Form' },
  { key: 'contributions' as ActiveSection, label: 'My Contributions', icon: History, description: 'Donation History & Status' },
  { key: 'impact' as ActiveSection, label: 'Impact Hub', icon: BarChart3, description: 'See Your Impact & Reports' },
  { key: 'requests' as ActiveSection, label: 'Community Calls', icon: MessageSquare, description: 'Requests from NGOs & People' },
  { key: 'stories' as ActiveSection, label: 'Stories of Change', icon: FileText, description: 'Success Stories & Updates' },
  { key: 'rewards' as ActiveSection, label: 'Rewards & Badges', icon: Award, description: 'Gamification – Achievements' },
  { key: 'notifications' as ActiveSection, label: 'Notifications', icon: Bell, description: 'Alerts & Updates' },
  { key: 'help' as ActiveSection, label: 'Help & Support', icon: HelpCircle, description: 'Contact & Assistance' },
  { key: 'settings' as ActiveSection, label: 'Profile Settings', icon: SettingsIcon, description: 'Account & Preferences' }
];

// Sample data for charts
const donationData = [
  { name: 'Food Donations', value: 35, color: '#10B981' },
  { name: 'Education Support', value: 25, color: '#3B82F6' },
  { name: 'Emergency Aid', value: 20, color: '#EF4444' },
  { name: 'Shelter Support', value: 12, color: '#F59E0B' },
  { name: 'Other', value: 8, color: '#8B5CF6' }
];

const weeklyData = [
  { name: 'Mon', donations: 4 },
  { name: 'Tue', donations: 3 },
  { name: 'Wed', donations: 7 },
  { name: 'Thu', donations: 5 },
  { name: 'Fri', donations: 8 },
  { name: 'Sat', donations: 6 },
  { name: 'Sun', donations: 9 }
];

const monthlyDonationData = [
  { month: 'jan', donations: 15 },
  { month: 'feb', donations: 22 },
  { month: 'mar', donations: 18 },
  { month: 'apr', donations: 25 },
  { month: 'may', donations: 30 },
  { month: 'jun', donations: 28 },
  { month: 'jul', donations: 35 },
  { month: 'aug', donations: 32 },
  { month: 'sep', donations: 40 },
  { month: 'oct', donations: 38 },
  { month: 'nov', donations: 45 },
  { month: 'dec', donations: 50 }
];

const recentActivities = [
  { id: 1, type: 'Food Donation', recipient: 'Local Family', amount: '5 meals', time: '2 hours ago', status: 'completed' },
  { id: 2, type: 'Education Support', recipient: 'Student Aid', amount: '₹2,000', time: '1 day ago', status: 'in-progress' },
  { id: 3, type: 'Emergency Aid', recipient: 'Medical Emergency', amount: '₹5,000', time: '2 days ago', status: 'completed' },
  { id: 4, type: 'Shelter Support', recipient: 'Animal Shelter', amount: '₹1,500', time: '3 days ago', status: 'completed' }
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatCreatedAt(createdAt: any) {
  if (!createdAt) return '';
  if (typeof createdAt?.toDate === 'function') {
    return createdAt.toDate().toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  if (createdAt instanceof Date) {
    return createdAt.toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  if (typeof createdAt === 'string') {
    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
      return date.toLocaleString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
  }
  return '';
}

const formatInitiativeName = (initiative: string) => {
  if (!initiative) return 'Unknown Initiative';
  
  const nameMap: { [key: string]: string } = {
    'annamitra-seva': 'Annamitra Seva',
    'vidya-jyothi': 'Vidya Jyothi',
    'suraksha-setu': 'Suraksha Setu',
    'punarasha': 'PunarAsha',
    'raksha-jyothi': 'Raksha Jyothi',
    'jyothi-nilayam': 'Jyothi Nilayam'
  };
  
  return nameMap[initiative.toLowerCase()] || initiative.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Donation Status Card Component
const DonationStatusCard: React.FC<{ donation: DonationHistoryItem; onOpenImage?: (images: string[], initialIndex?: number) => void }> = ({ donation, onOpenImage }) => {
  const [volunteerDetails, setVolunteerDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Fetch volunteer details when component mounts if donation is accepted
  useEffect(() => {
    if (donation.status === 'accepted' && donation.id) {
      fetchVolunteerDetailsForCard(donation.id);
    }
  }, [donation.id, donation.status]);

  const fetchVolunteerDetailsForCard = async (donationId: string) => {
    setLoadingDetails(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) return;
      
      const idToken = await user.getIdToken();
      
      const response = await fetch(`https://hungrysaver.onrender.com/api/volunteer-details/${donationId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVolunteerDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching volunteer details for card:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case 'pending': return 1;
      case 'accepted': return 2;
      case 'picked': return 3;
      case 'delivered': return 4;
      case 'completed': return 5;
      default: return 1;
    }
  };

  const currentStep = getStatusStep(donation.status);

  const statusSteps = [
    { name: 'Waiting for Volunteer', icon: Clock, color: 'text-gray-400' },
    { name: 'Volunteer Accepted', icon: UserPlus, color: 'text-gray-400' },
    { name: 'Picked Up', icon: Truck, color: 'text-gray-400' },
    { name: 'Delivered', icon: Users2, color: 'text-gray-400' },
    { name: 'Completed', icon: CheckCircle, color: 'text-gray-400' }
  ];

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-[#eaa640]/30 hover:border-[#eaa640]/50 transition-all duration-300 transform hover:scale-105">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-bold text-white">
              {formatInitiativeName(donation.initiative)}
            </h3>
            {/** Badge if this donation originated from a community request */}
            {(donation as any).communityRequestId && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                Community Request
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            📍 {donation.location_lowercase?.charAt(0).toUpperCase() + donation.location_lowercase?.slice(1) || 'Unknown Location'}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          donation.status === 'pending' ? 'bg-[#eeb766]/20 text-[#eeb766] border border-[#eeb766]' :
          donation.status === 'accepted' ? 'bg-[#eaa640]/20 text-[#eaa640] border border-[#eaa640]' :
          donation.status === 'picked' ? 'bg-[#ecae53]/20 text-[#ecae53] border border-[#ecae53]' :
          donation.status === 'delivered' ? 'bg-[#10b981]/20 text-[#10b981] border border-[#10b981]' :
          donation.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500' :
          'bg-gray-600/20 text-gray-300 border border-gray-600'
        }`}>
          {donation.status ? donation.status.charAt(0).toUpperCase() + donation.status.slice(1) : ''}
        </div>
      </div>

      {/* Status Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {statusSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index < currentStep;
            const isCurrent = index === currentStep - 1;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  isActive ? 'bg-[#eaa640] text-black' : 'bg-gray-700 text-gray-400'
                } ${isCurrent ? 'ring-2 ring-[#eaa640] ring-offset-2 ring-offset-gray-900' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs text-center ${isActive ? 'text-[#eaa640] font-medium' : 'text-gray-500'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-[#eaa640] to-[#ecae53] h-2 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 5) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Volunteer Details (if accepted or beyond) */}
      {donation.status !== 'pending' && (
        <div className="bg-[#eaa640]/10 rounded-lg p-4 mb-4 border border-[#eaa640]/20">
          <h4 className="text-[#eaa640] font-semibold mb-2">Volunteer Details</h4>
          {loadingDetails ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#eaa640]"></div>
              <span className="text-gray-400 text-sm ml-2">Loading volunteer details...</span>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-gray-300">
                <span className="font-medium">Volunteer Name:</span> 
                <span className="text-white ml-2">
                  {volunteerDetails?.volunteerName || donation.volunteerName || 'Assigned Volunteer'}
                </span>
              </p>
              <p className="text-gray-300">
                <span className="font-medium">Volunteer Contact:</span> 
                <span className="text-white ml-2">
                  {volunteerDetails?.volunteerContact || donation.volunteerContact || '+91 XXXXX XXXXX'}
                </span>
              </p>
              {volunteerDetails?.expectedArrivalTime && (
                <p className="text-gray-300">
                  <span className="font-medium">Expected Arrival:</span> 
                  <span className="text-white ml-2">
                    {volunteerDetails.expectedArrivalTime}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Volunteer Feedback (for completed donations) */}
      {donation.status === 'completed' && donation.feedback && (
        <div className="bg-green-500/10 rounded-lg p-4 mb-4 border border-green-500/20">
          <h4 className="text-green-400 font-semibold mb-2 flex items-center">
            <span className="mr-2">💬</span>
            Volunteer Feedback
          </h4>
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <p className="text-gray-300 text-sm leading-relaxed italic mb-3">
              "{donation.feedback}"
            </p>
            
            {/* Feedback Image */}
            {donation.feedbackImageUrl && (
              <div className="mt-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-300">📸 Proof of Donation:</span>
                </div>
                <div className="relative">
                  <img
                    src={donation.feedbackImageUrl}
                    alt="Proof of donation"
                    className="w-32 h-32 object-cover rounded-lg border border-gray-600 shadow-lg cursor-zoom-in"
                    onClick={() => onOpenImage && onOpenImage([donation.feedbackImageUrl!], 0)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>📅 {formatCreatedAt(donation.createdAt) || 'Recently'}</span>
        <span className="text-[#eaa640] font-medium">Thanks for your support! 🙏</span>
      </div>
    </div>
  );
};

const DonorDashboard: React.FC = () => {
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const { submitForm, loading, error, success, resetForm } = useFormSubmission('donor');
  const { userData, logout } = useAuth();
  const [donationHistory, setDonationHistory] = useState<DonationHistoryItem[]>([]);
  const [donationHistoryLoading, setDonationHistoryLoading] = useState(false);
  const [approvedCommunityRequests, setApprovedCommunityRequests] = useState<CommunityRequest[]>([]);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CommunityRequest | null>(null);
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; images: string[]; initialIndex: number }>({ isOpen: false, images: [], initialIndex: 0 });
  const [contribFilter, setContribFilter] = useState<'available' | 'completed'>('available');
  const navigate = useNavigate();

  // Hide global site navbar while on donor dashboard
  useEffect(() => {
    const nav = document.querySelector('nav');
    const originalDisplay = nav instanceof HTMLElement ? nav.style.display : '';
    if (nav instanceof HTMLElement) nav.style.display = 'none';
    return () => {
      if (nav instanceof HTMLElement) nav.style.display = originalDisplay;
    };
  }, []);

  // Prevent background scroll when modals are open
  useEffect(() => {
    const shouldLock = claimModalOpen || imageViewer.isOpen || sidebarOpen;
    if (shouldLock) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [claimModalOpen, imageViewer.isOpen, sidebarOpen]);

  const initiatives = [
    // TEMPORARY: Hidden for pilot launch - only showing reusable clothes (PunarAsha)
    // {
    //   id: 'annamitra-seva',
    //   icon: Heart,
    //   title: "🍛 Annamitra Seva",
    //   description: "Donate surplus food to feed hungry families in your community.",
    //   component: AnnamitraSevaForm,
    //   available: true,
    //   color: "from-green-500 to-green-600",
    //   impact: "2,847 meals served",
    //   images: [
    //     '/assets/images/annamitra1.png',
    //     '/assets/images/annamitra2.png',
    //     '/assets/images/annamitra3.png',
    //     '/assets/images/annamitra4.png',
    //     '/assets/images/annamitra5.png'
    //   ]
    // },
    // {
    //   id: 'vidya-jyothi',
    //   icon: BookOpen,
    //   title: "📚 Vidya Jyothi",
    //   description: "Support education through financial assistance for fees, books, and uniforms.",
    //   component: VidyaJyothiForm,
    //   available: true,
    //   color: "from-blue-500 to-blue-600",
    //   impact: "156 students supported",
    //   images: [
    //     '/assets/images/vidya1.png',
    //     '/assets/images/vidya2.png',
    //     '/assets/images/vidya3.png',
    //     '/assets/images/vidya4.png',
    //     '/assets/images/vidya5.png'
    //   ]
    // },
    // {
    //   id: 'suraksha-setu',
    //   icon: Shield,
    //   title: "🤝 Suraksha Setu",
    //   description: "Donate items like clothing, books, and groceries for emergency support.",
    //   component: SurakshaSetuForm,
    //   available: true,
    //   color: "from-purple-500 to-purple-600",
    //   impact: "89 families protected",
    //   images: [
    //     '/assets/images/suraksha1.png',
    //     '/assets/images/suraksha2.png',
    //     '/assets/images/suraksha3.png',
    //     '/assets/images/suraksha4.png'
    //   ]
    // },
    {
      id: 'punarasha',
      icon: Recycle,
      title: "🔄 PunarAsha",
      description: "Donate electronics, furniture, and other items for rehabilitation support.",
      component: PunarAshaForm,
      available: true,
      color: "from-pink-500 to-pink-600",
      impact: "45 lives rebuilt",
      images: [
        '/assets/images/punar1.png',
        '/assets/images/punar2.png',
        '/assets/images/punar3.png',
        '/assets/images/punar4.png'
      ]
    }
    // {
    //   id: 'raksha-jyothi',
    //   icon: Zap,
    //   title: "🚨 Raksha Jyothi",
    //   description: "Provide emergency support for medical, accident, or animal emergencies.",
    //   component: RakshaJyothiForm,
    //   available: true,
    //   color: "from-red-500 to-red-600",
    //   impact: "24/7 emergency response",
    //   images: [
    //     '/assets/images/raksha1.png',
    //     '/assets/images/rakshs2.png',
    //     '/assets/images/raksha3.png',
    //     '/assets/images/raksha4.png'
    //   ]
    // },
    // {
    //   id: 'jyothi-nilayam',
    //   icon: Home,
    //   title: "🏠 Jyothi Nilayam",
    //   description: "Support shelters for humans and animals with full or partial donations.",
    //   component: JyothiNilayamForm,
    //   available: true,
    //   color: "from-orange-500 to-orange-600",
    //   impact: "12 shelters supported",
    //   images: [
    //     '/assets/images/nilayam1.png',
    //     '/assets/images/nilayam2.png',
    //     '/assets/images/nilayam3.png',
    //     '/assets/images/nilayam4.png',
    //     '/assets/images/nilayam5.png',
    //     '/assets/images/nilayam6.png'
    //   ]
    // }
  ];

  // Add user type validation
  useEffect(() => {
    if (userData && userData.userType !== 'donor' && userData.userType !== 'admin') {
      console.error('❌ User type mismatch:', userData.userType, 'Expected: donor or admin');
      // Redirect to appropriate page based on user type
      if (userData.userType === 'volunteer') {
        navigate('/dashboard/volunteer');
      } else if (userData.userType === 'community') {
        navigate('/dashboard/community');
      } else {
        navigate('/login');
      }
    }
  }, [userData, navigate]);

  // Debug: Log user data
  useEffect(() => {
    if (userData) {
      console.log('🔍 DonorDashboard - User Data:', {
        uid: userData.uid,
        userType: userData.userType,
        status: userData.status,
        email: userData.email,
        firstName: userData.firstName
      });
    }
  }, [userData]);

  // Function to fix user type if incorrect
  const fixUserType = async () => {
    if (!userData) return;
    
    try {
      console.log('🔧 Attempting to fix user type for:', userData.uid);
      
      // Update the user's userType in Firestore
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('../config/firebase');
      
      await updateDoc(doc(db, 'users', userData.uid), {
        userType: 'donor',
        updatedAt: new Date()
      });
      
      console.log('✅ User type updated successfully');
      
      // Reload the page to refresh the auth context
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Error fixing user type:', error);
      alert('Failed to update user type. Please contact support.');
    }
  };

  // Debug function to show current user data
  const showUserData = () => {
    if (userData) {
      console.log('🔍 Current User Data:', userData);
      alert(`User Data:\nUID: ${userData.uid}\nEmail: ${userData.email}\nUser Type: ${userData.userType}\nStatus: ${userData.status}\nFirst Name: ${userData.firstName}`);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    if (activeSection === 'requests') {
      // Real-time subscription to approved community requests
      setRequestsLoading(true);
      const q = query(
        collection(db, 'community_requests'),
        where('status', '==', 'APPROVED_BY_VOLUNTEER')
      );
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })) as CommunityRequest[];
        setApprovedCommunityRequests(list);
        setRequestsLoading(false);
      }, (err) => {
        console.error('Realtime fetch error (approved community requests):', err);
        setApprovedCommunityRequests([]);
        setRequestsLoading(false);
      });
    }
    if (activeSection === 'contributions' && userData?.uid) {
      fetchDonationHistory();
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [activeSection, userData?.uid]);

  // Add real-time listener for donation history updates
  useEffect(() => {
    if (!userData?.uid) return;
    
    const q = query(
      collection(db, 'donations'),
      where('userId', '==', userData.uid)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const donations = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Debug logging for real-time updates
        console.log(`🔄 Real-time update for donation ${doc.id}:`, {
          initiative: data.initiative,
          status: data.status,
          volunteerName: data.volunteerName,
          volunteerContact: data.volunteerContact,
          assignedTo: data.assignedTo,
          acceptedAt: data.acceptedAt,
          allFields: Object.keys(data)
        });
        
        return {
          id: doc.id,
          initiative: data.initiative || 'Unknown Initiative',
          location_lowercase: data.city || data.location_lowercase || '',
          status: data.status || 'pending',
          createdAt: data.createdAt,
          volunteerName: data.volunteerName,
          volunteerContact: data.volunteerContact,
          feedback: data.feedback, // Include feedback field
          feedbackImageUrl: data.feedbackImageUrl // Include feedback image URL
        } as DonationHistoryItem;
      });
      
      setDonationHistory(donations);
      setDonationHistoryLoading(false);
    }, (error) => {
      console.error('Error listening to donation updates:', error);
      setDonationHistoryLoading(false);
    });
    
    return () => unsubscribe();
  }, [userData?.uid]);

  // remove old manual fetch functions (using realtime subscription instead)

  const handleCommunityRequestClaim = async (requestId: string, donorAddress: string, notes: string, donorName: string, donorContact: string) => {
    try {
      await claimCommunityRequest(requestId, donorAddress, notes, donorName, donorContact);
      // Success is handled in ClaimForm component
    } catch (error) {
      console.error('Error claiming community request:', error);
      throw error;
    }
  };

  const fetchDonationHistory = async () => {
    setDonationHistoryLoading(true);
    try {
      if (!userData) return;
      const q = query(
        collection(db, 'donations'),
        where('userId', '==', userData.uid)
      );
      const snapshot = await getDocs(q);
      const donations = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Debug logging to see what data is fetched
        console.log(`🔍 Donation ${doc.id} data:`, {
          initiative: data.initiative,
          status: data.status,
          volunteerName: data.volunteerName,
          volunteerContact: data.volunteerContact,
          assignedTo: data.assignedTo,
          acceptedAt: data.acceptedAt,
          allFields: Object.keys(data)
        });
        
        return {
          id: doc.id,
          initiative: data.initiative || 'Unknown Initiative',
          location_lowercase: data.city || data.location_lowercase || '',
          status: data.status || 'pending',
          createdAt: data.createdAt,
          volunteerName: data.volunteerName,
          volunteerContact: data.volunteerContact,
          feedback: data.feedback, // Include feedback field
          feedbackImageUrl: data.feedbackImageUrl // Include feedback image URL
        } as DonationHistoryItem;
      });
      setDonationHistory(donations);
    } catch (error) {
      console.error('Error fetching donation history:', error);
    } finally {
      setDonationHistoryLoading(false);
    }
  };

  // Function to fetch volunteer details from the new collection
  const fetchVolunteerDetails = async (donationId: string) => {
    try {
      const { getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.error('No authenticated user found');
        return null;
      }
      
      const idToken = await user.getIdToken();
      
      const response = await fetch(`https://hungrysaver.onrender.com/api/volunteer-details/${donationId}`, {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`No volunteer details found for donation ${donationId}`);
          return null;
        }
        throw new Error('Failed to fetch volunteer details');
      }
      
      const data = await response.json();
      console.log('📞 Fetched volunteer details:', data);
      return data.data;
    } catch (error) {
      console.error('Error fetching volunteer details:', error);
      return null;
    }
  };

  const handleFormSubmit = async (formData: DonorFormData): Promise<boolean> => {
    const submissionData = {
      ...formData,
      initiative: selectedInitiative
    };
    const result = await submitForm(submissionData);
    if (result) {
      setTimeout(() => {
        resetForm();
      }, 3000);
    }
    return result;
  };

  const handleCommunityDonate = (request: CommunityRequest) => {
    let route = '';
    switch (request.initiative) {
      case 'annamitra-seva':
        route = `/community-donor/annamitra-seva/${request.id}`;
        break;
      case 'vidya-jyothi':
        route = `/community-donor/vidya-jyothi/${request.id}`;
        break;
      case 'suraksha-setu':
        route = `/community-donor/suraksha-setu/${request.id}`;
        break;
      case 'punarasha':
        route = `/community-donor/punar-asha/${request.id}`;
        break;
      case 'raksha-jyothi':
        route = `/community-donor/raksha-jyothi/${request.id}`;
        break;
      case 'jyothi-nilayam':
        route = `/community-donor/jyothi-nilayam/${request.id}`;
        break;
      default:
        console.error('Unknown initiative:', request.initiative);
        return;
    }
    navigate(route, { state: { request } });
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getInitiativeEmoji = (initiative: string) => {
    const emojiMap: { [key: string]: string } = {
      'annamitra-seva': '🍛',
      'vidya-jyothi': '📚',
      'suraksha-setu': '🛡️',
      'punarasha': '♻️',
      'raksha-jyothi': '⚡',
      'jyothi-nilayam': '🏠'
    };
    return emojiMap[initiative.toLowerCase()] || '💝';
  };



  const selectedInitiativeData = initiatives.find(init => init.id === selectedInitiative);
  const FormComponent = selectedInitiativeData?.component;

  if (success) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 text-center max-w-md mx-4 border border-[#eaa640]/30">
          <div className="bg-[#eaa640] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">🎉 Donation Submitted!</h2>
          <p className="text-gray-300 mb-4">
            Thank you for your generous donation. Volunteers in your area will be notified and will contact you soon to arrange pickup/delivery.
          </p>
          <div className="bg-[#eaa640]/20 border border-[#eaa640] rounded-lg p-3 mb-4">
            <p className="text-[#eaa640] text-sm">
              Expected response time: 2-6 hours
            </p>
          </div>
          <div className="bg-[#eaa640]/10 border border-[#eaa640]/30 rounded-lg p-3 mb-4">
            <p className="text-[#eaa640] text-sm italic">
              🧡 "This is not just a donation — it's a lifeline."
            </p>
          </div>
          <button
            onClick={resetForm}
            className="bg-[#eaa640] hover:bg-[#ecae53] text-black px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Make Another Donation
          </button>
        </div>
      </div>
    );
  }

  const renderHomeSection = () => (
    <div className="space-y-8">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#eaa640]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Total Donations This Week</p>
              <p className="text-2xl font-bold text-[#eaa640]">42</p>
              <p className="text-xs text-[#eaa640]">+12% from last week</p>
            </div>
            <div className="bg-[#eaa640]/20 p-3 rounded-full">
              <Heart className="h-6 w-6 text-[#eaa640]" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#ecae53]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Total Volunteers</p>
              <p className="text-2xl font-bold text-[#ecae53]">156</p>
              <p className="text-xs text-[#ecae53]">+8 new this month</p>
            </div>
            <div className="bg-[#ecae53]/20 p-3 rounded-full">
              <Users className="h-6 w-6 text-[#ecae53]" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#eeb766]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">Missions Completed</p>
              <p className="text-2xl font-bold text-[#eeb766]">89</p>
              <p className="text-xs text-[#eeb766]">+15 this week</p>
            </div>
            <div className="bg-[#eeb766]/20 p-3 rounded-full">
              <Award className="h-6 w-6 text-[#eeb766]" />
            </div>
          </div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#f0c079]/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-300">People Impacted</p>
              <p className="text-2xl font-bold text-[#f0c079]">1,247</p>
              <p className="text-xs text-[#f0c079]">+89 this week</p>
            </div>
            <div className="bg-[#f0c079]/20 p-3 rounded-full">
              <TrendingUp className="h-6 w-6 text-[#f0c079]" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#eaa640]/30">
          <h3 className="text-lg font-semibold text-white mb-4">Donations by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {donationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {donationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-300">{item.name}</span>
                </div>
                <span className="font-medium text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#eaa640]/30">
          <h3 className="text-lg font-semibold text-white mb-4">Weekly Donation Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Bar dataKey="donations" fill="#EAA640" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donations Over Time - Centered */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-4xl">
            <div className="bg-[#1E102C] rounded-[20px] p-6 shadow-lg border border-[#eaa640]/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#eaa640]/5 to-transparent opacity-30"></div>
              <div className="relative z-10">
                <h3 className="text-lg font-bold text-white mb-6">Donations Over Time</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyDonationData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="donationGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#EAA640" />
                          <stop offset="100%" stopColor="#EBE7E1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                      <XAxis 
                        dataKey="month" 
                        stroke="#EBE7E1" 
                        fontSize={12}
                        tick={{ fill: '#EBE7E1' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="#9ca3af" 
                        fontSize={12}
                        tick={{ fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(value) => `${value}k`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#1E102C',
                          border: '1px solid #EAA640',
                          borderRadius: '8px',
                          color: 'white'
                        }}
                        labelStyle={{ color: '#EBE7E1' }}
                        formatter={(value: any) => [`${value}k donations`, 'Amount']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="donations" 
                        stroke="white" 
                        strokeWidth={3}
                        fill="url(#donationGradient)"
                        fillOpacity={0.8}
                        dot={{
                          fill: 'white',
                          stroke: '#EAA640',
                          strokeWidth: 2,
                          r: 4,
                          filter: 'drop-shadow(0 0 4px rgba(234, 166, 64, 0.6))'
                        }}
                        activeDot={{
                          fill: 'white',
                          stroke: '#EAA640',
                          strokeWidth: 3,
                          r: 6,
                          filter: 'drop-shadow(0 0 8px rgba(234, 166, 64, 0.8))'
                        }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#eaa640]/30">
        <h3 className="text-lg font-semibold text-white mb-4">Donation Locations</h3>
        <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900"></div>
          <div className="relative z-10 text-center">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-300">Interactive map showing donation locations</p>
            <p className="text-sm text-gray-500 mt-1">Map integration coming soon</p>
          </div>
          {/* Sample markers */}
          <div className="absolute top-4 left-8 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <div className="absolute top-12 right-12 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-8 left-16 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="absolute bottom-16 right-8 w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-[#eaa640]/30">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-300">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Recipient</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Time</th>
                <th className="text-left py-3 px-4 font-medium text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-white">{activity.type}</td>
                  <td className="py-3 px-4 text-gray-300">{activity.recipient}</td>
                  <td className="py-3 px-4 text-white font-medium">{activity.amount}</td>
                  <td className="py-3 px-4 text-gray-400 text-sm">{activity.time}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'completed' 
                        ? 'bg-[#eaa640]/20 text-[#eaa640] border border-[#eaa640]' 
                        : 'bg-[#eeb766]/20 text-[#eeb766] border border-[#eeb766]'
                    }`}>
                      {activity.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Reusable initiative card with background slideshow
  const InitiativeCard: React.FC<{ initiative: any; onClick: () => void }> = ({ initiative, onClick }) => {
    const Icon = initiative.icon;
    const slideshowImages: string[] = initiative.images || [initiative.image];
    const [idx, setIdx] = React.useState(0);
    const [prevIdx, setPrevIdx] = React.useState<number | null>(null);
    React.useEffect(() => {
      if (!slideshowImages || slideshowImages.length <= 1) return;
      const t = setInterval(() => {
        setPrevIdx(idx);
        setIdx((p) => (p + 1) % slideshowImages.length);
      }, 8000);
      return () => clearInterval(t);
    }, [slideshowImages?.length]);
    return (
      <button
        onClick={onClick}
        className="group relative w-full text-left bg-gray-900 rounded-xl p-0 transition transform hover:scale-105 hover:shadow-lg border border-gray-700 hover:border-[#eaa640] overflow-hidden hover:bg-[#eaa640]/10 active:bg-[#eaa640]/20"
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-[#eaa640] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative h-64 w-full">
          {(slideshowImages || []).map((src, i) => (
            <img
              key={i}
              src={src}
              alt={initiative.title}
              className={`absolute inset-0 w-full h-64 object-cover rounded-t-xl transition-all ease-in-out ${i === idx ? 'opacity-100' : i === prevIdx ? 'opacity-0' : 'opacity-0'} ${i === idx ? 'filter blur-0 scale-100' : i === prevIdx ? 'filter blur-md scale-[1.02]' : ''}`}
              style={{ zIndex: i === idx ? 2 : i === prevIdx ? 1 : 0, transitionDuration: '1000ms' }}
            />
          ))}
        </div>
        <div className="p-4">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full bg-[#eaa640]/20 group-hover:bg-[#eaa640]/30 transition-all duration-300 ring-0 group-hover:ring-4 ring-[#eaa640]/30`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white">{initiative.title}</h3>
          </div>
          <p className="text-sm text-gray-400 mt-1">{initiative.description}</p>
        </div>
      </button>
    );
  };

  const renderDonateSection = () => (
    <div>
      {selectedInitiative === '' ? (
        <div>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Initiative</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Select an initiative to make a donation. Each initiative serves a specific need in our community.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {initiatives.map((initiative) => (
              <InitiativeCard
                key={initiative.id}
                initiative={initiative}
                onClick={() => setSelectedInitiative(initiative.id)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {FormComponent && (
            <>
              <FormComponent
                onSubmit={async (data) => {
                  const result = await handleFormSubmit(data);
                  if (result) {
                    setTimeout(() => setSelectedInitiative(''), 3000);
                  }
                }}
                loading={loading}
              />
              <button
                type="button"
                className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                onClick={() => setSelectedInitiative('')}
                disabled={loading}
              >
                Cancel
              </button>
            </>
          )}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderRequestsSection = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Community Requests</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Help community members in need by accepting their requests. Your donation will be matched with volunteers for delivery.
        </p>
      </div>

      {requestsLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eaa640] mx-auto mb-4"></div>
          <p className="text-gray-300">Loading community requests...</p>
        </div>
      ) : approvedCommunityRequests.length === 0 ? (
        <AnimatedEmptyState
          type="requests"
          title="No pending requests"
          description="All community requests have been fulfilled. Check back later for new opportunities to help!"
          actionText="Make a Direct Donation"
          onAction={() => setActiveSection('donate')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {approvedCommunityRequests.map((request) => (
            <div key={request.id} className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 hover:shadow-lg transition-all duration-300 border border-[#eaa640]/30 hover:border-[#eaa640] transform hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getInitiativeEmoji(request.initiative)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {request.initiative ? request.initiative.replace('-', ' ') : ''}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs border font-medium bg-green-500/10 text-green-400 border-green-500`}>APPROVED BY VOLUNTEER</span>
                  </div>
                </div>
              </div>
              {/* Basic details for all initiatives */}
              <div className="mb-2 text-gray-300 text-sm space-y-1">
                <div><span className="font-semibold">Contact Person:</span> {request.beneficiaryName || '-'}</div>
                <div><span className="font-semibold">Contact Number:</span> {request.beneficiaryContact || '-'}</div>
              </div>
              <p className="text-gray-300 mb-4 leading-relaxed">{request.description}</p>

              {/* Images (if present) */}
              {((request as any).imageUrl || (Array.isArray((request as any).imageUrls) && (request as any).imageUrls.length > 0)) && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-300">Images:</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {(((request as any).imageUrls as string[]) || [(request as any).imageUrl]).map((url: string, idx: number) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`Request image ${idx + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-600 shadow-lg cursor-zoom-in"
                        onClick={() => setImageViewer({ isOpen: true, images: (((request as any).imageUrls as string[]) || [(request as any).imageUrl]), initialIndex: idx })}
                        onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span className="capitalize">{request.location_lowercase || request.location || '-'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{request.beneficiaryName || '-'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{formatCreatedAt(request.createdAt) || 'Recently'}</span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedRequest(request); setClaimModalOpen(true); }}
                className="w-full bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] hover:to-[#eeb766] text-black py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                <Heart className="h-4 w-4" />
                <span>Support This Request</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderImpactSection = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Your Impact Journey</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          See the incredible difference you've made in your community through your generous donations.
        </p>
      </div>

      {/* Impact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-[#eaa640] to-[#ecae53] p-6 rounded-xl text-black text-center">
          <Heart className="h-8 w-8 mx-auto mb-2" />
          <div className="text-2xl font-bold">25</div>
          <div className="text-sm opacity-90">Families Fed</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#ecae53] to-[#eeb766] p-6 rounded-xl text-black text-center">
          <BookOpen className="h-8 w-8 mx-auto mb-2" />
          <div className="text-2xl font-bold">12</div>
          <div className="text-sm opacity-90">Students Supported</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#eeb766] to-[#f0c079] p-6 rounded-xl text-black text-center">
          <Shield className="h-8 w-8 mx-auto mb-2" />
          <div className="text-2xl font-bold">8</div>
          <div className="text-sm opacity-90">Emergency Responses</div>
        </div>
        
        <div className="bg-gradient-to-br from-[#f0c079] to-[#eaa640] p-6 rounded-xl text-black text-center">
          <Building className="h-8 w-8 mx-auto mb-2" />
          <div className="text-2xl font-bold">3</div>
          <div className="text-sm opacity-90">Shelters Supported</div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 mb-8 shadow-sm border border-[#eaa640]/30">
        <h3 className="text-2xl font-bold text-white mb-6 text-center">🏆 Your Achievements</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="bg-gradient-to-br from-[#eeb766] to-[#f0c079] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Star className="h-8 w-8 text-black" />
            </div>
            <h4 className="text-white font-semibold mb-2">First Helper</h4>
            <p className="text-gray-300 text-sm">Completed your first donation</p>
            <div className="bg-[#ecae53]/20 text-[#ecae53] border border-[#ecae53] px-3 py-1 rounded-full text-xs mt-2 inline-block">
              ✅ Earned
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-br from-[#eaa640] to-[#ecae53] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Heart className="h-8 w-8 text-black" />
            </div>
            <h4 className="text-white font-semibold mb-2">Community Hero</h4>
            <p className="text-gray-300 text-sm">Helped 50+ families</p>
            <div className="bg-[#eeb766]/20 text-[#eeb766] border border-[#eeb766] px-3 py-1 rounded-full text-xs mt-2 inline-block">
              32/50 Progress
            </div>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-br from-[#f0c079] to-[#eaa640] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Award className="h-8 w-8 text-black" />
            </div>
            <h4 className="text-white font-semibold mb-2">Consistent Giver</h4>
            <p className="text-gray-300 text-sm">Donated for 30 consecutive days</p>
            <div className="bg-gray-600/20 text-gray-400 border border-gray-600 px-3 py-1 rounded-full text-xs mt-2 inline-block">
              🔒 Locked
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="bg-gradient-to-r from-[#eaa640] to-[#ecae53] rounded-xl p-8 text-center text-black">
        <h3 className="text-2xl font-bold mb-4">🌟 Thank You for Making a Difference!</h3>
        <p className="text-lg mb-4">
          Your kindness has created ripples of hope in the community. Thank you for being part of the solution to hunger and need.
        </p>
        <p className="text-gray-800 italic">
          "Your small step today can become someone's reason to survive tomorrow."
        </p>
      </div>
    </div>
  );

  const renderContributionsSection = () => (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">Your Donation History</h2>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Track all your donations and see their current status.
        </p>
      </div>
      {/* Filter Pills - simplified */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {([
          { key: 'available', label: 'Available (In Progress)' },
          { key: 'completed', label: 'Completed Donations' }
        ] as const).map(pill => (
          <button
            key={pill.key}
            onClick={() => setContribFilter(pill.key)}
            className={`px-4 py-2 rounded-full text-sm border transition-colors ${
              contribFilter === pill.key
                ? 'bg-[#eaa640] text-black border-[#eaa640]'
                : 'bg-transparent text-gray-300 border-gray-600 hover:border-[#eaa640] hover:text-[#eaa640]'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>
      {donationHistoryLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eaa640] mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your donation history...</p>
        </div>
      ) : donationHistory.length === 0 ? (
        <AnimatedEmptyState
          type="donations"
          title="No donations yet"
          description="Your donations will appear here once you make them."
          actionText="Make a Donation"
          onAction={() => setActiveSection('donate')}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {donationHistory
            .filter((d: any) => (contribFilter === 'available' ? d.status !== 'completed' : d.status === 'completed'))
            .map((donation: DonationHistoryItem) => (
              <DonationStatusCard key={donation.id} donation={donation} onOpenImage={(images, idx = 0) => setImageViewer({ isOpen: true, images, initialIndex: idx })} />
            ))}
        </div>
      )}
    </div>
  );

  const renderPlaceholderSection = (title: string, description: string) => (
    <div className="text-center py-16">
      <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-[#eaa640]/30 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <p className="text-gray-300 mb-6">{description}</p>
        <div className="bg-[#eaa640]/20 border border-[#eaa640] rounded-lg p-4">
          <p className="text-[#eaa640] text-sm">This section is coming soon!</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'home':
        return renderHomeSection();
      case 'donate':
        return renderDonateSection();
      case 'contributions':
        return renderContributionsSection();
      case 'impact':
        return renderImpactSection();
      case 'requests':
        return renderRequestsSection();
      case 'stories':
        return (
          <div className="space-y-8">
            <SuccessStories />
          </div>
        );
      case 'rewards':
        return renderPlaceholderSection('Rewards & Badges', 'Track your achievements and unlock new badges.');
      case 'notifications':
        return renderPlaceholderSection('Notifications', 'Stay updated with alerts and important messages.');
      case 'help':
        return renderPlaceholderSection('Help & Support', 'Get assistance and contact our support team.');
      case 'settings':
        return <Settings userType="donor" />;
      default:
        return renderHomeSection();
    }
  };

  // Prevent rendering if user type is incorrect
  if (userData && userData.userType !== 'donor' && userData.userType !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <X className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">
            This dashboard is only for donors. Your account type is: <span className="text-red-400 font-semibold">{userData.userType}</span>
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/login')} 
              className="bg-[#eaa640] hover:bg-[#eeb766] text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 mr-2"
            >
              Go to Login
            </button>
            <button 
              onClick={() => navigate('/register')} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 mr-2"
            >
              Register as Donor
            </button>
            <button 
              onClick={fixUserType}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 mr-2"
            >
              Fix My Account Type
            </button>
            <button 
              onClick={showUserData}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
            >
              Show My Data
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-4">
            If you believe this is an error, you can try to fix your account type or re-register with the correct user type.
          </p>
        </div>
      </div>
    );
  }

  // (imageViewer state declared earlier)

  return (
    <div className="min-h-screen bg-black">
      {/* Minimal Dashboard Header (only for Donor Dashboard) */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-transparent h-[60px]"
      >
        <div className="h-full flex items-center justify-between px-5">
          {/* Left: Mobile sidebar toggle + User type */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden px-3 py-2 rounded-md border border-[#eaa640]/40 text-[#eaa640] hover:bg-[#eaa640]/10 transition-colors"
            >
              ☰ Dashboard
            </button>
            <div className="flex items-center space-x-2 text-gray-200">
              <div className="h-8 w-8 rounded-full border border-gray-400/60 flex items-center justify-center">
                <User className="h-4 w-4 text-gray-300" />
              </div>
              <span className="text-sm">Donor</span>
            </div>
          </div>
          {/* Right: Logout */}
          <button
            onClick={async () => {
              try {
                await logout();
                navigate('/login');
              } catch (error) {
                console.error('Logout error:', error);
              }
            }}
            className="bg-[#eaa640] hover:bg-[#eeb766] text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-[60px] bottom-0 w-64 bg-black shadow-lg border-r border-[#eaa640]/20 transform transition-transform duration-300 ease-in-out z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-4 h-full overflow-y-auto relative">
          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 text-gray-300 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
          <nav className="space-y-2 mt-6 lg:mt-0">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveSection(item.key);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                    activeSection === item.key
                      ? 'bg-gradient-to-r from-[#eaa640]/20 to-[#eeb766]/20 text-[#eaa640] border-l-4 border-[#eaa640]'
                      : 'text-gray-400 hover:text-[#eaa640] hover:bg-[#eaa640]/10'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeSection === item.key ? 'text-[#eaa640]' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64 pt-[60px]">
        <div className="p-6">
          {activeSection === 'home' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {userData?.firstName || 'Donor'}!</h1>
                <p className="text-gray-300">Here's your impact dashboard and latest community updates.</p>
              </div>
              <div className="mb-8">
                <ImpactSection />
              </div>
            </>
          )}
          {renderContent()}
        </div>
      </div>

      {/* Claim Modal inline import to avoid circular deps */}
      {claimModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-3xl mx-auto border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-[#eaa640]/20 rounded-lg">
                  <Heart className="h-6 w-6 text-[#eaa640]" />
                </div>
                <h3 className="text-xl font-semibold text-white">Support This Request</h3>
              </div>
              <button onClick={() => { setClaimModalOpen(false); setSelectedRequest(null); }} className="text-gray-400 hover:text-white transition-colors">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="max-h-[85vh] overflow-y-auto p-6">
              <ClaimForm
                onSubmit={async (addr, notes, donorName, donorContact) => {
                  try {
                    await handleCommunityRequestClaim(selectedRequest.id, addr, notes, donorName, donorContact);
                  } catch (e: any) {
                    alert(e?.message || 'Failed to submit. Please try again.');
                  }
                }}
                request={selectedRequest}
                onCancel={() => { setClaimModalOpen(false); setSelectedRequest(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        images={imageViewer.images}
        initialIndex={imageViewer.initialIndex}
        onClose={() => setImageViewer({ isOpen: false, images: [], initialIndex: 0 })}
      />
    </div>
  );
};

export default DonorDashboard;

// Lightweight inline claim form to avoid extra imports
const ClaimForm: React.FC<{ request: CommunityRequest; onSubmit: (addr: string, notes: string, donorName: string, donorContact: string) => Promise<void>; onCancel: () => void; }> = ({ request, onSubmit, onCancel }) => {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorContact, setDonorContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim() || !donorName.trim() || !donorContact.trim()) return;
    
    setSubmitting(true);
    try {
      await onSubmit(address.trim(), notes.trim(), donorName.trim(), donorContact.trim());
      setSuccessMessage('Request claimed successfully! A donation record has been created and linked. Volunteers will be notified for pickup coordination.');
      setSuccess(true);
      // Reset form
      setAddress('');
      setNotes('');
      setDonorName('');
      setDonorContact('');
    } catch (error) {
      console.error('Error claiming request:', error);
      alert('Failed to claim request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <div className="bg-[#eaa640] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">✅</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">🎉 Request Claimed Successfully!</h3>
        <p className="text-gray-300 mb-4">{successMessage}</p>
        <div className="bg-[#eaa640]/20 border border-[#eaa640] rounded-lg p-3 mb-4">
          <p className="text-[#eaa640] text-sm">
            Volunteers will be notified and will contact you soon to arrange pickup.
          </p>
        </div>
        <button
          onClick={onCancel}
          className="bg-[#eaa640] hover:bg-[#ecae53] text-black px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 space-y-4"
    >
      <div className="bg-gray-700/30 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Request Details</h4>
        <div className="space-y-2 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-[#eaa640]" />
            <span>{request.address}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-[#eaa640]" />
            <span>{request.description}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">Your Name <span className="text-red-400">*</span></label>
          <input value={donorName} onChange={(e) => setDonorName(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none transition-colors" placeholder="Enter your full name..." required />
        </div>
        <div>
          <label className="block text-sm font-medium text-white mb-2">Mobile Number <span className="text-red-400">*</span></label>
          <input value={donorContact} onChange={(e) => setDonorContact(e.target.value)} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none transition-colors" placeholder="Enter your mobile number..." required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-white mb-2">Your Address <span className="text-red-400">*</span></label>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none transition-colors" placeholder="Enter your full address for pickup..." required />
      </div>
      <div>
        <label className="block text-sm font-medium text-white mb-2">Additional Notes (Optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none transition-colors" placeholder="Any additional information or special instructions..." />
      </div>
      <div className="flex space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-medium transition-colors">Cancel</button>
        <button type="submit" disabled={submitting || !address.trim()} className="flex-1 px-4 py-3 bg-[#eaa640] hover:bg-[#eaa640]/80 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-black font-medium transition-colors">{submitting ? 'Submitting...' : 'Confirm Support'}</button>
      </div>
    </form>
  );
};