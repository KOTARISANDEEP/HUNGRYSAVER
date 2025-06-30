import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, User, Phone, Package, Clock, CheckCircle, AlertCircle, Award, TrendingUp, Heart } from 'lucide-react';
import { getTasksByLocation, updateTaskStatus } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { Task } from '../types/formTypes';
import { LiveImpactDashboard } from '../components/ImpactCounter';
import MotivationalBanner from '../components/MotivationalBanner';
import AnimatedEmptyState from '../components/AnimatedIllustrations';

const VolunteerDashboard: React.FC = () => {
  const { location } = useParams<{ location: string }>();
  const { userData } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned'>('available');
  const [stats, setStats] = useState({
    totalHelped: 25,
    thisWeek: 8,
    totalTasks: 156,
    completionRate: 92
  });

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
    }
  }, [location, userData]);

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
          // Remove task from current user's view
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
      
      // Update local state
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: newStatus, ...updateData } : task
      ));
      
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'available':
        return tasks.filter(task => task.status === 'pending');
      case 'assigned':
        return tasks.filter(task => task.assignedTo === userData?.uid);
      default:
        return tasks;
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
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md mx-4">
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
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="bg-gray-800 rounded-xl p-8 text-center max-w-md mx-4">
          <MapPin className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
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
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="bg-green-500 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium capitalize">{userData.location} Volunteer</span>
              </div>
              <div className="bg-blue-500 px-3 py-1 rounded-full">
                <span className="text-white text-sm font-medium">✅ Approved</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {userData?.firstName}! 👋
            </h1>
            <p className="text-gray-300">Ready to make a difference in {userData.location} today?</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500 rounded-lg px-4 py-3">
              <p className="text-green-400 font-medium">You've helped {stats.thisWeek} people this week! 🎉</p>
            </div>
          </div>
        </div>

        {/* Motivational Banner */}
        <MotivationalBanner />

        {/* Live Impact Dashboard */}
        <LiveImpactDashboard />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalHelped}</p>
                <p className="text-sm opacity-90">People Helped</p>
              </div>
              <User className="h-8 w-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.thisWeek}</p>
                <p className="text-sm opacity-90">This Week</p>
              </div>
              <Calendar className="h-8 w-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
                <p className="text-sm opacity-90">Total Tasks</p>
              </div>
              <Package className="h-8 w-8 opacity-80" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
                <p className="text-sm opacity-90">Success Rate</p>
              </div>
              <CheckCircle className="h-8 w-8 opacity-80" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6 w-fit">
          {[
            { key: 'available', label: 'Available Tasks', count: tasks.filter(t => t.status === 'pending').length },
            { key: 'assigned', label: 'My Tasks', count: tasks.filter(t => t.assignedTo === userData?.uid).length },
            { key: 'all', label: 'All Tasks', count: tasks.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Location Restriction Notice */}
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-400" />
            <span className="text-blue-400 font-medium">Location-Based Access</span>
          </div>
          <p className="text-blue-200 text-sm mt-1">
            You're viewing donations and requests specifically for <strong>{userData.location}</strong>. 
            This ensures efficient local coordination and faster response times.
          </p>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {getFilteredTasks().length === 0 ? (
            <div className="col-span-full">
              <AnimatedEmptyState
                type="volunteers"
                title={
                  filter === 'available' 
                    ? `No new tasks in ${userData.location} right now`
                    : filter === 'assigned'
                    ? 'You haven\'t accepted any tasks yet'
                    : 'No tasks found for your location'
                }
                description={
                  filter === 'available'
                    ? 'Check back later for new opportunities to help your community!'
                    : filter === 'assigned'
                    ? 'Accept some available tasks to start making a difference!'
                    : 'Tasks will appear here when they become available.'
                }
                actionText={filter === 'assigned' ? 'View Available Tasks' : undefined}
                onAction={filter === 'assigned' ? () => setFilter('available') : undefined}
              />
            </div>
          ) : (
            getFilteredTasks().map((task) => (
              <div key={task.id} className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-all duration-300 border border-gray-700 hover:border-green-500/50 transform hover:scale-105">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getInitiativeEmoji(task.initiative)}</div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-white capitalize">{task.initiative.replace('-', ' ')}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.type === 'donation' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
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
                        onClick={() => handleTaskAction(task.id, 'accept', task.type)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105"
                      >
                        Accept {task.type === 'donation' ? 'Donation' : 'Request'}
                      </button>
                      <button
                        onClick={() => handleTaskAction(task.id, 'reject', task.type)}
                        className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                      >
                        Pass
                      </button>
                    </>
                  )}
                  
                  {task.status === 'accepted' && task.assignedTo === userData?.uid && (
                    <button
                      onClick={() => handleTaskAction(task.id, 'picked', task.type)}
                      className="flex-1 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Mark as {task.type === 'donation' ? 'Picked Up' : 'In Progress'}
                    </button>
                  )}
                  
                  {task.status === 'picked' && task.assignedTo === userData?.uid && (
                    <button
                      onClick={() => handleTaskAction(task.id, 'delivered', task.type)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      Mark as {task.type === 'donation' ? 'Delivered' : 'Completed'}
                    </button>
                  )}
                  
                  {task.status === 'delivered' && (
                    <div className="flex-1 bg-green-500/20 text-green-400 py-2 px-4 rounded-md text-sm font-medium text-center border border-green-500">
                      ✅ Completed
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Motivational Footer */}
        <div className="mt-12 text-center bg-gradient-to-r from-green-600/20 to-green-700/20 rounded-lg p-8 border border-green-500/30">
          <h3 className="text-2xl font-bold text-white mb-2">Making Impact in {userData.location}</h3>
          <p className="text-green-300 text-lg italic mb-4">
            "Every task you complete brings hope to someone in your community"
          </p>
          <div className="text-gray-300">
            <p>Together, {userData.location} volunteers have helped <span className="text-green-400 font-bold">500+</span> families this month!</p>
          </div>
          
          {/* Achievement Badge */}
          <div className="mt-6 inline-flex items-center space-x-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full px-6 py-3">
            <Award className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-300 font-medium">Community Hero Badge Earned!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;