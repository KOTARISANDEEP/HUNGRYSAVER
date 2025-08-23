import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, User, Phone, Package, Clock, CheckCircle, AlertCircle, 
  Award, TrendingUp, Heart, Home, List, Users, ClipboardCheck, 
  Star, MessageCircle, Settings as SettingsIcon, Menu, X, Bell, LogOut,
  ChevronRight, BarChart3, Gift
} from 'lucide-react';
import { getTasksByLocation, updateTaskStatus } from '../services/firestoreService';
import { getVolunteerCommunityRequests, updateCommunityRequestStatus } from '../services/communityRequestService';
import { useAuth } from '../contexts/AuthContext';
import { Task, CommunityRequest } from '../types/formTypes';
import { LiveImpactDashboard } from '../components/ImpactCounter';
import MotivationalBanner from '../components/MotivationalBanner';
import AnimatedEmptyState from '../components/AnimatedIllustrations';
import CommunityRequestCard from '../components/CommunityRequestCard';
import Settings from '../components/Settings';

const VolunteerDashboard: React.FC = () => {
  const { location } = useParams<{ location: string }>();
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityRequestsLoading, setCommunityRequestsLoading] = useState(false);

  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalHelped: 25,
    thisWeek: 8,
    totalTasks: 156,
    completionRate: 92
  });

  const sidebarItems = [
    { id: 'home', label: 'Home', icon: Home, description: 'Dashboard Overview' },
    { id: 'donor-requests', label: 'Donor Requests', icon: Gift, description: 'Manage Donation Tasks' },
    { id: 'community-requests', label: 'Community Requests', icon: Users, description: 'Handle Support Requests' },
    { id: 'task-status', label: 'My Task Status', icon: ClipboardCheck, description: 'Track Active Tasks' },
    { id: 'completed-tasks', label: 'All Completed Tasks', icon: CheckCircle, description: 'View Task History' },
    { id: 'reviews', label: 'Reviews', icon: Star, description: 'Community Feedback' },
    { id: 'chatbot', label: 'Chatbot', icon: MessageCircle, description: 'AI Support Assistant' },
    { id: 'success-stories', label: 'Success Stories', icon: Award, description: 'Impact Stories' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, description: 'Account & Preferences' },
  ];

  useEffect(() => {
    // Check if volunteer is approved and location matches
    if (!userData || userData.userType !== 'volunteer' || userData.status !== 'approved') {
      return;
    }

    // Ensure volunteer can only access their assigned location
    if (location && userData.location && location.toLowerCase() !== userData.location.toLowerCase()) {
      return;
    }

    if (location) {
      fetchTasks();
      fetchCommunityRequests();
    }
  }, [location, userData]);

  // Hide global site navbar while on volunteer dashboard
  useEffect(() => {
    const nav = document.querySelector('nav');
    const originalDisplay = nav instanceof HTMLElement ? nav.style.display : '';
    if (nav instanceof HTMLElement) nav.style.display = 'none';
    return () => {
      if (nav instanceof HTMLElement) nav.style.display = originalDisplay;
    };
  }, []);

  const fetchTasks = async () => {
    try {
      // Only fetch tasks if volunteer is approved and in correct location
      if (!userData || userData.status !== 'approved' || !userData.location) {
        setTasks([]);
        setLoading(false);
        return;
      }

      // Ensure we're only fetching tasks for the volunteer's assigned location
      const volunteerLocation = userData.location.toLowerCase();
      if (location && location.toLowerCase() !== volunteerLocation) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const allTasks = await getTasksByLocation(volunteerLocation);
      
      // Transform tasks to include proper contact information
      const transformedTasks = allTasks.map(task => ({
        ...task,
        donorName: task.type === 'donation' ? task.donorName : undefined,
        donorContact: task.type === 'donation' ? task.donorContact : undefined,
        beneficiaryName: task.type === 'request' ? task.details?.contactName || task.details?.beneficiaryName : undefined,
        beneficiaryContact: task.type === 'request' ? task.details?.contactPhone || task.details?.beneficiaryContact : undefined,
        description: task.description || task.details?.description || 'No description provided'
      }));
      
      setTasks(transformedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunityRequests = async () => {
    try {
      if (!userData || userData.status !== 'approved') {
        setCommunityRequests([]);
        return;
      }

      setCommunityRequestsLoading(true);
      const requests = await getVolunteerCommunityRequests();
      setCommunityRequests(requests);
    } catch (error) {
      console.error('Error fetching community requests:', error);
      setCommunityRequests([]);
    } finally {
      setCommunityRequestsLoading(false);
    }
  };

  const handleCommunityRequestAction = async (action: 'accept' | 'deny' | 'mark-reached' | 'approve' | 'reject', requestId: string, data?: any) => {
    try {
      await updateCommunityRequestStatus({ type: action, requestId, data });
      // Refresh the community requests after action
      await fetchCommunityRequests();
    } catch (error) {
      console.error('Error handling community request action:', error);
      throw error;
    }
  };

  const handleTaskAction = async (taskId: string, action: 'accept' | 'reject' | 'picked' | 'delivered', taskType: 'donation' | 'request') => {
    try {
      let newStatus;
      let updateData: any = {};
      
      switch (action) {
        case 'accept':
          newStatus = 'accepted';
          updateData = { status: newStatus, assignedTo: userData?.uid };
          break;
        case 'reject':
          setTasks(prev => prev.filter(task => task.id !== taskId));
          return;
        case 'picked':
          newStatus = 'picked';
          updateData = { status: newStatus, pickedAt: new Date() };
          break;
        case 'delivered':
          newStatus = 'delivered';
          updateData = { status: newStatus, deliveredAt: new Date() };
          break;
      }
      
      await updateTaskStatus(taskId, taskType, newStatus, updateData);
      
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus, ...updateData } : task
      ));
      
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'picked': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500';
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

  // Security check: Prevent access if not approved volunteer
  if (!userData || userData.userType !== 'volunteer' || userData.status !== 'approved') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-900/90 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md mx-4 border border-gray-700">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-gray-300 mb-4">
            This dashboard is only available to approved volunteers.
          </p>
          <p className="text-gray-400 text-sm">
            {userData?.userType !== 'volunteer' 
              ? 'You need to be registered as a volunteer to access this page.'
              : userData?.status === 'pending'
              ? 'Your volunteer application is still pending approval.'
              : 'Your volunteer application was not approved.'}
          </p>
        </div>
      </div>
    );
  }

  // Location mismatch check
  if (location && userData.location && location.toLowerCase() !== userData.location.toLowerCase()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-900/90 backdrop-blur-lg rounded-2xl p-8 text-center max-w-md mx-4 border border-gray-700">
          <MapPin className="h-16 w-16 text-[#eaa640] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Wrong Location</h2>
          <p className="text-gray-300 mb-4">
            You can only access the dashboard for your assigned location: <strong>{userData.location}</strong>
          </p>
          <p className="text-gray-400 text-sm">
            You're trying to access: {location}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eaa640]"></div>
      </div>
    );
  }

  const renderMainContent = () => {
    switch (activeSection) {
      case 'home':
        return (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-[#eaa640]/10 to-[#eeb766]/10 backdrop-blur-lg rounded-2xl p-8 border border-[#eaa640]/30">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-[#eaa640] px-4 py-2 rounded-full">
                      <span className="text-black text-sm font-medium capitalize">{userData.location} Volunteer</span>
                    </div>
                    <div className="bg-green-500 px-4 py-2 rounded-full">
                      <span className="text-white text-sm font-medium">✅ Approved</span>
                    </div>
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Welcome back, {userData?.firstName}! 👋
                  </h1>
                  <p className="text-gray-300 text-lg">Ready to make a difference in {userData.location} today?</p>
                </div>
                
                <div className="mt-6 md:mt-0">
                  <div className="bg-gradient-to-r from-[#eaa640]/20 to-[#eeb766]/20 border border-[#eaa640] rounded-xl px-6 py-4">
                    <p className="text-[#f0c079] font-medium">You've helped {stats.thisWeek} people this week! 🎉</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#eaa640] to-[#ecae53] rounded-2xl p-6 text-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stats.totalHelped}</p>
                    <p className="text-sm font-medium">People Helped</p>
                  </div>
                  <User className="h-10 w-10 opacity-70" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#ecae53] to-[#eeb766] rounded-2xl p-6 text-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stats.thisWeek}</p>
                    <p className="text-sm font-medium">This Week</p>
                  </div>
                  <Calendar className="h-10 w-10 opacity-70" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#eeb766] to-[#f0c079] rounded-2xl p-6 text-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stats.totalTasks}</p>
                    <p className="text-sm font-medium">Total Tasks</p>
                  </div>
                  <Package className="h-10 w-10 opacity-70" />
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-[#f0c079] to-[#eaa640] rounded-2xl p-6 text-black">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold">{stats.completionRate}%</p>
                    <p className="text-sm font-medium">Success Rate</p>
                  </div>
                  <CheckCircle className="h-10 w-10 opacity-70" />
                </div>
              </div>
            </div>

            {/* Motivational Banner */}
            <MotivationalBanner />

            {/* Live Impact Dashboard */}
            <LiveImpactDashboard />
          </div>
        );

             case 'donor-requests':
         return (
           <div className="space-y-6">
             <div className="flex items-center justify-between">
               <h2 className="text-3xl font-bold text-white">Donor Requests</h2>
               <div className="bg-[#eaa640]/10 backdrop-blur-lg border border-[#eaa640]/30 rounded-lg px-4 py-2">
                 <span className="text-[#eaa640] font-medium">{tasks.filter(t => t.status === 'pending' && t.type === 'donation').length} Available</span>
               </div>
             </div>

             {/* Tasks Grid - Only Available Tasks */}
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {tasks.filter(task => task.status === 'pending' && task.type === 'donation').map((task) => (
                 <TaskCard key={task.id} task={task} onAction={handleTaskAction} userData={userData} />
               ))}
             </div>
           </div>
         );

      case 'community-requests':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Community Requests</h2>
              <div className="bg-[#eaa640]/10 backdrop-blur-lg border border-[#eaa640]/30 rounded-lg px-4 py-2">
                <span className="text-[#eaa640] font-medium">
                  {communityRequests.filter(r => r.status === 'pending').length} Pending
                </span>
              </div>
            </div>

            {communityRequestsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eaa640]"></div>
              </div>
            ) : communityRequests.length === 0 ? (
              <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-12 text-center border border-gray-700">
                <Users className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Community Requests</h3>
                <p className="text-gray-400">There are no community requests in your area at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {communityRequests.map((request) => (
                  <CommunityRequestCard
                    key={request.id}
                    request={request}
                    onAction={handleCommunityRequestAction}
                    userData={userData}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case 'task-status':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">My Task Status</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tasks.filter(task => task.assignedTo === userData?.uid).map((task) => (
                <TaskCard key={task.id} task={task} onAction={handleTaskAction} userData={userData} showProgress />
              ))}
            </div>
          </div>
        );

      case 'completed-tasks':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Completed Tasks</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {tasks.filter(task => task.status === 'delivered').map((task) => (
                <TaskCard key={task.id} task={task} onAction={handleTaskAction} userData={userData} />
              ))}
            </div>
          </div>
        );

      case 'settings':
        return <Settings userType="volunteer" />;

      default:
        return (
          <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-12 text-center border border-gray-700">
            <SettingsIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Coming Soon</h3>
            <p className="text-gray-400">This section is under development.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 bg-gray-900/90 backdrop-blur-lg rounded-lg border border-gray-700 text-white hover:bg-gray-800 transition-all"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full w-64 bg-black shadow-lg border-r border-[#eaa640]/20 transform transition-transform duration-300 z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        <div className="p-4 h-full overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-[#eaa640] to-[#eeb766] rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Volunteer</h1>
              <p className="text-xs text-gray-400">Dashboard</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-4 py-3 rounded-lg text-left transition-all duration-200 bg-transparent ${
                    isActive
                      ? 'bg-gradient-to-r from-[#eaa640]/20 to-[#eeb766]/20 text-[#eaa640] border-l-4 border-[#eaa640]'
                      : 'text-gray-400 hover:text-[#eaa640] hover:bg-[#eaa640]/10'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-[#eaa640]' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className={`font-medium ${isActive ? 'text-[#eaa640]' : 'text-gray-400'}`}>{item.label}</div>
                    <div className={`text-xs mt-0.5 ${isActive ? 'text-[#eaa640]/70' : 'text-gray-500'}`}>{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">
                 {/* Navbar */}
         <div className="bg-transparent h-[60px]">
           <div className="h-full flex items-center justify-between px-5">
             {/* Left: Welcome with emoji */}
             <div className="text-white text-base font-medium flex items-center gap-2">
               <span role="img" aria-label="handshake">🤝</span>
               <span>Welcome {userData?.location} volunteer! {userData?.firstName} 👋</span>
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

        {/* Page Content */}
        <div className="p-6">
          {renderMainContent()}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard: React.FC<{
  task: any;
  onAction: (taskId: string, action: 'accept' | 'reject' | 'picked' | 'delivered', taskType: 'donation' | 'request') => void;
  userData: any;
  showProgress?: boolean;
}> = ({ task, onAction, userData, showProgress = false }) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'picked': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-[#eaa640]/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-[#eaa640]/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{getInitiativeEmoji(task.initiative)}</div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-lg font-semibold text-white capitalize">{task.initiative.replace('-', ' ')}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                task.type === 'donation' ? 'bg-[#eaa640]/20 text-[#eaa640]' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {task.type === 'donation' ? '🎁 Donation' : '🆘 Request'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <User className="h-4 w-4" />
              <span>{task.type === 'donation' ? task.donorName : task.beneficiaryName}</span>
            </div>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs border font-medium ${getStatusColor(task.status)}`}>
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </span>
      </div>

      {showProgress && task.assignedTo === userData?.uid && (
        <div className="mb-4 p-4 bg-[#eaa640]/10 rounded-xl border border-[#eaa640]/30">
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['accepted', 'picked', 'delivered'].includes(task.status) ? 'bg-[#eaa640] text-black' : 'bg-gray-600 text-gray-400'
            }`}>
              <Package className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              ['picked', 'delivered'].includes(task.status) ? 'bg-[#eaa640] text-black' : 'bg-gray-600 text-gray-400'
            }`}>
              <Clock className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              task.status === 'delivered' ? 'bg-[#eaa640] text-black' : 'bg-gray-600 text-gray-400'
            }`}>
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-sm text-[#eaa640] font-medium">
            {task.status === 'accepted' && 'Ready for pickup'}
            {task.status === 'picked' && 'In delivery'}
            {task.status === 'delivered' && 'Completed successfully'}
          </div>
        </div>
      )}

      <p className="text-gray-300 mb-4 leading-relaxed">{task.description}</p>

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>{task.address}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Phone className="h-4 w-4" />
          <span>{task.type === 'donation' ? task.donorContact : task.beneficiaryContact}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{task.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently posted'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {task.status === 'pending' && (
          <>
            <button
              onClick={() => onAction(task.id, 'accept', task.type)}
              className="flex-1 bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] hover:to-[#eeb766] text-black py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-[#eaa640]/25"
            >
              Accept {task.type === 'donation' ? 'Donation' : 'Request'}
            </button>
            <button
              onClick={() => onAction(task.id, 'reject', task.type)}
              className="bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300"
            >
              Pass
            </button>
          </>
        )}
        
        {task.status === 'accepted' && task.assignedTo === userData?.uid && (
          <button
            onClick={() => onAction(task.id, 'picked', task.type)}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/25"
          >
            Mark as {task.type === 'donation' ? 'Picked Up' : 'In Progress'}
          </button>
        )}
        
        {task.status === 'picked' && task.assignedTo === userData?.uid && (
          <button
            onClick={() => onAction(task.id, 'delivered', task.type)}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg shadow-green-500/25"
          >
            Mark as {task.type === 'donation' ? 'Delivered' : 'Completed'}
          </button>
        )}
        
        {task.status === 'delivered' && (
          <div className="flex-1 bg-green-500/20 text-green-400 py-3 px-4 rounded-xl text-sm font-medium text-center border border-green-500/30">
            ✅ Completed
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;