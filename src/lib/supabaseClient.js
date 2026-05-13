// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables.\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
  );
}

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost:54321',
  supabaseAnonKey ?? 'missing-key'
);

// ─── Session cache to prevent competing lock requests ───
let cachedSession = null;
let sessionPromise = null;

export async function getSession() {
  // Return cached session if already fetched
  if (cachedSession) return cachedSession;

  // If another call is already fetching, wait for that same promise
  if (sessionPromise) return sessionPromise;

  // Start a fresh fetch
  sessionPromise = supabase.auth.getSession()
    .then(({ data, error }) => {
      if (error) throw error;
      cachedSession = data.session;
      return data.session;
    })
    .finally(() => {
      sessionPromise = null;
    });

  return sessionPromise;
}

// ─── Keep cache in sync with auth changes ───
supabase.auth.onAuthStateChange((event, session) => {
  cachedSession = session;
  sessionPromise = null;
});