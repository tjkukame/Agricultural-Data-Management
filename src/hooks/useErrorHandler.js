import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleError = useCallback((err) => {
    let message = 'An unexpected error occurred. Please try again.';
    
    if (typeof err === 'string') {
      message = err;
    } else if (err?.message) {
      message = err.message;
    }
    
    // Supabase specific error codes
    if (err?.code) {
      switch (err.code) {
        case '23505':
          message = 'Duplicate entry. This record already exists.';
          break;
        case '42501':
          message = 'You do not have permission to perform this action.';
          break;
        case 'PGRST301':
          message = 'Database connection error. Please check your internet and try again.';
          break;
        case '23503':
          message = 'This record is linked to other data and cannot be deleted.';
          break;
        case '42P01':
          message = 'System configuration error. Please contact support.';
          break;
        default:
          message = err.message || message;
      }
    }
    
    // Network errors
    if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
      message = 'Network error. Please check your internet connection.';
    }
    
    setError({ message, original: err });
    
    // Auto-clear after 5 seconds
    setTimeout(() => clearError(), 5000);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback(async (promise, errorContext = '') => {
    setLoading(true);
    clearError();
    try {
      const result = await promise;
      return result;
    } catch (err) {
      const contextMsg = errorContext ? `${errorContext}: ` : '';
      handleError(new Error(`${contextMsg}${err.message}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  return { error, loading, setLoading, handleError, clearError, withErrorHandling };
};