import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Provider } from 'react-redux';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster, toast } from 'react-hot-toast';
import { store, AppDispatch } from './store';
import { getCurrentUser } from './store/slices/authSlice';
import socketService, { ChatMessage } from './services/socketService';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResetPassword from './pages/ResetPassword';
import ProviderDashboard from './pages/ProviderDashboard';
import KYCVerification from './pages/KYCVerification';
import ProviderTracking from './pages/ProviderTracking';
import UserTracking from './pages/UserTracking';
import Wallet from './pages/Wallet';
import ProviderWallet from './pages/ProviderWallet';
import EarningsDashboard from './pages/provider/EarningsDashboard';
import TransactionHistory from './pages/provider/TransactionHistory';
import BankAccount from './pages/provider/BankAccount';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import DeleteAccount from './pages/DeleteAccount';
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import GoogleSignupComplete from './pages/GoogleSignupComplete';
import ProtectedRoute from './components/ProtectedRoute';

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: any) => state.auth);

  useEffect(() => {
    // Restore user session on app startup
    const token = localStorage.getItem('token');
    if (token) {
      // Set token in Redux state first
      dispatch({ type: 'auth/setToken', payload: token });
      // Then get current user
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  // Global socket listener for incoming messages
  useEffect(() => {
    if (!user) return;

    const setupSocketListener = async () => {
      try {
        // Connect to socket if not already connected
        if (!socketService.isConnected()) {
          await socketService.connect({
            userId: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          });
        }

        // Listen for incoming messages globally
        socketService.on('receive_message', (message: ChatMessage) => {
          console.log('💬 [GLOBAL] Message received:', message);
          
          // Show notification if message is from another user
          if (message.senderId !== user._id) {
            toast.success(`New message from ${message.senderName}`, {
              duration: 5000,
              icon: '💬'
            });
            
            // Play notification sound (optional)
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {});
            } catch (e) {
              // Ignore audio errors
            }
          }
        });

      } catch (error) {
        console.error('Failed to setup socket listener:', error);
      }
    };

    setupSocketListener();

    // Cleanup
    return () => {
      socketService.off('receive_message');
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="auth/callback" element={<GoogleAuthCallback />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="auth/google/complete" element={<GoogleSignupComplete />} />
          <Route path="services" element={<Services />} />
          <Route path="services/:id" element={<ServiceDetail />} />
          <Route path="dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="admin" element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="provider/earnings" element={
            <ProtectedRoute requiredRole="provider">
              <EarningsDashboard />
            </ProtectedRoute>
          } />
          <Route path="provider/transactions" element={
            <ProtectedRoute requiredRole="provider">
              <TransactionHistory />
            </ProtectedRoute>
          } />
          <Route path="provider/kyc" element={
            <ProtectedRoute requiredRole="provider">
              <KYCVerification />
            </ProtectedRoute>
          } />
          <Route path="provider/tracking/:id" element={
            <ProtectedRoute requiredRole="provider">
              <ProviderTracking />
            </ProtectedRoute>
          } />
          <Route path="provider" element={
            <ProtectedRoute requiredRole="provider">
              <ProviderDashboard />
            </ProtectedRoute>
          } />
          <Route path="provider/bank-account" element={
            <ProtectedRoute requiredRole="provider">
              <BankAccount />
            </ProtectedRoute>
          } />
          <Route path="provider/wallet" element={
            <ProtectedRoute requiredRole="provider">
              <ProviderWallet />
            </ProtectedRoute>
          } />
          <Route path="provider/withdrawal-history" element={
            <ProtectedRoute requiredRole="provider">
              <TransactionHistory />
            </ProtectedRoute>
          } />
          <Route path="tracking/:id" element={
            <ProtectedRoute requiredRole="customer">
              <UserTracking />
            </ProtectedRoute>
          } />
          <Route path="wallet" element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/delete-account" element={<DeleteAccount />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ScrollToTop />
        <AppContent />
      </Router>
    </Provider>
  );
}

export default App;
