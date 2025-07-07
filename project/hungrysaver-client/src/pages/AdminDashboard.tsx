import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, Timestamp, deleteDoc } from 'firebase/firestore';
import { Check, X, Clock, MapPin, GraduationCap, Mail, User, Crown, Heart, Users, Package, TrendingUp, Calendar, Activity } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface PendingVolunteer {
  uid: string;
  firstName: string;
  email: string;
  location: string;
  education: string;
  createdAt: any;
}

interface DashboardStats {
  pendingVolunteers: number;
  totalDonations: number;
  totalRequests: number;
  approvedVolunteers: number;
  todayDonations: number;
  todayRequests: number;
  completedTasks: number;
}

interface TodayActivity {
  id: string;
  type: 'donation' | 'request' | 'task_completed';
  title: string;
  description: string;
  location: string;
  timestamp: any;
  status: string;
  volunteerName?: string;
  donorName?: string;
}

const AdminDashboard: React.FC = () => {
  const [pendingVolunteers, setPendingVolunteers] = useState<PendingVolunteer[]>([]);
  const [todayActivity, setTodayActivity] = useState<TodayActivity[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    pendingVolunteers: 0,
    totalDonations: 0,
    totalRequests: 0,
    approvedVolunteers: 0,
    todayDonations: 0,
    todayRequests: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'volunteers' | 'activity'>('overview');
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      // Also test fetching all users to see what's in the database
      testFetchAllUsers();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Fetch pending volunteers
      console.log('🔍 Fetching pending volunteers...');
      const pendingQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'volunteer'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      const pendingSnapshot = await getDocs(pendingQuery);
      console.log('📊 Pending volunteers snapshot size:', pendingSnapshot.size);
      
      const volunteers = pendingSnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('👤 Volunteer data:', { uid: doc.id, ...data });
        return {
          uid: doc.id,
          ...data
        };
      }) as PendingVolunteer[];
      
      console.log('✅ Processed volunteers:', volunteers);
      setPendingVolunteers(volunteers);

      // Fetch approved volunteers count
      console.log('🔍 Fetching approved volunteers...');
      const approvedQuery = query(
        collection(db, 'users'),
        where('userType', '==', 'volunteer'),
        where('status', '==', 'approved')
      );
      const approvedSnapshot = await getDocs(approvedQuery);
      console.log('✅ Approved volunteers count:', approvedSnapshot.size);

      // Fetch all donations
      console.log('🔍 Fetching donations...');
      const donationsSnapshot = await getDocs(collection(db, 'donations'));
      const allDonations = donationsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as any[];
      console.log('✅ Donations count:', allDonations.length);
      
      // Fetch all requests
      console.log('🔍 Fetching community requests...');
      const requestsSnapshot = await getDocs(collection(db, 'community_requests'));
      const allRequests = requestsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as any[];
      console.log('✅ Community requests count:', allRequests.length);

      // Filter today's donations
      const todayDonations = allDonations.filter(donation => {
        const createdAt = donation.createdAt?.toDate?.() || new Date(0);
        return createdAt >= startOfDay && createdAt < endOfDay;
      });

      // Filter today's requests
      const todayRequests = allRequests.filter(request => {
        const createdAt = request.createdAt?.toDate?.() || new Date(0);
        return createdAt >= startOfDay && createdAt < endOfDay;
      });

      // Get completed tasks (delivered donations and fulfilled requests)
      const completedDonations = allDonations.filter(d => d.status === 'delivered');
      const completedRequests = allRequests.filter(r => r.status === 'delivered');

      // Build today's activity feed
      const activityFeed: TodayActivity[] = [
        ...todayDonations.map(donation => ({
          id: donation.id,
          type: 'donation' as const,
          title: `New Donation: ${donation.initiative?.replace('-', ' ') || 'Unknown'}`,
          description: donation.description || 'No description',
          location: donation.location || 'Unknown',
          timestamp: donation.createdAt,
          status: donation.status || 'pending',
          donorName: donation.donorName
        })),
        ...todayRequests.map(request => ({
          id: request.id,
          type: 'request' as const,
          title: `Community Request: ${request.initiative?.replace('-', ' ') || 'Unknown'}`,
          description: request.description || 'No description',
          location: request.location || 'Unknown',
          timestamp: request.createdAt,
          status: request.status || 'pending'
        })),
        ...completedDonations.filter(d => {
          const deliveredAt = d.deliveredAt?.toDate?.() || new Date(0);
          return deliveredAt >= startOfDay && deliveredAt < endOfDay;
        }).map(donation => ({
          id: `completed-${donation.id}`,
          type: 'task_completed' as const,
          title: `Task Completed: ${donation.initiative?.replace('-', ' ') || 'Unknown'}`,
          description: `Donation delivered successfully`,
          location: donation.location || 'Unknown',
          timestamp: donation.deliveredAt,
          status: 'completed',
          volunteerName: donation.assignedTo,
          donorName: donation.donorName
        }))
      ].sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(0);
        const bTime = b.timestamp?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });

      setTodayActivity(activityFeed);

      const statsData = {
        pendingVolunteers: volunteers.length,
        totalDonations: allDonations.length,
        totalRequests: allRequests.length,
        approvedVolunteers: approvedSnapshot.size,
        todayDonations: todayDonations.length,
        todayRequests: todayRequests.length,
        completedTasks: completedDonations.length + completedRequests.length
      };
      
      console.log('📈 Dashboard stats:', statsData);
      setStats(statsData);
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      // Show more detailed error information
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } finally {
      setLoading(false);
    }
  };

  const testFetchAllUsers = async () => {
    try {
      console.log('🧪 Testing: Fetching all users...');
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      console.log('📊 Total users in database:', allUsersSnapshot.size);
      
      allUsersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('👤 User:', { uid: doc.id, ...data });
      });

      // Check if there are any volunteers
      const volunteers = allUsersSnapshot.docs.filter(doc => {
        const data = doc.data();
        return data.userType === 'volunteer';
      });
      
      console.log('👥 Volunteers found:', volunteers.length);
      
      if (volunteers.length === 0) {
        console.log('⚠️ No volunteers found. You may need to register a volunteer account first.');
      }
    } catch (error) {
      console.error('❌ Error testing fetch all users:', error);
    }
  };

  const handleApproval = async (uid: string, approved: boolean, volunteerName: string, volunteerData?: any) => {
    setActionLoading(uid);
    try {
      const updateData = {
        status: approved ? 'approved' : 'rejected',
        approvedAt: new Date(),
        ...(approved ? {} : { rejectedAt: new Date() })
      };

      await updateDoc(doc(db, 'users', uid), updateData);

      // Remove from pending list
      setPendingVolunteers(prev => prev.filter(vol => vol.uid !== uid));

      // Update stats
      setStats(prev => ({
        ...prev,
        pendingVolunteers: prev.pendingVolunteers - 1,
        approvedVolunteers: approved ? prev.approvedVolunteers + 1 : prev.approvedVolunteers
      }));

      // Show success modal for approvals
      if (approved) {
        setShowSuccessModal(volunteerName);
        setTimeout(() => setShowSuccessModal(null), 4000);
      }

    } catch (error) {
      console.error('Error updating volunteer status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkApproval = async () => {
    if (pendingVolunteers.length === 0) return;
    
    setActionLoading('bulk');
    try {
      const promises = pendingVolunteers.map(async (volunteer) => {
        await updateDoc(doc(db, 'users', volunteer.uid), {
          status: 'approved',
          approvedAt: new Date()
        });
      });
      
      await Promise.all(promises);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        pendingVolunteers: 0,
        approvedVolunteers: prev.approvedVolunteers + pendingVolunteers.length
      }));
      
      setPendingVolunteers([]);
      setShowSuccessModal(`${pendingVolunteers.length} volunteers`);
      setTimeout(() => setShowSuccessModal(null), 4000);
      
    } catch (error) {
      console.error('Error bulk approving volunteers:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'donation': return <Heart className="h-5 w-5 text-green-400" />;
      case 'request': return <Users className="h-5 w-5 text-blue-400" />;
      case 'task_completed': return <Check className="h-5 w-5 text-purple-400" />;
      default: return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'accepted': return 'bg-blue-500/20 text-blue-400 border-blue-500';
      case 'picked': return 'bg-orange-500/20 text-orange-400 border-orange-500';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500';
      case 'completed': return 'bg-purple-500/20 text-purple-400 border-purple-500';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-center">
          <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
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
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl p-6 mb-8 border border-yellow-500">
          <div className="flex items-center space-x-3">
            <Crown className="h-8 w-8 text-yellow-200" />
            <div>
              <h1 className="text-2xl font-bold text-white">👑 Admin Dashboard</h1>
              <p className="text-yellow-200">Managing Hungry Saver operations across all cities</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingVolunteers}</p>
                <p className="text-gray-400 text-sm">Pending</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-green-400">{stats.approvedVolunteers}</p>
                <p className="text-gray-400 text-sm">Volunteers</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats.todayDonations}</p>
                <p className="text-gray-400 text-sm">Today's Donations</p>
              </div>
              <Heart className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-400">{stats.todayRequests}</p>
                <p className="text-gray-400 text-sm">Today's Requests</p>
              </div>
              <Package className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-orange-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-orange-400">{stats.totalDonations}</p>
                <p className="text-gray-400 text-sm">Total Donations</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-pink-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-pink-400">{stats.completedTasks}</p>
                <p className="text-gray-400 text-sm">Completed</p>
              </div>
              <Check className="h-8 w-8 text-pink-400" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6 w-fit">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'volunteers', label: 'Volunteers', icon: Users },
            { key: 'activity', label: 'Today\'s Activity', icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Debug Section */}
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
              <h3 className="text-xl font-bold text-red-400 mb-4">🐛 Debug Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-red-300">Admin Status:</span>
                  <span className={`font-bold ${isAdmin ? 'text-green-400' : 'text-red-400'}`}>
                    {isAdmin ? '✅ Admin' : '❌ Not Admin'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-300">Pending Volunteers:</span>
                  <span className="text-white font-bold">{pendingVolunteers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-300">Loading State:</span>
                  <span className={`font-bold ${loading ? 'text-yellow-400' : 'text-green-400'}`}>
                    {loading ? '🔄 Loading' : '✅ Loaded'}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-gray-800 rounded border">
                  <p className="text-red-300 text-xs mb-2">Recent Volunteers:</p>
                  {pendingVolunteers.length > 0 ? (
                    pendingVolunteers.slice(0, 3).map((vol, index) => (
                      <div key={vol.uid} className="text-xs text-gray-300 mb-1">
                        {index + 1}. {vol.firstName} ({vol.email}) - {vol.location}
                      </div>
                    ))
                  ) : (
                    <p className="text-red-400 text-xs">No pending volunteers found</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">📊 Platform Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Platform Users</span>
                  <span className="text-white font-bold">{stats.approvedVolunteers + stats.totalDonations + stats.totalRequests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Active Volunteers</span>
                  <span className="text-green-400 font-bold">{stats.approvedVolunteers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Donations</span>
                  <span className="text-blue-400 font-bold">{stats.totalDonations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Community Requests</span>
                  <span className="text-purple-400 font-bold">{stats.totalRequests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Completed Tasks</span>
                  <span className="text-pink-400 font-bold">{stats.completedTasks}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">📈 Today's Summary</h3>
              <div className="space-y-4">
                <div className="bg-blue-500/20 p-4 rounded-lg border border-blue-500">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-400 font-medium">New Donations</span>
                    <span className="text-blue-400 font-bold text-xl">{stats.todayDonations}</span>
                  </div>
                </div>
                <div className="bg-purple-500/20 p-4 rounded-lg border border-purple-500">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-400 font-medium">New Requests</span>
                    <span className="text-purple-400 font-bold text-xl">{stats.todayRequests}</span>
                  </div>
                </div>
                <div className="bg-green-500/20 p-4 rounded-lg border border-green-500">
                  <div className="flex items-center justify-between">
                    <span className="text-green-400 font-medium">Total Activity</span>
                    <span className="text-green-400 font-bold text-xl">{todayActivity.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Pending Volunteer Applications</h2>
                <p className="text-gray-400 text-sm">Review and approve new volunteers to enable their dashboard access</p>
              </div>
              
              {pendingVolunteers.length > 0 && (
                <button
                  onClick={handleBulkApproval}
                  disabled={actionLoading === 'bulk'}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {actionLoading === 'bulk' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Approve All ({pendingVolunteers.length})</span>
                </button>
              )}
            </div>
            
            {pendingVolunteers.length === 0 ? (
              <div className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-400 text-lg font-medium">All caught up!</p>
                <p className="text-gray-400">No pending volunteer applications to review</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Volunteer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Education
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {pendingVolunteers.map((volunteer) => (
                      <tr key={volunteer.uid} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                              <span className="text-white font-medium">
                                {volunteer.firstName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{volunteer.firstName}</div>
                              <div className="text-sm text-gray-400">New Volunteer</div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-300">
                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                            {volunteer.email}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-300 capitalize">
                              {volunteer.location}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm text-gray-300">{volunteer.education}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {volunteer.createdAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleApproval(volunteer.uid, true, volunteer.firstName, volunteer)}
                              disabled={actionLoading === volunteer.uid}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-3 py-1 rounded-md transition-colors flex items-center space-x-1"
                            >
                              {actionLoading === volunteer.uid ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              <span>Approve</span>
                            </button>
                            
                            <button
                              onClick={() => handleApproval(volunteer.uid, false, volunteer.firstName)}
                              disabled={actionLoading === volunteer.uid}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-3 py-1 rounded-md transition-colors flex items-center space-x-1"
                            >
                              <X className="h-4 w-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Today's Activity Feed</h2>
              <p className="text-gray-400 text-sm">Real-time updates of donations, requests, and completed tasks</p>
            </div>
            
            {todayActivity.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No activity today yet</p>
                <p className="text-gray-500 text-sm">Check back later for updates</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {todayActivity.map((activity) => (
                  <div key={activity.id} className="px-6 py-4 border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-white truncate">
                            {activity.title}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs border font-medium ${getStatusColor(activity.status)}`}>
                            {activity.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mt-1">{activity.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {activity.location}
                          </span>
                          {activity.donorName && (
                            <span className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {activity.donorName}
                            </span>
                          )}
                          {activity.volunteerName && (
                            <span className="flex items-center">
                              <Users className="h-3 w-3 mr-1" />
                              {activity.volunteerName}
                            </span>
                          )}
                          <span>{activity.timestamp?.toDate?.()?.toLocaleTimeString() || 'Unknown time'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-8 max-w-md mx-4 text-center border border-green-500">
              <div className="bg-green-500 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">🎉 Congratulations!</h3>
              <p className="text-gray-300 mb-4">
                <span className="text-green-400 font-medium">{showSuccessModal}</span> {showSuccessModal.includes('volunteers') ? 'are' : 'is'} now part of the Hungry Saver Volunteer Team.
              </p>
              <div className="bg-green-500/20 border border-green-500 rounded-lg p-3">
                <p className="text-green-400 text-sm">
                  {showSuccessModal.includes('volunteers') ? 'They' : 'They'} can now access their location dashboard and start helping the community!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;