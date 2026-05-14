import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import LocationService, { Location, GoogleMapsDistanceResult } from '../services/locationService';
import toast from 'react-hot-toast';

interface ProviderNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  providerLocation: Location | null;
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

const ProviderNavigationModal: React.FC<ProviderNavigationModalProps> = ({
  isOpen,
  onClose,
  booking,
  providerLocation
}) => {
  const [customerLocation, setCustomerLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Get customer location from booking
  useEffect(() => {
    const getCustomerLocation = async () => {
      if (!booking?.address) return;

      try {
        let customerCoords: Location | null = null;

        // If booking has coordinates, use them
        if (booking.address.coordinates?.lat && booking.address.coordinates?.lng) {
          customerCoords = {
            lat: booking.address.coordinates.lat,
            lng: booking.address.coordinates.lng,
            timestamp: Date.now()
          };
        } else {
          // Otherwise geocode the address
          let addressString: string;
          if (typeof booking.address === 'string') {
            addressString = booking.address;
          } else {
            const street = booking.address?.street || '';
            const city = booking.address?.city;
            const state = booking.address?.state;
            const pincode = booking.address?.pincode;
            
            // Skip unknown values
            const parts = [street];
            if (city && city !== 'Unknown City') parts.push(city);
            if (state && state !== 'Unknown State') parts.push(state);
            if (pincode && pincode !== '000000') parts.push(`- ${pincode}`);
            
            addressString = parts.join(', ');
          }
          
          customerCoords = await LocationService.geocodeAddress(addressString);
        }

        setCustomerLocation(customerCoords);
      } catch (err) {
        console.error('Error getting customer location:', err);
        setError('Could not determine customer location');
      }
    };

    if (isOpen && booking) {
      getCustomerLocation();
    }
  }, [isOpen, booking]);


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
                Provider Live Location
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

          {!loading && !error && providerLocation && customerLocation && (
            <>
              {/* Location Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Provider Location */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MapPinIcon className="w-6 h-6 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-900">Your Location</h3>
                  </div>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Lat: {providerLocation.lat.toFixed(6)}</p>
                    <p>Lng: {providerLocation.lng.toFixed(6)}</p>
                    <p>Updated: {new Date(providerLocation.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                {/* Customer Location */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <MapPinIcon className="w-6 h-6 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">Customer Location</h3>
                  </div>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>Lat: {customerLocation.lat.toFixed(6)}</p>
                    <p>Lng: {customerLocation.lng.toFixed(6)}</p>
                    <p className="font-medium">{formatAddress(booking.address)}</p>
                  </div>
                </div>
              </div>

              {/* Distance Information */}
              {providerLocation && customerLocation && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distance to Customer</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      📍 {LocationService.calculateDistance(providerLocation, customerLocation).toFixed(1)} km
                    </div>
                    <p className="text-gray-600">Straight-line distance</p>
                  </div>
                </div>
              )}

              {/* Live Location Map */}
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-6" ref={mapRef}>
                <div className="bg-white p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Live Location Map</p>
                </div>
                <div className="h-96 flex items-center justify-center">
                  {providerLocation ? (
                    <img 
                      src={LocationService.getStaticMapUrl(
                        providerLocation,
                        15, 
                        [
                          { location: providerLocation, color: 'green', label: 'P' } // Provider only
                        ]
                      )}
                      alt="Provider live location"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = `
                          <div class="text-center p-8">
                            <span class="text-6xl mb-4 block">🗺️</span>
                            <p class="text-gray-600 text-lg">Map preview unavailable</p>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div className="text-center">
                      <span className="text-6xl mb-4 block">🗺️</span>
                      <p className="text-gray-600">Waiting for provider location...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Close
                </button>
              </div>

              {/* Customer Info */}
              {booking?.customer && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Name:</p>
                      <p className="font-medium">{booking.customer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phone:</p>
                      <p className="font-medium">{booking.customer.phone}</p>
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

export default ProviderNavigationModal;
