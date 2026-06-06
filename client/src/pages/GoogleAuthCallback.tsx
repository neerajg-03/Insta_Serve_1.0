import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

// Dynamically import Capacitor modules only when needed (for mobile)
let Browser: any = null;
let Capacitor: any = null;

try {
  const capacitorCore = require('@capacitor/core');
  const capacitorBrowser = require('@capacitor/browser');
  Capacitor = capacitorCore.Capacitor;
  Browser = capacitorBrowser.Browser;
} catch (e) {
  // Capacitor not available (web build)
  console.log('Capacitor not available - running in web mode');
}

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        // Close the in-app browser if running in Capacitor
        if (Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
          await Browser.close();
        }

        const error = searchParams.get('error');
        const message = searchParams.get('message');
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        
        // Handle various error cases
        if (error) {
          switch (error) {
            case 'google_auth_failed':
              if (message === 'redirect_uri_mismatch') {
                toast.error('Google OAuth configuration error. Please contact administrator.');
                console.error('Redirect URI mismatch - Check Google Cloud Console configuration');
              } else {
                toast.error('Google authentication failed. Please try again.');
              }
              break;
            case 'google_not_configured':
              toast.error('Google OAuth is not configured. Please contact administrator.');
              break;
            case 'server_error':
              toast.error('Server error during Google authentication. Please try again.');
              break;
            default:
              toast.error('Authentication failed. Please try again.');
          }
          navigate('/login');
          return;
        }
        
        if (!token || !userParam) {
          toast.error('Google authentication failed - missing data');
          navigate('/login');
          return;
        }

        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Check if this is a new user (isNewUser flag from backend)
        if (user.isNewUser) {
          // Redirect to completion page for new users
          const googleData = {
            googleId: user.googleId,
            email: user.email,
            name: user.name,
            profilePicture: user.profilePicture
          };
          const redirectUrl = `/auth/google/complete?googleData=${encodeURIComponent(JSON.stringify(googleData))}`;
          navigate(redirectUrl, { replace: true });
          return;
        }
        
        // Store token and user data in Redux for existing users
        await dispatch(loginUser({ token, user }) as any);
        
        toast.success('Login successful with Google!');
        
        // Redirect based on user role
        if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (user.role === 'provider') {
          navigate('/provider', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Google callback error:', error);
        toast.error('Failed to complete Google authentication');
        navigate('/login');
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing Google authentication...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;
