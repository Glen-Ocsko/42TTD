import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';
import { createHash } from 'npm:crypto';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the API token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiToken = authHeader.replace('Bearer ', '');
    
    // Hash the token for verification
    const tokenHash = createHash('sha256').update(apiToken).digest('hex');
    
    // Verify the token and get the supplier ID
    const { data: tokenData, error: tokenError } = await supabase
      .from('supplier_api_tokens')
      .select('supplier_id')
      .eq('token_hash', tokenHash)
      .is('expires_at', null)
      .single();
    
    if (tokenError || !tokenData) {
      return new Response(JSON.stringify({ error: 'Invalid or expired API token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supplierId = tokenData.supplier_id;
    
    // Update last_used_at
    await supabase
      .from('supplier_api_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash);
    
    // Parse query parameters
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get('status');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    
    // Get bookings for the supplier
    const { data: bookings, error: bookingsError } = await supabase.rpc('get_supplier_bookings', {
      supplier_id: supplierId,
      status_filter: statusFilter
    });
    
    if (bookingsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Filter by date if provided
    let filteredBookings = bookings;
    if (startDate) {
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredBookings = filteredBookings.filter(booking => 
        new Date(booking.date) <= new Date(endDate)
      );
    }
    
    return new Response(JSON.stringify({
      data: filteredBookings,
      count: filteredBookings.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});