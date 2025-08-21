import React, { useState, useEffect } from 'react';
import { 
  Heart, BookOpen, Shield, Home, Zap, Building, Users, Calendar, MapPin, Clock, TrendingUp, Award, Star,
  Menu, X, Bell, LogOut, User, Gift, History, BarChart3, MessageSquare, FileText, HelpCircle, Settings
} from 'lucide-react';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFormSubmission } from '../hooks/useFormSubmission';
import ImpactSection from '../components/ImpactSection';
import SuccessStories from '../components/SuccessStories';
import AnimatedEmptyState from '../components/AnimatedIllustrations';
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
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface CommunityRequest {
  id: string;
  userId?: string;
  initiative: string;
  location?: string;
  location_lowercase?: string;
  address?: string;
  beneficiaryName?: string;
  beneficiaryContact?: string;
  childName?: string;
  childAge?: string;
  schoolName?: string;
  class?: string;
  neededItems?: Record<string, boolean>;
  neededItemTypes?: string[];
  requestedItems?: string[];
  parentGuardianName?: string;
  shelterTypeNeeded?: string;
  numberOfPeopleAnimals?: string;
  numberOfPeople?: string;
  durationNeeded?: string;
  emergencyDescription?: string;
  peopleAnimalsAffected?: string;
  immediateNeeds?: string;
  quantityRequired?: string;
  purpose?: string;
  quantityNeeded?: string;
  dietaryRestrictions?: string;
  mealFrequency?: string;
  donorName?: string;
  donorContact?: string;
  donorAddress?: string;
  availableTime?: string;
  description?: string;
  urgency?: 'low' | 'medium' | 'high' | string;
  status?: 'pending' | 'accepted' | 'completed' | string;
  createdAt?: Date | string | { toDate: () => Date };
  acceptedBy?: string;
  acceptedAt?: Date | string | { toDate: () => Date };
  completedAt?: Date | string | { toDate: () => Date };
  updatedAt?: Date | string | { toDate: () => Date };
  details?: unknown;
  [key: string]: unknown;
}

type DonorFormData =
  | AnnamitraSevaFormData
  | VidyaJyothiFormData
  | SurakshaSetuFormData
  | PunarAshaFormData
  | RakshaJyothiFormData
  | JyothiNilayamFormData;

type ActiveSection = 'home' | 'donate' | 'contributions' | 'impact' | 'requests' | 'stories' | 'rewards' | 'notifications' | 'help' | 'settings';

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
  { key: 'settings' as ActiveSection, label: 'Profile Settings', icon: Settings, description: 'Account & Preferences' }
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

const DonorDashboard: React.FC = () => {
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const { submitForm, loading, error, success, resetForm } = useFormSubmission('donor');
  const { userData, logout } = useAuth();
  const [donationHistory, setDonationHistory] = useState<CommunityRequest[]>([]);
  const [donationHistoryLoading, setDonationHistoryLoading] = useState(false);
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

  const initiatives = [
    {
      id: 'annamitra-seva',
      icon: Heart,
      title: "🍛 Annamitra Seva",
      description: "Donate surplus food to feed hungry families in your community.",
      component: AnnamitraSevaForm,
      available: true,
      color: "from-green-500 to-green-600",
      impact: "2,847 meals served"
    },
    {
      id: 'vidya-jyothi',
      icon: BookOpen,
      title: "📚 Vidya Jyothi",
      description: "Support education through financial assistance for fees, books, and uniforms.",
      component: VidyaJyothiForm,
      available: true,
      color: "from-blue-500 to-blue-600",
      impact: "156 students supported"
    },
    {
      id: 'suraksha-setu',
      icon: Shield,
      title: "🤝 Suraksha Setu",
      description: "Donate items like clothing, books, and groceries for emergency support.",
      component: SurakshaSetuForm,
      available: true,
      color: "from-purple-500 to-purple-600",
      impact: "89 families protected"
    },
    {
      id: 'punarasha',
      icon: Home,
      title: "🔄 PunarAsha",
      description: "Donate electronics, furniture, and other items for rehabilitation support.",
      component: PunarAshaForm,
      available: true,
      color: "from-pink-500 to-pink-600",
      impact: "45 lives rebuilt"
    },
    {
      id: 'raksha-jyothi',
      icon: Zap,
      title: "🚨 Raksha Jyothi",
      description: "Provide emergency support for medical, accident, or animal emergencies.",
      component: RakshaJyothiForm,
      available: true,
      color: "from-red-500 to-red-600",
      impact: "24/7 emergency response"
    },
    {
      id: 'jyothi-nilayam',
      icon: Building,
      title: "🏠 Jyothi Nilayam",
      description: "Support shelters for humans and animals with full or partial donations.",
      component: JyothiNilayamForm,
      available: true,
      color: "from-orange-500 to-orange-600",
      impact: "12 shelters supported"
    }
  ];

  useEffect(() => {
    if (activeSection === 'requests') {
      fetchCommunityRequests();
    }
    if (activeSection === 'contributions' && userData?.uid) {
      fetchDonationHistory();
    }
  }, [activeSection, userData?.uid]);

  const fetchCommunityRequests = async () => {
    try {
      setRequestsLoading(true);
      const requestsQuery = query(
        collection(db, 'community_requests'),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityRequest[];
      // Sort by urgency and creation date
      const urgencyOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const getDate = (val: unknown): Date => {
        if (!val) return new Date(0);
        if (typeof val === 'string') {
          const d = new Date(val);
          return isNaN(d.getTime()) ? new Date(0) : d;
        }
        if (val instanceof Date) return val;
        if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: unknown }).toDate === 'function') {
          return (val as { toDate: () => Date }).toDate();
        }
        return new Date(0);
      };
      const sortedRequests = requests.sort((a, b) => {
        const urgencyA = typeof a.urgency === 'string' ? urgencyOrder[a.urgency] ?? 0 : 0;
        const urgencyB = typeof b.urgency === 'string' ? urgencyOrder[b.urgency] ?? 0 : 0;
        const urgencyDiff = urgencyB - urgencyA;
        if (urgencyDiff !== 0) return urgencyDiff;
        const aTime = getDate(a.createdAt);
        const bTime = getDate(b.createdAt);
        return bTime.getTime() - aTime.getTime();
      });
      setCommunityRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching community requests:', error);
    } finally {
      setRequestsLoading(false);
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
      const donations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommunityRequest));
      setDonationHistory(donations);
    } catch (error) {
      console.error('Error fetching donation history:', error);
    } finally {
      setDonationHistoryLoading(false);
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
      'punarasha': '🏠',
      'raksha-jyothi': '⚡',
      'jyothi-nilayam': '🏛️'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initiatives.map((initiative) => {
              const Icon = initiative.icon;
              
              return (
                <button
                  key={initiative.id}
                  onClick={() => setSelectedInitiative(initiative.id)}
                  className="w-full text-left p-6 rounded-lg border-2 border-gray-600 bg-gray-900/80 backdrop-blur-sm hover:border-[#eaa640] hover:bg-[#eaa640]/10 transition-all hover:scale-105 shadow-sm"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${initiative.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-xl text-white mb-2">
                        {initiative.title}
                      </h3>
                      <p className="text-sm text-gray-300 mb-3">
                        {initiative.description}
                      </p>
                      <div className="text-xs text-[#eaa640] font-medium">
                        {initiative.impact}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
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
      ) : communityRequests.length === 0 ? (
        <AnimatedEmptyState
          type="requests"
          title="No pending requests"
          description="All community requests have been fulfilled. Check back later for new opportunities to help!"
          actionText="Make a Direct Donation"
          onAction={() => setActiveSection('donate')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communityRequests.map((request) => (
            <div key={request.id} className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 hover:shadow-lg transition-all duration-300 border border-[#eaa640]/30 hover:border-[#eaa640] transform hover:scale-105">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getInitiativeEmoji(request.initiative)}</div>
                  <div>
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {request.initiative ? request.initiative.replace('-', ' ') : ''}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getUrgencyColor(request.urgency as string)}`}>{request.urgency ? request.urgency.toUpperCase() : ''} PRIORITY</span>
                  </div>
                </div>
              </div>
              {/* Initiative-specific details */}
              {request.initiative === 'vidya-jyothi' ? (
                <div className="mb-2 text-gray-300 text-sm space-y-1">
                  <div><span className="font-semibold">Parent/Guardian:</span> {request.parentGuardianName || request.beneficiaryName || '-'}</div>
                  <div><span className="font-semibold">Contact:</span> {request.beneficiaryContact || '-'}</div>
                  <div><span className="font-semibold">Child Name:</span> {request.childName || '-'}</div>
                  <div><span className="font-semibold">Child Age:</span> {request.childAge || '-'}</div>
                  <div><span className="font-semibold">School:</span> {request.schoolName || '-'}</div>
                  <div><span className="font-semibold">Class:</span> {request.class || '-'}</div>
                  <div><span className="font-semibold">Needed Items:</span> {request.neededItems && Object.keys(request.neededItems).length > 0 ? Object.keys(request.neededItems).filter(k => request.neededItems && request.neededItems[k]).join(', ') : '-'}</div>
                </div>
              ) : null}
              {request.initiative === 'jyothi-nilayam' ? (
                <div className="mb-2 text-gray-300 text-sm space-y-1">
                  <div><span className="font-semibold">Contact Person:</span> {request.beneficiaryName || '-'}</div>
                  <div><span className="font-semibold">Contact Number:</span> {request.beneficiaryContact || '-'}</div>
                  <div><span className="font-semibold">Shelter Type Needed:</span> {request.shelterTypeNeeded || '-'}</div>
                  <div><span className="font-semibold">Number of People/Animals:</span> {request.numberOfPeopleAnimals || '-'}</div>
                  <div><span className="font-semibold">Duration Needed:</span> {request.durationNeeded || '-'}</div>
                </div>
              ) : null}
              {request.initiative === 'suraksha-setu' ? (
                <div className="mb-2 text-gray-300 text-sm space-y-1">
                  <div><span className="font-semibold">Contact Person:</span> {request.beneficiaryName || '-'}</div>
                  <div><span className="font-semibold">Contact Number:</span> {request.beneficiaryContact || '-'}</div>
                  <div><span className="font-semibold">Needed Item Types:</span> {request.neededItemTypes ? request.neededItemTypes.join(', ') : '-'}</div>
                  <div><span className="font-semibold">Quantity Required:</span> {request.quantityRequired || '-'}</div>
                </div>
              ) : null}
              {request.initiative === 'punarasha' ? (
                <div className="mb-2 text-gray-300 text-sm space-y-1">
                  <div><span className="font-semibold">Contact Person:</span> {request.beneficiaryName || '-'}</div>
                  <div><span className="font-semibold">Contact Number:</span> {request.beneficiaryContact || '-'}</div>
                  <div><span className="font-semibold">Requested Items:</span> {request.requestedItems ? request.requestedItems.join(', ') : '-'}</div>
                  <div><span className="font-semibold">Purpose:</span> {request.purpose || '-'}</div>
                  <div><span className="font-semibold">Quantity Needed:</span> {request.quantityNeeded || '-'}</div>
                </div>
              ) : null}
              {request.initiative === 'raksha-jyothi' ? (
                <div className="mb-2 text-gray-300 text-sm space-y-1">
                  <div><span className="font-semibold">Contact Person:</span> {request.beneficiaryName || '-'}</div>
                  <div><span className="font-semibold">Contact Number:</span> {request.beneficiaryContact || '-'}</div>
                  <div><span className="font-semibold">Emergency Description:</span> {request.emergencyDescription || '-'}</div>
                  <div><span className="font-semibold">People/Animals Affected:</span> {request.peopleAnimalsAffected || '-'}</div>
                  <div><span className="font-semibold">Immediate Needs:</span> {request.immediateNeeds || '-'}</div>
                </div>
              ) : null}
              {request.initiative === 'annamitra-seva' ? (
                <div className="mb-2 text-gray-300 text-sm space-y-1">
                  <div><span className="font-semibold">Contact Person:</span> {request.beneficiaryName || '-'}</div>
                  <div><span className="font-semibold">Contact Number:</span> {request.beneficiaryContact || '-'}</div>
                  <div><span className="font-semibold">Number of People:</span> {request.numberOfPeople || '-'}</div>
                  <div><span className="font-semibold">Dietary Restrictions:</span> {request.dietaryRestrictions || '-'}</div>
                  <div><span className="font-semibold">Meal Frequency:</span> {request.mealFrequency || '-'}</div>
                </div>
              ) : null}
              <p className="text-gray-300 mb-4 leading-relaxed">{request.description}</p>
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
                onClick={() => handleCommunityDonate(request)}
                className="w-full bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] hover:to-[#eeb766] text-black py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
              >
                <Heart className="h-4 w-4" />
                <span>Donate to Help</span>
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
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-[#eaa640]/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Initiative</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900/80 divide-y divide-gray-700">
                {donationHistory.map((donation: CommunityRequest) => (
                  <tr key={donation.id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {donation.initiative ? donation.initiative.replace('-', ' ') : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {donation.location_lowercase || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        donation.status === 'pending' ? 'bg-[#eeb766]/20 text-[#eeb766] border border-[#eeb766]' :
                        donation.status === 'accepted' ? 'bg-[#eaa640]/20 text-[#eaa640] border border-[#eaa640]' :
                        donation.status === 'completed' ? 'bg-[#ecae53]/20 text-[#ecae53] border border-[#ecae53]' :
                        'bg-gray-600/20 text-gray-300 border border-gray-600'
                      }`}>
                        {donation.status ? donation.status.charAt(0).toUpperCase() + donation.status.slice(1) : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {formatCreatedAt(donation.createdAt) || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        return renderPlaceholderSection('Profile Settings', 'Manage your account and preferences.');
      default:
        return renderHomeSection();
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Minimal Dashboard Header (only for Donor Dashboard) */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-transparent h-[60px]"
      >
        <div className="h-full flex items-center justify-between px-5">
          {/* Left: Welcome with emoji */}
          <div className="text-white text-base font-medium flex items-center gap-2">
            <span role="img" aria-label="handshake">🤝</span>
            <span>Welcome back, {userData?.firstName || 'Donor'}!</span>
          </div>
          {/* Right: Profile + Logout */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <button
              onClick={async () => { await logout(); navigate('/login'); }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-600 text-sm text-white hover:text-[#EAA640] hover:border-[#EAA640] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-[60px] bottom-0 w-64 bg-black shadow-lg border-r border-[#eaa640]/20 transform transition-transform duration-300 ease-in-out z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-2">
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
    </div>
  );
};

export default DonorDashboard;