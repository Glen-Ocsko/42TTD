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
    const { bookingId, paymentMethodId } = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Booking ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, suppliers(*)')
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (bookingError || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found or not authorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if the booking is already paid
    if (booking.stripe_payment_id) {
      return new Response(JSON.stringify({ error: 'Booking is already paid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get or create a customer
    let customerId;
    const { data: customerData } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (customerData?.stripe_customer_id) {
      customerId = customerData.stripe_customer_id;
    } else {
      // Get user profile for customer creation
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      // Create a new customer
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || 'Customer',
        metadata: {
          user_id: user.id
        }
      });

      customerId = customer.id;

      // Save the customer ID to the user's profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Attach the payment method to the customer if provided
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // Calculate the amount in cents
    const amount = Math.round(booking.price_total * 100);
    const platformFee = Math.round(booking.platform_fee * 100);
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: booking.currency.toLowerCase(),
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: !!paymentMethodId,
      automatic_payment_methods: !paymentMethodId ? { enabled: true } : undefined,
      metadata: {
        booking_id: booking.id,
        supplier_id: booking.supplier_id,
        user_id: user.id
      },
      application_fee_amount: platformFee,
      transfer_data: booking.suppliers.stripe_account_id ? {
        destination: booking.suppliers.stripe_account_id,
      } : undefined,
      description: `Booking for ${booking.suppliers.supplier_name}`,
    });

    // Update the booking with the payment intent ID
    await supabase
      .from('bookings')
      .update({
        stripe_payment_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    // Create an invoice record
    await supabase
      .from('invoices')
      .insert({
        booking_id: booking.id,
        supplier_id: booking.supplier_id,
        user_id: user.id,
        amount: booking.price_total,
        platform_fee: booking.platform_fee,
        supplier_amount: booking.price_total - booking.platform_fee,
        currency: booking.currency,
        status: 'issued',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Due in 7 days
        stripe_payment_intent_id: paymentIntent.id
      });

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});