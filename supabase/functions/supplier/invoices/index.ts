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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});