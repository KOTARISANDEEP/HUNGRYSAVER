import React, { useState, useEffect } from 'react';
import { Heart, BookOpen, Shield, Home, Zap, Building, MapPin, User, Phone, Calendar, CheckCircle, Clock, AlertCircle, History, BarChart3, MessageSquare, Settings as SettingsIcon, Star, Award, Users, TrendingUp, Target, Lightbulb, LogOut } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import AnnamitraCommunityForm from '../components/CommunitySupportForms/AnnamitraCommunityForm';
import VidyaJyothiCommunityForm from '../components/CommunitySupportForms/VidyaJyothiCommunityForm';
import SurakshaSetuCommunityForm from '../components/CommunitySupportForms/SurakshaSetuCommunityForm';
import PunarAshaCommunityForm from '../components/CommunitySupportForms/PunarAshaCommunityForm';
import RakshaJyothiCommunityForm from '../components/CommunitySupportForms/RakshaJyothiCommunityForm';
import JyothiNilayamCommunityForm from '../components/CommunitySupportForms/JyothiNilayamCommunityForm';
import Settings from '../components/Settings';

interface CommunityRequest {
  id?: string;
  userId: string;
  initiative: string;
  location_lowercase: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'VOLUNTEER_ACCEPTED' | 'REACHED_COMMUNITY' | 'APPROVED_BY_VOLUNTEER' | 'DONOR_CLAIMED' | 'REJECTED_BY_VOLUNTEER' | 'completed';
  createdAt: any;
  acceptedBy?: string;
  acceptedAt?: any;
  completedAt?: any;
  decisionAt?: any;
  reachedAt?: any;
  claimedAt?: any;
}

const CommunitySupportDashboard: React.FC = () => {
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [activeTab, setActiveTab] = useState<'home' | 'newRequest' | 'myRequests' | 'supportHistory' | 'successStories' | 'impactHub' | 'messages' | 'feedback' | 'settings'>('home');
  const { submitForm, loading, error, success, resetForm } = useFormSubmission('community');
  const [requestHistory, setRequestHistory] = useState<CommunityRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { userData, logout } = useAuth();
  const navigate = useNavigate();

  const initiatives = [
    {
      id: 'annamitra-seva',
      icon: Heart,
      title: "🍛 Annamitra Seva",
      description: "Request food assistance for families in need. We connect surplus food with hungry families in your community.",
      component: AnnamitraCommunityForm
    },
    {
      id: 'vidya-jyothi',
      icon: BookOpen,
      title: "📚 Vidya Jyothi",
      description: "Educational support for children including books, fees, uniforms, and school supplies.",
      component: VidyaJyothiCommunityForm
    },
    {
      id: 'suraksha-setu',
      icon: Shield,
      title: "🤝 Suraksha Setu",
      description: "Emergency support during crisis situations. Safety net for vulnerable community members.",
      component: SurakshaSetuCommunityForm
    },
    {
      id: 'punarasha',
      icon: Home,
      title: "🔄 PunarAsha",
      description: "Rehabilitation support to help families rebuild their lives with dignity and hope.",
      component: PunarAshaCommunityForm
    },
    {
      id: 'raksha-jyothi',
      icon: Zap,
      title: "🚨 Raksha Jyothi",
      description: "Emergency response for humans and animals during critical situations requiring immediate assistance.",
      component: RakshaJyothiCommunityForm
    },
    {
      id: 'jyothi-nilayam',
      icon: Building,
      title: "🏠 Jyothi Nilayam",
      description: "Support for shelters caring for humans and animals in need of safe sanctuary.",
      component: JyothiNilayamCommunityForm
    }
  ];

  const navigationTabs = [
    { key: 'home', label: 'Home', icon: Home, description: 'Dashboard Overview' },
    { key: 'newRequest', label: 'New Request', icon: Heart, description: 'Create Support Request' },
    { key: 'myRequests', label: 'My Requests', icon: User, description: 'Track Your Requests' },
    { key: 'supportHistory', label: 'Support History', icon: History, description: 'Past Support Records' },
    { key: 'successStories', label: 'Success Stories', icon: Award, description: 'Community Impact Stories' },
    { key: 'impactHub', label: 'Impact Hub', icon: BarChart3, description: 'Community Impact Reports' },
    { key: 'messages', label: 'Messages', icon: MessageSquare, description: 'Communication Center' },
    { key: 'feedback', label: 'Feedback', icon: Star, description: 'Share Your Experience' },
    { key: 'settings', label: 'Settings', icon: SettingsIcon, description: 'Account & Preferences' }
  ];

  useEffect(() => {
    if (activeTab === 'myRequests' || activeTab === 'supportHistory') {
      fetchRequestHistory();
    }
  }, [activeTab, userData]);

  // Hide global site navbar while on community support dashboard
  useEffect(() => {
    const nav = document.querySelector('nav');
    const originalDisplay = nav instanceof HTMLElement ? nav.style.display : '';
    if (nav instanceof HTMLElement) nav.style.display = 'none';
    return () => {
      if (nav instanceof HTMLElement) nav.style.display = originalDisplay;
    };
  }, []);

  const fetchRequestHistory = async () => {
    if (!userData?.uid) return;
    
    try {
      setHistoryLoading(true);
      
      const requestsQuery = query(
        collection(db, 'community_requests'),
        where('userId', '==', userData.uid),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(requestsQuery);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityRequest[];
      
      setRequestHistory(requests);
    } catch (error) {
      console.error('Error fetching request history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFormSubmit = async (formData: any): Promise<boolean> => {
    const submissionData = {
      ...formData,
      initiative: selectedInitiative,
      userId: userData?.uid,
      status: 'pending'
    };
    
    const result = await submitForm(submissionData);
    if (result) {
      if (activeTab === 'myRequests' || activeTab === 'supportHistory') {
        fetchRequestHistory();
      }
      setTimeout(() => {
        resetForm();
      }, 3000);
    }
    return result;
  };

  const selectedInitiativeData = initiatives.find(init => init.id === selectedInitiative);
  const FormComponent = selectedInitiativeData?.component;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'VOLUNTEER_ACCEPTED': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'REACHED_COMMUNITY': return 'bg-purple-500/20 text-purple-400 border-purple-500';
      case 'APPROVED_BY_VOLUNTEER': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'REJECTED_BY_VOLUNTEER': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'DONOR_CLAIMED': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'completed': return 'bg-[#eeb766]/20 text-[#eeb766] border-[#eeb766]';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'VOLUNTEER_ACCEPTED': return <AlertCircle className="h-4 w-4" />;
      case 'REACHED_COMMUNITY': return <AlertCircle className="h-4 w-4" />;
      case 'APPROVED_BY_VOLUNTEER': return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED_BY_VOLUNTEER': return <AlertCircle className="h-4 w-4" />;
      case 'DONOR_CLAIMED': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting volunteer review in your city';
      case 'VOLUNTEER_ACCEPTED': return 'A volunteer has accepted your request';
      case 'REACHED_COMMUNITY': return 'Volunteer reached your location for verification';
      case 'APPROVED_BY_VOLUNTEER': return (<span className="text-[#eaa640] font-semibold animate-pulse">Waiting for Donor Support</span>);
      case 'REJECTED_BY_VOLUNTEER': return 'Request was reviewed and rejected by a volunteer';
      case 'DONOR_CLAIMED': return 'A donor claimed this request – pickup will be coordinated';
      case 'completed': return 'Your request has been fulfilled and delivered';
      default: return 'Unknown status';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'VOLUNTEER_ACCEPTED': return 'Volunteer Accepted';
      case 'REACHED_COMMUNITY': return 'Reached Community';
      case 'APPROVED_BY_VOLUNTEER': return 'Approved by Volunteer';
      case 'REJECTED_BY_VOLUNTEER': return 'Rejected by Volunteer';
      case 'DONOR_CLAIMED': return 'Donor Claimed';
      case 'completed': return 'Delivered';
      default: return status;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'low': return 'bg-[#eeb766]/20 text-[#eeb766] border-[#eeb766]';
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

  const renderStarsRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'text-[#eaa640] fill-current' : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 text-center max-w-md mx-4 border border-[#eaa640]/30">
          <div className="bg-gradient-to-r from-[#eaa640] to-[#eeb766] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-gray-300 mb-4">
            Your request has been submitted successfully. Donors will be able to see your request and volunteers will reach out to you soon.
          </p>
          <div className="bg-[#eaa640]/20 border border-[#eaa640] rounded-lg p-3">
            <p className="text-[#eaa640] text-sm">
              Expected response time: 2-6 hours
            </p>
          </div>
          <button
            onClick={resetForm}
            className="mt-4 bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] to-[#eeb766] text-black px-6 py-2 rounded-lg font-medium transition-all duration-300"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Minimal Header Bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-transparent h-[60px]"
      >
        <div className="h-full flex items-center justify-between px-5">
          {/* Left: Welcome with emoji */}
          <div className="text-white text-base font-medium flex items-center gap-2">
            <span role="img" aria-label="handshake">🤝</span>
            <span>Welcome back, {userData?.firstName || 'Community Member'}!</span>
          </div>
          {/* Right: Profile + Logout */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
                                                         <button
                               onClick={async () => {
                                 try {
                                   await logout();
                                   navigate('/login');
                                 } catch (error) {
                                   console.error('Logout error:', error);
                                 }
                               }}
                               className="group relative w-16 h-20 transition-all duration-300 hover:scale-110 flex flex-col items-center justify-center"
                             >
                               <LogOut className="h-5 w-5 text-[#eaa640] mb-1 transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-1 group-hover:-translate-y-1" />
                               <span className="text-xs text-[#eaa640] font-medium">Logout</span>
                             </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-[60px] bottom-0 w-64 bg-black shadow-lg border-r border-[#eaa640]/20 z-40">
        <div className="p-4 h-full overflow-y-auto">
          <nav className="space-y-2">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    console.log('Setting active tab to:', tab.key);
                    setActiveTab(tab.key as any);
                    setSelectedInitiative('');
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 bg-transparent ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-[#eaa640]/20 to-[#eeb766]/20 text-[#eaa640] border-l-4 border-[#eaa640]'
                      : 'text-gray-400 hover:text-[#eaa640] hover:bg-[#eaa640]/10'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${activeTab === tab.key ? 'text-[#eaa640]' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${activeTab === tab.key ? 'text-[#eaa640]' : 'text-gray-400'}`}>{tab.label}</div>
                    <div className={`text-xs mt-0.5 ${activeTab === tab.key ? 'text-[#eaa640]/70' : 'text-gray-500'}`}>{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="ml-64 pt-[60px]">
        <div className="p-8">
          {/* Home Dashboard */}
          {activeTab === 'home' && (
            <div className="space-y-8">
              {/* Motivational Banner */}
              <div className="relative bg-gradient-to-r from-[#eaa640]/20 to-[#eeb766]/20 rounded-xl p-8 border border-[#eaa640]/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-white mb-4">Together We Make a Difference</h2>
                  <p className="text-gray-300 text-lg max-w-2xl">
                    Every act of kindness creates ripples of hope. Your support transforms lives and builds stronger communities.
                  </p>
                </div>
                <div className="absolute top-4 right-4 text-6xl opacity-20">🌟</div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-[#eaa640]/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Total Requests</h3>
                    <Target className="h-8 w-8 text-[#eaa640]" />
                  </div>
                  <p className="text-3xl font-bold text-[#eaa640]">127</p>
                  <p className="text-gray-400 text-sm">This month</p>
                </div>
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-[#ecae53]/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Approved</h3>
                    <CheckCircle className="h-8 w-8 text-[#ecae53]" />
                  </div>
                  <p className="text-3xl font-bold text-[#ecae53]">95</p>
                  <p className="text-gray-400 text-sm">Success rate: 75%</p>
                </div>
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-[#eeb766]/30">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Pending</h3>
                    <Clock className="h-8 w-8 text-[#eeb766]" />
                  </div>
                  <p className="text-3xl font-bold text-[#eeb766]">32</p>
                  <p className="text-gray-400 text-sm">Awaiting donors</p>
                </div>
              </div>

              {/* Charts and Visual Elements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-[#eaa640]/30">
                  <h3 className="text-xl font-bold text-white mb-6">Support Impact</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Families Helped</span>
                      <span className="text-[#eaa640] font-bold">342</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#eaa640] to-[#eeb766] h-2 rounded-full w-4/5"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Children Educated</span>
                      <span className="text-[#ecae53] font-bold">156</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#ecae53] to-[#eeb766] h-2 rounded-full w-3/5"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Emergency Responses</span>
                      <span className="text-[#eeb766] font-bold">89</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-[#eeb766] to-[#f0c079] h-2 rounded-full w-2/3"></div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl p-6 border border-[#eaa640]/30">
                  <h3 className="text-xl font-bold text-white mb-6">Community Map</h3>
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <MapPin className="h-12 w-12 text-[#eaa640] mx-auto mb-4" />
                    <p className="text-gray-400">Interactive map showing support distribution</p>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-[#eaa640]/20 p-3 rounded">
                        <p className="text-[#eaa640] font-bold">North Zone</p>
                        <p className="text-gray-300">45 requests</p>
                      </div>
                      <div className="bg-[#ecae53]/20 p-3 rounded">
                        <p className="text-[#ecae53] font-bold">South Zone</p>
                        <p className="text-gray-300">38 requests</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* New Request */}
          {activeTab === 'newRequest' && (
            <div>
              {selectedInitiative === '' ? (
                <div>
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-4">Choose Your Initiative</h2>
                    <p className="text-gray-300 max-w-2xl">
                      Select an initiative to submit a support request. Each initiative addresses specific community needs.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initiatives.map((initiative) => {
                      const Icon = initiative.icon;
                      return (
                        <button
                          key={initiative.id}
                          onClick={() => setSelectedInitiative(initiative.id)}
                          className="w-full text-left p-6 rounded-lg border-2 border-gray-600 bg-gray-900/60 hover:border-[#eaa640] hover:bg-[#eaa640]/10 transition-all hover:scale-105 shadow-lg backdrop-blur-sm"
                        >
                          <div className="flex items-start space-x-3">
                            <Icon className="h-6 w-6 text-[#eaa640] mt-1 flex-shrink-0" />
                            <div>
                              <h3 className="text-white font-medium text-xl mb-2">{initiative.title}</h3>
                              <p className="text-gray-300 text-sm">{initiative.description}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="max-w-2xl">
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
                        className="mt-4 bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
          )}

          {/* My Requests */}
          {activeTab === 'myRequests' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">My Requests</h2>
                <p className="text-gray-300 max-w-2xl">
                  Track all your submitted requests and see their current status in real-time.
                </p>
              </div>

              {historyLoading ? (
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 text-center border border-[#eaa640]/30">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eaa640] mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading your requests...</p>
                </div>
              ) : requestHistory.length === 0 ? (
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 text-center border border-[#eaa640]/30">
                  <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No requests yet</h3>
                  <p className="text-gray-400">Your submitted requests will appear here</p>
                  <button
                    onClick={() => setActiveTab('newRequest')}
                    className="mt-4 bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] to-[#eeb766] text-black px-6 py-2 rounded-lg font-medium transition-all duration-300"
                  >
                    Submit Your First Request
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requestHistory.map((request) => (
                    <div key={request.id} className="bg-gray-900/80 rounded-lg border border-[#eaa640]/20 hover:border-[#eaa640]/50 transition-all">
                      <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-4 flex items-start space-x-3">
                          <div className="text-2xl">{getInitiativeEmoji(request.initiative)}</div>
                          <div>
                            <h3 className="text-white font-semibold text-lg capitalize">{request.initiative.replace('-', ' ')}</h3>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs border font-medium ${getStatusColor(request.status)}`}>
                                {getStatusIcon(request.status)}
                                <span className="ml-1">{getStatusLabel(request.status)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="md:col-span-5 text-sm text-gray-300 space-y-2">
                          <div className="flex items-center space-x-2"><MapPin className="h-4 w-4" /><span className="capitalize">{request.location_lowercase}</span></div>
                          <div className="flex items-center space-x-2"><User className="h-4 w-4" /><span>{request.beneficiaryName}</span></div>
                          <div className="flex items-center space-x-2"><Phone className="h-4 w-4" /><span>{request.beneficiaryContact}</span></div>
                          <p className="text-gray-400 line-clamp-2">{request.description}</p>
                        </div>
                        <div className="md:col-span-3 bg-gray-800/50 rounded-lg p-3 text-sm">
                          <div className="text-white font-medium mb-1">Status</div>
                          <div className="text-gray-300">{getStatusDescription(request.status)}</div>
                          <div className="text-xs text-gray-400 mt-2 flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{request.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Support History */}
          {activeTab === 'supportHistory' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Support History</h2>
                <p className="text-gray-300 max-w-2xl">
                  View your complete history of completed support requests and their outcomes.
                </p>
              </div>

              {historyLoading ? (
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 text-center border border-[#eaa640]/30">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#eaa640] mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading support history...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {requestHistory.filter(r => r.status === 'completed' || r.status === 'REJECTED_BY_VOLUNTEER').map((request, index) => (
                    <div key={request.id || index} className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-4 border-l-4 border-[#eeb766] hover:bg-gray-900/90 transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-xl">{getInitiativeEmoji(request.initiative)}</div>
                          <div>
                            <h4 className="text-white font-medium capitalize">{request.initiative.replace('-', ' ')}</h4>
                            <p className="text-gray-400 text-sm">{request.beneficiaryName}</p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-400">
                          <p>{(request.completedAt || request.decisionAt)?.toDate?.()?.toLocaleDateString() || 'Recently updated'}</p>
                          {request.status === 'completed' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[#eeb766]/20 text-[#eeb766] border border-[#eeb766]">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Rejected by Volunteer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {requestHistory.filter(r => r.status === 'completed' || r.status === 'REJECTED_BY_VOLUNTEER').length === 0 && (
                    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-8 text-center border border-[#eaa640]/30">
                      <History className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-white mb-2">No completed or rejected requests</h3>
                      <p className="text-gray-400">Your completed and volunteer-rejected requests will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Success Stories */}
          {activeTab === 'successStories' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Success Stories</h2>
                <p className="text-gray-300 max-w-2xl">
                  Inspiring stories from our community showing the impact of collective support and kindness.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: "A Family's New Beginning", image: "🏠", story: "Through Annamitra Seva, the Sharma family received consistent food support during their difficult time, allowing them to focus on finding stable employment.", impact: "3 children now attending school regularly" },
                  { title: "Education Changes Everything", image: "📚", story: "Vidya Jyothi helped Priya get school supplies and fees covered, enabling her to complete her 10th grade with excellent marks.", impact: "First in family to complete high school" },
                  { title: "Emergency Response Success", image: "🚨", story: "Raksha Jyothi's quick response during the flood helped rescue and relocate 15 families to safety within hours.", impact: "15 families saved, zero casualties" },
                  { title: "Shelter Restoration", image: "🏛️", story: "Jyothi Nilayam provided funds to rebuild a community shelter, giving 25 homeless individuals a safe place to stay.", impact: "25 people now have secure housing" },
                  { title: "Healthcare Support", image: "🏥", story: "Suraksha Setu covered medical expenses for elderly Mrs. Devi's surgery, giving her a new lease on life.", impact: "Full recovery and independent living" },
                  { title: "Community Rebuilding", image: "🤝", story: "PunarAsha helped three families rebuild their homes after a natural disaster, stronger and more resilient than before.", impact: "3 homes rebuilt with disaster-resistant features" }
                ].map((story, index) => (
                  <div key={index} className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaa640]/30 hover:border-[#eaa640] hover:scale-105 transition-all duration-300 group">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{story.image}</div>
                      <h3 className="text-xl font-bold text-white mb-3">{story.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-4 leading-relaxed">{story.story}</p>
                    <div className="bg-[#eaa640]/20 border border-[#eaa640] rounded-lg p-3">
                      <p className="text-[#eaa640] text-sm font-medium">Impact: {story.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Hub */}
          {activeTab === 'impactHub' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Impact Hub</h2>
                <p className="text-gray-300 max-w-2xl">
                  Visualize the collective impact of our community support initiatives across all programs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 text-center border border-[#eaa640]/30">
                  <Users className="h-12 w-12 text-[#eaa640] mx-auto mb-4" />
                  <p className="text-3xl font-bold text-white mb-2">2,456</p>
                  <p className="text-gray-400">Total Beneficiaries</p>
                </div>
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 text-center border border-[#ecae53]/30">
                  <Heart className="h-12 w-12 text-[#ecae53] mx-auto mb-4" />
                  <p className="text-3xl font-bold text-white mb-2">890</p>
                  <p className="text-gray-400">Total Volunteers</p>
                </div>
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 text-center border border-[#eeb766]/30">
                  <TrendingUp className="h-12 w-12 text-[#eeb766] mx-auto mb-4" />
                  <p className="text-3xl font-bold text-white mb-2">₹12.5L</p>
                  <p className="text-gray-400">Total Donations</p>
                </div>
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 text-center border border-[#f0c079]/30">
                  <Award className="h-12 w-12 text-[#f0c079] mx-auto mb-4" />
                  <p className="text-3xl font-bold text-white mb-2">1,234</p>
                  <p className="text-gray-400">Requests Completed</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaa640]/30">
                  <h3 className="text-xl font-bold text-white mb-6">Initiative Performance</h3>
                  <div className="space-y-4">
                    {initiatives.map((initiative, index) => (
                      <div key={initiative.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">{initiative.title.split(' ')[0]}</span>
                          <span className="text-gray-300 text-sm">{initiative.title.split(' ').slice(1).join(' ')}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full bg-gradient-to-r from-[#eaa640] to-[#eeb766]`}
                              style={{ width: `${70 + Math.random() * 30}%` }}
                            ></div>
                          </div>
                          <span className="text-[#eaa640] font-bold text-sm">{Math.floor(50 + Math.random() * 100)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaa640]/30">
                  <h3 className="text-xl font-bold text-white mb-6">Monthly Trends</h3>
                  <div className="space-y-3">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                      <div key={month} className="flex items-center justify-between">
                        <span className="text-gray-300">{month} 2024</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-700 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-[#ecae53] to-[#eeb766]"
                              style={{ width: `${60 + index * 5}%` }}
                            ></div>
                          </div>
                          <span className="text-[#ecae53] font-bold text-sm">{60 + index * 5}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Messages/Chat */}
          {activeTab === 'messages' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Messages & Support</h2>
                <p className="text-gray-300 max-w-2xl">
                  Connect with our support team and volunteers for assistance with your requests.
                </p>
              </div>

              <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border border-[#eaa640]/30 overflow-hidden">
                <div className="p-6 border-b border-[#eaa640]/20">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-[#eaa640] to-[#eeb766] p-2 rounded-full">
                      <MessageSquare className="h-5 w-5 text-black" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Support Chat</h3>
                      <p className="text-gray-400 text-sm">Our team is here to help • Available 24/7</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 h-96 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Chat Support Coming Soon</h4>
                    <p className="text-gray-400 mb-4">Real-time messaging with our support team</p>
                    <button className="bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] to-[#eeb766] text-black px-6 py-2 rounded-lg font-medium transition-all duration-300">
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback & Ratings */}
          {activeTab === 'feedback' && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-4">Feedback & Ratings</h2>
                <p className="text-gray-300 max-w-2xl">
                  Share your experience and help us improve our community support services.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaa640]/30">
                  <h3 className="text-xl font-bold text-white mb-6">Rate Our Service</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-medium mb-2">Overall Experience</label>
                      <div className="flex items-center space-x-2">
                        {renderStarsRating(5)}
                        <span className="text-[#eaa640] ml-2">Excellent</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Response Time</label>
                      <div className="flex items-center space-x-2">
                        {renderStarsRating(4)}
                        <span className="text-[#eaa640] ml-2">Very Good</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white font-medium mb-2">Support Quality</label>
                      <div className="flex items-center space-x-2">
                        {renderStarsRating(5)}
                        <span className="text-[#eaa640] ml-2">Excellent</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-medium mb-2">Your Feedback</label>
                      <textarea 
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:border-[#eaa640] focus:outline-none"
                        rows={4}
                        placeholder="Share your experience with our community support..."
                      />
                    </div>

                    <button className="w-full bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] to-[#eeb766] text-black py-3 rounded-lg font-medium transition-all duration-300">
                      Submit Feedback
                    </button>
                  </div>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg p-6 border border-[#eaa640]/30">
                  <h3 className="text-xl font-bold text-white mb-6">Recent Reviews</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Priya Sharma", rating: 5, comment: "Amazing support during our difficult time. The volunteers were incredibly kind and responsive." },
                      { name: "Rajesh Kumar", rating: 5, comment: "Quick response for emergency help. Grateful for this wonderful community initiative." },
                      { name: "Anita Devi", rating: 4, comment: "Great service, helped my children get educational supplies they needed for school." }
                    ].map((review, index) => (
                      <div key={index} className="bg-gray-800/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{review.name}</span>
                          {renderStarsRating(review.rating)}
                        </div>
                        <p className="text-gray-300 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <Settings userType="community" />
          )}
        </div>
      </main>
    </div>
  );
};

export default CommunitySupportDashboard;