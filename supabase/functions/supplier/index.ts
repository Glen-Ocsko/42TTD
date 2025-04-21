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
    
    // Parse the URL path to determine which endpoint to call
    const url = new URL(req.url);
    const path = url.pathname.split('/').filter(Boolean);
    
    // The path should be like /functions/v1/supplier/[endpoint]
    // So we need to check if there's an endpoint specified
    if (path.length < 3) {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const endpoint = path[2]; // The endpoint is the third segment
    
    // Parse query parameters
    const statusFilter = url.searchParams.get('status');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    
    // Handle different endpoints
    switch (endpoint) {
      case 'bookings':
        return await handleBookings(supplierId, statusFilter, startDate, endDate, corsHeaders);
      case 'invoices':
        return await handleInvoices(supplierId, statusFilter, startDate, endDate, corsHeaders);
      case 'payouts':
        return await handlePayouts(supplierId, statusFilter, startDate, endDate, corsHeaders);
      default:
        return new Response(JSON.stringify({ error: 'Unknown endpoint' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (err) {
    console.error('Error processing request:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle bookings endpoint
async function handleBookings(
  supplierId: string, 
  statusFilter: string | null, 
  startDate: string | null, 
  endDate: string | null,
  headers: Record<string, string>
) {
  // Get bookings for the supplier
  const { data: bookings, error: bookingsError } = await supabase.rpc('get_supplier_bookings', {
    supplier_id: supplierId,
    status_filter: statusFilter
  });
  
  if (bookingsError) {
    return new Response(JSON.stringify({ error: 'Failed to fetch bookings' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
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
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// Handle invoices endpoint
async function handleInvoices(
  supplierId: string, 
  statusFilter: string | null, 
  startDate: string | null, 
  endDate: string | null,
  headers: Record<string, string>
) {
  // Get invoices for the supplier
  const { data: invoices, error: invoicesError } = await supabase
    .from('invoices')
    .select(`
      *,
      booking:bookings (
        user:profiles (username, email),
        ad:supplier_ads (title),
        activity:activities (title)
      )
    `)
    .eq('supplier_id', supplierId)
    .order('issue_date', { ascending: false });
  
  if (invoicesError) {
    return new Response(JSON.stringify({ error: 'Failed to fetch invoices' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
  
  // Filter by status if provided
  let filteredInvoices = invoices;
  if (statusFilter) {
    filteredInvoices = filteredInvoices.filter(invoice => 
      invoice.status === statusFilter
    );
  }
  
  // Filter by date if provided
  if (startDate) {
    filteredInvoices = filteredInvoices.filter(invoice => 
      new Date(invoice.issue_date) >= new Date(startDate)
    );
  }
  if (endDate) {
    filteredInvoices = filteredInvoices.filter(invoice => 
      new Date(invoice.issue_date) <= new Date(endDate)
    );
  }
  
  // Transform data for API response
  const transformedInvoices = filteredInvoices.map(invoice => ({
    id: invoice.id,
    booking_id: invoice.booking_id,
    amount: invoice.amount,
    platform_fee: invoice.platform_fee,
    supplier_amount: invoice.supplier_amount,
    currency: invoice.currency,
    status: invoice.status,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    paid_date: invoice.paid_date,
    stripe_invoice_url: invoice.stripe_invoice_url,
    customer: invoice.booking?.user?.username || 'Unknown',
    customer_email: invoice.booking?.user?.email,
    description: invoice.booking?.ad?.title || invoice.booking?.activity?.title || 'Booking'
  }));
  
  return new Response(JSON.stringify({
    data: transformedInvoices,
    count: transformedInvoices.length
  }), {
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}

// Handle payouts endpoint
async function handlePayouts(
  supplierId: string, 
  statusFilter: string | null, 
  startDate: string | null, 
  endDate: string | null,
  headers: Record<string, string>
) {
  // Get payouts for the supplier
  const { data: payouts, error: payoutsError } = await supabase
    .from('supplier_payouts')
    .select('*')
    .eq('supplier_id', supplierId)
    .order('created_at', { ascending: false });
  
  if (payoutsError) {
    return new Response(JSON.stringify({ error: 'Failed to fetch payouts' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
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
    headers: { ...headers, 'Content-Type': 'application/json' },
  });
}