// Navigation Modal Component with Turn-by-Turn Directions
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationData } from '../services/socketService';
import {
  XMarkIcon,
  ArrowPathIcon,
  MapPinIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  MapIcon
} from '@heroicons/react/24/outline';

interface NavigationModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerLocation?: LocationData | null;
  customerLocation?: LocationData | null;
  customerAddress?: string;
  bookingId?: string;
}

interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver?: {
    type: string;
    modifier?: string;
  };
}

interface RouteData {
  distance: number;
  duration: number;
  geometry: [number, number][];
  steps: RouteStep[];
}

const NavigationModal: React.FC<NavigationModalProps> = ({
  isOpen,
  onClose,
  providerLocation,
  customerLocation,
  customerAddress,
  bookingId
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const providerMarkerRef = useRef<L.Marker | null>(null);
  const customerMarkerRef = useRef<L.Marker | null>(null);
  
  const [mapReady, setMapReady] = useState(false);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [eta, setEta] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Fetch route data when locations are available
  useEffect(() => {
    console.log('NavigationModal useEffect triggered:', { mapReady, providerLocation, customerLocation });
    if (!mapReady) {
      console.log('Map not ready yet');
      return;
    }
    
    // Always try to fetch route data (will use test coordinates if real ones aren't available)
    fetchRouteData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchRouteData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [mapReady]);

  const fetchRouteData = async () => {
    console.log('fetchRouteData called with:', { providerLocation, customerLocation });
    
    // Use test coordinates if real locations are not available (for demonstration)
    const testProviderLocation = providerLocation || { lat: 28.6139, lng: 77.2090 }; // New Delhi
    const testCustomerLocation = customerLocation || { lat: 28.7041, lng: 77.1025 }; // Another Delhi location
    
    console.log('Using locations:', { testProviderLocation, testCustomerLocation });

    setLoadingRoute(true);
    setError(null);

    try {
      // Using OSRM API for routing
      const url = `https://router.project-osrm.org/route/v1/driving/${testProviderLocation.lng},${testProviderLocation.lat};${testCustomerLocation.lng},${testCustomerLocation.lat}?overview=full&geometries=geojson&steps=true`;
      console.log('Fetching route from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch route data');
      }

      const data = await response.json();
      console.log('OSRM API response:', data);
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        console.log('Route data:', { distance: route.distance, duration: route.duration, stepsCount: route.legs[0].steps.length });
        
        const processedRoute: RouteData = {
          distance: route.distance,
          duration: route.duration,
          geometry: route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]),
          steps: route.legs[0].steps.map((step: any) => ({
            instruction: step.maneuver.instruction || 'Continue',
            distance: formatDistance(step.distance),
            duration: formatDuration(step.duration),
            maneuver: step.maneuver
          }))
        };

        console.log('Processed route:', processedRoute);
        setRouteData(processedRoute);
        
        // Calculate ETA
        const arrivalTime = new Date(Date.now() + processedRoute.duration * 1000);
        setEta(arrivalTime);
        console.log('ETA set to:', arrivalTime);
        
        // Update map with route
        updateMapWithRoute(processedRoute, providerLocation || testProviderLocation, customerLocation || testCustomerLocation);
      } else {
        throw new Error('No route found');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      setError('Unable to calculate route. Please try again.');
    } finally {
      setLoadingRoute(false);
    }
  };

  const updateMapWithRoute = (route: RouteData, provLocation?: LocationData, custLocation?: LocationData) => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing route
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
    }

    // Add route line
    routeLineRef.current = L.polyline(route.geometry, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(map);

    // Add markers
    const providerIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd"/>
          </svg>
        </div>
      `,
      className: 'provider-nav-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const customerIcon = L.divIcon({
      html: `
        <div style="
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l4.05-4.95a7 7 0 11-9.9-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
          </svg>
        </div>
      `,
      className: 'customer-nav-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    if (providerMarkerRef.current) {
      map.removeLayer(providerMarkerRef.current);
    }
    if (customerMarkerRef.current) {
      map.removeLayer(customerMarkerRef.current);
    }

    // Use provided locations or fall back to original locations
    const finalProviderLocation = provLocation || providerLocation;
    const finalCustomerLocation = custLocation || customerLocation;

    if (finalProviderLocation && finalCustomerLocation) {
      providerMarkerRef.current = L.marker([finalProviderLocation.lat, finalProviderLocation.lng], {
        icon: providerIcon,
      }).addTo(map);

      customerMarkerRef.current = L.marker([finalCustomerLocation.lat, finalCustomerLocation.lng], {
        icon: customerIcon,
      }).addTo(map);
    }

    // Fit map to show route
    const bounds = L.latLngBounds(route.geometry);
    map.fitBounds(bounds, { padding: [50, 50] });
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getNextInstruction = (): string => {
    if (!routeData || currentStepIndex >= routeData.steps.length) {
      return 'You have arrived at your destination!';
    }
    return routeData.steps[currentStepIndex].instruction;
  };

  const getNextDistance = (): string => {
    if (!routeData || currentStepIndex >= routeData.steps.length) {
      return '';
    }
    return routeData.steps[currentStepIndex].distance;
  };

  const handleNextStep = () => {
    if (routeData && currentStepIndex < routeData.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            <MapIcon className="w-6 h-6 mr-2" />
            <div>
              <h2 className="text-xl font-bold">Navigation to Customer</h2>
              <p className="text-blue-100 text-sm">
                {customerAddress || 'Customer Location'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Info */}
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <p className="text-sm text-gray-600">Distance</p>
              </div>
              <p className="font-bold text-lg">
                {routeData ? formatDistance(routeData.distance) : '--'}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <ClockIcon className="w-4 h-4 text-blue-500 mr-1" />
                <p className="text-sm text-gray-600">Duration</p>
              </div>
              <p className="font-bold text-lg">
                {routeData ? formatDuration(routeData.duration) : '--'}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <MapIcon className="w-4 h-4 text-purple-500 mr-1" />
                <p className="text-sm text-gray-600">ETA</p>
              </div>
              <p className="font-bold text-lg">
                {eta ? eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
              </p>
              {eta && (
                <p className="text-xs text-gray-500">
                  {Math.round((eta.getTime() - Date.now()) / (1000 * 60))} min
                </p>
              )}
            </div>
          </div>
          
          {/* Real-time Status */}
          {routeData && (
            <div className="mt-3 flex items-center justify-center">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Active Navigation
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Map */}
          <div className="flex-1 relative">
            <div 
              ref={mapRef} 
              className="w-full h-96 lg:h-full"
              style={{ minHeight: '400px' }}
            />
            
            {/* Loading Overlay */}
            {loadingRoute && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Calculating route...</p>
                </div>
              </div>
            )}

            {/* Error Overlay */}
            {error && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                  <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-800 font-semibold mb-2">Navigation Error</p>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={fetchRouteData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center mx-auto"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Turn-by-Turn Directions */}
          <div className="w-full lg:w-96 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <MapIcon className="w-5 h-5 mr-2 text-blue-600" />
                Turn-by-Turn Directions
              </h3>

              {/* Current Instruction */}
              <div className="bg-blue-600 text-white rounded-xl p-4 mb-4">
                <div className="flex items-start">
                  <MapIcon className="w-6 h-6 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-lg">{getNextInstruction()}</p>
                    {getNextDistance() && (
                      <p className="text-blue-100 text-sm mt-1">{getNextDistance()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Step Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStepIndex === 0}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Step {currentStepIndex + 1} of {routeData?.steps.length || 0}
                </span>
                <button
                  onClick={handleNextStep}
                  disabled={!routeData || currentStepIndex >= routeData.steps.length - 1}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>

              {/* All Steps */}
              <div className="space-y-2">
                {routeData?.steps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      index === currentStepIndex
                        ? 'bg-blue-100 border-2 border-blue-300'
                        : index < currentStepIndex
                        ? 'bg-gray-100 opacity-60'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setCurrentStepIndex(index)}
                  >
                    <div className="flex items-start">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 mt-0.5 ${
                        index === currentStepIndex
                          ? 'bg-blue-600 text-white'
                          : index < currentStepIndex
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {index < currentStepIndex ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <span className="text-xs font-semibold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm ${
                          index === currentStepIndex ? 'font-semibold text-blue-900' : 'text-gray-700'
                        }`}>
                          {step.instruction}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {step.distance} · {step.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <MapPinIcon className="w-4 h-4 mr-1" />
            Booking #{bookingId?.slice(-8)}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchRouteData}
              disabled={loadingRoute}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center disabled:opacity-50"
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh Route
            </button>
            <button
              onClick={() => {
                // Open in external maps as fallback
                if (customerAddress) {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(customerAddress)}&travelmode=driving`;
                  window.open(url, '_blank');
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Open in Google Maps
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigationModal;
