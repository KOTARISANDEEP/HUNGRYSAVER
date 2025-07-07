import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { Clock, CheckCircle, Users, Heart, BookOpen, Shield, Home, Zap, Building } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const motivationalQuotes = [
  "Every small act of kindness creates ripples of change in our community.",
  "Your compassion today will be someone's hope tomorrow.",
  "Together, we're not just changing lives—we're building a better future.",
  "In helping others, we discover the best version of ourselves."
];

const PendingApproval: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected' | 'loading'>('loading');
  const navigate = useNavigate();
  const [currentQuote, setCurrentQuote] = React.useState(0);

  console.log("PendingApproval component mounted", { userData, currentUser });

  // Rotate motivational quotes
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Initialize status from userData if available
  useEffect(() => {
    console.log('🔍 Initial userData check:', userData);
    if (userData) {
      console.log('📊 Setting initial status from userData:', userData.status);
      setStatus(userData.status);
      
      // Auto-redirect if already approved
      if (userData.status === 'approved' && userData.location) {
        console.log('✅ User already approved, redirecting to dashboard');
        navigate(`/dashboard/${userData.location}`, { replace: true });
      } else if (userData.status === 'rejected') {
        console.log('❌ User rejected, redirecting to login');
        navigate('/login', { replace: true });
      }
    } else {
      console.log('❌ No userData available');
    }
  }, [userData, navigate]);

  // Real-time status monitoring
  useEffect(() => {
    if (!currentUser?.uid) {
      console.log('❌ No current user UID available');
      return;
    }

    console.log('🔍 Setting up real-time status monitoring for user:', currentUser.uid);
    
    const unsubscribe = onSnapshot(
      doc(db, 'users', currentUser.uid),
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const currentStatus = userData.status;
          console.log('📊 User status updated via listener:', currentStatus, userData);
          setStatus(currentStatus);

          // Auto-redirect based on status
          if (currentStatus === 'approved' && userData.location) {
            console.log('✅ User approved via listener, redirecting to dashboard');
            navigate(`/dashboard/${userData.location}`, { replace: true });
          } else if (currentStatus === 'rejected') {
            console.log('❌ User rejected via listener, redirecting to login');
            navigate('/login', { replace: true });
          }
        } else {
          console.log('❌ User document does not exist');
          // If document doesn't exist but we have userData from context, use that
          if (userData?.status) {
            setStatus(userData.status);
          } else {
            setStatus('pending'); // Fallback to pending
          }
        }
      },
      (error) => {
        console.error('❌ Error listening to user status:', error);
        // Fallback to userData from context if listener fails
        if (userData?.status) {
          setStatus(userData.status);
        } else {
          setStatus('pending'); // Fallback to pending
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid, navigate, userData]);

  // Show loading only briefly while checking status
  if (status === 'loading' && !userData) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Checking your application status...</p>
        </div>
      </div>
    );
  }

  // If we have userData but status is not pending, show appropriate message
  if (userData && status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 pb-12 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">
            {status === 'approved' ? 'Your application has been approved!' : 
             status === 'rejected' ? 'Your application was not approved.' :
             'You do not have a pending application.'}
          </p>
          <p className="text-gray-400 text-sm mt-2">Status: {String(status)}</p>
          {status === 'approved' && userData.location && (
            <button
              onClick={() => navigate(`/dashboard/${userData.location}`)}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // If no userData and not loading, redirect to login
  if (!userData && status !== 'loading') {
    navigate('/login', { replace: true });
    return null;
  }

  console.log("PendingApproval rendering main content, status:", status);

  const initiatives = [
    {
      icon: Heart,
      title: "🍛 Annamitra Seva",
      description: "You'll help distribute surplus food to hungry families, ensuring no meal goes to waste while fighting hunger in your community.",
      impact: "Feed 50+ families daily",
      image: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg"
    },
    {
      icon: BookOpen,
      title: "📚 Vidya Jyothi",
      description: "Support students by delivering educational materials, books, and helping with school fee payments for deserving children.",
      impact: "Educate 100+ children monthly",
      image: "https://images.pexels.com/photos/8535230/pexels-photo-8535230.jpeg"
    },
    {
      icon: Shield,
      title: "🛡️ Suraksha Setu",
      description: "Provide emergency support to vulnerable communities during crisis situations, being their safety net when needed most.",
      impact: "Support 200+ families in emergencies",
      image: "https://images.pexels.com/photos/6646918/pexels-photo-6646918.jpeg"
    },
    {
      icon: Home,
      title: "🏠 PunarAsha",
      description: "Help families rebuild their lives through rehabilitation programs, providing dignity and hope for a better future.",
      impact: "Rebuild 30+ lives annually",
      image: "https://images.pexels.com/photos/5029857/pexels-photo-5029857.jpeg"
    },
    {
      icon: Zap,
      title: "⚡ Raksha Jyothi",
      description: "Respond to emergency situations for both humans and animals, providing rapid assistance during critical moments.",
      impact: "Emergency response 24/7",
      image: "https://images.pexels.com/photos/6646919/pexels-photo-6646919.jpeg"
    },
    {
      icon: Building,
      title: "🏛️ Jyothi Nilayam",
      description: "Support shelters for humans and animals in need, creating safe sanctuaries of hope and care.",
      impact: "Support 10+ shelters",
      image: "https://images.pexels.com/photos/5029851/pexels-photo-5029851.jpeg"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="bg-yellow-500 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Clock className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Application Under Review
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Thank you for your volunteer application! Our team is currently reviewing your information.
          </p>
        </div>

        {/* Motivational Quote Carousel */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-8 mb-12 text-center">
          <div className="h-16 flex items-center justify-center">
            <p className="text-xl text-white italic font-medium transition-all duration-500">
              "{motivationalQuotes[currentQuote]}"
            </p>
          </div>
          <div className="flex justify-center space-x-2 mt-4">
            {motivationalQuotes.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentQuote ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Initiatives Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Initiatives You'll Impact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {initiatives.map((initiative, index) => {
              const Icon = initiative.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={initiative.image}
                      alt={initiative.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute top-4 left-4 bg-green-500 p-3 rounded-full shadow-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium inline-block">
                        {initiative.impact}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-3">
                      {initiative.title}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {initiative.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* What Happens Next */}
        <div className="bg-gray-800 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">
            What Happens Next?
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-yellow-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Review Process</h4>
              <p className="text-gray-300">Our admin team reviews your application and verifies your information.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Approval Notification</h4>
              <p className="text-gray-300">You'll receive an email confirmation once your application is approved.</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Start Volunteering</h4>
              <p className="text-gray-300">Access your location-specific dashboard and start making an impact!</p>
            </div>
          </div>
        </div>

        {/* Expected Timeline */}
        <div className="mt-8 text-center">
          <div className="bg-gray-700 rounded-lg p-6 inline-block">
            <p className="text-gray-300">
              <span className="text-white font-semibold">Expected Review Time:</span> 24-48 hours
            </p>
            <p className="text-gray-400 text-sm mt-2">
              You'll be redirected automatically once approved
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;