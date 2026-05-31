/**
 * Custom hook for managing service completion code state
 */
import { useState, useEffect, useCallback } from 'react';
import socketService from '../services/socketService';
import { bookingsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { getTimeRemaining, formatTimeRemaining, isCodeExpired } from '../utils/completionCodeUtils';

interface UseCompletionCodeProps {
  bookingId: string;
  userRole: 'provider' | 'customer';
  isOpen: boolean;
}

export const useCompletionCode = ({ bookingId, userRole, isOpen }: UseCompletionCodeProps) => {
  const [completionCode, setCompletionCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [codeGenerated, setCodeGenerated] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 minutes

  // Listen for completion code from socket (for customers)
  useEffect(() => {
    if (userRole === 'customer' && isOpen) {
      const handleCompletionCodeGenerated = (data: any) => {
        if (data.bookingId === bookingId) {
          console.log('Completion code received:', data.completionCode);
          setCompletionCode(data.completionCode);
          setCodeGenerated(true);
          toast.success(`Completion code received: ${data.completionCode}`, {
            duration: 8000,
            icon: '🔢'
          });
        }
      };

      socketService.onCompletionCodeGenerated(handleCompletionCodeGenerated);

      return () => {
        socketService.offCompletionCodeGenerated(handleCompletionCodeGenerated);
      };
    }
  }, [bookingId, userRole, isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!codeGenerated || !isOpen || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          toast.error('Code expired. Please request a new code.');
          setCodeGenerated(false);
          setCompletionCode('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [codeGenerated, isOpen, timeRemaining]);

  // Generate completion code (for providers)
  const generateCode = useCallback(async () => {
    if (userRole !== 'provider') {
      toast.error('Only providers can generate completion codes');
      return;
    }

    try {
      setLoading(true);
      const response = await bookingsAPI.completeBooking(bookingId, {});
      
      if (response.completionCode) {
        setCompletionCode(response.completionCode);
        setCodeGenerated(true);
        setTimeRemaining(300);
        toast.success('Completion code generated successfully');
        return response.completionCode;
      }
    } catch (error: any) {
      console.error('Generate code error:', error);
      toast.error(error.response?.data?.message || 'Failed to generate completion code');
    } finally {
      setLoading(false);
    }
  }, [bookingId, userRole]);

  // Verify completion code (for providers)
  const verifyCode = useCallback(async (code: string) => {
    if (userRole !== 'provider') {
      toast.error('Only providers can verify completion codes');
      return false;
    }

    try {
      setLoading(true);
      const response = await bookingsAPI.verifyCompletionCode(bookingId, { completionCode: code });
      
      if (response.message) {
        toast.success(response.message);
        setCodeGenerated(false);
        setCompletionCode('');
        setInputCode('');
        return true;
      }
    } catch (error: any) {
      console.error('Verify code error:', error);
      toast.error(error.response?.data?.message || 'Failed to verify completion code');
      return false;
    } finally {
      setLoading(false);
    }
  }, [bookingId, userRole]);

  // Copy code to clipboard
  const copyCode = useCallback(async () => {
    if (!completionCode) return;
    
    try {
      await navigator.clipboard.writeText(completionCode);
      toast.success('Code copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy code');
    }
  }, [completionCode]);

  // Reset state
  const reset = useCallback(() => {
    setCompletionCode('');
    setInputCode('');
    setCodeGenerated(false);
    setTimeRemaining(300);
    setLoading(false);
  }, []);

  return {
    completionCode,
    inputCode,
    setInputCode,
    loading,
    codeGenerated,
    timeRemaining,
    formattedTimeRemaining: formatTimeRemaining(timeRemaining),
    generateCode,
    verifyCode,
    copyCode,
    reset
  };
};
