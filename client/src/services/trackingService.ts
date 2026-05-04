import { io, Socket } from 'socket.io-client';
import LocationService, { Location } from './locationService';

export interface TrackingUpdate {
  bookingId: string;
  providerId: string;
  location: Location;
  status: 'moving' | 'arrived' | 'service_started' | 'completed';
  timestamp: number;
}

export interface TrackingSubscription {
  bookingId: string;
  callback: (update: TrackingUpdate) => void;
}

class TrackingService {
  private static instance: TrackingService;
  private socket: Socket | null = null;
  private subscriptions: Map<string, TrackingSubscription[]> = new Map();
  private trackingEnabled: boolean = false;
  private locationTrackingId: number | null = null;

  static getInstance(): TrackingService {
    if (!TrackingService.instance) {
      TrackingService.instance = new TrackingService();
    }
    return TrackingService.instance;
  }

  // Initialize tracking service
  async initialize(userId: string, userRole: 'provider' | 'customer'): Promise<void> {
    try {
      console.log(`[TRACKING] Initializing tracking for ${userRole}: ${userId}`);

      // Connect to socket
      this.socket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          userId,
          role: userRole
        }
      });

      // Set up socket event listeners
      this.socket.on('connect', () => {
        console.log('[TRACKING] Connected to tracking server');
        this.trackingEnabled = true;
      });

      this.socket.on('disconnect', () => {
        console.log('[TRACKING] Disconnected from tracking server');
        this.trackingEnabled = false;
      });

      // Listen for location updates
      this.socket.on('location_update', (update: TrackingUpdate) => {
        console.log('[TRACKING] Received location update:', update);
        this.notifySubscribers(update);
      });

      // Listen for provider location updates (for customers)
      this.socket.on('provider_location_update', (update: TrackingUpdate) => {
        console.log('[TRACKING] Received provider location update:', update);
        this.notifySubscribers(update);
      });

      // If provider, start location sharing
      if (userRole === 'provider') {
        await this.startLocationSharing(userId);
      }

    } catch (error) {
      console.error('[TRACKING] Failed to initialize tracking:', error);
      throw error;
    }
  }

  // Start sharing provider location
  async startLocationSharing(providerId: string): Promise<void> {
    try {
      console.log('[TRACKING] Starting location sharing for provider:', providerId);

      // Start GPS tracking
      await LocationService.startLocationTracking(async (location: Location) => {
        if (this.socket && this.trackingEnabled) {
          // Emit location update to server
          this.socket.emit('provider_location_update', {
            providerId,
            location,
            timestamp: Date.now()
          });
          console.log('[TRACKING] Location shared:', location);
        }
      });

      this.locationTrackingId = 1; // Mark as active

    } catch (error) {
      console.error('[TRACKING] Failed to start location sharing:', error);
      throw error;
    }
  }

  // Stop sharing provider location
  stopLocationSharing(): void {
    try {
      console.log('[TRACKING] Stopping location sharing');
      
      LocationService.stopLocationTracking();
      this.locationTrackingId = null;

      if (this.socket) {
        this.socket.emit('stop_location_sharing');
      }

    } catch (error) {
      console.error('[TRACKING] Failed to stop location sharing:', error);
    }
  }

  // Subscribe to tracking updates for a specific booking
  subscribeToTracking(bookingId: string, callback: (update: TrackingUpdate) => void): () => void {
    try {
      console.log('[TRACKING] Subscribing to tracking for booking:', bookingId);

      const subscription: TrackingSubscription = {
        bookingId,
        callback
      };

      // Add subscription
      if (!this.subscriptions.has(bookingId)) {
        this.subscriptions.set(bookingId, []);
      }
      this.subscriptions.get(bookingId)!.push(subscription);

      // Join booking room for real-time updates
      if (this.socket) {
        this.socket.emit('join_booking_tracking', { bookingId });
      }

      // Return unsubscribe function
      return () => {
        this.unsubscribeFromTracking(bookingId, subscription);
      };

    } catch (error) {
      console.error('[TRACKING] Failed to subscribe to tracking:', error);
      throw error;
    }
  }

  // Unsubscribe from tracking updates
  private unsubscribeFromTracking(bookingId: string, subscription: TrackingSubscription): void {
    try {
      const subscriptions = this.subscriptions.get(bookingId);
      if (subscriptions) {
        const index = subscriptions.indexOf(subscription);
        if (index > -1) {
          subscriptions.splice(index, 1);
        }

        // Leave booking room if no more subscriptions
        if (subscriptions.length === 0) {
          this.subscriptions.delete(bookingId);
          if (this.socket) {
            this.socket.emit('leave_booking_tracking', { bookingId });
          }
        }
      }

    } catch (error) {
      console.error('[TRACKING] Failed to unsubscribe from tracking:', error);
    }
  }

  // Update tracking status
  updateTrackingStatus(bookingId: string, status: TrackingUpdate['status']): void {
    try {
      if (!this.socket || !this.trackingEnabled) {
        throw new Error('Tracking service not connected');
      }

      const update: Partial<TrackingUpdate> = {
        bookingId,
        status,
        timestamp: Date.now()
      };

      this.socket.emit('tracking_status_update', update);
      console.log('[TRACKING] Status updated:', update);

    } catch (error) {
      console.error('[TRACKING] Failed to update tracking status:', error);
    }
  }

  // Get current tracking status for a booking
  async getTrackingStatus(bookingId: string): Promise<TrackingUpdate | null> {
    try {
      if (!this.socket || !this.trackingEnabled) {
        return null;
      }

      // Request current status from server
      this.socket.emit('get_tracking_status', { bookingId });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 5000); // 5 second timeout

        this.socket!.once('tracking_status_response', (response: TrackingUpdate | null) => {
          clearTimeout(timeout);
          resolve(response);
        });
      });

    } catch (error) {
      console.error('[TRACKING] Failed to get tracking status:', error);
      return null;
    }
  }

  // Notify all subscribers of a tracking update
  private notifySubscribers(update: TrackingUpdate): void {
    const subscriptions = this.subscriptions.get(update.bookingId);
    if (subscriptions) {
      subscriptions.forEach(subscription => {
        try {
          subscription.callback(update);
        } catch (error) {
          console.error('[TRACKING] Error in subscription callback:', error);
        }
      });
    }
  }

  // Check if tracking is enabled
  isTrackingEnabled(): boolean {
    return this.trackingEnabled && this.socket?.connected === true;
  }

  // Get connection status
  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connected) return 'connected';
    return 'connecting';
  }

  // Disconnect tracking service
  disconnect(): void {
    try {
      console.log('[TRACKING] Disconnecting tracking service');

      // Stop location sharing
      this.stopLocationSharing();

      // Clear all subscriptions
      this.subscriptions.clear();

      // Disconnect socket
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      this.trackingEnabled = false;

    } catch (error) {
      console.error('[TRACKING] Failed to disconnect tracking service:', error);
    }
  }
}

export default TrackingService.getInstance();
