import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MapPin, Calendar, User, Phone, Package, Clock, CheckCircle, AlertCircle, 
  Award, TrendingUp, Heart, Home, List, Users, ClipboardCheck, 
  Star, MessageCircle, Settings as SettingsIcon, Menu, X, Bell, LogOut,
  ChevronRight, BarChart3, Gift, Building, ThumbsUp
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
import SuccessMessage from '../components/SuccessMessage';
import ImageViewerModal from '../components/ImageViewerModal';
import FeedbackModal from '../components/FeedbackModal';


const VolunteerDashboard: React.FC = () => {
  const { location } = useParams<{ location: string }>();
  const { userData, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [communityRequestsLoading, setCommunityRequestsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track which action is loading
  const [activeTab, setActiveTab] = useState<'tasks' | 'community' | 'completed'>('tasks');
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionButton?: { text: string; onClick: () => void; };
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalHelped: 25,
    thisWeek: 8,
    totalTasks: 156,
    completionRate: 92
  });
  
  // Image viewer modal state
  const [imageViewer, setImageViewer] = useState<{ isOpen: boolean; images: string[]; initialIndex: number }>({
    isOpen: false,
    images: [],
    initialIndex: 0
  });
  
  // Feedback modal state
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskType: 'donation' | 'request' | null;
    taskName: string;
  }>({
    isOpen: false,
    taskId: null,
    taskType: null,
    taskName: ''
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

  // Lock background scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = originalOverflow; };
    }
  }, [sidebarOpen]);

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
      const transformedTasks = allTasks.map((task: any) => ({
        ...task,
        donorName: task.type === 'donation' ? task.donorName : undefined,
        donorContact: task.type === 'donation' ? task.donorContact : undefined,
        beneficiaryName: task.type === 'request' ? task.details?.contactName || task.details?.beneficiaryName : undefined,
        beneficiaryContact: task.type === 'request' ? task.details?.contactPhone || task.details?.beneficiaryContact : undefined,
        description: task.description || task.details?.description || 'No description provided'
      }));
      
      // Separate available and accepted tasks
      const availableTasks = transformedTasks.filter((task: any) => task.status === 'pending');
      const acceptedTasks = transformedTasks.filter((task: any) => 
        task.status !== 'pending' && 
        (task.assignedTo === userData?.uid || task.volunteerId === userData?.uid)
      );
      
      setTasks(availableTasks);
      setMyTasks(acceptedTasks);
      
      console.log('📊 Task filtering results:', {
        total: transformedTasks.length,
        available: availableTasks.length,
        accepted: acceptedTasks.length,
        userUid: userData?.uid
      });
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
      
      // Show beautiful success message
      let successTitle = '';
      let successMessage = '';
      let actionButton = undefined;
      
      switch (action) {
        case 'accept':
          successTitle = '🤝 Request Accepted!';
          successMessage = 'You have successfully accepted this community request. It has been added to your active tasks.';
          actionButton = {
            text: 'View My Tasks',
            onClick: () => {
              setActiveSection('task-status');
              setSuccessMessage(prev => ({ ...prev, isOpen: false }));
            }
          };
          break;
        case 'approve':
          successTitle = '✅ Request Approved!';
          successMessage = 'The community request has been approved and is now available for other volunteers.';
          break;
        case 'mark-reached':
          successTitle = '📍 Location Reached!';
          successMessage = 'Great! You have marked that you have reached the location. Continue with the support task.';
          break;
        case 'reject':
          successTitle = '❌ Request Rejected';
          successMessage = 'The community request has been rejected. It will be removed from your task list.';
          break;
        case 'deny':
          successTitle = '❌ Request Denied';
          successMessage = 'The community request has been denied. It will be removed from your task list.';
          break;
      }
      
      if (successTitle && successMessage) {
        setSuccessMessage({
          isOpen: true,
          title: successTitle,
          message: successMessage,
          actionButton
        });
      }
      
    } catch (error) {
      console.error('Error handling community request action:', error);
      throw error;
    }
  };



          const handleTaskAction = async (taskId: string, action: 'accept' | 'reject' | 'picked' | 'delivered', taskType: 'donation' | 'request') => {
    try {
      // Prevent multiple rapid clicks
      if (actionLoading) {
        console.log('⚠️ Action already in progress, please wait...');
        return;
      }

      // Set loading state
      setActionLoading(`${taskId}-${action}`);
      
      // Find the current task to check its status
      const currentTask = [...tasks, ...myTasks].find(task => task.id === taskId);
      if (!currentTask) {
        console.error('Task not found:', taskId);
        setActionLoading(null);
        return;
      }

      // Handle delivered action with feedback modal
      if (action === 'delivered') {
        // First update status to 'delivered'
        const updateData = { 
          status: 'delivered', 
          deliveredAt: new Date()
        };
        
        console.log('🔄 Updating status to delivered:', { taskId, taskType });
        
        const result = await updateTaskStatus(taskId, taskType, 'delivered', updateData);
        console.log('✅ Status updated to delivered:', result);
        
        // Then open feedback modal
        setFeedbackModal({
          isOpen: true,
          taskId,
          taskType,
          taskName: currentTask.initiative || currentTask.type || 'this task'
        });
        setActionLoading(null);
        return;
      }

      // Prevent invalid status updates
      if (currentTask.status === 'delivered') {
        console.log('⚠️ Task already delivered, cannot update status');
        setActionLoading(null);
        return;
      }

      if (currentTask.status === 'picked' && action === 'accept') {
        console.log('⚠️ Task already picked, cannot go back to accepted');
        setActionLoading(null);
        return;
      }

      let newStatus;
      let updateData: any = {};
      
      switch (action) {
        case 'accept':
          // Directly accept donation without form
          newStatus = 'accepted';
          updateData = { status: newStatus };
          break;
        case 'reject':
          setTasks(prev => prev.filter(task => task.id !== taskId));
          // Show success message for rejection
          setSuccessMessage({
            isOpen: true,
            title: '⏭️ Task Passed',
            message: 'You have passed on this task. It will remain available for other volunteers to accept.',
          });
          setActionLoading(null);
          return;
        case 'picked':
          newStatus = 'picked';
          updateData = { status: newStatus, pickedAt: new Date() };
          break;
      }
       
       console.log('🔄 Updating task status:', { taskId, taskType, newStatus, updateData, currentStatus: currentTask.status });
       
       const result = await updateTaskStatus(taskId, taskType, newStatus, updateData);
       console.log('✅ Task status update result:', result);
       
       // Show beautiful success message
       let successTitle = '';
       let successMessage = '';
       let actionButton = undefined;
       
       switch (action) {
         case 'accept':
           successTitle = '🎉 Donation Accepted!';
           successMessage = 'The donation request has been successfully moved to your tasks. You can now track its progress in "My Task Status".';
           actionButton = {
             text: 'View My Tasks',
             onClick: () => {
               setActiveSection('task-status');
               setSuccessMessage(prev => ({ ...prev, isOpen: false }));
             }
           };
           break;
         case 'picked':
           successTitle = '📦 Task Picked Up!';
           successMessage = 'Great job! The donation has been marked as picked up. Continue to the delivery location to complete the task.';
           break;
       }
       
       if (successTitle && successMessage) {
         setSuccessMessage({
           isOpen: true,
           title: successTitle,
           message: successMessage,
           actionButton
         });
       }
       
       // Refresh tasks from server to get updated data
       try {
         console.log('🔄 Refreshing tasks from server...');
         const refreshedTasks = await getTasksByLocation(userData?.location || '');
         
         // Filter tasks based on status and assignment
         const availableTasks = refreshedTasks.filter((task: any) => task.status === 'pending');
         const myTasks = refreshedTasks.filter((task: any) => 
           task.status !== 'pending' && 
           (task.assignedTo === userData?.uid || task.volunteerId === userData?.uid)
         );
         
         console.log('🔍 Task filtering details:', {
           totalRefreshed: refreshedTasks.length,
           availableTasks: availableTasks.length,
           myTasks: myTasks.length,
           userUid: userData?.uid,
           sampleAvailable: availableTasks.slice(0, 2).map((t: any) => ({ id: t.id, status: t.status, type: t.type })),
           sampleMyTasks: myTasks.slice(0, 2).map((t: any) => ({ id: t.id, status: t.status, type: t.type, assignedTo: t.assignedTo, volunteerId: t.volunteerId }))
         });
         
         setTasks(availableTasks);
         setMyTasks(myTasks);
         console.log('✅ Tasks refreshed from server. Available:', availableTasks.length, 'My Tasks:', myTasks.length);
         
       } catch (refreshError) {
         console.error('Error refreshing tasks:', refreshError);
         // Fallback to local state update
         if (action === 'accept') {
           setTasks(prev => prev.filter(task => task.id !== taskId));
           console.log('✅ Task removed from available list (fallback)');
         }
       }
       
            } catch (error) {
         console.error('Error updating task:', error);
         let errorMessage = 'Error updating task status. Please try again.';
         
         // Provide more specific error messages
         if (error instanceof Error) {
           if (error.message.includes('Invalid status transition')) {
             errorMessage = 'Cannot update task status. The task may already be in a final state.';
           } else if (error.message.includes('500')) {
             errorMessage = 'Server error. Please try again in a moment.';
           }
         }
         
                  alert(errorMessage);
       } finally {
         // Always reset loading state
         setActionLoading(null);
       }
     };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedback: string, imageUrl?: string) => {
    if (!feedbackModal.taskId || !feedbackModal.taskType) {
      console.error('Missing task information for feedback submission');
      return;
    }

    try {
      setActionLoading(`${feedbackModal.taskId}-feedback`);
      
      // Update status to 'completed' with feedback and image URL (task is already 'delivered')
      const updateData: any = { 
        status: 'completed', 
        feedback,
        completedAt: new Date()
      };
      
      // Add image URL if provided
      if (imageUrl) {
        updateData.feedbackImageUrl = imageUrl;
      }
      
      console.log('🔄 Submitting feedback and completing task:', { 
        taskId: feedbackModal.taskId, 
        taskType: feedbackModal.taskType, 
        feedback,
        imageUrl 
      });
      
      const result = await updateTaskStatus(
        feedbackModal.taskId, 
        feedbackModal.taskType, 
        'completed', 
        updateData
      );
      
      console.log('✅ Feedback submitted and task completed:', result);
      
      // Close feedback modal
      setFeedbackModal({
        isOpen: false,
        taskId: null,
        taskType: null,
        taskName: ''
      });
      
      // Show success message
      setSuccessMessage({
        isOpen: true,
        title: '✅ Task Completed!',
        message: 'Excellent work! You have successfully delivered the donation and provided feedback. Thank you for making a difference in your community! 🎉',
        actionButton: {
          text: 'View Completed Tasks',
          onClick: () => {
            setActiveSection('completed-tasks');
            setSuccessMessage(prev => ({ ...prev, isOpen: false }));
          }
        }
      });
      
      // Refresh tasks from server
      try {
        console.log('🔄 Refreshing tasks from server...');
        const refreshedTasks = await getTasksByLocation(userData?.location || '');
        
        const availableTasks = refreshedTasks.filter((task: any) => task.status === 'pending');
        const myTasks = refreshedTasks.filter((task: any) => 
          task.status !== 'pending' && 
          (task.assignedTo === userData?.uid || task.volunteerId === userData?.uid)
        );
        
        setTasks(availableTasks);
        setMyTasks(myTasks);
        console.log('✅ Tasks refreshed after feedback submission');
        
      } catch (refreshError) {
        console.error('Error refreshing tasks after feedback:', refreshError);
      }
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setActionLoading(null);
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
          <div className="space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white">Donor Requests</h2>
              <div className="bg-[#eaa640]/10 backdrop-blur-lg border border-[#eaa640]/30 rounded-lg px-4 py-2">
                <span className="text-[#eaa640] font-medium">{tasks.filter(t => t.status === 'pending' && t.type === 'donation').length} Available</span>
              </div>
            </div>

            {/* Community-linked Requests */}
            {tasks.some(task => task.status === 'pending' && task.type === 'donation' && (task.communityRequestId || task.communityBeneficiaryName || task.communityAddress)) && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xl font-semibold text-white">Community-linked Requests</h3>
                <span className="text-sm text-gray-400">Pickup from donor, deliver to community address</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tasks.filter(task => task.status === 'pending' && task.type === 'donation' && (task.communityRequestId || task.communityBeneficiaryName || task.communityAddress)).map((task) => (
                  <TaskCard key={task.id} task={task} onAction={handleTaskAction} userData={userData} actionLoading={actionLoading} setFeedbackModal={setFeedbackModal} setImageViewer={setImageViewer} />
                ))}
              </div>
            </div>
            )}

            {/* Direct Donations */}
            {tasks.some(task => task.status === 'pending' && task.type === 'donation' && !(task.communityRequestId || task.communityBeneficiaryName || task.communityAddress)) && (
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Direct Donations</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tasks.filter(task => task.status === 'pending' && task.type === 'donation' && !(task.communityRequestId || task.communityBeneficiaryName || task.communityAddress)).map((task) => (
                  <TaskCard key={task.id} task={task} onAction={handleTaskAction} userData={userData} actionLoading={actionLoading} setFeedbackModal={setFeedbackModal} setImageViewer={setImageViewer} />
                ))}
              </div>
            </div>
            )}
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
            {(() => {
              const statusTasks = myTasks.filter(task => task.assignedTo === userData?.uid || task.volunteerId === userData?.uid);
              const linkedRequestIds = new Set(statusTasks
                .filter(t => t.type === 'donation' && t.communityRequestId)
                .map(t => t.communityRequestId));
              const deduped = statusTasks.filter(t => !(t.type === 'request' && linkedRequestIds.has(t.id)));
              return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {deduped.map((task) => (
                <TaskCard key={task.id} task={task} onAction={handleTaskAction} userData={userData} showProgress actionLoading={actionLoading} setFeedbackModal={setFeedbackModal} setImageViewer={setImageViewer} />
              ))}
            </div>
              );
            })()}
          </div>
        );

      case 'completed-tasks':
        return (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">Completed Tasks</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {myTasks.filter(task => task.status === 'completed').map((task) => (
                <TaskCard key={task.id} task={task} onAction={handleTaskAction} userData={userData} actionLoading={actionLoading} setFeedbackModal={setFeedbackModal} setImageViewer={setImageViewer} />
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
      {/* Image Viewer Modal state at page scope */}
      
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
      <div className={`fixed left-0 top-0 h-full w-64 bg-black shadow-lg border-r border-[#eaa640]/20 transform transition-transform duration-300 ease-in-out z-40 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 lg:top-0`}>
        <div className="p-4 h-full overflow-y-auto relative">
          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 text-gray-300 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
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

      {/* Top bar with mobile toggle */}
      <div className="lg:ml-64 min-h-screen">
        {/* Navbar */}
        <div className="bg-black border-b border-[#eaa640]/20 h-[60px]">
          <div className="h-full flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden px-3 py-2 rounded-md border border-[#eaa640]/40 text-[#eaa640] hover:bg-[#eaa640]/10 transition-colors"
              >
                ☰ Dashboard
              </button>
              <div className="flex items-center space-x-2 text-gray-200">
                <div className="h-8 w-8 rounded-full border border-gray-400/60 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-300" />
                </div>
                <span className="text-sm">Volunteer</span>
              </div>
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
              className="bg-[#eaa640] hover:bg-[#eeb766] text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
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

      {/* Success Message Modal */}
      <SuccessMessage
        isOpen={successMessage.isOpen}
        onClose={() => setSuccessMessage(prev => ({ ...prev, isOpen: false }))}
        title={successMessage.title}
        message={successMessage.message}
        actionButton={successMessage.actionButton}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        onSubmit={handleFeedbackSubmit}
        loading={actionLoading === `${feedbackModal.taskId}-feedback`}
        taskName={feedbackModal.taskName}
      />
      
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

// Task Card Component
const TaskCard: React.FC<{
  task: any;
  onAction: (taskId: string, action: 'accept' | 'reject' | 'picked' | 'delivered', taskType: 'donation' | 'request') => void;
  userData: any;
  showProgress?: boolean;
  actionLoading?: string | null;
  setFeedbackModal?: (modal: { isOpen: boolean; taskId: string | null; taskType: 'donation' | 'request' | null; taskName: string }) => void;
  setImageViewer?: (viewer: { isOpen: boolean; images: string[]; initialIndex: number }) => void;
}> = ({ task, onAction, userData, showProgress = false, actionLoading, setFeedbackModal, setImageViewer }) => {
  const getInitiativeEmoji = (initiative: string) =>
    { const emojiMap: { [key: string]: string } = {
      'annamitra-seva': '🍛',
      'vidya-jyothi': '📚',
      'suraksha-setu': '🛡️',
      'punarasha': '🏠',
      'raksha-jyothi': '⚡',
      'jyothi-nilayam': '🏛️'
    };
    return emojiMap[initiative.toLowerCase()] || '💝'; };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'picked': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'completed': return 'bg-green-600/20 text-green-300 border-green-600';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard?.writeText(text); alert('Address copied'); } catch {}
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gray-700 hover:border-[#eaa640]/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-[#eaa640]/10">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getInitiativeEmoji(task.initiative || '')}</div>
          <div>
            <h3 className="text-lg font-semibold text-white capitalize">{task.initiative?.replace('-', ' ') || 'Donation'}</h3>
            <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getStatusColor(task.status)}`}>{(task.status || 'pending').toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Community-linked: Requester Details at top */}
      {task.type === 'donation' && (task.communityRequestId || task.communityBeneficiaryName || task.communityAddress) && (
        <div className="mb-4 bg-gray-700/20 border border-gray-600/40 rounded-lg p-3">
          <div className="flex items-center space-x-2 text-sm text-gray-300 mb-2">
            <Users className="h-4 w-4 text-[#eaa640]" />
            <span className="font-medium">Requester Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="h-4 w-4 text-[#eaa640]" />
              <span>{task.communityBeneficiaryName || '-'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Phone className="h-4 w-4 text-[#eaa640]" />
              {task.communityBeneficiaryContact ? (
                <a href={`tel:${task.communityBeneficiaryContact}`} className="text-blue-300 hover:text-blue-200 underline">{task.communityBeneficiaryContact}</a>
              ) : (<span>—</span>)}
            </div>
            {task.communityAddress && (
              <div className="md:col-span-2 flex items-start justify-between text-gray-300">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-[#eaa640] mt-0.5" />
                  <span>{task.communityAddress}</span>
                </div>
                <button onClick={() => copyToClipboard(task.communityAddress)} className="ml-3 px-2 py-1 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200">Copy</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Food Image Display */}
      {task.type === 'donation' && task.initiative === 'annamitra-seva' && task.imageUrl && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-gray-300">Food Image:</span>
          </div>
          <div className="relative">
            <img
              src={task.imageUrl}
              alt="Food donation"
              className="w-36 h-36 object-cover rounded-lg border border-gray-600 shadow-lg cursor-zoom-in"
              onClick={() => {
                if (setImageViewer) {
                  const images: string[] = Array.isArray(task.imageUrls) && task.imageUrls.length > 0 ? task.imageUrls : [task.imageUrl];
                  setImageViewer({ isOpen: true, images, initialIndex: 0 });
                }
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}

      {/* Donor Engagement / Pickup Details at bottom for both community-linked and direct donations */}
      {task.type === 'donation' && (task.donorName || task.donorContact || task.donorAddress || task.donorNotes) && (
        <div className="mt-2 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2 text-sm text-blue-300 mb-1">
            <ThumbsUp className="h-4 w-4" />
            <span className="font-medium">Donor Engagement / Pickup Details</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="h-4 w-4 text-[#eaa640]" />
              <span>{task.donorName || 'Donor'}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Phone className="h-4 w-4 text-[#eaa640]" />
              {task.donorContact ? (
                <a href={`tel:${task.donorContact}`} className="text-blue-300 hover:text-blue-200 underline">{task.donorContact}</a>
              ) : (
                <span>—</span>
              )}
            </div>
            {task.donorAddress && (
              <div className="md:col-span-2 flex items-start justify-between text-gray-300">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-[#eaa640] mt-0.5" />
                  <span>{task.donorAddress}</span>
                </div>
                <button onClick={() => copyToClipboard(task.donorAddress)} className="ml-3 px-2 py-1 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200">Copy</button>
              </div>
            )}
            {task.donorNotes && (
              <div className="md:col-span-2 flex items-start space-x-2 text-gray-300">
                <ClipboardCheck className="h-4 w-4 text-[#eaa640] mt-0.5" />
                <span>{task.donorNotes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <MapPin className="h-4 w-4" />
          <span>{task.address}</span>
        </div>
        {/* Show hostel information for Kalasalingam Academy donations */}
        {task.type === 'donation' && task.location?.toLowerCase() === 'kalasalingam academy of research and education' && task.hostel && (
          <div className="flex items-center space-x-2 text-sm text-[#eaa640]">
            <Building className="h-4 w-4" />
            <span className="font-medium">Hostel: {task.hostel}</span>
          </div>
        )}
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
               disabled={actionLoading === `${task.id}-accept`}
               className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
                 actionLoading === `${task.id}-accept`
                   ? 'bg-gray-500 cursor-not-allowed'
                   : 'bg-gradient-to-r from-[#eaa640] to-[#ecae53] hover:from-[#ecae53] hover:to-[#eeb766] text-black shadow-[#eaa640]/25'
               }`}
             >
               {actionLoading === `${task.id}-accept` ? 'Accepting...' : `Accept ${task.type === 'donation' ? 'Donation' : 'Request'}`}
             </button>
             <button
               onClick={() => onAction(task.id, 'reject', task.type)}
               disabled={actionLoading === `${task.id}-reject`}
               className={`py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 ${
                 actionLoading === `${task.id}-reject`
                   ? 'bg-gray-500 cursor-not-allowed'
                   : 'bg-gray-700 hover:bg-gray-600 text-white'
               }`}
             >
               {actionLoading === `${task.id}-reject` ? 'Passing...' : 'Pass'}
             </button>
           </>
         )}
        
                          {task.status === 'accepted' && (task.assignedTo === userData?.uid || task.volunteerId === userData?.uid) && (
           <button
             onClick={() => onAction(task.id, 'picked', task.type)}
             disabled={actionLoading === `${task.id}-picked`}
             className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
               actionLoading === `${task.id}-picked`
                 ? 'bg-gray-500 cursor-not-allowed'
                 : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-orange-500/25'
             }`}
           >
             {actionLoading === `${task.id}-picked` ? 'Updating...' : `Mark as ${task.type === 'donation' ? 'Picked Up' : 'In Progress'}`}
           </button>
         )}
         
         {task.status === 'picked' && (task.assignedTo === userData?.uid || task.volunteerId === userData?.uid) && (
           <button
             onClick={() => onAction(task.id, 'delivered', task.type)}
             disabled={actionLoading === `${task.id}-delivered`}
             className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 shadow-lg ${
               actionLoading === `${task.id}-delivered`
                 ? 'bg-gray-500 cursor-not-allowed'
                 : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-green-500/25'
             }`}
           >
             {actionLoading === `${task.id}-delivered` ? 'Completing...' : `Mark as ${task.type === 'donation' ? 'Delivered' : 'Completed'}`}
           </button>
         )}
        
        {task.status === 'delivered' && (
          <button
            onClick={() => {
              if (setFeedbackModal) {
                setFeedbackModal({
                  isOpen: true,
                  taskId: task.id,
                  taskType: task.type,
                  taskName: task.initiative || task.type || 'this task'
                });
              }
            }}
            className="flex-1 bg-green-500/20 text-green-400 py-3 px-4 rounded-xl text-sm font-medium text-center border border-green-500/30 hover:bg-green-500/30 transition-colors"
          >
            📝 Submit Feedback
          </button>
        )}
        
        {task.status === 'completed' && (
          <div className="flex-1 bg-green-600/20 text-green-300 py-3 px-4 rounded-xl text-sm font-medium text-center border border-green-600/30">
            ✅ Completed with Feedback
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerDashboard;