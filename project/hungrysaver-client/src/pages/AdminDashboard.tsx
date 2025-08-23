import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, Timestamp, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Check, X, Clock, MapPin, GraduationCap, Mail, User, Crown, Heart, Users, Package, TrendingUp, Calendar, Activity, Home, Settings, Bell, LogOut, UserCircle, Menu, BarChart3, ClipboardList, DollarSign, Star, UserCheck, FileText, Award, MessageSquare } from 'lucide-react';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

interface PendingVolunteer {
  uid: string;
  firstName: string;
  email: string;
  location: string;
  education: string;
  createdAt: any;
}

interface DashboardStats {
  totalUsers: number;
  activeVolunteers: number;
  totalDonations: number;
  completedTasks: number;
  pendingRequests: number;
  todayActivity: number;
  totalDonors: number;
  totalAdmins: number;
}

interface ChartData {
  name: string;
  value?: number;
  donations?: number;
  date?: string;
}

interface CommunityRequest {
  id: string;
  initiative: string;
  description: string;
  location: string;
  status: string;
  createdAt: any;
  contactName?: string;
  mobileNumber?: string;
}

interface Donation {
  id: string;
  initiative: string;
  donorName: string;
  status: string;
  createdAt: any;
  location: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: any;
  reviewerName: string;
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
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [recentDonations, setRecentDonations] = useState<Donation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
     const [donationChartData, setDonationChartData] = useState<ChartData[]>([]);
   const [userRatioData, setUserRatioData] = useState<ChartData[]>([]);
   const [allDonations, setAllDonations] = useState<any[]>([]);
   const [directDonations, setDirectDonations] = useState<any[]>([]);
   const [allRequests, setAllRequests] = useState<any[]>([]);
   const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeVolunteers: 0,
    totalDonations: 0,
    completedTasks: 0,
    pendingRequests: 0,
    todayActivity: 0,
    totalDonors: 0,
    totalAdmins: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'home' | 'volunteers' | 'community' | 'donations' | 'tasks' | 'reviews' | 'users' | 'settings'>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
      // Also test fetching all users to see what's in the database
      testFetchAllUsers();
    }
  }, [isAdmin]);

  // Hide global site navbar while on admin dashboard
  useEffect(() => {
    const nav = document.querySelector('nav');
    const originalDisplay = nav instanceof HTMLElement ? nav.style.display : '';
    if (nav instanceof HTMLElement) nav.style.display = 'none';
    return () => {
      if (nav instanceof HTMLElement) nav.style.display = originalDisplay;
    };
  }, []);

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
         try {
           const data = doc.data();
           console.log('👤 Volunteer data:', { uid: doc.id, ...data });
           return {
             uid: String(doc.id || ''),
             firstName: String(data.firstName || 'Unknown'),
             email: String(data.email || 'No email'),
             location: String(data.location || 'Unknown'),
             education: String(data.education || 'Not specified'),
             createdAt: data.createdAt || new Date()
           };
         } catch (error) {
           console.warn('Error processing volunteer data:', error, doc.id);
           return {
             uid: 'error',
             firstName: 'Unknown',
             email: 'No email',
             location: 'Unknown',
             education: 'Not specified',
             createdAt: new Date()
           };
         }
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
       setAllDonations(allDonations);
       
               // Filter to show only direct donations (not community request fulfillments)
       const directDonations = allDonations.filter(donation => {
         try {
           // Only include direct donations, exclude community request fulfillments
           // Assuming community request fulfillments have a 'communityRequestId' or 'requestId' field
           // or donationType field to distinguish them
           return !donation.communityRequestId && !donation.requestId && 
                  String(donation.donationType || 'direct') === 'direct';
         } catch (error) {
           console.warn('Error filtering direct donations:', error, donation);
           return true; // Include by default if we can't determine
         }
       });
       
       console.log('📊 Direct donations count:', directDonations.length);
       console.log('📊 Total donations count:', allDonations.length);
       
       // Set direct donations state
       setDirectDonations(directDonations);
       
       // Set recent donations for display with safe data conversion (direct donations only)
        setRecentDonations(directDonations.slice(0, 10).map(donation => {
          try {
            return {
              id: String(donation.id || ''),
              initiative: String(donation.initiative || 'Unknown'),
              donorName: String(donation.donorName || donation.donorContact || donation.userName || 'Anonymous'),
              status: String(donation.status || 'pending'),
              createdAt: donation.createdAt,
              location: String(donation.location || 'Unknown')
            };
          } catch (error) {
            console.warn('Error processing donation for display:', error, donation);
            return {
              id: 'error',
              initiative: 'Unknown',
              donorName: 'Anonymous',
              status: 'pending',
              createdAt: new Date(),
              location: 'Unknown'
            };
          }
        }));
      
             // Fetch all requests
       console.log('🔍 Fetching community requests...');
       const requestsSnapshot = await getDocs(collection(db, 'community_requests'));
       const allRequests = requestsSnapshot.docs.map(doc => ({ 
         id: doc.id, 
         ...doc.data() 
       })) as any[];
       console.log('✅ Community requests count:', allRequests.length);
       setAllRequests(allRequests);
       
               // Set community requests for display with safe data conversion
        setCommunityRequests(allRequests.map(request => {
          try {
            return {
              id: String(request.id || ''),
              initiative: String(request.initiative || 'Unknown'),
              description: String(request.description || 'No description'),
              location: String(request.location || 'Unknown'),
              status: String(request.status || 'pending'),
              createdAt: request.createdAt,
              contactName: String(request.beneficiaryName || request.contactName || request.userName || 'Anonymous'),
              mobileNumber: String(request.beneficiaryContact || request.phoneNumber || 'Not provided')
            };
          } catch (error) {
            console.warn('Error processing community request for display:', error, request);
            return {
              id: 'error',
              initiative: 'Unknown',
              description: 'No description',
              location: 'Unknown',
              status: 'pending',
              createdAt: new Date(),
              contactName: 'Anonymous',
              mobileNumber: 'Not provided'
            };
          }
        }));

      // Filter today's donations (direct donations only)
      const todayDonations = directDonations.filter(donation => {
        try {
          const createdAt = donation.createdAt?.toDate?.() || new Date(0);
          return createdAt >= startOfDay && createdAt < endOfDay;
        } catch (error) {
          console.warn('Error processing donation date:', error);
          return false;
        }
      });

      // Filter today's requests
      const todayRequests = allRequests.filter(request => {
        try {
          const createdAt = request.createdAt?.toDate?.() || new Date(0);
          return createdAt >= startOfDay && createdAt < endOfDay;
        } catch (error) {
          console.warn('Error processing request date:', error);
          return false;
        }
      });

             // Get completed tasks (delivered direct donations and fulfilled requests)
       const completedDonations = directDonations.filter(d => {
         try {
           return String(d.status || '') === 'delivered';
         } catch (error) {
           console.warn('Error processing completed donation filter:', error, d);
           return false;
         }
       });
       const completedRequests = allRequests.filter(r => {
         try {
           return String(r.status || '') === 'delivered';
         } catch (error) {
           console.warn('Error processing completed request filter:', error, r);
           return false;
         }
       });

             // Build today's activity feed with safe data conversion
       const activityFeed: TodayActivity[] = [
         ...todayDonations.map(donation => {
           try {
             return {
               id: String(donation.id || ''),
               type: 'donation' as const,
               title: `New Donation: ${String(donation.initiative || 'Unknown').replace('-', ' ')}`,
               description: String(donation.description || 'No description'),
               location: String(donation.location || 'Unknown'),
               timestamp: donation.createdAt,
               status: String(donation.status || 'pending'),
               donorName: String(donation.donorName || 'Anonymous')
             };
           } catch (error) {
             console.warn('Error processing donation activity:', error, donation);
             return {
               id: 'error',
               type: 'donation' as const,
               title: 'New Donation: Unknown',
               description: 'No description',
               location: 'Unknown',
               timestamp: new Date(),
               status: 'pending',
               donorName: 'Anonymous'
             };
           }
         }),
         ...todayRequests.map(request => {
           try {
             return {
               id: String(request.id || ''),
               type: 'request' as const,
               title: `Community Request: ${String(request.initiative || 'Unknown').replace('-', ' ')}`,
               description: String(request.description || 'No description'),
               location: String(request.location || 'Unknown'),
               timestamp: request.createdAt,
               status: String(request.status || 'pending')
             };
           } catch (error) {
             console.warn('Error processing request activity:', error, request);
             return {
               id: 'error',
               type: 'request' as const,
               title: 'Community Request: Unknown',
               description: 'No description',
               location: 'Unknown',
               timestamp: new Date(),
               status: 'pending'
             };
           }
         }),
         ...completedDonations.filter(d => {
           try {
             const deliveredAt = d.deliveredAt?.toDate?.() || new Date(0);
             return deliveredAt >= startOfDay && deliveredAt < endOfDay;
           } catch (error) {
             console.warn('Error processing completed donation date:', error);
             return false;
           }
         }).map(donation => {
           try {
             return {
               id: `completed-${String(donation.id || '')}`,
               type: 'task_completed' as const,
               title: `Task Completed: ${String(donation.initiative || 'Unknown').replace('-', ' ')}`,
               description: `Donation delivered successfully`,
               location: String(donation.location || 'Unknown'),
               timestamp: donation.deliveredAt,
               status: 'completed',
               volunteerName: String(donation.assignedTo || 'Unknown'),
               donorName: String(donation.donorName || 'Anonymous')
             };
           } catch (error) {
             console.warn('Error processing completed donation activity:', error, donation);
             return {
               id: 'completed-error',
               type: 'task_completed' as const,
               title: 'Task Completed: Unknown',
               description: 'Donation delivered successfully',
               location: 'Unknown',
               timestamp: new Date(),
               status: 'completed',
               volunteerName: 'Unknown',
               donorName: 'Anonymous'
             };
           }
         })
       ].sort((a, b) => {
         try {
           const aTime = a.timestamp?.toDate?.() || new Date(0);
           const bTime = b.timestamp?.toDate?.() || new Date(0);
           return bTime.getTime() - aTime.getTime();
         } catch (error) {
           console.warn('Error sorting activity feed:', error);
           return 0;
         }
       });

      setTodayActivity(activityFeed);

      // Fetch all users for user breakdown
      const allUsersSnapshot = await getDocs(collection(db, 'users'));
      const allUsers = allUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
             const totalDonors = allUsers.filter(user => {
         try {
           return String(user.userType || '') === 'donor';
         } catch (error) {
           console.warn('Error processing donor filter:', error, user);
           return false;
         }
       }).length;
       const totalAdmins = allUsers.filter(user => {
         try {
           return String(user.userType || '') === 'admin';
         } catch (error) {
           console.warn('Error processing admin filter:', error, user);
           return false;
         }
       }).length;
       const totalUsers = allUsers.length;

      // Prepare chart data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

             const donationChartData = last7Days.map(date => {
         try {
           const dayDonations = directDonations.filter(donation => {
             try {
               const createdAt = donation.createdAt?.toDate?.() || new Date(0);
               return createdAt.toISOString().split('T')[0] === date;
             } catch (error) {
               console.warn('Error processing donation date:', error);
               return false;
             }
           });
           return {
             name: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
             donations: dayDonations.length,
             date: String(date)
           };
         } catch (error) {
           console.warn('Error processing chart data for date:', date, error);
           return {
             name: 'Error',
             donations: 0,
             date: String(date)
           };
         }
       });

             const userRatioData = [
         { name: 'Volunteers', value: Number(approvedSnapshot.size) || 0 },
         { name: 'Donors', value: Number(totalDonors) || 0 },
         { name: 'Community Users', value: Number(allUsers.filter(user => {
           try {
             return String(user.userType || '') === 'community';
           } catch (error) {
             console.warn('Error processing community user filter:', error, user);
             return false;
           }
         }).length) || 0 }
       ];

      setDonationChartData(donationChartData);
      setUserRatioData(userRatioData);

             const statsData = {
         totalUsers: Number(totalUsers) || 0,
         activeVolunteers: Number(approvedSnapshot.size) || 0,
         totalDonations: Number(directDonations.length) || 0, // Only count direct donations
         completedTasks: Number(completedDonations.length + completedRequests.length) || 0,
         pendingRequests: Number(volunteers.length + allRequests.filter(r => {
           try {
             return String(r.status || '') === 'pending';
           } catch (error) {
             console.warn('Error processing pending request filter:', error, r);
             return false;
           }
         }).length) || 0,
         todayActivity: Number(todayDonations.length + todayRequests.length) || 0,
         totalDonors: Number(totalDonors) || 0,
         totalAdmins: Number(totalAdmins) || 0
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
         try {
           const data = doc.data();
           console.log('👤 User:', { uid: String(doc.id || ''), ...data });
         } catch (error) {
           console.warn('Error processing user data:', error, doc.id);
         }
       });

             // Check if there are any volunteers
       const volunteers = allUsersSnapshot.docs.filter(doc => {
         try {
           const data = doc.data();
           return String(data.userType || '') === 'volunteer';
         } catch (error) {
           console.warn('Error processing volunteer filter:', error, doc.id);
           return false;
         }
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
        pendingRequests: prev.pendingRequests - 1,
        activeVolunteers: approved ? prev.activeVolunteers + 1 : prev.activeVolunteers
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
         pendingRequests: prev.pendingRequests - pendingVolunteers.length,
         activeVolunteers: prev.activeVolunteers + pendingVolunteers.length
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

   const handleCommunityRequestStatusUpdate = async (requestId: string, newStatus: string) => {
     setActionLoading(requestId);
     try {
       await updateDoc(doc(db, 'community_requests', requestId), {
         status: newStatus,
         updatedAt: new Date()
       });
       
       // Update local state
       setCommunityRequests(prev => prev.map(request => 
         request.id === requestId ? { ...request, status: newStatus } : request
       ));
       
       setShowSuccessModal(`Community request ${newStatus}`);
       setTimeout(() => setShowSuccessModal(null), 3000);
       
     } catch (error) {
       console.error('Error updating community request status:', error);
     } finally {
       setActionLoading(null);
     }
   };

   const handleDonationStatusUpdate = async (donationId: string, newStatus: string) => {
     setActionLoading(donationId);
     try {
       await updateDoc(doc(db, 'donations', donationId), {
         status: newStatus,
         updatedAt: new Date()
       });
       
       // Update local state
       setRecentDonations(prev => prev.map(donation => 
         donation.id === donationId ? { ...donation, status: newStatus } : donation
       ));
       
       setShowSuccessModal(`Donation ${newStatus}`);
       setTimeout(() => setShowSuccessModal(null), 3000);
       
     } catch (error) {
       console.error('Error updating donation status:', error);
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

  const sidebarItems = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'volunteers', label: 'Volunteer Requests', icon: UserCheck },
    { key: 'community', label: 'Community Requests', icon: ClipboardList },
    { key: 'donations', label: 'Donations Today', icon: Heart },
    { key: 'tasks', label: 'Overall Tasks', icon: Activity },
    { key: 'reviews', label: 'Reviews', icon: Star },
    { key: 'users', label: 'Total Users', icon: Users },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#eaa640]"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Final safety check - ensure all data is safe for rendering
  const safeRender = () => {
    try {
      return (
        <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-black transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 border-r border-[#eaa640]/20`}>
        <div className="flex items-center justify-center h-16 bg-black border-b border-[#eaa640]/20">
          <Crown className="h-8 w-8 text-[#eaa640]" />
          <span className="ml-2 text-xl font-bold text-white">Admin Panel</span>
        </div>
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveSection(item.key as any);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 relative ${
                    activeSection === item.key
                      ? 'bg-[#eaa640] text-black shadow-lg border-l-4 border-[#eeb766]'
                      : 'text-gray-300 hover:bg-[#eeb766] hover:text-black'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Navbar */}
        <div className="bg-black border-b border-[#eaa640]/20 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md text-gray-300 hover:text-[#eaa640] hover:bg-gray-800/50 transition-all duration-200"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-white">Welcome Admin</h1>
              <p className="text-sm text-gray-400">Managing Hungry Saver Platform</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 rounded-lg text-gray-300 hover:text-[#eaa640] hover:bg-gray-800/50 transition-all duration-200">
              <Bell className="h-6 w-6" />
            </button>
            <button
              onClick={handleLogout}
              className="bg-[#eaa640] hover:bg-[#eeb766] text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center space-x-2 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-200"
              >
                <UserCircle className="h-8 w-8" />
                <span className="hidden md:block">Admin</span>
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-black rounded-lg shadow-lg border border-[#eaa640]/20 py-2">
                  <button className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors">
                    <User className="h-4 w-4 inline mr-2" />
                    Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors">
                    <Settings className="h-4 w-4 inline mr-2" />
                    Settings
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 bg-black">
          {activeSection === 'home' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-[#eaa640]/30 hover:shadow-lg hover:shadow-[#eaa640]/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#eaa640]">{stats.totalUsers}</p>
                      <p className="text-gray-400 text-sm">Total Users</p>
                    </div>
                    <Users className="h-8 w-8 text-[#eaa640]" />
                  </div>
                </div>
                
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-[#eaa640]/30 hover:shadow-lg hover:shadow-[#eaa640]/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#eaa640]">{stats.activeVolunteers}</p>
                      <p className="text-gray-400 text-sm">Active Volunteers</p>
                    </div>
                    <UserCheck className="h-8 w-8 text-[#eaa640]" />
                  </div>
                </div>
                
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-[#eaa640]/30 hover:shadow-lg hover:shadow-[#eaa640]/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#eaa640]">{stats.totalDonations}</p>
                      <p className="text-gray-400 text-sm">Total Donations</p>
                    </div>
                    <Heart className="h-8 w-8 text-[#eaa640]" />
                  </div>
                </div>
                
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-[#eaa640]/30 hover:shadow-lg hover:shadow-[#eaa640]/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#eaa640]">{stats.completedTasks}</p>
                      <p className="text-gray-400 text-sm">Completed Tasks</p>
                    </div>
                    <Check className="h-8 w-8 text-[#eaa640]" />
                  </div>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-[#eaa640]/30 hover:shadow-lg hover:shadow-[#eaa640]/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#eaa640]">{stats.pendingRequests}</p>
                      <p className="text-gray-400 text-sm">Pending Requests</p>
                    </div>
                    <Clock className="h-8 w-8 text-[#eaa640]" />
                  </div>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-4 border border-[#eaa640]/30 hover:shadow-lg hover:shadow-[#eaa640]/20 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-[#eaa640]">{stats.todayActivity}</p>
                      <p className="text-gray-400 text-sm">Today's Activity</p>
                    </div>
                    <Activity className="h-8 w-8 text-[#eaa640]" />
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-[#eaa640]/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-[#eaa640]" />
                    Donations Over Time
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={donationChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <YAxis 
                          stroke="#9CA3AF"
                          fontSize={12}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #EAA640',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="donations" 
                          stroke="#EAA640" 
                          strokeWidth={3}
                          dot={{ fill: '#EAA640', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: '#EAA640', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-[#eaa640]/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-[#eaa640]" />
                    User Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userRatioData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {userRatioData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={['#EAA640', '#ECAE53', '#EEB766'][index % 3]} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #EAA640',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-[#eaa640]/30">
                <div className="px-6 py-4 border-b border-[#eaa640]/20">
                  <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
                </div>
                <div className="p-6">
                  {todayActivity.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No activity today</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todayActivity.slice(0, 5).map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-white text-sm font-medium">{String(activity.title || 'Unknown Activity')}</p>
                            <p className="text-gray-400 text-xs">{String(activity.location || 'Unknown Location')}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(String(activity.status || 'pending'))}`}>
                            {String(activity.status || 'pending')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'volunteers' && (
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-[#eaa640]/30 overflow-hidden">
              <div className="px-6 py-4 border-b border-[#eaa640]/20 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Volunteer Requests</h2>
                  <p className="text-gray-400 text-sm">Review and approve new volunteer applications</p>
                </div>
                
                {pendingVolunteers.length > 0 && (
                  <button
                    onClick={handleBulkApproval}
                    disabled={actionLoading === 'bulk'}
                    className="bg-[#eaa640] hover:bg-[#eeb766] disabled:bg-gray-600 text-black px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    {actionLoading === 'bulk' ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Approve All ({pendingVolunteers.length})</span>
                  </button>
                )}
              </div>
              
              {pendingVolunteers.length === 0 ? (
                <div className="p-8 text-center">
                  <UserCheck className="h-12 w-12 text-[#eaa640] mx-auto mb-4" />
                  <p className="text-[#eaa640] text-lg font-medium">All caught up!</p>
                  <p className="text-gray-400">No pending volunteer applications</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                                         <thead className="bg-gray-800/50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Name</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Email</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">City</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Education</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Status</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Actions</th>
                       </tr>
                     </thead>
                    <tbody className="divide-y divide-gray-700">
                      {pendingVolunteers.map((volunteer) => (
                                                 <tr key={volunteer.uid} className="hover:bg-gray-800/30 transition-colors">
                           <td className="px-6 py-4 text-white font-medium">{volunteer.firstName}</td>
                           <td className="px-6 py-4 text-gray-300">{volunteer.email}</td>
                           <td className="px-6 py-4 text-gray-300 capitalize">{volunteer.location}</td>
                           <td className="px-6 py-4 text-gray-300 capitalize">{volunteer.education || 'Not specified'}</td>
                           <td className="px-6 py-4">
                             <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-medium">
                               Pending
                             </span>
                           </td>
                           <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproval(volunteer.uid, true, volunteer.firstName)}
                                disabled={actionLoading === volunteer.uid}
                                className="bg-[#eaa640] hover:bg-[#eeb766] disabled:bg-gray-600 text-black px-3 py-1 rounded-lg text-sm transition-all duration-200 flex items-center"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleApproval(volunteer.uid, false, volunteer.firstName)}
                                disabled={actionLoading === volunteer.uid}
                                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-3 py-1 rounded-lg text-sm transition-all duration-200 flex items-center"
                              >
                                <X className="h-4 w-4" />
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

                     {activeSection === 'community' && (
             <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-[#eaa640]/30 overflow-hidden">
               <div className="px-6 py-4 border-b border-[#eaa640]/20">
                 <h2 className="text-xl font-semibold text-white">Community Requests</h2>
                 <p className="text-gray-400 text-sm">Monitor community requests and their status</p>
               </div>
               
               {communityRequests.length === 0 ? (
                 <div className="p-8 text-center">
                   <ClipboardList className="h-12 w-12 text-[#eaa640] mx-auto mb-4" />
                   <p className="text-[#eaa640] text-lg font-medium">No Community Requests</p>
                   <p className="text-gray-400">No community requests found in the system</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="min-w-full">
                                           <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Initiative</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                     <tbody className="divide-y divide-gray-700">
                       {communityRequests.map((request) => (
                         <tr key={request.id} className="hover:bg-gray-800/30 transition-colors">
                                                       <td className="px-6 py-4 text-white font-medium">
                              <div>
                                <div className="font-semibold">{String(request.contactName || 'Anonymous')}</div>
                                <div className="text-sm text-gray-400">{String(request.mobileNumber || 'Not provided')}</div>
                              </div>
                            </td>
                           <td className="px-6 py-4 text-gray-300 capitalize">{String(request.initiative || 'Unknown').replace('-', ' ')}</td>
                           <td className="px-6 py-4 text-gray-300 max-w-xs truncate">{String(request.description || 'No description')}</td>
                           <td className="px-6 py-4 text-gray-300 capitalize">{String(request.location || 'Unknown')}</td>
                                                       <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(String(request.status || 'pending'))}`}>
                                {String(request.status || 'pending')}
                              </span>
                            </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           )}

                     {activeSection === 'donations' && (
             <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-[#eaa640]/30 overflow-hidden">
               <div className="px-6 py-4 border-b border-[#eaa640]/20">
                 <h2 className="text-xl font-semibold text-white">Recent Donations</h2>
                 <p className="text-gray-400 text-sm">Latest donations from Firebase</p>
               </div>
               
               {recentDonations.length === 0 ? (
                 <div className="p-8 text-center">
                   <Heart className="h-12 w-12 text-[#eaa640] mx-auto mb-4" />
                   <p className="text-[#eaa640] text-lg font-medium">No Donations</p>
                   <p className="text-gray-400">No donations found in the system</p>
                 </div>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="min-w-full">
                                           <thead className="bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Donor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Initiative</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-[#eaa640] uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                     <tbody className="divide-y divide-gray-700">
                       {recentDonations.map((donation) => (
                         <tr key={donation.id} className="hover:bg-gray-800/30 transition-colors">
                           <td className="px-6 py-4 text-white font-medium">{String(donation.donorName || 'Anonymous')}</td>
                           <td className="px-6 py-4 text-gray-300 capitalize">{String(donation.initiative || 'Unknown').replace('-', ' ')}</td>
                           <td className="px-6 py-4 text-gray-300 capitalize">{String(donation.location || 'Unknown')}</td>
                                                       <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(String(donation.status || 'pending'))}`}>
                                {String(donation.status || 'pending')}
                              </span>
                            </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           )}

                     {activeSection === 'tasks' && (
             <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-[#eaa640]/30 overflow-hidden">
               <div className="px-6 py-4 border-b border-[#eaa640]/20">
                 <h2 className="text-xl font-semibold text-white">Overall Tasks</h2>
                 <p className="text-gray-400 text-sm">All completed and pending tasks from donations and community requests</p>
               </div>
               
               <div className="p-6">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Left Column - Community Requests */}
                   <div>
                     <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                       <Users className="h-5 w-5 mr-2 text-blue-400" />
                       Community Requests
                     </h3>
                     
                     {/* Completed Community Requests */}
                     <div className="mb-6">
                       <h4 className="text-md font-medium text-green-400 mb-3 flex items-center">
                         <Check className="h-4 w-4 mr-2" />
                         Completed ({allRequests?.filter(r => {
                           try {
                             return String(r.status || '') === 'completed';
                           } catch (error) {
                             console.warn('Error processing completed request filter in UI:', error, r);
                             return false;
                           }
                         }).length || 0})
                       </h4>
                       <div className="space-y-2">
                         {allRequests?.filter(r => {
                           try {
                             return String(r.status || '') === 'completed';
                           } catch (error) {
                             console.warn('Error processing completed request filter in UI:', error, r);
                             return false;
                           }
                         }).map((request) => (
                           <div key={`request-${request.id}`} className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-green-500">
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="text-white font-medium">Community Request Completed</p>
                                 <p className="text-gray-400 text-sm">{String(request.initiative || 'Unknown').replace('-', ' ')} - {String(request.location || 'Unknown')}</p>
                                 <p className="text-gray-500 text-xs">Contact: {String(request.contactName || request.userName || 'Anonymous')}</p>
                               </div>
                               <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                 Completed
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                     
                     {/* Pending Community Requests */}
                     <div>
                       <h4 className="text-md font-medium text-yellow-400 mb-3 flex items-center">
                         <Clock className="h-4 w-4 mr-2" />
                         Pending ({allRequests?.filter(r => {
                           try {
                             const status = String(r.status || '');
                             return status === 'pending' || status === 'accepted' || status === 'in_progress';
                           } catch (error) {
                             console.warn('Error processing pending request filter in UI:', error, r);
                             return false;
                           }
                         }).length || 0})
                       </h4>
                       <div className="space-y-2">
                         {allRequests?.filter(r => {
                           try {
                             const status = String(r.status || '');
                             return status === 'pending' || status === 'accepted' || status === 'in_progress';
                           } catch (error) {
                             console.warn('Error processing pending request filter in UI:', error, r);
                             return false;
                           }
                         }).map((request) => (
                           <div key={`request-pending-${request.id}`} className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-yellow-500">
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="text-white font-medium">Community Request {String(request.status || 'Unknown')}</p>
                                 <p className="text-gray-400 text-sm">{String(request.initiative || 'Unknown').replace('-', ' ')} - {String(request.location || 'Unknown')}</p>
                                 <p className="text-gray-500 text-xs">Contact: {String(request.contactName || request.userName || 'Anonymous')}</p>
                               </div>
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(String(request.status || 'pending'))}`}>
                                 {String(request.status || 'pending')}
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                   
                   {/* Right Column - Direct Donations */}
                   <div>
                     <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                       <Heart className="h-5 w-5 mr-2 text-red-400" />
                       Direct Donations
                     </h3>
                     
                     {/* Completed Direct Donations */}
                     <div className="mb-6">
                       <h4 className="text-md font-medium text-green-400 mb-3 flex items-center">
                         <Check className="h-4 w-4 mr-2" />
                         Delivered ({directDonations?.filter(d => {
                           try {
                             return String(d.status || '') === 'delivered';
                           } catch (error) {
                             console.warn('Error processing completed donation filter in UI:', error, d);
                             return false;
                           }
                         }).length || 0})
                       </h4>
                       <div className="space-y-2">
                         {directDonations?.filter(d => {
                           try {
                             return String(d.status || '') === 'delivered';
                           } catch (error) {
                             console.warn('Error processing completed donation filter in UI:', error, d);
                             return false;
                           }
                         }).map((donation) => (
                           <div key={`donation-${donation.id}`} className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-green-500">
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="text-white font-medium">Donation Delivered</p>
                                 <p className="text-gray-400 text-sm">{String(donation.initiative || 'Unknown').replace('-', ' ')} - {String(donation.location || 'Unknown')}</p>
                                 <p className="text-white text-xs">Donor: {String(donation.donorName || donation.donorContact || donation.userName || 'Anonymous')}</p>
                               </div>
                               <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
                                 Delivered
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                     
                     {/* Pending Direct Donations */}
                     <div>
                       <h4 className="text-md font-medium text-yellow-400 mb-3 flex items-center">
                         <Clock className="h-4 w-4 mr-2" />
                         Pending ({directDonations?.filter(d => {
                           try {
                             const status = String(d.status || '');
                             return status === 'pending' || status === 'accepted' || status === 'picked';
                           } catch (error) {
                             console.warn('Error processing pending donation filter in UI:', error, d);
                             return false;
                           }
                         }).length || 0})
                       </h4>
                       <div className="space-y-2">
                         {directDonations?.filter(d => {
                           try {
                             const status = String(d.status || '');
                             return status === 'pending' || status === 'accepted' || status === 'picked';
                           } catch (error) {
                             console.warn('Error processing pending donation filter in UI:', error, d);
                             return false;
                           }
                         }).map((donation) => (
                           <div key={`donation-pending-${donation.id}`} className="bg-gray-800/50 rounded-lg p-4 border-l-4 border-yellow-500">
                             <div className="flex items-center justify-between">
                               <div>
                                 <p className="text-white font-medium">Donation {String(donation.status || 'Unknown')}</p>
                                 <p className="text-gray-400 text-sm">{String(donation.initiative || 'Unknown').replace('-', ' ')} - {String(donation.location || 'Unknown')}</p>
                                 <p className="text-white text-xs">Donor: {String(donation.donorName || donation.donorContact || donation.userName || 'Anonymous')}</p>
                               </div>
                               <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(String(donation.status || 'pending'))}`}>
                                 {String(donation.status || 'pending')}
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {(activeSection === 'reviews' || activeSection === 'users' || activeSection === 'settings') && (
             <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-[#eaa640]/30 overflow-hidden">
               <div className="px-6 py-4 border-b border-[#eaa640]/20">
                 <h2 className="text-xl font-semibold text-white capitalize">{activeSection}</h2>
                 <p className="text-gray-400 text-sm">Section coming soon with Firebase integration</p>
               </div>
               <div className="p-6">
                 <div className="text-center py-8">
                   <Settings className="h-12 w-12 text-[#eaa640] mx-auto mb-4" />
                   <p className="text-gray-400">This section will be available soon</p>
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-4 text-center border border-[#eaa640]">
            <div className="bg-[#eaa640] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Check className="h-8 w-8 text-black" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">🎉 Approved Successfully!</h3>
            <p className="text-gray-300 mb-4">
              <span className="text-[#eaa640] font-medium">{showSuccessModal}</span> {showSuccessModal.includes('volunteers') ? 'are' : 'is'} now part of the Hungry Saver team.
            </p>
            <div className="bg-[#eaa640]/20 border border-[#eaa640] rounded-lg p-3">
              <p className="text-[#eaa640] text-sm">
                They can now access their dashboard and start helping the community!
              </p>
            </div>
          </div>
        </div>
      )}

             {/* Sidebar Overlay */}
       {sidebarOpen && (
         <div 
           className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden" 
           onClick={() => setSidebarOpen(false)}
         ></div>
       )}
     </div>
       );
     } catch (error) {
       console.error('❌ Error rendering AdminDashboard:', error);
       return (
         <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
           <div className="text-center">
             <X className="h-16 w-16 text-red-500 mx-auto mb-4" />
             <h1 className="text-2xl font-bold text-white mb-2">Render Error</h1>
             <p className="text-gray-400">Something went wrong while rendering the dashboard.</p>
             <button 
               onClick={() => window.location.reload()} 
               className="mt-4 bg-[#eaa640] hover:bg-[#eeb766] text-black px-4 py-2 rounded-lg font-medium transition-all duration-200"
             >
               Reload Page
             </button>
           </div>
         </div>
       );
     }
   };

      return safeRender();
 };

export default AdminDashboard;
