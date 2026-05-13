import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const GoogleSignupComplete: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  
  const [formData, setFormData] = useState({
    phone: '',
    role: 'customer' as 'customer' | 'provider',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [googleData, setGoogleData] = useState<any>(null);

  useEffect(() => {
    const googleDataParam = searchParams.get('googleData');
    if (googleDataParam) {
      try {
        setGoogleData(JSON.parse(decodeURIComponent(googleDataParam)));
      } catch (error) {
        toast.error('Invalid Google data');
        navigate('/register');
      }
    } else {
      toast.error('Missing Google data');
      navigate('/register');
    }
  }, [searchParams, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://insta-serve-1-0.onrender.com//api/auth/google/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleData,
          ...formData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete Google sign-up');
      }

      // Store token and user data in Redux
      await dispatch(loginUser({ token: data.token, user: data.user }) as any);
      
      toast.success('Google sign-up completed successfully!');
      
      // Redirect based on user role
      if (data.user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (data.user.role === 'provider') {
        navigate('/provider', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete Google sign-up');
    } finally {
      setLoading(false);
    }
  };

  if (!googleData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete your profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please provide additional information to complete your Google sign-up
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>Name:</strong> {googleData.name}<br />
              <strong>Email:</strong> {googleData.email}
            </p>
          </div>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className="mt-1 input"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                I want to <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                className="mt-1 input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="customer">Hire Service Providers</option>
                <option value="provider">Offer Services</option>
              </select>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Address</h3>
              
              <div>
                <label htmlFor="street" className="block text-sm text-gray-600">
                  Street Address
                </label>
                <input
                  id="street"
                  name="address.street"
                  type="text"
                  className="mt-1 input"
                  placeholder="123 Main St"
                  value={formData.address.street}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm text-gray-600">
                    City
                  </label>
                  <input
                    id="city"
                    name="address.city"
                    type="text"
                    className="mt-1 input"
                    placeholder="Mumbai"
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm text-gray-600">
                    State
                  </label>
                  <input
                    id="state"
                    name="address.state"
                    type="text"
                    className="mt-1 input"
                    placeholder="Maharashtra"
                    value={formData.address.state}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pincode" className="block text-sm text-gray-600">
                  Pincode
                </label>
                <input
                  id="pincode"
                  name="address.pincode"
                  type="text"
                  className="mt-1 input"
                  placeholder="400001"
                  value={formData.address.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Completing sign-up...' : 'Complete Sign-up'}
            </button>
          </div>

          <div className="text-xs text-gray-500">
            By completing your account, you agree to our{' '}
            <button type="button" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </button>{' '}
            and{' '}
            <button type="button" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GoogleSignupComplete;
