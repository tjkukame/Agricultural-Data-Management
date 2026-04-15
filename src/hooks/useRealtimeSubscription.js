import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Subscribe to real-time changes on a Supabase table
 * @param {string} table - Table name
 * @param {string} filterColumn - Column to filter by (optional)
 * @param {string|number} filterValue - Value to match (optional)
 * @param {Function} onEvent - Callback when event occurs (receives payload)
 * @param {string} event - 'INSERT', 'UPDATE', 'DELETE', or '*' (default)
 * @param {Object} options - Additional options
 */
export const useRealtimeSubscription = (
  table,
  filterColumn,
  filterValue,
  onEvent,
  event = '*',
  options = {}
) => {
  const { enabled = true } = options;
  const onEventRef = useRef(onEvent);
  
  // Keep latest callback reference
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);
  
  useEffect(() => {
    if (!enabled) return;
    if (!table) return;
    if (filterColumn && !filterValue) return;
    
    // Build filter
    const filter = filterColumn && filterValue 
      ? `${filterColumn}=eq.${filterValue}`
      : undefined;
    
    const channel = supabase
      .channel(`${table}_changes_${filterValue || 'all'}`)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
          filter
        },
        (payload) => {
          if (onEventRef.current) {
            onEventRef.current(payload);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, filterColumn, filterValue, event, enabled]);
};

/**
 * Subscribe to multiple tables at once
 * @param {Array} subscriptions - Array of { table, filterColumn, filterValue, onEvent, event }
 * @param {Object} options - { enabled }
 */
export const useMultipleRealtimeSubscriptions = (subscriptions, options = {}) => {
  const { enabled = true } = options;
  const subscriptionsRef = useRef(subscriptions);
  
  useEffect(() => {
    subscriptionsRef.current = subscriptions;
  }, [subscriptions]);
  
  useEffect(() => {
    if (!enabled) return;
    
    const channels = [];
    
    subscriptionsRef.current.forEach((sub, index) => {
      if (sub.table) {
        const filter = sub.filterColumn && sub.filterValue 
          ? `${sub.filterColumn}=eq.${sub.filterValue}`
          : undefined;
        
        const channel = supabase
          .channel(`${sub.table}_changes_${index}`)
          .on(
            'postgres_changes',
            {
              event: sub.event || '*',
              schema: 'public',
              table: sub.table,
              filter
            },
            (payload) => {
              if (sub.onEvent) sub.onEvent(payload);
            }
          )
          .subscribe();
        
        channels.push(channel);
      }
    });
    
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [enabled]);
};

/**
 * Broadcast messages between clients (for collaborative features)
 * @param {string} channelName - Name of the broadcast channel
 * @param {Function} onMessage - Callback when message received
 */
export const useBroadcast = (channelName, onMessage) => {
  useEffect(() => {
    const channel = supabase.channel(channelName);
    
    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        if (onMessage) onMessage(payload);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, onMessage]);
  
  const sendMessage = (message) => {
    supabase.channel(channelName).send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });
  };
  
  return { sendMessage };
};