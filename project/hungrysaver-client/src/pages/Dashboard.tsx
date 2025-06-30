import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { MapPin, Calendar, User, Phone, Package, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Task {
  id: string;
  donorName?: string;
  donorContact?: string;
  beneficiaryName?: string;
  beneficiaryContact?: string;
  initiative: string;
  description: string;
  address: string;
  location: string;
  status: 'pending' | 'accepted' | 'picked' | 'delivered';
  type: 'donation' | 'request';
  createdAt: any;
  assignedTo?: string;
  details?: any;
}

const Dashboard: React.FC = () => {
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
    if (location) {
      fetchTasks();
    }
  }, [location]);

  const fetchTasks = async () => {
    try {
      // Fetch donations
      const donationsQuery = query(
        collection(db, 'donations'),
        where('location_lowercase', '==', location?.toLowerCase())
      );
      const donationsSnapshot = await getDocs(donationsQuery);
      const donations = donationsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'donation' as const,
        donorName: doc.data().donorName,
        donorContact: doc.data().donorContact,
        ...doc.data()
      })) as Task[];

      // Fetch community requests
      const requestsQuery = query(
        collection(db, 'community_requests'),
        where('location_lowercase', '==', location?.toLowerCase())
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'request' as const,
        beneficiaryName: doc.data().details?.contactName || doc.data().details?.beneficiaryName,
        beneficiaryContact: doc.data().details?.contactPhone || doc.data().details?.beneficiaryContact,
        description: doc.data().details?.description || doc.data().description,
        ...doc.data()
      })) as Task[];

      // Combine and sort by creation date
      const allTasks = [...donations, ...requests].sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setTasks(allTasks);
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
      
      const collectionName = taskType === 'donation' ? 'donations' : 'community_requests';
      await updateDoc(doc(db, collectionName, taskId), updateData);
      
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
                <span className="text-white text-sm font-medium capitalize">{location} Volunteer</span>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, {userData?.firstName}!
            </h1>
            <p className="text-gray-300">Ready to make a difference in {location} today?</p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <div className="bg-green-500/20 border border-green-500 rounded-lg px-4 py-3">
              <p className="text-green-400 font-medium">You've helped {stats.thisWeek} people this week! 🎉</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalHelped}</p>
                <p className="text-gray-400 text-sm">People Helped</p>
              </div>
              <User className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.thisWeek}</p>
                <p className="text-gray-400 text-sm">This Week</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalTasks}</p>
                <p className="text-gray-400 text-sm">Total Tasks</p>
              </div>
              <Package className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
                <p className="text-gray-400 text-sm">Success Rate</p>
              </div>
              <CheckCircle className="h-8 w-8 text-yellow-400" />
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

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {getFilteredTasks().length === 0 ? (
            <div className="col-span-full bg-gray-800 rounded-lg p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tasks available</h3>
              <p className="text-gray-400">
                {filter === 'available' 
                  ? `No new tasks in ${location} right now. Check back later!`
                  : filter === 'assigned'
                  ? 'You haven\'t accepted any tasks yet.'
                  : 'No tasks found for your location.'
                }
              </p>
            </div>
          ) : (
            getFilteredTasks().map((task) => (
              <div key={task.id} className="bg-gray-800 rounded-lg p-6 hover:shadow-lg transition-all duration-300 border border-gray-700 hover:border-green-500/50">
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
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
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
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    >
                      Mark as {task.type === 'donation' ? 'Picked Up' : 'In Progress'}
                    </button>
                  )}
                  
                  {task.status === 'picked' && task.assignedTo === userData?.uid && (
                    <button
                      onClick={() => handleTaskAction(task.id, 'delivered', task.type)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
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
          <h3 className="text-2xl font-bold text-white mb-2">Making Impact in {location}</h3>
          <p className="text-green-300 text-lg italic">
            "Every task you complete brings hope to someone in your community"
          </p>
          <div className="mt-4 text-gray-300">
            <p>Together, {location} volunteers have helped <span className="text-green-400 font-bold">500+</span> families this month!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;