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

    // Get the request body
    const { supplierId, returnUrl } = await req.json();

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

    // Check if the supplier already has a Stripe account
    if (supplier.stripe_account_id) {
      // Create a login link for the existing account
      const loginLink = await stripe.accounts.createLoginLink(supplier.stripe_account_id);
      
      return new Response(JSON.stringify({ url: loginLink.url }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'GB', // Default to UK
      email: supplier.contact_email,
      business_type: supplier.supplier_type === 'business' ? 'company' : 
                    supplier.supplier_type === 'charity' ? 'non_profit' : 'individual',
      business_profile: {
        name: supplier.supplier_name,
        url: supplier.website_url,
      },
      metadata: {
        supplier_id: supplier.id,
        user_id: user.id
      },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    // Update the supplier record with the Stripe account ID
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({
        stripe_account_id: account.id,
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        stripe_details_submitted: account.details_submitted
      })
      .eq('id', supplierId);

    if (updateError) {
      throw updateError;
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${returnUrl}?refresh=true`,
      return_url: `${returnUrl}?success=true`,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error creating Connect account:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});