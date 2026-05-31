/**
 * Utility functions for service completion code handling
 */

export const COMPLETION_CODE_LENGTH = 6;
export const CODE_EXPIRY_MINUTES = 5;

/**
 * Format a completion code with dash (XXX-XXX format)
 */
export const formatCompletionCode = (code: string): string => {
  const cleaned = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length >= 4) {
    return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 6);
  }
  return cleaned;
};

/**
 * Validate completion code format
 */
export const validateCompletionCode = (code: string): boolean => {
  const formatted = formatCompletionCode(code);
  return formatted.length === 7 && formatted.includes('-');
};

/**
 * Check if code has expired
 */
export const isCodeExpired = (generatedAt: Date | string): boolean => {
  const generatedTime = new Date(generatedAt).getTime();
  const currentTime = Date.now();
  const expiryTime = generatedTime + CODE_EXPIRY_MINUTES * 60 * 1000;
  return currentTime > expiryTime;
};

/**
 * Get remaining time in seconds
 */
export const getTimeRemaining = (generatedAt: Date | string): number => {
  const generatedTime = new Date(generatedAt).getTime();
  const currentTime = Date.now();
  const expiryTime = generatedTime + CODE_EXPIRY_MINUTES * 60 * 1000;
  const remaining = Math.max(0, Math.floor((expiryTime - currentTime) / 1000));
  return remaining;
};

/**
 * Format time remaining as MM:SS
 */
export const formatTimeRemaining = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Copy code to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};
