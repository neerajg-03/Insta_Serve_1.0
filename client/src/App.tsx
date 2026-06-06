import React, { useEffect, useState } from 'react';
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
import OTPLogin from './pages/OTPLogin';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
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
import GoogleAuthCallback from './pages/GoogleAuthCallback';
import GoogleSignupComplete from './pages/GoogleSignupComplete';
import ResetPassword from './pages/ResetPassword';
import ProtectedRoute from './components/ProtectedRoute';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

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
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Skip splash screen for Google auth callback
    if (location.pathname === '/auth/callback' || location.pathname === '/auth/google/complete') {
      setShowSplash(false);
      return;
    }

    // Hide splash screen after 6 seconds
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 6000);

    return () => clearTimeout(splashTimer);
  }, [location.pathname]);

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

  // Handle deep link callback from OAuth
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setupAppUrlOpenListener = async () => {
        const listener = await CapacitorApp.addListener('appUrlOpen', (event: { url: string }) => {
          console.log('Deep link received:', event.url);
          
          // Check if the URL is our OAuth callback
          if (event.url.includes('com.instaserve.app://auth/callback')) {
            // Parse the URL to extract query parameters
            const url = new URL(event.url.replace('com.instaserve.app://', 'https://'));
            const params = new URLSearchParams(url.search);
            const token = params.get('token');
            const userParam = params.get('user');
            
            if (token && userParam) {
              // Navigate to the callback route in the app with the parameters
              window.location.href = `/auth/callback?token=${token}&user=${userParam}`;
            }
          }
        });

        return () => {
          listener.remove();
        };
      };

      setupAppUrlOpenListener();
    }
  }, [dispatch]);

  // Global socket listener for incoming messages
  useEffect(() => {
    if (!user) return;

    const setupSocketListener = async () => {
      try {
        // Initialize notification service
        await notificationService.initialize();

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

  // Show splash screen while loading
  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="login-otp" element={<OTPLogin />} />
          <Route path="register" element={<Register />} />
          <Route path="reset-password" element={<ResetPassword />} />
          <Route path="auth/callback" element={<GoogleAuthCallback />} />
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
          <Route path="/contact" element={<Contact />} />
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
s
