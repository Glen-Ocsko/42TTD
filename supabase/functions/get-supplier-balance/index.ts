import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe
import Stripe from 'npm:stripe@12.0.0';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

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
    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the supplier ID from the request
    const url = new URL(req.url);
    const supplierId = url.searchParams.get('supplierId');

    if (!supplierId) {
      return new Response(JSON.stringify({ error: 'Supplier ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the supplier details
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return new Response(JSON.stringify({ error: 'Supplier not found or not authorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if the supplier has a Stripe account
    if (!supplier.stripe_account_id) {
      return new Response(JSON.stringify({ error: 'Supplier does not have a Stripe account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: supplier.stripe_account_id,
    });

    // Get recent balance transactions
    const balanceTransactions = await stripe.balanceTransactions.list({
      limit: 10,
      stripeAccount: supplier.stripe_account_id,
    });

    // Get upcoming payouts
    const payouts = await stripe.payouts.list({
      limit: 5,
      stripeAccount: supplier.stripe_account_id,
    });

    return new Response(JSON.stringify({
      balance,
      transactions: balanceTransactions.data,
      payouts: payouts.data
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error getting supplier balance:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});