import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MapPinIcon, PhoneIcon, ChatBubbleLeftRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import LocationService, { Location, OSMRouteResult } from '../services/locationService';
import toast from 'react-hot-toast';
import ChatComponent from './ChatComponent';

interface CustomerTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  customerLocation: Location | null;
}

interface ProviderTrackingData {
  location: Location | null;
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  lastUpdated: number;
  source: string;
}

const CustomerTrackingModal: React.FC<CustomerTrackingModalProps> = ({
  isOpen,
  onClose,
  booking,
  customerLocation
}) => {
  const [providerTracking, setProviderTracking] = useState<ProviderTrackingData | null>(null);
  const [staticMapUrl, setStaticMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const trackingInterval = useRef<NodeJS.Timeout | null>(null);

  // Track provider location and calculate ETA
  const startTracking = async () => {
    if (!customerLocation || !booking?.provider) {
      console.error('[DEBUG] Missing customer location or provider info');
      setError('Unable to start tracking - missing location information');
      return;
    }

    setLoading(true);
    setError(null);

    const trackProvider = async () => {
      try {
        console.log('[DEBUG] Tracking provider for booking:', booking._id);

        // Get provider's current location (this would come from real-time updates)
        // For now, we'll simulate or use the provider's last known location
        let providerLocation: Location | null = null;

        // Try to get provider location from booking data or socket
        if (booking.providerLocation) {
          providerLocation = booking.providerLocation;
        } else {
          // Fallback: use provider's address coordinates
          if (booking.provider?.address?.coordinates) {
            providerLocation = {
              lat: booking.provider.address.coordinates.lat,
              lng: booking.provider.address.coordinates.lng,
              timestamp: Date.now()
            };
          }
        }

        if (!providerLocation) {
          console.warn('[DEBUG] No provider location available');
          setProviderTracking(null);
          return;
        }

        // Calculate distance and ETA using OpenStreetMap
        const distanceResult = await LocationService.calculateDistanceWithOSM(
          providerLocation,
          customerLocation
        );

        console.log('[DEBUG] Provider tracking result:', distanceResult);

        const trackingData: ProviderTrackingData = {
          location: providerLocation,
          distance: distanceResult.distance,
          duration: distanceResult.duration,
          lastUpdated: Date.now(),
          source: distanceResult.source
        };

        setProviderTracking(trackingData);

        // Generate static map with both locations
        try {
          const staticUrl = await LocationService.getStaticMapUrl(
            {
              lat: (providerLocation.lat + customerLocation.lat) / 2,
              lng: (providerLocation.lng + customerLocation.lng) / 2,
              timestamp: Date.now()
            }, 
            13, 
            [
              { location: providerLocation, color: 'green', label: 'P' }, // Provider
              { location: customerLocation, color: 'blue', label: 'C' } // Customer
            ]
          );
          setStaticMapUrl(staticUrl);
        } catch (mapError) {
          console.error('[DEBUG] Error generating static map:', mapError);
          setStaticMapUrl('');
        }

      } catch (err) {
        console.error('[DEBUG] Error tracking provider:', err);
        setError('Unable to track provider location');
      } finally {
        setLoading(false);
      }
    };

    // Initial tracking
    trackProvider();

    // Set up periodic updates (every 30 seconds)
    trackingInterval.current = setInterval(trackProvider, 30000);
  };

  // Stop tracking when modal closes
  const stopTracking = () => {
    if (trackingInterval.current) {
      clearInterval(trackingInterval.current);
      trackingInterval.current = null;
    }
  };

  // Start/stop tracking based on modal state
  useEffect(() => {
    if (isOpen && customerLocation && booking) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => stopTracking();
  }, [isOpen, customerLocation, booking]);

  const handleChatNow = () => {
    setShowChat(true);
  };

  const handleCallProvider = () => {
    if (booking?.provider?.phone) {
      window.open(`tel:${booking.provider.phone}`);
    } else {
      toast.error('Provider phone number not available');
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  const getLastUpdatedText = () => {
    if (!providerTracking?.lastUpdated) return '';
    
    const minutesAgo = Math.floor((Date.now() - providerTracking.lastUpdated) / 60000);
    if (minutesAgo < 1) return 'Just now';
    if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
    
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <MapPinIcon className="w-8 h-8 mr-3" />
                  Track Provider
                </h2>
                <p className="text-green-100 mt-1">
                  Booking ID: #{booking?._id?.slice(-8)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-3 text-gray-600">Getting provider location...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {!loading && !error && providerTracking && (
              <>
                {/* ETA Information */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Arrival Time</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2 flex items-center justify-center">
                        <ClockIcon className="w-10 h-10 mr-2" />
                        {formatTime(providerTracking.duration.value / 60)}
                      </div>
                      <p className="text-gray-600">Estimated Arrival</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        📍 {providerTracking.distance.text}
                      </div>
                      <p className="text-gray-600">Distance Away</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Last updated: {getLastUpdatedText()}
                    {providerTracking.source && (
                      <span className="ml-2">
                        • Powered by {providerTracking.source === 'osrm' ? 'OpenStreetMap' : providerTracking.source}
                      </span>
                    )}
                  </div>
                </div>

                {/* Location Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Provider Location */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <MapPinIcon className="w-6 h-6 text-green-600 mr-2" />
                      <h3 className="font-semibold text-green-900">Provider Location</h3>
                    </div>
                    <div className="text-sm text-green-700 space-y-1">
                      {providerTracking.location ? (
                        <>
                          <p>Lat: {providerTracking.location.lat.toFixed(6)}</p>
                          <p>Lng: {providerTracking.location.lng.toFixed(6)}</p>
                          <p>Updated: {new Date(providerTracking.location.timestamp).toLocaleTimeString()}</p>
                        </>
                      ) : (
                        <p className="text-green-600">Location not available</p>
                      )}
                    </div>
                  </div>

                  {/* Your Location */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <MapPinIcon className="w-6 h-6 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-blue-900">Your Location</h3>
                    </div>
                    <div className="text-sm text-blue-700 space-y-1">
                      {customerLocation ? (
                        <>
                          <p>Lat: {customerLocation.lat.toFixed(6)}</p>
                          <p>Lng: {customerLocation.lng.toFixed(6)}</p>
                          <p>Service Address</p>
                        </>
                      ) : (
                        <p className="text-blue-600">Location not available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Map Preview */}
                <div className="bg-gray-100 rounded-lg overflow-hidden mb-6" ref={mapRef}>
                  <div className="bg-white p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-700">Live Tracking Map</p>
                  </div>
                  <div className="h-96 flex items-center justify-center">
                    {staticMapUrl ? (
                      <img 
                        src={staticMapUrl}
                        alt="Tracking map"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.innerHTML = `
                            <div class="text-center p-8">
                              <span class="text-6xl mb-4 block">🗺️</span>
                              <p class="text-gray-600 text-lg">Map preview unavailable</p>
                              <p class="text-gray-500 mt-2">Provider location tracking active</p>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="text-center">
                        <span className="text-6xl mb-4 block">🗺️</span>
                        <p className="text-gray-600">
                          {loading ? 'Loading map...' : 'Map preview unavailable'}
                        </p>
                        <p className="text-gray-500 mt-2">Provider location tracking active</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={handleChatNow}
                    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center text-sm"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                    Chat Provider
                  </button>
                  <button
                    onClick={handleCallProvider}
                    className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center text-sm"
                  >
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Call Provider
                  </button>
                  <button
                    onClick={onClose}
                    className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                  >
                    Close Tracking
                  </button>
                </div>

                {/* Provider Info */}
                {booking?.provider && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Provider Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Name:</p>
                        <p className="font-medium">{booking.provider.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Phone:</p>
                        <p className="font-medium">{booking.provider.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Service:</p>
                        <p className="font-medium">{booking.service?.title || 'Service'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status:</p>
                        <p className="font-medium capitalize">{booking.status?.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Component */}
      {booking?.provider && (
        <ChatComponent
          bookingId={booking._id}
          recipientId={booking.provider._id}
          recipientName={booking.provider.name}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
          isProvider={false}
        />
      )}
    </>
  );
};

export default CustomerTrackingModal;
