import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Ensure URL uses HTTPS protocol
const secureSupabaseUrl = supabaseUrl.replace(/^http:/, 'https:');

export const supabase = createClient(secureSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'supabase.auth.token',
  },
  global: {
    headers: {
      'X-Client-Info': 'activities-app'
    }
  }
});

// Helper function to safely execute Supabase queries that require a user ID
export const safeUserQuery = async (
  queryFn: (userId: string) => Promise<any>, 
  userId: string | null,
  fallbackValue: any = null
) => {
  // Only execute the query if userId is a valid UUID
  if (userId && typeof userId === 'string' && userId.length === 36) {
    try {
      return await queryFn(userId);
    } catch (error) {
      console.error('Error executing safe user query:', error);
      return fallbackValue;
    }
  }
  
  // Return fallback value if userId is invalid
  return fallbackValue;
};

// Add demo mode support
export const getDemoData = async (table: string, query: any) => {
  // This is where you would implement mock data handling for demo mode
  // For now, just pass through to real Supabase
  return await supabase.from(table).select(query);
};

// Enhanced fetch wrapper with better error handling
export const fetchWithErrorHandling = async (url: string, options?: RequestInit) => {
  try {
    // Ensure URL uses HTTPS
    const secureUrl = url.replace(/^http:/, 'https:');
    
    const response = await fetch(secureUrl, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Try to get error details from response
      let errorDetails = '';
      try {
        const errorData = await response.json();
        errorDetails = errorData.error || errorData.message || '';
      } catch (e) {
        // If we can't parse JSON, use status text
        errorDetails = response.statusText;
      }
      
      throw new Error(`API request failed: ${response.status} ${errorDetails}`);
    }
    
    return response;
  } catch (error) {
    // Handle network errors gracefully
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      console.error('Network error - could not connect to Supabase:', error);
      throw new Error('Could not connect to the server. Please check your internet connection and try again.');
    }
    
    // Re-throw other errors
    throw error;
  }
};