import { useEffect, useRef, useCallback } from 'react';

/**
 * Polling hook that repeatedly calls a callback at specified interval
 * @param {Function} callback - Function to call on each poll
 * @param {number} intervalMs - Interval in milliseconds (default 5000)
 * @param {Array} dependencies - Dependencies that trigger restart of polling (default [])
 * @param {Object} options - Additional options
 * @param {boolean} options.immediate - Whether to call immediately on mount (default true)
 * @param {boolean} options.enabled - Whether polling is enabled (default true)
 */
export const usePolling = (callback, intervalMs = 5000, dependencies = [], options = {}) => {
  const { immediate = true, enabled = true } = options;
  const savedCallback = useRef();
  const intervalRef = useRef(null);
  
  // Save the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  // Function to execute the callback
  const tick = useCallback(async () => {
    if (savedCallback.current && enabled) {
      try {
        await savedCallback.current();
      } catch (err) {
        console.error('Polling callback error:', err);
      }
    }
  }, [enabled]);
  
  // Start/stop polling based on dependencies and enabled flag
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    // Immediate first call
    if (immediate) {
      tick();
    }
    
    // Set up interval
    intervalRef.current = setInterval(tick, intervalMs);
    
    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, immediate, tick, ...dependencies]);
  
  // Manual trigger function
  const forceRefresh = useCallback(() => {
    tick();
  }, [tick]);
  
  return { forceRefresh };
};

/**
 * Simplified polling hook that returns a refetch function
 */
export const usePollingSimple = (fetchFn, intervalMs = 5000, enabled = true) => {
  const intervalRef = useRef(null);
  
  useEffect(() => {
    if (!enabled) return;
    
    fetchFn();
    intervalRef.current = setInterval(fetchFn, intervalMs);
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchFn, intervalMs, enabled]);
};