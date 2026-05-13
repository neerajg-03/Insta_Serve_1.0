import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const GoogleAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const error = searchParams.get('error');
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        
        // Handle various error cases
        if (error) {
          switch (error) {
            case 'google_auth_failed':
              toast.error('Google authentication failed. Please try again.');
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
        
        // Store token and user data in Redux
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
