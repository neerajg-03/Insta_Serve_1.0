import React, { useState, useEffect } from 'react';
import { providerAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  MapPinIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  MapPinIcon as MapPinSolidIcon
} from '@heroicons/react/24/solid';

interface ProviderStatus {
  locationSharingEnabled: boolean;
  currentLocation: {
    lat: number;
    lng: number;
    lastUpdated: string;
  } | null;
  lastLocationUpdate: string | null;
}

const ProviderStatusCompact: React.FC = () => {
  const [status, setStatus] = useState<ProviderStatus>({
    locationSharingEnabled: false,
    currentLocation: null,
    lastLocationUpdate: null
  });
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const fetchProviderStatus = async () => {
    try {
      setLoading(true);
      const response = await providerAPI.getStatus();
      setStatus(response);
      
      // Auto-enable availability and location sharing when provider visits the site
      if (!response.locationSharingEnabled) {
        await enableAvailability();
      }
    } catch (error: any) {
      console.error('Failed to fetch provider status:', error);
    } finally {
      setLoading(false);
    }
  };

  const enableAvailability = async () => {
    try {
      setLoading(true);
      
      // Always set provider as available and enable location sharing
      const updateData = {
        isAvailable: true,
        locationSharingEnabled: true
      };

      await providerAPI.updateAvailability(updateData);
      
      setStatus(prev => ({
        ...prev,
        locationSharingEnabled: true
      }));

      // Start location tracking
      startLocationTracking();
    } catch (error: any) {
      console.error('Failed to enable availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    if (!navigator.geolocation) {
      return;
    }

    setLocationLoading(true);

    try {
      console.log('Starting real-time location tracking with watchPosition...');
      
      // Use watchPosition for real-time updates
      const watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const timestamp = new Date().toISOString();
          
          console.log('Real-time location update:', { latitude, longitude, timestamp });
          
          try {
            await providerAPI.updateLocation({
              lat: latitude,
              lng: longitude
            });

            setStatus(prev => ({
              ...prev,
              currentLocation: {
                lat: latitude,
                lng: longitude,
                lastUpdated: timestamp
              },
              lastLocationUpdate: timestamp
            }));

            setLocationLoading(false);
            console.log('Real-time location updated successfully to:', { latitude, longitude });
          } catch (apiError) {
            console.error('Failed to update location to backend:', apiError);
          }
        },
        (error) => {
          console.error('Location access denied or error:', error);
          setLocationLoading(false);
          
          // Disable location sharing if access denied
          providerAPI.updateAvailability({ locationSharingEnabled: false });
          setStatus(prev => ({ ...prev, locationSharingEnabled: false }));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000 // Only accept positions less than 5 seconds old
        }
      );

      // Store watchId for cleanup
      (window as any).locationWatchId = watchId;
      console.log('Real-time location tracking started with watchId:', watchId);
      
    } catch (error: any) {
      console.error('Failed to start location tracking:', error);
      setLocationLoading(false);
    }
  };

  const stopLocationTracking = () => {
    if ((window as any).locationWatchId) {
      navigator.geolocation.clearWatch((window as any).locationWatchId);
      delete (window as any).locationWatchId;
      console.log('Real-time location tracking stopped');
    }
    if ((window as any).locationInterval) {
      clearInterval((window as any).locationInterval);
      delete (window as any).locationInterval;
      console.log('Legacy location tracking stopped');
    }
  };

  useEffect(() => {
    // Start location tracking if location sharing is enabled
    if (status.locationSharingEnabled) {
      startLocationTracking();
    }

    // Cleanup on unmount
    return () => {
      stopLocationTracking();
    };
  }, [status.locationSharingEnabled]);

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50">
      <div className="space-y-2">
        {/* Availability Status */}
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${status.locationSharingEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className="text-xs font-medium text-gray-700">
            {status.locationSharingEnabled ? 'Available' : 'Unavailable'}
          </span>
        </div>

        {/* Live Coordinates */}
        {status.currentLocation && (
          <div className="flex items-center space-x-2">
            <MapPinIcon className="w-3 h-3 text-blue-500" />
            <div className="flex items-center space-x-1">
              <span className="text-xs font-mono text-gray-600">
                {status.currentLocation.lat.toFixed(4)}, {status.currentLocation.lng.toFixed(4)}
              </span>
              {locationLoading && (
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
        )}

        {/* Location Loading Indicator */}
        {!status.currentLocation && locationLoading && (
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-3 h-3 text-yellow-600" />
            <span className="text-xs text-yellow-700">Getting location...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderStatusCompact;
