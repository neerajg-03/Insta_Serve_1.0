import React, { useRef } from 'react';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import LocationService, { Location } from '../services/locationService';

interface CustomerNavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  providerLocation: Location | null;
  customerLocation: Location | null;
}

const CustomerNavigationModal: React.FC<CustomerNavigationModalProps> = ({
  isOpen,
  onClose,
  booking,
  providerLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <MapPinIcon className="w-8 h-8 mr-3" />
                Provider Live Location
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
          {!providerLocation ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <span className="text-6xl mb-4 block">📍</span>
                <p className="text-gray-600">Waiting for provider location...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Provider Location Card */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-4">
                  <MapPinIcon className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold text-green-900">Provider's Current Location</h3>
                </div>
                <div className="text-green-700 space-y-2">
                  <p className="text-lg"><strong>Latitude:</strong> {providerLocation.lat.toFixed(6)}</p>
                  <p className="text-lg"><strong>Longitude:</strong> {providerLocation.lng.toFixed(6)}</p>
                  <p className="text-lg"><strong>Last Updated:</strong> {new Date(providerLocation.timestamp).toLocaleString()}</p>
                </div>
              </div>

              {/* Map Preview */}
              <div className="bg-gray-100 rounded-lg overflow-hidden mb-6" ref={mapRef}>
                <div className="bg-white p-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Provider Location Map</p>
                </div>
                <div className="h-96 flex items-center justify-center">
                  {providerLocation ? (
                    <img 
                      src={LocationService.getStaticMapUrl(
                        providerLocation,
                        15, 
                        [
                          { location: providerLocation, color: 'green', label: 'P' }
                        ]
                      )}
                      alt="Provider location map"
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
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>

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
