// Razorpay Route Service for Frontend Split Payment Integration
import api from './api';

export interface ProviderAccountData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  pan?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
  bankAccount?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
  };
}

export interface SplitOrderData {
  _id: string;
  price: {
    totalPrice: number;
  };
  provider: {
    _id: string;
    name: string;
    email: string;
  };
  customer: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  service: {
    _id: string;
    title: string;
  };
}

export interface RazorpayRouteResponse {
  success: boolean;
  message?: string;
  error?: string;
  accountId?: string;
  stakeholderId?: string;
  configId?: string;
  status?: string;
  activationStatus?: string;
  orderId?: string;
  amount?: number;
  transfers?: any[];
  earnings?: any;
  transferId?: string;
  refundId?: string;
  balance?: any;
}

class RazorpayRouteService {
  private static instance: RazorpayRouteService;

  static getInstance(): RazorpayRouteService {
    if (!RazorpayRouteService.instance) {
      RazorpayRouteService.instance = new RazorpayRouteService();
    }
    return RazorpayRouteService.instance;
  }

  // Create Provider Linked Account
  async createProviderAccount(providerData: ProviderAccountData): Promise<RazorpayRouteResponse> {
    try {
      const response = await api.post('/razorpay-route/create-provider-account', providerData);
      return response.data;
    } catch (error: any) {
      console.error('Error creating provider account:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create provider account'
      };
    }
  }

  // Create Split Order
  async createSplitOrder(bookingData: SplitOrderData): Promise<RazorpayRouteResponse> {
    try {
      const response = await api.post('/razorpay-route/create-split-order', { bookingData });
      return response.data;
    } catch (error: any) {
      console.error('Error creating split order:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create split order'
      };
    }
  }

  // Process Split Payment
  async processSplitPayment(paymentId: string, bookingData: SplitOrderData): Promise<RazorpayRouteResponse> {
    try {
      const response = await api.post('/razorpay-route/process-payment', { paymentId, bookingData });
      return response.data;
    } catch (error: any) {
      console.error('Error processing split payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process split payment'
      };
    }
  }

  // Get Transfer Status
  async getTransferStatus(transferId: string): Promise<RazorpayRouteResponse> {
    try {
      const response = await api.get(`/razorpay-route/transfer-status/${transferId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting transfer status:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get transfer status'
      };
    }
  }

  // Process Refund
  async processRefund(paymentId: string, refundAmount: number, bookingData: SplitOrderData): Promise<RazorpayRouteResponse> {
    try {
      const response = await api.post('/razorpay-route/process-refund', { 
        paymentId, 
        refundAmount, 
        bookingData 
      });
      return response.data;
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process refund'
      };
    }
  }

  // Get Account Balance
  async getAccountBalance(accountId: string): Promise<RazorpayRouteResponse> {
    try {
      const response = await api.get(`/razorpay-route/account-balance/${accountId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting account balance:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get account balance'
      };
    }
  }

  // Update Provider Account
  async updateProviderAccount(updateData: Partial<ProviderAccountData>): Promise<RazorpayRouteResponse> {
    try {
      const response = await api.put('/razorpay-route/update-account', updateData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating provider account:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update provider account'
      };
    }
  }

  // Initialize Razorpay Checkout with Split Payment
  initializeSplitPayment(order: any, bookingData: SplitOrderData): Promise<any> {
    return new Promise((resolve, reject) => {
      const razorpay = new (window as any).Razorpay({
        key: process.env.REACT_APP_RAZORPAY_KEY || 'rzp_test_1DP5mmOlF5G5ag',
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'InstaServe',
        description: `Split payment for ${bookingData.service.title}`,
        image: '/logo.png',
        order_id: order.orderId,
        handler: async (response: any) => {
          try {
            // Process split payment after successful payment
            const result = await this.processSplitPayment(response.razorpay_payment_id, bookingData);
            if (result.success) {
              resolve({
                ...response,
                transferId: result.transferId,
                earnings: result.earnings
              });
            } else {
              reject(new Error(result.error || 'Failed to process split payment'));
            }
          } catch (error) {
            reject(error);
          }
        },
        prefill: {
          name: bookingData.customer.name,
          email: bookingData.customer.email,
          contact: bookingData.customer.phone || ''
        },
        notes: {
          booking_id: bookingData._id,
          service_title: bookingData.service.title,
          provider_name: bookingData.provider.name,
          split_payment: 'true'
        },
        theme: {
          color: '#10b981' // Green theme for split payments
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
        console.error('Split payment failed:', response.error);
        reject(new Error(response.error.description || 'Split payment failed'));
      });

      razorpay.open();
    });
  }

  // Complete Split Payment Flow
  async completeSplitPaymentFlow(bookingData: SplitOrderData): Promise<any> {
    try {
      // Step 1: Create split order
      const orderResult = await this.createSplitOrder(bookingData);
      
      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Failed to create split order');
      }

      // Step 2: Initialize payment with split configuration
      const paymentResult = await this.initializeSplitPayment({
        orderId: orderResult.orderId,
        amount: orderResult.amount,
        currency: 'INR',
        transfers: orderResult.transfers
      }, bookingData);

      return paymentResult;
    } catch (error) {
      console.error('Complete split payment flow error:', error);
      throw error;
    }
  }

  // Load Razorpay Script
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

export default RazorpayRouteService.getInstance();
