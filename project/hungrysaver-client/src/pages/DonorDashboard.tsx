import React, { useState, useEffect } from 'react';
import { Heart, BookOpen, Shield, Home, Zap, Building, Users, Calendar, MapPin, Clock, CheckCircle, TrendingUp, Award, Star } from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { LiveImpactDashboard } from '../components/ImpactCounter';
import MotivationalBanner from '../components/MotivationalBanner';
import AnimatedEmptyState from '../components/AnimatedIllustrations';
import AnnamitraSevaForm from '../components/DonorForms/AnnamitraSevaForm';
import VidyaJyothiForm from '../components/DonorForms/VidyaJyothiForm';
import SurakshaSetuForm from '../components/DonorForms/SurakshaSetuForm';
import PunarAshaForm from '../components/DonorForms/PunarAshaForm';
import RakshaJyothiForm from '../components/DonorForms/RakshaJyothiForm';
import JyothiNilayamForm from '../components/DonorForms/JyothiNilayamForm';

interface CommunityRequest {
  id: string;
  userId: string;
  initiative: string;
  location_lowercase: string;
  address: string;
  beneficiaryName: string;
  beneficiaryContact: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'pending' | 'accepted' | 'completed';
  createdAt: any;
  acceptedBy?: string;
  acceptedAt?: any;
  completedAt?: any;
}

const DonorDashboard: React.FC = () => {
  const [selectedInitiative, setSelectedInitiative] = useState('annamitra-seva');
  const [activeTab, setActiveTab] = useState<'donate' | 'requests' | 'impact'>('donate');
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const { submitForm, loading, error, success, resetForm } = useFormSubmission('donor');
  const { userData } = useAuth();

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
    if (activeTab === 'requests') {
      fetchCommunityRequests();
    }
  }, [activeTab]);

  const fetchCommunityRequests = async () => {
    try {
      setRequestsLoading(true);
      
      // Fetch all pending community requests (no location filtering for donors)
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
      const sortedRequests = requests.sort((a, b) => {
        const urgencyOrder = { high: 3, medium: 2, low: 1 };
        const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
        if (urgencyDiff !== 0) return urgencyDiff;
        
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      setCommunityRequests(sortedRequests);
    } catch (error) {
      console.error('Error fetching community requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleFormSubmit = async (formData: any): Promise<boolean> => {
    const submissionData = {
      ...formData,
      initiative: selectedInitiative
    };
    
    const result = await submitForm(submissionData);
    if (result) {
      // Reset form after successful submission
      setTimeout(() => {
        resetForm();
      }, 3000);
    }
    return result;
  };

  const handleAcceptRequest = async (requestId: string, requestData: CommunityRequest) => {
    try {
      // Create a donation based on the community request
      const donationData = {
        userId: userData?.uid,
        initiative: requestData.initiative,
        location: requestData.location_lowercase,
        location_lowercase: requestData.location_lowercase,
        address: requestData.address,
        donorName: userData?.firstName || 'Anonymous Donor',
        donorContact: userData?.email || '',
        description: `Donation in response to community request: ${requestData.description}`,
        details: {
          originalRequestId: requestId,
          beneficiaryName: requestData.beneficiaryName,
          beneficiaryContact: requestData.beneficiaryContact,
          urgency: requestData.urgency
        },
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add the donation
      await addDoc(collection(db, 'donations'), donationData);

      // Update the community request status
      await updateDoc(doc(db, 'community_requests', requestId), {
        status: 'accepted',
        acceptedBy: userData?.uid,
        acceptedAt: new Date(),
        updatedAt: new Date()
      });

      // Remove from local state
      setCommunityRequests(prev => prev.filter(req => req.id !== requestId));

      alert('Thank you! Your donation has been submitted and volunteers will be notified.');
    } catch (error) {
      console.error('Error accepting request:', error);
      alert('Error submitting donation. Please try again.');
    }
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
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md mx-4 border border-green-500">
          <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">🎉 Donation Submitted!</h2>
          <p className="text-gray-300 mb-4">
            Thank you for your generous donation. Volunteers in your area will be notified and will contact you soon to arrange pickup/delivery.
          </p>
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 mb-4">
            <p className="text-green-400 text-sm">
              Expected response time: 2-6 hours
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-lg p-3 mb-4">
            <p className="text-green-300 text-sm italic">
              🧡 "This is not just a donation — it's a lifeline."
            </p>
          </div>
          <button
            onClick={resetForm}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Make Another Donation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-3 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Donor Dashboard
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Choose how you want to make a difference. Your generosity helps build a stronger, more compassionate community.
          </p>
        </div>

        {/* Motivational Banner */}
        <MotivationalBanner />

        {/* Live Impact Dashboard */}
        <LiveImpactDashboard />

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-8 w-fit mx-auto">
          {[
            { key: 'donate', label: 'Make Donation', icon: Heart },
            { key: 'requests', label: 'Community Requests', icon: Users },
            { key: 'impact', label: 'Your Impact', icon: TrendingUp }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-3 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
                  activeTab === tab.key
                    ? 'bg-green-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'donate' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Initiative Selection */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-white mb-6">Select Initiative</h2>
              <div className="space-y-3">
                {initiatives.map((initiative) => {
                  const Icon = initiative.icon;
                  
                  return (
                    <button
                      key={initiative.id}
                      onClick={() => setSelectedInitiative(initiative.id)}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                        selectedInitiative === initiative.id
                          ? 'border-green-500 bg-green-500/20 shadow-lg'
                          : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${initiative.color}`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-lg text-white mb-1">
                            {initiative.title}
                          </h3>
                          <p className="text-sm text-gray-300 mb-2">
                            {initiative.description}
                          </p>
                          <div className="text-xs text-green-400 font-medium">
                            {initiative.impact}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Donation Form */}
            <div className="lg:col-span-2">
              {FormComponent && (
                <FormComponent onSubmit={handleFormSubmit} loading={loading} />
              )}
              
              {error && (
                <div className="mt-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Community Requests</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Help community members in need by accepting their requests. Your donation will be matched with volunteers for delivery.
              </p>
            </div>

            {requestsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading community requests...</p>
              </div>
            ) : communityRequests.length === 0 ? (
              <AnimatedEmptyState
                type="requests"
                title="No pending requests"
                description="All community requests have been fulfilled. Check back later for new opportunities to help!"
                actionText="Make a Direct Donation"
                onAction={() => setActiveTab('donate')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityRequests.map((request) => (
                  <div key={request.id} className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-all duration-300 border border-gray-700 hover:border-green-500/50 transform hover:scale-105">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getInitiativeEmoji(request.initiative)}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {request.initiative.replace('-', ' ')}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency.toUpperCase()} PRIORITY
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 leading-relaxed">{request.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <MapPin className="h-4 w-4" />
                        <span className="capitalize">{request.location_lowercase}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Users className="h-4 w-4" />
                        <span>{request.beneficiaryName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span>{request.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptRequest(request.id, request)}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 transform hover:scale-105"
                    >
                      <Heart className="h-4 w-4" />
                      <span>Donate to Help</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'impact' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Your Impact Journey</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                See the incredible difference you've made in your community through your generous donations.
              </p>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white text-center">
                <Heart className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">25</div>
                <div className="text-sm opacity-90">Families Fed</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white text-center">
                <BookOpen className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">12</div>
                <div className="text-sm opacity-90">Students Supported</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl text-white text-center">
                <Shield className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">8</div>
                <div className="text-sm opacity-90">Emergency Responses</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white text-center">
                <Building className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm opacity-90">Shelters Supported</div>
              </div>
            </div>

            {/* Achievement Badges */}
            <div className="bg-gray-800 rounded-xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">🏆 Your Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">First Helper</h4>
                  <p className="text-gray-400 text-sm">Completed your first donation</p>
                  <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs mt-2 inline-block">
                    ✅ Earned
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-br from-green-400 to-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Community Hero</h4>
                  <p className="text-gray-400 text-sm">Helped 50+ families</p>
                  <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs mt-2 inline-block">
                    32/50 Progress
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-400 to-purple-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Award className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-white font-semibold mb-2">Consistent Giver</h4>
                  <p className="text-gray-400 text-sm">Donated for 30 consecutive days</p>
                  <div className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs mt-2 inline-block">
                    🔒 Locked
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational Message */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-4">🌟 Thank You for Making a Difference!</h3>
              <p className="text-lg mb-4">
                Your kindness has created ripples of hope in the community. Thank you for being part of the solution to hunger and need.
              </p>
              <p className="text-green-200 italic">
                "Your small step today can become someone's reason to survive tomorrow."
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;