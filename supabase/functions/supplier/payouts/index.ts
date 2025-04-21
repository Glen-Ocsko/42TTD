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
    
    // Get payouts for the supplier
    const { data: payouts, error: payoutsError } = await supabase
      .from('supplier_payouts')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    if (payoutsError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch payouts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Filter by status if provided
    let filteredPayouts = payouts;
    if (statusFilter) {
      filteredPayouts = filteredPayouts.filter(payout => 
        payout.status === statusFilter
      );
    }
    
    // Filter by date if provided
    if (startDate) {
      filteredPayouts = filteredPayouts.filter(payout => 
        new Date(payout.created_at) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredPayouts = filteredPayouts.filter(payout => 
        new Date(payout.created_at) <= new Date(endDate)
      );
    }
    
    return new Response(JSON.stringify({
      data: filteredPayouts,
      count: filteredPayouts.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching payouts:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});