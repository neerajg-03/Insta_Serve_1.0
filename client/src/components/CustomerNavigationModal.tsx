import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import LocationService, { Location, GoogleMapsDistanceResult } from '../services/locationService';
import toast from 'react-hot-toast';

interface CustomerNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  providerLocation: Location | null;
  customerLocation: Location | null;
}

interface RouteData {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  overview_polyline?: string;
}

const CustomerNavigationModal: React.FC<CustomerNavigationModalProps> = ({
  isOpen,
  onClose,
  booking,
  providerLocation,
  customerLocation
}) => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Calculate route when both locations are available
  useEffect(() => {
    const calculateRoute = async () => {
      if (!customerLocation || !providerLocation) return;

      setLoading(true);
      setError(null);

      try {
        // Calculate distance and duration
        const distanceResult = await LocationService.calculateDistanceWithGoogleMaps(
          customerLocation,
          providerLocation
        );

        setRouteData({
          distance: distanceResult.distance,
          duration: distanceResult.duration
        });

        // Generate Google Maps navigation URL
        const navigationUrl = LocationService.getGoogleMapsUrl(customerLocation, providerLocation);
        setMapUrl(navigationUrl);

      } catch (err) {
        console.error('Error calculating route:', err);
        setError('Could not calculate route. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (customerLocation && providerLocation) {
      calculateRoute();
    }
  }, [customerLocation, providerLocation]);

  const handleNavigateNow = () => {
    if (mapUrl) {
      window.open(mapUrl, '_blank');
    }
  };

  const formatAddress = (address: string | any) => {
    if (typeof address === 'string') return address;
    if (typeof address === 'object' && address !== null) {
      const street = address.street || '';
      const city = address.city;
      const state = address.state;
      const pincode = address.pincode;
      
      // Skip unknown values
      const parts = [street];
      if (city && city !== 'Unknown City') parts.push(city);
      if (state && state !== 'Unknown State') parts.push(state);
      if (pincode && pincode !== '000000') parts.push(`- ${pincode}`);
      
      return parts.join(', ') || 'Address not available';
    }
    return 'Address not available';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <MapPinIcon className="w-8 h-8 mr-3" />
                Navigation to Provider
              </h2>
              <p className="text-blue-100 mt-1">
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Calculating route...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {!loading && !error && customerLocation && providerLocation && (
            <>
              {/* Location Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Location */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MapPinIcon className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Your Location</h3>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Lat: {customerLocation.lat.toFixed(6)}</p>
                    <p>Lng: {customerLocation.lng.toFixed(6)}</p>
                    <p>Updated: {new Date(customerLocation.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Provider Location */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MapPinIcon className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">Provider Location</h3>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Lat: {providerLocation.lat.toFixed(6)}</p>
                    <p>Lng: {providerLocation.lng.toFixed(6)}</p>
                    <p className="font-medium">{booking.provider?.name || 'Provider'}</p>
                  </div>
                </div>
              </div>

              {/* Route Information */}
              {routeData && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        📍 {routeData.distance.text}
                      </div>
                      <p className="text-gray-600">Total Distance</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        ⏱️ {routeData.duration.text}
                      </div>
                      <p className="text-gray-600">Estimated Time</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Preview */}
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-6" ref={mapRef}>
                <div className="bg-white p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Route Preview</p>
                </div>
                <div className="h-96 flex items-center justify-center">
                  {customerLocation && providerLocation ? (
                    <img 
                      src={LocationService.getStaticMapUrl(
                        {
                          lat: (customerLocation.lat + providerLocation.lat) / 2,
                          lng: (customerLocation.lng + providerLocation.lng) / 2,
                          timestamp: Date.now()
                        }, 
                        13, 
                        [
                          { location: customerLocation, color: 'blue', label: 'Y' }, // Your location
                          { location: providerLocation, color: 'green', label: 'P' } // Provider
                        ]
                      )}
                      alt="Route map"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                          <div class="text-center p-8">
                            <span class="text-6xl mb-4 block">🗺️</span>
                            <p class="text-gray-600 text-lg">Map preview unavailable</p>
                            <p class="text-gray-500 mt-2">Click "Navigate Now" to open in Google Maps</p>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">🗺️</span>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleNavigateNow}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
                >
                  <MapPinIcon className="w-5 h-5 mr-2" />
                  Navigate Now
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
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
  );
};

export default CustomerNavigationModal;
