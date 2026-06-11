import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../store';
import { servicesAPI, adminAPI, adminServicesAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ChartBarIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  SparklesIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentTextIcon,
  HomeIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  TruckIcon,
  PaintBrushIcon,
  LightBulbIcon,
  FireIcon,
  HeartIcon,
  CameraIcon,
  ComputerDesktopIcon,
  GiftIcon,
  TrophyIcon,
  FlagIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  XMarkIcon,
  BellIcon,
  CogIcon,
  CreditCardIcon,
  BanknotesIcon,
  ChartPieIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  StarIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import {
  StarIcon as StarSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  ShieldCheckIcon as ShieldSolidIcon
} from '@heroicons/react/24/solid';

interface DashboardStats {
  totalUsers: number;
  totalProviders: number;
  totalCustomers: number;
  totalServices: number;
  totalBookings: number;
  totalRevenue: number;
  pendingKYC: number;
  activeBookings: number;
  completedBookings: number;
}

interface AdminData {
  users: {
    total: number;
    customers: number;
    providers: number;
    verifiedProviders: number;
    pendingKYC: number;
  };
  services: {
    total: number;
    active: number;
    pending: number;
  };
  bookings: {
    total: number;
    completed: number;
    cancelled: number;
    completionRate: string;
  };
  revenue: {
    total: number;
    currency: string;
  };
}

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProviders: 0,
    totalCustomers: 0,
    totalServices: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingKYC: 0,
    activeBookings: 0,
    completedBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User Management State
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    isActive: true
  });

  // KYC Management State
  const [pendingKYC, setPendingKYC] = useState<any[]>([]);
  const [allKYC, setAllKYC] = useState<any[]>([]);
  const [kycTab, setKycTab] = useState('pending');
  const [kycLoading, setKycLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  // Service Management State
  const [services, setServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);
  const [providerRequests, setProviderRequests] = useState<any[]>([]);
  const [showAddServiceForm, setShowAddServiceForm] = useState(false);
  const [showEditServiceForm, setShowEditServiceForm] = useState(false);
  const [showViewServiceModal, setShowViewServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [serviceFormData, setServiceFormData] = useState({
    title: '',
    description: '',
    category: '',
    estimatedDuration: '',
    basePrice: '',
    serviceArea: '',
    requirements: '',
    tools: '',
  });

  // Coupon Management State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponsError, setCouponsError] = useState<string | null>(null);
  const [couponFormData, setCouponFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '0',
    maxDiscountAmount: '',
    startDate: '',
    endDate: ''
  });

  // Booking Management State
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingFilter, setBookingFilter] = useState('all');

  // Feedback Management State
  const [feedback, setFeedback] = useState<any[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'kyc') {
      if (kycTab === 'pending') {
        fetchPendingKYC();
      } else {
        fetchAllKYC(kycTab);
      }
    }
  }, [activeTab, kycTab]);

  useEffect(() => {
    if (activeTab === 'services') {
      fetchServicesWithProviders();
      fetchProviderRequests();
    }
    if (activeTab === 'coupons') {
      fetchCoupons();
    }
    if (activeTab === 'bookings') {
      fetchBookings();
    }
    if (activeTab === 'feedback') {
      fetchFeedback();
    }
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getAnalytics();
      
      // Update stats with real data
      setStats({
        totalUsers: response.users.total,
        totalProviders: response.users.providers,
        totalCustomers: response.users.customers,
        totalServices: response.services.total,
        totalBookings: response.bookings.total,
        totalRevenue: response.revenue.total,
        pendingKYC: response.users.pendingKYC,
        activeBookings: response.bookings.total - response.bookings.completed - response.bookings.cancelled,
        completedBookings: response.bookings.completed,
      });
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.response?.data?.message || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const response = await adminAPI.getUsers({ limit: 1000 });
      setUsers(response.users);
    } catch (err: any) {
      setUsersError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      await adminAPI.updateUser(userId, userData);
      fetchUsers();
    } catch (err: any) {
      setUsersError(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowViewUserModal(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive
    });
    setShowEditUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setUsersLoading(true);
      await adminAPI.updateUser(selectedUser._id, userFormData);
      toast.success('User updated successfully');
      setShowEditUserModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Error updating user:', err);
      toast.error(err.response?.data?.message || 'Failed to update user');
      setUsersError(err.response?.data?.message || 'Failed to update user');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchPendingKYC = async () => {
    try {
      setKycLoading(true);
      setKycError(null);
      const response = await adminAPI.getPendingKYC();
      setPendingKYC(response.users);
    } catch (err: any) {
      setKycError(err.response?.data?.message || 'Failed to fetch pending KYC');
    } finally {
      setKycLoading(false);
    }
  };

  const fetchAllKYC = async (status?: string) => {
    try {
      setKycLoading(true);
      setKycError(null);
      const response = await adminAPI.getAllKYC(status);
      setAllKYC(response.users);
    } catch (err: any) {
      setKycError(err.response?.data?.message || 'Failed to fetch KYC applications');
    } finally {
      setKycLoading(false);
    }
  };

  const handleApproveKYC = async (userId: string) => {
    try {
      await adminAPI.approveKYC(userId);
      if (kycTab === 'pending') {
        fetchPendingKYC();
      } else {
        fetchAllKYC(kycTab);
      }
      fetchAdminData(); // Refresh main stats
    } catch (err: any) {
      setKycError(err.response?.data?.message || 'Failed to approve KYC');
    }
  };

  const handleRequestReupload = async (userId: string, email: string) => {
    try {
      // For now, just show a toast notification
      // In the future, this could send an email or push notification to the provider
      toast.success(`Re-upload request sent to ${email}. The provider has been notified to upload new documents.`);
    } catch (err: any) {
      toast.error('Failed to send re-upload request');
    }
  };

  const handleRejectKYC = async (userId: string) => {
    const reason = window.prompt('Please enter rejection reason:');
    if (!reason) return;
    
    try {
      await adminAPI.rejectKYC(userId, reason);
      if (kycTab === 'pending') {
        fetchPendingKYC();
      } else {
        fetchAllKYC(kycTab);
      }
      fetchAdminData(); // Refresh main stats
    } catch (err: any) {
      setKycError(err.response?.data?.message || 'Failed to reject KYC');
    }
  };

  const fetchServices = async () => {
    try {
      setServicesLoading(true);
      setServicesError(null);
      const response = await adminAPI.getServices();
      setServices(response.services);
    } catch (err: any) {
      setServicesError(err.response?.data?.message || 'Failed to fetch services');
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchServicesWithProviders = async () => {
    try {
      setServicesLoading(true);
      setServicesError(null);
      const response = await adminAPI.getServices({ limit: 1000 });
      // Ensure provider data is populated
      const servicesWithProviders = await Promise.all(
        response.services.map(async (service: any) => {
          if (service.providerRequests && service.providerRequests.length > 0) {
            // Populate provider data for each request
            const populatedRequests = await Promise.all(
              service.providerRequests.map(async (req: any) => {
                if (req.provider && typeof req.provider === 'object') {
                  return req;
                }
                // If provider is just an ID, we need to fetch it
                try {
                  const userResponse = await adminAPI.getUser(req.provider);
                  return {
                    ...req,
                    provider: userResponse.user
                  };
                } catch (error) {
                  console.error('Failed to fetch provider data:', error);
                  return req;
                }
              })
            );
            return {
              ...service,
              providerRequests: populatedRequests
            };
          }
          return service;
        })
      );
      setServices(servicesWithProviders);
    } catch (err: any) {
      setServicesError(err.response?.data?.message || 'Failed to fetch services');
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchProviderRequests = async () => {
    try {
      setServicesLoading(true);
      setServicesError(null);
      console.log('🔍 Fetching provider requests...');
      const response = await adminServicesAPI.getServiceRequests();
      console.log('📊 Provider requests response:', response);
      setProviderRequests(response.services || []);
      console.log(`✅ Set ${response.services?.length || 0} provider requests`);
    } catch (err: any) {
      console.error('❌ Error fetching provider requests:', err);
      setServicesError(err.response?.data?.message || 'Failed to fetch provider requests');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleApproveService = async (serviceId: string) => {
    try {
      await adminAPI.approveService(serviceId);
      fetchServicesWithProviders();
      fetchAdminData(); // Refresh main stats
    } catch (err: any) {
      setServicesError(err.response?.data?.message || 'Failed to approve service');
    }
  };

  const handleRejectService = async (serviceId: string) => {
    try {
      await adminAPI.updateService(serviceId, { isApproved: false });
      fetchServicesWithProviders();
      fetchAdminData(); // Refresh main stats
    } catch (err: any) {
      setServicesError(err.response?.data?.message || 'Failed to reject service');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setServicesLoading(true);
      await adminAPI.createService({
        ...serviceFormData,
        estimatedDuration: parseInt(serviceFormData.estimatedDuration),
        basePrice: parseFloat(serviceFormData.basePrice),
        isActive: true,
        isApproved: true, // Admin-created services are auto-approved
        createdBy: 'admin'
      });
      setShowAddServiceForm(false);
      setServiceFormData({
        title: '',
        description: '',
        category: '',
        estimatedDuration: '',
        basePrice: '',
        serviceArea: '',
        requirements: '',
        tools: '',
      });
      fetchServicesWithProviders();
    } catch (err: any) {
      setServicesError(err.response?.data?.message || 'Failed to create service');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleApproveProviderService = async (serviceId: string, providerId: string) => {
    try {
      console.log(`✅ Approving provider request: ${providerId} for service: ${serviceId}`);
      await adminServicesAPI.approveServiceRequest(serviceId, { providerId });
      console.log('✅ Provider request approved successfully');
      fetchProviderRequests();
      fetchServicesWithProviders();
    } catch (err: any) {
      console.error('❌ Error approving provider service request:', err);
      setServicesError(err.response?.data?.message || 'Failed to approve provider service request');
    }
  };

  const handleRejectProviderService = async (serviceId: string, providerId: string, reason?: string) => {
    try {
      console.log(`❌ Rejecting provider request: ${providerId} for service: ${serviceId}, reason: ${reason}`);
      await adminServicesAPI.rejectServiceRequest(serviceId, { providerId, rejectionReason: reason || 'Rejected by admin' });
      console.log('✅ Provider request rejected successfully');
      fetchProviderRequests();
      fetchServicesWithProviders();
    } catch (err: any) {
      console.error('❌ Error rejecting provider service request:', err);
      setServicesError(err.response?.data?.message || 'Failed to reject provider service request');
    }
  };

  const handleViewService = (service: any) => {
    setSelectedService(service);
    setShowViewServiceModal(true);
  };

  const handleEditService = (service: any) => {
    setSelectedService(service);
    setServiceFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      estimatedDuration: service.duration?.value?.toString() || '',
      basePrice: service.price?.toString() || '',
      serviceArea: service.serviceArea || '',
      requirements: service.subcategory || '',
      tools: service.skills?.join(', ') || '',
    });
    setShowEditServiceForm(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      setServicesLoading(true);
      await adminAPI.deleteService(serviceId);
      toast.success('Service deleted successfully');
      fetchServicesWithProviders();
      fetchAdminData();
    } catch (err: any) {
      console.error('Error deleting service:', err);
      toast.error(err.response?.data?.message || 'Failed to delete service');
      setServicesError(err.response?.data?.message || 'Failed to delete service');
    } finally {
      setServicesLoading(false);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    try {
      setServicesLoading(true);
      await adminAPI.updateService(selectedService._id, {
        ...serviceFormData,
        estimatedDuration: parseInt(serviceFormData.estimatedDuration),
        basePrice: parseFloat(serviceFormData.basePrice),
        updateAllInstances: 'true', // Sync all provider instances with template
      });
      toast.success('Service updated successfully');
      setShowEditServiceForm(false);
      setSelectedService(null);
      setServiceFormData({
        title: '',
        description: '',
        category: '',
        estimatedDuration: '',
        basePrice: '',
        serviceArea: '',
        requirements: '',
        tools: '',
      });
      fetchServicesWithProviders();
      fetchAdminData();
    } catch (err: any) {
      console.error('Error updating service:', err);
      toast.error(err.response?.data?.message || 'Failed to update service');
      setServicesError(err.response?.data?.message || 'Failed to update service');
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      setCouponsLoading(true);
      setCouponsError(null);
      const response = await adminAPI.getCoupons();
      setCoupons(response.coupons);
    } catch (err: any) {
      setCouponsError(err.response?.data?.message || 'Failed to fetch coupons');
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCouponsLoading(true);
      await adminAPI.createCoupon(couponFormData);
      setCouponFormData({
        code: '',
        description: '',
        discountType: 'percentage',
        discountValue: '',
        minOrderAmount: '0',
        maxDiscountAmount: '',
        startDate: '',
        endDate: ''
      });
      fetchCoupons();
    } catch (err: any) {
      setCouponsError(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setCouponsLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;

    try {
      setCouponsLoading(true);
      await adminAPI.deleteCoupon(id);
      fetchCoupons();
    } catch (err: any) {
      setCouponsError(err.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setCouponsLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setBookingsLoading(true);
      setBookingsError(null);
      const params: any = {};

      if (bookingFilter === 'cancelled_no_provider' || bookingFilter === 'cancelled_with_provider') {
        params.status = 'cancelled';
      } else if (bookingFilter !== 'all') {
        params.status = bookingFilter;
      }

      const response = await adminAPI.getBookings(params);
      let filteredBookings = response.bookings;

      if (bookingFilter === 'cancelled_no_provider') {
        filteredBookings = response.bookings.filter((b: any) => !b.provider || b.provider === null || b.provider === undefined);
      } else if (bookingFilter === 'cancelled_with_provider') {
        filteredBookings = response.bookings.filter((b: any) => b.provider && b.provider !== null && b.provider !== undefined);
      }

      setBookings(filteredBookings);
    } catch (err: any) {
      setBookingsError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: string) => {
    try {
      setBookingsLoading(true);
      await adminAPI.updateBooking(bookingId, { status });
      toast.success('Booking status updated successfully');
      fetchBookings();
      fetchAdminData();
    } catch (err: any) {
      console.error('Error updating booking status:', err);
      toast.error(err.response?.data?.message || 'Failed to update booking status');
      setBookingsError(err.response?.data?.message || 'Failed to update booking status');
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      setFeedbackLoading(true);
      setFeedbackError(null);
      const response = await adminAPI.getFeedback();
      setFeedback(response.messages || []);
    } catch (err: any) {
      setFeedbackError(err.response?.data?.message || 'Failed to fetch feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      setFeedbackLoading(true);
      await adminAPI.deleteFeedback(id);
      toast.success('Feedback deleted successfully');
      fetchFeedback();
    } catch (err: any) {
      console.error('Error deleting feedback:', err);
      toast.error(err.response?.data?.message || 'Failed to delete feedback');
      setFeedbackError(err.response?.data?.message || 'Failed to delete feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UserGroupIcon },
    { id: 'services', label: 'Services', icon: WrenchScrewdriverIcon },
    { id: 'bookings', label: 'Bookings', icon: CalendarIcon },
    { id: 'kyc', label: 'KYC Management', icon: ShieldCheckIcon },
    { id: 'feedback', label: 'Feedback', icon: EnvelopeIcon },
    { id: 'payments', label: 'Payments', icon: CreditCardIcon },
    { id: 'coupons', label: 'Coupons', icon: GiftIcon },
    { id: 'analytics', label: 'Analytics', icon: ChartPieIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchAdminData}
                  className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-purple-100 text-lg">Manage your service marketplace efficiently</p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                <ShieldSolidIcon className="w-5 h-5 text-purple-200" />
                <span className="text-sm font-medium">System Administrator</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm px-3 py-2 rounded-lg">
                <CheckCircleSolidIcon className="w-5 h-5 text-green-300" />
                <span className="text-sm font-medium">All Systems Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-1 text-blue-500" />
                  Total Users
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-2">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600 mt-2 flex items-center font-medium">
                  <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                  Active platform users
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl group-hover:scale-110 transition-transform">
                <UserGroupIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <WrenchScrewdriverIcon className="w-4 h-4 mr-1 text-green-500" />
                  Total Services
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                  {stats.totalServices}
                </p>
                <p className="text-xs text-green-600 mt-2 flex items-center font-medium">
                  <SparklesIcon className="w-3 h-3 mr-1" />
                  Available services
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl group-hover:scale-110 transition-transform">
                <WrenchScrewdriverIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1 text-purple-500" />
                  Total Bookings
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
                  {stats.totalBookings}
                </p>
                <p className="text-xs text-purple-600 mt-2 flex items-center font-medium">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  Service requests
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl group-hover:scale-110 transition-transform">
                <CalendarIcon className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <CurrencyDollarIcon className="w-4 h-4 mr-1 text-yellow-500" />
                  Total Revenue
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mt-2">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-xs text-yellow-600 mt-2 flex items-center font-medium">
                  <BanknotesIcon className="w-3 h-3 mr-1" />
                  Platform earnings
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl group-hover:scale-110 transition-transform">
                <CurrencyDollarIcon className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <UserIcon className="w-4 h-4 mr-1 text-indigo-500" />
                  Providers
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  {stats.totalProviders}
                </p>
                <p className="text-xs text-indigo-600 mt-2 flex items-center font-medium">
                  <CheckBadgeIcon className="w-3 h-3 mr-1" />
                  Service providers
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl group-hover:scale-110 transition-transform">
                <UserIcon className="w-8 h-8 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <ShieldCheckIcon className="w-4 h-4 mr-1 text-red-500" />
                  Pending KYC
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mt-2">
                  {stats.pendingKYC}
                </p>
                <p className="text-xs text-red-600 mt-2 flex items-center font-medium">
                  <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                  Need verification
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl group-hover:scale-110 transition-transform">
                <ShieldCheckIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <ArrowPathIcon className="w-4 h-4 mr-1 text-teal-500" />
                  Active Bookings
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mt-2">
                  {stats.activeBookings}
                </p>
                <p className="text-xs text-teal-600 mt-2 flex items-center font-medium">
                  <ClockIcon className="w-3 h-3 mr-1" />
                  In progress
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl group-hover:scale-110 transition-transform">
                <ArrowPathIcon className="w-8 h-8 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-1 text-orange-500" />
                  Completion Rate
                </p>
                <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mt-2">
                  {stats.totalBookings > 0 ? Math.round((stats.completedBookings / stats.totalBookings) * 100) : 0}%
                </p>
                <p className="text-xs text-orange-600 mt-2 flex items-center font-medium">
                  <ArrowTrendingUpIcon className="w-3 h-3 mr-1" />
                  Service success
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl group-hover:scale-110 transition-transform">
                <CheckCircleIcon className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">User Management</h3>
            <p className="text-gray-600 mt-2">Manage platform users and their accounts</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={fetchUsers}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center text-sm font-medium"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
            <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center text-sm font-medium">
              <PlusIcon className="w-4 h-4 mr-1" />
              Add User
            </button>
          </div>
        </div>
        
        {usersError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1">{usersError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
              <UserGroupIcon className="w-5 h-5 mr-2 text-blue-600" />
              User Statistics
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Total Users</span>
                <span className="text-lg font-bold text-blue-600">{users.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Active Users</span>
                <span className="text-lg font-bold text-green-600">{users.filter(u => u.isActive).length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-600">Providers</span>
                <span className="text-lg font-bold text-purple-600">{users.filter(u => u.role === 'provider').length}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2 text-gray-600" />
              Recent Users
            </h4>
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No users found</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div key={`user_${user._id}`} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h5 className="font-semibold text-gray-900">{user.name}</h5>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                              {user.role}
                            </span>
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p className="flex items-center">
                              <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-500" />
                              {user.email}
                            </p>
                            <p className="flex items-center">
                              <PhoneIcon className="w-4 h-4 mr-2 text-gray-500" />
                              {user.phone || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button 
                            onClick={() => handleViewUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateUser(user._id, { isActive: !user.isActive })}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive 
                                ? 'text-red-600 hover:bg-red-50' 
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {user.isActive ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* View User Modal */}
        {showViewUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                      <UserIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                      <p className="text-gray-600 mt-1">View user information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowViewUserModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedUser.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedUser.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">User ID</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg text-sm">{selectedUser._id}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowViewUserModal(false)}
                    className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                      <PencilIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                      <p className="text-gray-600 mt-1">Update user information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditUserModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSaveUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                      <input
                        type="text"
                        value={userFormData.phone}
                        onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                      <select
                        value={userFormData.role}
                        onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="customer">Customer</option>
                        <option value="provider">Provider</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={userFormData.isActive}
                          onChange={(e) => setUserFormData({ ...userFormData, isActive: e.target.checked })}
                          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-gray-700">Active Status</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditUserModal(false)}
                      className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-all"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Service Management</h3>
            <p className="text-gray-600 mt-2">Manage services and provider approval requests</p>
          </div>
          <button 
            onClick={() => setShowAddServiceForm(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Service Type</span>
          </button>
        </div>

        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-start space-x-3">
            <DocumentMagnifyingGlassIcon className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Service Workflow</h4>
              <p className="text-sm text-blue-700">
                <strong>1.</strong> Admin creates service types → <strong>2.</strong> Providers request to provide them → <strong>3.</strong> Admin approves provider requests
              </p>
            </div>
          </div>
        </div>
        
        {servicesError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1">{servicesError}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-4 flex items-center">
              <CheckCircleIcon className="w-5 h-5 mr-2 text-green-600" />
              Service Statistics
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-2xl font-bold text-green-600">{services.filter(s => s.isActive).length}</p>
                <p className="text-sm text-gray-600">Active Services</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{providerRequests.filter(r => !r.isApproved).length}</p>
                <p className="text-sm text-gray-600">Pending Requests</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-4 flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-yellow-600" />
              Pending Provider Requests
            </h4>
            {servicesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {providerRequests.filter(r => !r.providerRequest?.isApproved).length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-600">No pending requests</p>
                  </div>
                ) : (
                  providerRequests
                    .filter((request: any) => !request.providerRequest?.isApproved)
                    .map((request: any) => (
                      <div key={`provider_request_${request._id}_${request.providerRequest?.provider?._id || 'unknown'}`} className="bg-white rounded-lg p-4 border border-yellow-200 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-semibold text-gray-900">{request.title}</h5>
                            <div className="mt-2 space-y-1">
                              <p className="text-sm text-gray-600 flex items-center">
                                <UserIcon className="w-4 h-4 mr-1 text-gray-500" />
                                {request.providerRequest?.provider?.name || 'Unknown Provider'}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center">
                                <EnvelopeIcon className="w-4 h-4 mr-1 text-gray-500" />
                                {request.providerRequest?.provider?.email || 'unknown@example.com'}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center">
                                <ClockIcon className="w-3 h-3 mr-1" />
                                {new Date(request.providerRequest?.requestedAt || request.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button 
                              onClick={() => handleApproveProviderService(request.serviceId || request._id, request.providerRequest?.provider?._id)}
                              className="bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center text-sm font-medium"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectProviderService(request.serviceId || request._id, request.providerRequest?.provider?._id)}
                              className="bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center text-sm font-medium"
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        {showAddServiceForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                      <WrenchScrewdriverIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Create New Service Type</h2>
                      <p className="text-gray-600 mt-1">Add a new service that providers can request to offer</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddServiceForm(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                
                <form onSubmit={handleCreateService} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <TagIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Service Title
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceFormData.title}
                        onChange={(e) => setServiceFormData({...serviceFormData, title: e.target.value})}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="e.g., Home Cleaning Service"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <BuildingOfficeIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Category
                      </label>
                      <select
                        required
                        value={serviceFormData.category}
                        onChange={(e) => setServiceFormData({...serviceFormData, category: e.target.value})}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Select a category</option>
                        <option value="home_cleaning">Home Cleaning</option>
                        <option value="beauty_wellness">Beauty & Wellness</option>
                        <option value="appliance_repair">Appliance Repair</option>
                        <option value="plumbing">Plumbing</option>
                        <option value="electrical">Electrical</option>
                        <option value="carpentry">Carpentry</option>
                        <option value="painting">Painting</option>
                        <option value="pest_control">Pest Control</option>
                        <option value="packers_movers">Packers & Movers</option>
                        <option value="home_tutoring">Home Tutoring</option>
                        <option value="fitness_training">Fitness Training</option>
                        <option value="event_management">Event Management</option>
                        <option value="photography">Photography</option>
                        <option value="web_development">Web Development</option>
                        <option value="digital_marketing">Digital Marketing</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                      Description
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={serviceFormData.description}
                      onChange={(e) => setServiceFormData({...serviceFormData, description: e.target.value})}
                      className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Describe the service in detail..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <ClockIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Duration (hours)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={serviceFormData.estimatedDuration}
                        onChange={(e) => setServiceFormData({...serviceFormData, estimatedDuration: e.target.value})}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Base Price (₹)
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={serviceFormData.basePrice}
                        onChange={(e) => setServiceFormData({...serviceFormData, basePrice: e.target.value})}
                        className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Service Area
                      </label>
                      <input
                        type="text"
                        required
                        value={serviceFormData.serviceArea}
                        onChange={(e) => setServiceFormData({...serviceFormData, serviceArea: e.target.value})}
                        placeholder="e.g., Delhi NCR"
                        className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Requirements
                      </label>
                      <textarea
                        rows={3}
                        value={serviceFormData.requirements}
                        onChange={(e) => setServiceFormData({...serviceFormData, requirements: e.target.value})}
                        placeholder="e.g., Tools, materials, space requirements"
                        className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                        <WrenchScrewdriverIcon className="w-4 h-4 mr-2 text-blue-600" />
                        Tools & Equipment
                      </label>
                      <textarea
                        rows={3}
                        value={serviceFormData.tools}
                        onChange={(e) => setServiceFormData({...serviceFormData, tools: e.target.value})}
                        placeholder="e.g., Cleaning supplies, ladder, basic tools"
                        className="mt-1 block w-full border-2 border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddServiceForm(false)}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={servicesLoading}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {servicesLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          <span>Create Service</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Services List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-gray-900">All Services</h4>
            <button 
              onClick={() => {
                fetchServicesWithProviders();
                fetchProviderRequests();
              }}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center text-sm font-medium"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
          
          {servicesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {services.length === 0 ? (
                <div className="text-center py-12">
                  <WrenchScrewdriverIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                  <p className="text-gray-600 mb-6">Start by adding your first service type</p>
                  <button 
                    onClick={() => setShowAddServiceForm(true)}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add First Service
                  </button>
                </div>
              ) : (
                services.map((service: any) => (
                  <div key={`service_${service._id}`} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h5 className="text-lg font-semibold text-gray-900">{service.title}</h5>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {service.category}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{service.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
                            <span>{service.duration?.value || 'N/A'} {service.duration?.unit || 'hours'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <CurrencyDollarIcon className="w-4 h-4 mr-2 text-green-500" />
                            <span className="font-semibold text-green-600">₹{service.price || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MapPinIcon className="w-4 h-4 mr-2 text-red-500" />
                            <span>{service.serviceArea || 'N/A'}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <UserGroupIcon className="w-4 h-4 mr-2 text-purple-500" />
                            <span>{service.providerRequests?.filter((req: any) => req.isApproved).length || 0} providers</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-6">
                        <button 
                          onClick={() => handleViewService(service)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleEditService(service)}
                          className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteService(service._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* View Service Modal */}
        {showViewServiceModal && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Service Details</h3>
                  <button
                    onClick={() => {
                      setShowViewServiceModal(false);
                      setSelectedService(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Title</label>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{selectedService.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-700 mt-1">{selectedService.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-gray-900 mt-1 capitalize">{selectedService.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
                      selectedService.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedService.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duration</label>
                    <p className="text-gray-900 mt-1">{selectedService.duration?.value || 'N/A'} {selectedService.duration?.unit || 'hours'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Price</label>
                    <p className="text-gray-900 mt-1 font-semibold text-green-600">₹{selectedService.price || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Service Area</label>
                    <p className="text-gray-900 mt-1">{selectedService.serviceArea || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Providers</label>
                    <p className="text-gray-900 mt-1">{selectedService.providerRequests?.filter((req: any) => req.isApproved).length || 0} approved</p>
                  </div>
                </div>
                {selectedService.skills && selectedService.skills.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Skills/Tools</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedService.skills.map((skill: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Service Modal */}
        {showEditServiceForm && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Edit Service</h3>
                  <button
                    onClick={() => {
                      setShowEditServiceForm(false);
                      setSelectedService(null);
                      setServiceFormData({
                        title: '',
                        description: '',
                        category: '',
                        estimatedDuration: '',
                        basePrice: '',
                        serviceArea: '',
                        requirements: '',
                        tools: '',
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleUpdateService} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={serviceFormData.title}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={serviceFormData.description}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={serviceFormData.category}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="electrical">Electrical</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="home_cleaning">Home Cleaning</option>
                      <option value="appliance_repair">Appliance Repair</option>
                      <option value="beauty_wellness">Beauty & Wellness</option>
                      <option value="carpentry">Carpentry</option>
                      <option value="painting">Painting</option>
                      <option value="pest_control">Pest Control</option>
                      <option value="packers_movers">Packers & Movers</option>
                      <option value="home_tutoring">Home Tutoring</option>
                      <option value="fitness_training">Fitness Training</option>
                      <option value="event_management">Event Management</option>
                      <option value="photography">Photography</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (hours)</label>
                    <input
                      type="number"
                      value={serviceFormData.estimatedDuration}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, estimatedDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
                    <input
                      type="number"
                      value={serviceFormData.basePrice}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, basePrice: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Area</label>
                    <input
                      type="text"
                      value={serviceFormData.serviceArea}
                      onChange={(e) => setServiceFormData({ ...serviceFormData, serviceArea: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Requirements/Subcategory</label>
                  <input
                    type="text"
                    value={serviceFormData.requirements}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, requirements: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills/Tools (comma-separated)</label>
                  <input
                    type="text"
                    value={serviceFormData.tools}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, tools: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditServiceForm(false);
                      setSelectedService(null);
                      setServiceFormData({
                        title: '',
                        description: '',
                        category: '',
                        estimatedDuration: '',
                        basePrice: '',
                        serviceArea: '',
                        requirements: '',
                        tools: '',
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={servicesLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {servicesLoading ? 'Updating...' : 'Update Service'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Booking Management</h3>
            <p className="text-gray-600 mt-2">Manage all platform bookings</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={bookingFilter}
              onChange={(e) => {
                setBookingFilter(e.target.value);
                fetchBookings();
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled_no_provider">Cancelled (No Provider)</option>
              <option value="cancelled_with_provider">Cancelled (With Provider)</option>
              <option value="broadcast">Broadcast</option>
            </select>
            <button
              onClick={fetchBookings}
              className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center text-sm font-medium"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>

        {bookingsError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-700 mt-1">{bookingsError}</p>
              </div>
            </div>
          </div>
        )}

        {bookingsLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">Bookings will appear here once customers make requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking: any) => (
              <div key={booking._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="text-lg font-semibold text-gray-900">{booking.service?.title || 'Unknown Service'}</h5>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        booking.status === 'broadcast' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                        booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.paymentStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                      <div>
                        <label className="text-gray-500">Customer</label>
                        <p className="font-medium text-gray-900">{booking.customer?.name || 'N/A'}</p>
                        <p className="text-gray-600">{booking.customer?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Provider</label>
                        <p className="font-medium text-gray-900">{booking.provider?.name || 'Unassigned'}</p>
                        <p className="text-gray-600">{booking.provider?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-gray-500">Scheduled Date</label>
                        <p className="font-medium text-gray-900">
                          {booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-gray-500">Price</label>
                        <p className="font-semibold text-green-600">₹{booking.price?.totalPrice || 'N/A'}</p>
                      </div>
                    </div>
                    {booking.address && (
                      <div className="mt-3 text-sm">
                        <label className="text-gray-500">Address</label>
                        <p className="text-gray-900">
                          {booking.address.street && `${booking.address.street}, `}
                          {booking.address.city && `${booking.address.city}, `}
                          {booking.address.state && `${booking.address.state} - `}
                          {booking.address.pincode}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="ml-6">
                    <select
                      value={booking.status}
                      onChange={(e) => handleUpdateBookingStatus(booking._id, e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={bookingsLoading}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="broadcast">Broadcast</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderKYCDocuments = (documents: any[]) => {
    if (!documents || documents.length === 0) {
      return <p className="text-sm text-gray-500">No documents uploaded</p>;
    }

    return (
      <div className="space-y-3">
        {documents.map((doc, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {doc.documentType.replace('_', ' ')}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(doc.uploadDate).toLocaleDateString()}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              Document Number: {doc.documentNumber}
            </p>
            {doc.documentUrl && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    // Check if it's a Cloudinary URL (starts with http/https)
                    if (doc.documentUrl.startsWith('http://') || doc.documentUrl.startsWith('https://')) {
                      window.open(doc.documentUrl, '_blank');
                    } else {
                      // Old local storage URL
                      const filename = doc.documentUrl.split('/').pop();
                      const url = adminAPI.getKYCDocumentUrl(filename);
                      window.open(url, '_blank');
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>View Document</span>
                </button>
                <span className="text-xs text-gray-500">
                  ({doc.documentUrl.split('.').pop()?.toUpperCase()})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderKYC = () => {
    const currentData = kycTab === 'pending' ? pendingKYC : allKYC;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">KYC Management</h3>
              <p className="text-gray-600 mt-2">Verify provider identity documents and credentials</p>
            </div>
            <button 
              onClick={() => kycTab === 'pending' ? fetchPendingKYC() : fetchAllKYC(kycTab)}
              className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-colors flex items-center text-sm font-medium"
            >
              <ArrowPathIcon className="w-4 h-4 mr-1" />
              Refresh
            </button>
          </div>
          
          {kycError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800">Error</h4>
                  <p className="text-sm text-red-700 mt-1">{kycError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-yellow-900">Pending KYC</h4>
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingKYC}</p>
              <p className="text-sm text-yellow-700 mt-2">Awaiting verification</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-green-900">Approved KYC</h4>
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalProviders - stats.pendingKYC}
              </p>
              <p className="text-sm text-green-700 mt-2">Verified providers</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-red-900">Rejected KYC</h4>
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-red-600">0</p>
              <p className="text-sm text-red-700 mt-2">Rejected applications</p>
            </div>
          </div>

          {/* KYC Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { id: 'pending', label: 'Pending KYC', icon: ExclamationTriangleIcon },
              { id: 'approved', label: 'Approved KYC', icon: CheckCircleIcon },
              { id: 'rejected', label: 'Rejected KYC', icon: XCircleIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setKycTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  kycTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <ClipboardDocumentListIcon className="w-5 h-5 mr-2 text-gray-600" />
              {kycTab === 'pending' ? 'Pending KYC Applications' : `${kycTab.charAt(0).toUpperCase() + kycTab.slice(1)} KYC Applications`}
            </h4>
            {kycLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentData.length === 0 ? (
                  <div className="text-center py-12">
                    <ShieldCheckIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No {kycTab} applications</h3>
                    <p className="text-gray-600">
                      {kycTab === 'pending' ? 'All KYC applications have been processed' : `No ${kycTab} KYC applications found`}
                    </p>
                  </div>
                ) : (
                  currentData.map((user) => (
                    <div key={`kyc_${user._id}`} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {user.kycVerificationPhoto ? (
                              <img
                                src={user.kycVerificationPhoto.startsWith('http') ? user.kycVerificationPhoto : `https://insta-serve-1-0.onrender.com${user.kycVerificationPhoto}`}
                                alt={user.name}
                                className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                                onError={(e) => {
                                  console.log('Failed to load verification photo URL:', e.currentTarget.src);
                                }}
                              />
                            ) : (
                              <div className={`p-2 rounded-lg ${
                                user.kycStatus === 'approved' ? 'bg-green-100' :
                                user.kycStatus === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                              }`}>
                                <ShieldCheckIcon className={`w-6 h-6 ${
                                  user.kycStatus === 'approved' ? 'text-green-600' :
                                  user.kycStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                                }`} />
                              </div>
                            )}
                            <div>
                              <h5 className="font-semibold text-gray-900">{user.name}</h5>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-600 capitalize">{user.kycStatus} Application</p>
                                <button
                                  onClick={() => {
                                    // Send notification to provider to re-upload documents
                                    handleRequestReupload(user._id, user.email);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  (Request Re-upload)
                                </button>
                              </div>
                              {user.kycVerificationPhoto && (
                                <p className="text-xs text-green-600">✓ Verification Photo Uploaded</p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                            <div className="flex items-center text-gray-600">
                              <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-500" />
                              {user.email}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <PhoneIcon className="w-4 h-4 mr-2 text-gray-500" />
                              {user.phone || 'N/A'}
                            </div>
                            <div className="flex items-center text-gray-600">
                              <ClockIcon className="w-4 h-4 mr-2 text-gray-500" />
                              Applied: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* KYC Documents Section */}
                          <div className="mb-4">
                            <h6 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                              <DocumentTextIcon className="w-4 h-4 mr-2 text-blue-600" />
                              KYC Documents
                            </h6>
                            {renderKYCDocuments(user.kycDocuments)}
                          </div>
                          
                          {user.kycRejectionReason && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-sm text-red-800">
                                <strong>Rejection Reason:</strong> {user.kycRejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {user.kycStatus === 'pending' && (
                          <div className="flex items-center space-x-3 ml-6">
                            <button 
                              onClick={() => handleApproveKYC(user._id)}
                              className="bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors flex items-center text-sm font-medium"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Approve
                            </button>
                            <button 
                              onClick={() => handleRejectKYC(user._id)}
                              className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center text-sm font-medium"
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPayments = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Payment Management</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Payment Overview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Revenue:</span>
                <span className="font-medium">₹{stats.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Payments:</span>
                <span className="font-medium text-yellow-600">
                  {stats.totalBookings - stats.completedBookings}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Completed Payments:</span>
                <span className="font-medium text-green-600">
                  {stats.completedBookings}
                </span>
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                View All Transactions
              </button>
              <button className="w-full text-left px-3 py-2 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100">
                Process Refunds
              </button>
              <button className="w-full text-left px-3 py-2 bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
                Generate Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCoupons = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Coupon Management</h3>
        
        {couponsError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{couponsError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Create New Coupon</h4>
            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <input
                type="text"
                placeholder="Coupon Code"
                value={couponFormData.code}
                onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <textarea
                placeholder="Description"
                value={couponFormData.description}
                onChange={(e) => setCouponFormData({...couponFormData, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={couponFormData.discountType}
                  onChange={(e) => setCouponFormData({...couponFormData, discountType: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
                <input
                  type="number"
                  placeholder={couponFormData.discountType === 'percentage' ? 'Discount (%)' : 'Discount Amount'}
                  value={couponFormData.discountValue}
                  onChange={(e) => setCouponFormData({...couponFormData, discountValue: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  min="0"
                />
              </div>
              <input
                type="number"
                placeholder="Minimum Order Amount"
                value={couponFormData.minOrderAmount}
                onChange={(e) => setCouponFormData({...couponFormData, minOrderAmount: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={couponFormData.startDate}
                  onChange={(e) => setCouponFormData({...couponFormData, startDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <input
                  type="date"
                  value={couponFormData.endDate}
                  onChange={(e) => setCouponFormData({...couponFormData, endDate: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={couponsLoading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {couponsLoading ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Active Coupons</h4>
            {couponsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {coupons.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No coupons found</p>
                ) : (
                  coupons.map((coupon) => (
                    <div key={`coupon_${coupon._id}`} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{coupon.code}</span>
                        <p className="text-xs text-gray-600">{coupon.description}</p>
                        <p className="text-xs text-green-600">
                          {coupon.discountType === 'percentage' 
                            ? `${coupon.discountValue}% off` 
                            : `₹${coupon.discountValue} off`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button 
                          onClick={() => handleDeleteCoupon(coupon._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">User Feedback</h3>
            <p className="text-gray-600 mt-2">View and manage user feedback from contact form</p>
          </div>
          <button
            onClick={fetchFeedback}
            className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center text-sm font-medium"
          >
            <ArrowPathIcon className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {feedbackLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : feedbackError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading feedback</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{feedbackError}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={fetchFeedback}
                    className="bg-red-100 text-red-800 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <EnvelopeIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg">No feedback yet</p>
            <p className="text-gray-400 text-sm mt-2">Feedback from users will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item: any) => (
              <div key={item._id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.status === 'sent' ? 'bg-green-100 text-green-800' :
                        item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <EnvelopeIcon className="w-4 h-4 inline mr-1" />
                      {item.email}
                    </p>
                    {item.subject && (
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Subject: {item.subject}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(item.createdAt || item.timestamp).toLocaleString()}
                    </span>
                    <button
                      onClick={() => handleDeleteFeedback(item._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete feedback"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{item.message}</p>
                </div>
                {item.emailError && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs text-red-600">
                      <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                      Email Error: {item.emailError}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'users':
        return renderUsers();
      case 'services':
        return renderServices();
      case 'bookings':
        return renderBookings();
      case 'kyc':
        return renderKYC();
      case 'feedback':
        return renderFeedback();
      case 'payments':
        return renderPayments();
      case 'coupons':
        return renderCoupons();
      default:
        return (
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-gray-600">Coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Sidebar Navigation */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-xl min-h-screen border-r border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-xl shadow-lg">
                <ShieldSolidIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Management System</p>
              </div>
            </div>
            
            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      activeTab === item.id ? 'text-white' : 'text-gray-500'
                    }`} />
                    <span>{item.label}</span>
                    {activeTab === item.id && (
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
          
          {/* User Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
                <UserIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Administrator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-gray-600 mt-2">
                    {activeTab === 'overview' && 'Monitor your platform performance and key metrics'}
                    {activeTab === 'users' && 'Manage platform users and their accounts'}
                    {activeTab === 'services' && 'Manage services and provider approval requests'}
                    {activeTab === 'kyc' && 'Verify provider identity documents and credentials'}
                    {activeTab === 'payments' && 'Monitor transactions and financial data'}
                    {activeTab === 'coupons' && 'Create and manage discount coupons'}
                    {activeTab === 'analytics' && 'View detailed analytics and reports'}
                    {activeTab === 'settings' && 'Configure system settings and preferences'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
                    <BellIcon className="w-6 h-6" />
                    {stats.pendingKYC > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                        {stats.pendingKYC}
                      </span>
                    )}
                  </button>
                  <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <CogIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
