export interface Location {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface LocationUpdate {
  bookingId: string;
  userId: string;
  location: Location;
  status: 'moving' | 'arrived' | 'service_started' | 'completed';
}

export interface OSMRouteResult {
  distance: {
    text: string;
    value: number; // in meters
  };
  duration: {
    text: string;
    value: number; // in seconds
  };
  status: string;
  source: string;
}

class LocationService {
  private static instance: LocationService;
  private watchId: number | null = null;
  private currentLocation: Location | null = null;
  private locationCallbacks: ((location: Location) => void)[] = [];
  private readonly LAST_LOCATION_KEY = 'provider_last_location';

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Store last known location to localStorage
  private storeLastLocation(location: Location): void {
    try {
      localStorage.setItem(this.LAST_LOCATION_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Failed to store last location:', error);
    }
  }

  // Get last known location from localStorage
  getLastKnownLocation(): Location | null {
    try {
      const stored = localStorage.getItem(this.LAST_LOCATION_KEY);
      if (stored) {
        const location = JSON.parse(stored) as Location;
        // Check if location is not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
        if (Date.now() - location.timestamp < maxAge) {
          return location;
        } else {
          // Remove old location
          localStorage.removeItem(this.LAST_LOCATION_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to retrieve last location:', error);
    }
    return null;
  }

  // Get current location with enhanced accuracy
  getCurrentLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      console.log('📍 Requesting high accuracy GPS location...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          
          console.log('📍 GPS location obtained:', {
            lat: location.lat,
            lng: location.lng,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
          
          // Validate location accuracy
          if (position.coords.accuracy > 100) {
            console.warn(`⚠️ Low GPS accuracy: ${position.coords.accuracy}m. Location may be unreliable.`);
          }
          
          this.currentLocation = location;
          this.storeLastLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('❌ GPS location error:', error);
          
          // Try fallback to last known location
          const lastLocation = this.getLastKnownLocation();
          if (lastLocation) {
            console.log('📍 Using last known location as fallback:', lastLocation);
            resolve(lastLocation);
            return;
          }
          
          reject(error);
        },
        {
          enableHighAccuracy: true,  // Force high accuracy GPS
          timeout: 15000,             // Longer timeout for GPS fix
          maximumAge: 0              // No cached location
        }
      );
    });
  }

  // Start watching location changes with enhanced accuracy
  startLocationTracking(callback: (location: Location) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      this.locationCallbacks.push(callback);

      if (this.watchId) {
        resolve(); // Already tracking
        return;
      }

      console.log('📍 Starting high accuracy location tracking...');
      
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location: Location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: Date.now()
          };
          
          console.log('📍 Location update received:', {
            lat: location.lat,
            lng: location.lng,
            accuracy: position.coords.accuracy,
            timestamp: new Date(location.timestamp).toISOString()
          });
          
          // Validate location accuracy
          if (position.coords.accuracy > 100) {
            console.warn(`⚠️ Low GPS accuracy: ${position.coords.accuracy}m. Location may be unreliable.`);
          }
          
          this.currentLocation = location;
          this.storeLastLocation(location);
          
          // Notify all callbacks
          this.locationCallbacks.forEach(cb => cb(location));
        },
        (error) => {
          console.error('❌ Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,  // Force high accuracy GPS
          timeout: 15000,             // Longer timeout for GPS fix
          maximumAge: 0                // No cached location
        }
      );

      resolve();
    });
  }

  // Stop location tracking
  stopLocationTracking(): void {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.locationCallbacks = [];
  }

  // Calculate distance and ETA using OpenStreetMap (OSRM)
  async calculateDistanceWithOSM(origin: Location, destination: Location): Promise<OSMRouteResult> {
    try {
      console.log('[DEBUG] Calculating distance using OpenStreetMap OSRM...');
      
      const originStr = `${origin.lat},${origin.lng}`;
      const destStr = `${destination.lat},${destination.lng}`;
      
      const response = await fetch(
        `/api/maps/distance?origins=${originStr}&destinations=${destStr}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'OK' && data.rows[0]?.elements[0]) {
          const element = data.rows[0].elements[0];
          console.log('[DEBUG] Using OSM distance:', element);
          return {
            distance: element.distance,
            duration: element.duration,
            status: data.source || 'osrm'
          };
        }
      }

      throw new Error('OSRM service failed');
    } catch (error) {
      console.error('[DEBUG] OSM distance calculation failed, using client-side fallback:', error);
      // Final fallback to client-side Haversine
      const distance = this.calculateDistance(origin, destination);
      const duration = this.calculateETA(distance);
      return {
        distance: {
          text: `${distance.toFixed(1)} km`,
          value: distance * 1000
        },
        duration: {
          text: `${Math.round(duration)} mins`,
          value: duration * 60
        },
        status: 'client_fallback'
      };
    }
  }

  // Calculate distance between two points (Haversine formula) - fallback method
  calculateDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(loc2.lat - loc1.lat);
    const dLng = this.toRadians(loc2.lng - loc1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.lat)) * Math.cos(this.toRadians(loc2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  // Calculate ETA based on distance and average speed
  calculateETA(distance: number, speedKmh: number = 40): number {
    return distance / speedKmh * 60; // Return minutes
  }

  // Get OpenStreetMap navigation URL for provider
  getOSMNavigationUrl(origin: Location, destination: Location | string): string {
    if (typeof destination === 'string') {
      // For address destination, we'll use the web interface
      return `https://www.openstreetmap.org/directions?engine=osrm_car&from=${origin.lat},${origin.lng}&to=${encodeURIComponent(destination)}`;
    } else {
      // For coordinate destination
      return `https://www.openstreetmap.org/directions?engine=osrm_car&from=${origin.lat},${origin.lng}&to=${destination.lat},${destination.lng}`;
    }
  }

  // Get navigation URLs from server (more reliable)
  async getNavigationUrls(origin: Location, destination: Location): Promise<{
    navigationUrl: string;
    webNavigationUrl: string;
    source: string;
  }> {
    try {
      const response = await fetch(
        `/api/maps/navigation?origin_lat=${origin.lat}&origin_lng=${origin.lng}&dest_lat=${destination.lat}&dest_lng=${destination.lng}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
      
      throw new Error('Failed to get navigation URLs');
    } catch (error) {
      console.error('[DEBUG] Navigation URL error:', error);
      // Fallback to basic OSM URL
      return {
        navigationUrl: this.getOSMNavigationUrl(origin, destination),
        webNavigationUrl: this.getOSMNavigationUrl(origin, destination),
        source: 'fallback'
      };
    }
  }

  // Get static map URL using OpenStreetMap
  async getStaticMapUrl(center: Location, zoom: number = 15, markers?: Array<{location: Location, color?: string, label?: string}>): Promise<string> {
    try {
      // Build marker string for OSM
      let markerString = '';
      if (markers && markers.length > 0) {
        markerString = markers.map(marker => {
          return `${marker.location.lat},${marker.location.lng}`;
        }).join('|');
      }

      const response = await fetch(
        `/api/maps/static?center=${center.lat},${center.lng}&zoom=${zoom}&size=600x400&markers=${markerString}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.url;
      }
      
      throw new Error('Failed to get static map URL');
    } catch (error) {
      console.error('[DEBUG] Static map error:', error);
      // Fallback to placeholder
      return 'https://via.placeholder.com/600x400?text=Map+Preview+Unavailable';
    }
  }

  // Geocode address to coordinates using OpenStreetMap Nominatim
  async geocodeAddress(address: string): Promise<Location | null> {
    try {
      console.log(`[DEBUG] Geocoding address with OSM: ${address}`);
      
      const response = await fetch(
        `/api/maps/geocode?address=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results[0]) {
        const location = data.results[0].geometry.location;
        const result: Location = {
          lat: location.lat,
          lng: location.lng,
          timestamp: Date.now()
        };
        
        console.log(`[DEBUG] Geocoded successfully using ${data.results[0].source || 'OSM'}:`, result);
        return result;
      } else if (data.error) {
        throw new Error(`Server error: ${data.error}`);
      } else {
        throw new Error(`Geocoding error: ${data.status}`);
      }
    } catch (error) {
      console.error('[DEBUG] Error geocoding address:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to address using OpenStreetMap
  async reverseGeocode(location: Location): Promise<string | null> {
    try {
      const response = await fetch(
        `/api/maps/geocode?latlng=${location.lat},${location.lng}`
      );

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results[0]) {
        return data.results[0].formatted_address;
      } else if (data.error) {
        throw new Error(`Server error: ${data.error}`);
      } else {
        throw new Error(`Reverse geocoding error: ${data.status}`);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `${location.lat}, ${location.lng}`;
    }
  }

  // Convert degrees to radians
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Get current location
  getCurrentLocationSync(): Location | null {
    return this.currentLocation;
  }

  // Check if location is within service area
  isWithinServiceArea(location: Location, serviceArea: string, maxRadiusKm: number = 10): boolean {
    // This is a simplified check - in real app, you'd geocode the service area
    // and check if the location is within the specified radius
    return true; // Placeholder
  }
}

export default LocationService.getInstance();
