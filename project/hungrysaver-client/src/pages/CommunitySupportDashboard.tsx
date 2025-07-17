import React, { useState, useEffect } from 'react';
import { Heart, BookOpen, Shield, Home, Zap, Building, MapPin, User, Phone, Calendar, CheckCircle, Clock, AlertCircle, History } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { useAuth } from '../contexts/AuthContext';
import AnnamitraCommunityForm from '../components/CommunitySupportForms/AnnamitraCommunityForm';
import VidyaJyothiCommunityForm from '../components/CommunitySupportForms/VidyaJyothiCommunityForm';
import SurakshaSetuCommunityForm from '../components/CommunitySupportForms/SurakshaSetuCommunityForm';
import PunarAshaCommunityForm from '../components/CommunitySupportForms/PunarAshaCommunityForm';
import RakshaJyothiCommunityForm from '../components/CommunitySupportForms/RakshaJyothiCommunityForm';
import JyothiNilayamCommunityForm from '../components/CommunitySupportForms/JyothiNilayamCommunityForm';

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
  status: 'pending' | 'accepted' | 'completed';
  createdAt: any;
  acceptedBy?: string;
  acceptedAt?: any;
  completedAt?: any;
}

const CommunitySupportDashboard: React.FC = () => {
  const [selectedInitiative, setSelectedInitiative] = useState('');
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const { submitForm, loading, error, success, resetForm } = useFormSubmission('community');
  const [requestHistory, setRequestHistory] = useState<CommunityRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { userData } = useAuth();

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

  useEffect(() => {
    if (activeTab === 'history') {
      fetchRequestHistory();
    }
  }, [activeTab, userData]);

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
      // Refresh history and reset form after successful submission
      if (activeTab === 'history') {
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
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'accepted': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'pending': return 'Waiting for a donor to accept your request';
      case 'accepted': return 'A donor has accepted your request and volunteers are coordinating delivery';
      case 'completed': return 'Your request has been fulfilled and delivered';
      default: return 'Unknown status';
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

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md mx-4">
          <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
          <p className="text-gray-300 mb-4">
            Your request has been submitted successfully. Donors will be able to see your request and volunteers will reach out to you soon.
          </p>
          <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
            <p className="text-green-400 text-sm">
              Expected response time: 2-6 hours
            </p>
          </div>
          <button
            onClick={resetForm}
            className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Submit Another Request
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
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Community Support Dashboard
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Submit requests for support through our community initiatives or track your request history.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-8 w-fit mx-auto">
          {[
            { key: 'request', label: 'Submit Request', icon: Heart },
            { key: 'history', label: 'Request History', icon: History }
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
        {activeTab === 'request' && (
          <div>
            {selectedInitiative === '' ? (
              // Show only initiative cards when no initiative is selected
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-4">Choose Your Initiative</h2>
                  <p className="text-gray-300 max-w-2xl mx-auto">
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
                        className="w-full text-left p-6 rounded-lg border-2 border-gray-600 bg-gray-800 hover:border-green-500 hover:bg-gray-700 transition-all hover:scale-105 shadow-lg"
                      >
                      <div className="flex items-start space-x-3">
                        <Icon className="h-6 w-6 text-green-400 mt-1 flex-shrink-0" />
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
              // Show only the selected initiative form (no sidebar/cards)
              <div className="max-w-2xl mx-auto">
              {FormComponent && (
                  <>
                    <FormComponent
                      onSubmit={async (data) => {
                        const result = await handleFormSubmit(data);
                        if (result) {
                          setTimeout(() => setSelectedInitiative(''), 3000); // Return to cards after success message
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

        {activeTab === 'history' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Request History</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Track the status of all your submitted requests and see their progress through our system.
              </p>
            </div>

            {historyLoading ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading request history...</p>
              </div>
            ) : requestHistory.length === 0 ? (
              <div className="bg-gray-800 rounded-lg p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No requests yet</h3>
                <p className="text-gray-400">Your submitted requests will appear here</p>
                <button
                  onClick={() => setActiveTab('request')}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Submit Your First Request
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {requestHistory.map((request) => (
                  <div key={request.id} className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-all duration-300 border border-gray-700">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getInitiativeEmoji(request.initiative)}</div>
                        <div>
                          <h3 className="text-lg font-semibold text-white capitalize">
                            {request.initiative.replace('-', ' ')}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs border font-medium flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                              {getStatusIcon(request.status)}
                              <span className="capitalize">{request.status}</span>
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getUrgencyColor(request.urgency)}`}>
                              {request.urgency ? request.urgency.toUpperCase() : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{request.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 leading-relaxed">{request.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <MapPin className="h-4 w-4" />
                          <span className="capitalize">{request.location_lowercase}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <User className="h-4 w-4" />
                          <span>{request.beneficiaryName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <Phone className="h-4 w-4" />
                          <span>{request.beneficiaryContact}</span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/50 p-4 rounded-lg">
                        <h4 className="text-white font-medium mb-2">Status Information</h4>
                        <p className="text-gray-300 text-sm">{getStatusDescription(request.status)}</p>
                        
                        {request.status === 'accepted' && request.acceptedAt && (
                          <p className="text-blue-400 text-xs mt-2">
                            Accepted on {request.acceptedAt.toDate?.()?.toLocaleDateString()}
                          </p>
                        )}
                        
                        {request.status === 'completed' && request.completedAt && (
                          <p className="text-green-400 text-xs mt-2">
                            Completed on {request.completedAt.toDate?.()?.toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>Pending</span>
                        <span>Accepted</span>
                        <span>Completed</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            request.status === 'pending' ? 'bg-yellow-500 w-1/3' :
                            request.status === 'accepted' ? 'bg-blue-500 w-2/3' :
                            'bg-green-500 w-full'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-16 bg-gray-800 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Submit Request</h4>
              <p className="text-gray-300">Choose the type of support you need and provide details about your situation.</p>
            </div>
            
            <div>
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Donor Accepts</h4>
              <p className="text-gray-300">Generous donors in our community will see your request and offer to help.</p>
            </div>
            
            <div>
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Volunteers Deliver</h4>
              <p className="text-gray-300">Our trained volunteers coordinate the delivery and ensure you receive the support.</p>
            </div>
          </div>
          
          <div className="mt-8 bg-green-500/20 border border-green-500 rounded-lg p-4">
            <p className="text-green-400 font-medium">
              Average response time: 2-6 hours | Available 24/7 for emergencies
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunitySupportDashboard;