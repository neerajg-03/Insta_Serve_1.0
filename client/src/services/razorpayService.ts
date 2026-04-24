// Razorpay Payment Service Integration
import Razorpay from 'razorpay';

export interface PaymentOptions {
  amount: number;
  currency?: string;
  receipt?: string;
  notes?: Record<string, string>;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

class RazorpayService {
  private static instance: RazorpayService;

  static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  // Create Razorpay order
 async createOrder(options: PaymentOptions): Promise<any> {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_URL}/api/razorpay-route/create-split-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingData: {
            _id: options.bookingId,
            amount: options.amount,
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create order");
    }

    return {
      id: data.orderId,     // ✅ REAL ORDER ID
      amount: data.amount,
      currency: "INR",
      notes: {}
    };

  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    throw error;
  }
}
  // Initialize Razorpay payment
  initializePayment(order: any, options: PaymentOptions): Promise<PaymentResponse> {
    return new Promise((resolve, reject) => {
      const razorpay = new (window as any).Razorpay({
       key: "rzp_live_ShE5bMl84arxkI", // Test key - replace with your actual key
        amount: order.amount,
        currency: order.currency,
        name: 'InstaServe',
        description: `Payment for booking ${options.bookingId}`,
        image: '/logo.png', // Add your logo
        order_id: order.id,
        handler: (response: PaymentResponse) => {
          console.log('Payment successful:', response);
          resolve(response);
        },
        prefill: {
          name: options.customerName,
          email: options.customerEmail,
          contact: options.customerPhone
        },
        notes: order.notes,
        theme: {
          color: '#6366f1' // Blue theme matching your app
        },
        modal: {
          ondismiss: () => {
            reject(new Error('Payment cancelled by user'));
          },
          escape: true,
          backdropclose: false,
          animate: true
        }
      });

      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        reject(new Error(response.error.description || 'Payment failed'));
      });

      razorpay.open();
    });
  }

  // Process payment
  async processPayment(options: PaymentOptions): Promise<PaymentResponse> {
    try {
      // Step 1: Create order
      const order = await this.createOrder(options);
      
      // Step 2: Initialize payment
      const response = await this.initializePayment(order, options);
      
      // Step 3: Verify payment on backend (in production)
      await this.verifyPayment(response, options.bookingId);
      
      return response;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    }
  }

  // Verify payment with backend
 private async verifyPayment(response: PaymentResponse, bookingId: string): Promise<void> {
  try {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/api/payments/verify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...response,
          bookingId, // ✅ IMPORTANT (backend needs this)
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Payment verification failed");
    }

    console.log("✅ Payment verified:", data);
  } catch (error) {
    console.error("❌ Verification error:", error);
    throw error;
  }
}
  // Load Razorpay script
  loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error('Failed to load Razorpay script'));
      };

      document.head.appendChild(script);
    });
  }
}

export default RazorpayService.getInstance();
