import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize Stripe
import Stripe from 'npm:stripe@12.0.0';
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  try {
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature provided', { status: 400 });
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'transfer.created':
        await handleTransferCreated(event.data.object);
        break;
      case 'transfer.failed':
        await handleTransferFailed(event.data.object);
        break;
      case 'payout.created':
        await handlePayoutCreated(event.data.object);
        break;
      case 'payout.paid':
        await handlePayoutPaid(event.data.object);
        break;
      case 'payout.failed':
        await handlePayoutFailed(event.data.object);
        break;
      case 'account.updated':
        await handleAccountUpdated(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(`Error processing webhook: ${err.message}`);
    return new Response(`Error processing webhook: ${err.message}`, { status: 500 });
  }
});

// Handler functions for different webhook events
async function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  try {
    // Get the booking ID from the metadata
    const bookingId = paymentIntent.metadata.booking_id;
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update the booking status to confirmed
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_payment_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingError) {
      throw bookingError;
    }

    // Get the booking details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, suppliers(*)')
      .eq('id', bookingId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Check if the supplier has a Stripe account
    if (booking.suppliers.stripe_account_id) {
      // Calculate the platform fee and supplier amount
      const platformFee = Math.round(booking.price_total * 10); // 10% fee, in cents
      const supplierAmount = Math.round(booking.price_total * 90); // 90% to supplier, in cents

      // Create a transfer to the supplier's connected account
      const transfer = await stripe.transfers.create({
        amount: supplierAmount,
        currency: booking.currency.toLowerCase(),
        destination: booking.suppliers.stripe_account_id,
        transfer_group: bookingId,
        source_transaction: paymentIntent.charges.data[0].id,
        metadata: {
          booking_id: bookingId,
          supplier_id: booking.supplier_id
        }
      });

      // Create or update the supplier payment record
      const { error: paymentError } = await supabase
        .from('supplier_payments')
        .upsert({
          booking_id: bookingId,
          supplier_id: booking.supplier_id,
          amount: booking.price_total,
          platform_fee: booking.platform_fee,
          supplier_amount: booking.price_total - booking.platform_fee,
          currency: booking.currency,
          status: 'paid',
          created_at: new Date().toISOString(),
          paid_at: new Date().toISOString(),
          stripe_transfer_id: transfer.id
        });

      if (paymentError) {
        throw paymentError;
      }
    }

  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);
  
  try {
    // Get the booking ID from the metadata
    const bookingId = paymentIntent.metadata.booking_id;
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update the booking status to pending (payment failed)
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'pending',
        stripe_payment_id: paymentIntent.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error handling payment intent failed:', error);
  }
}

async function handleInvoicePaid(invoice) {
  console.log('Invoice paid:', invoice.id);
  
  try {
    // Find the booking associated with this invoice
    const { data: invoiceData, error: fetchError } = await supabase
      .from('invoices')
      .select('booking_id')
      .eq('stripe_invoice_id', invoice.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (invoiceData) {
      // Update the invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString()
        })
        .eq('stripe_invoice_id', invoice.id);

      if (updateError) {
        throw updateError;
      }

      // Update the booking with the invoice URL
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          stripe_invoice_url: invoice.hosted_invoice_url,
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceData.booking_id);

      if (bookingError) {
        throw bookingError;
      }
    }
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  try {
    // Find the booking associated with this invoice
    const { data: invoiceData, error: fetchError } = await supabase
      .from('invoices')
      .select('booking_id')
      .eq('stripe_invoice_id', invoice.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (invoiceData) {
      // Update the invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({
          status: 'issued' // Reset to issued so user can try again
        })
        .eq('stripe_invoice_id', invoice.id);

      if (updateError) {
        throw updateError;
      }
    }
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}

async function handleTransferCreated(transfer) {
  console.log('Transfer created:', transfer.id);
  
  try {
    // Get the booking ID from the metadata
    const bookingId = transfer.metadata.booking_id;
    const supplierId = transfer.metadata.supplier_id;
    
    if (!bookingId || !supplierId) {
      console.error('Missing booking_id or supplier_id in transfer metadata');
      return;
    }

    // Update the supplier payment record
    const { error } = await supabase
      .from('supplier_payments')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_transfer_id: transfer.id
      })
      .eq('booking_id', bookingId)
      .eq('supplier_id', supplierId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error handling transfer created:', error);
  }
}

async function handleTransferFailed(transfer) {
  console.log('Transfer failed:', transfer.id);
  
  try {
    // Get the booking ID from the metadata
    const bookingId = transfer.metadata.booking_id;
    const supplierId = transfer.metadata.supplier_id;
    
    if (!bookingId || !supplierId) {
      console.error('Missing booking_id or supplier_id in transfer metadata');
      return;
    }

    // Update the supplier payment record
    const { error } = await supabase
      .from('supplier_payments')
      .update({
        status: 'failed',
        stripe_transfer_id: transfer.id
      })
      .eq('booking_id', bookingId)
      .eq('supplier_id', supplierId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error handling transfer failed:', error);
  }
}

async function handlePayoutCreated(payout) {
  console.log('Payout created:', payout.id);
  
  try {
    // Get the supplier ID from the metadata
    const supplierId = payout.metadata?.supplier_id;
    
    if (!supplierId) {
      console.error('No supplier_id in payout metadata');
      return;
    }

    // Create a supplier payout record
    const { error } = await supabase
      .from('supplier_payouts')
      .insert({
        supplier_id: supplierId,
        amount: payout.amount / 100, // Convert from cents
        currency: payout.currency.toUpperCase(),
        status: 'pending',
        created_at: new Date().toISOString(),
        arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
        stripe_payout_id: payout.id
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error handling payout created:', error);
  }
}

async function handlePayoutPaid(payout) {
  console.log('Payout paid:', payout.id);
  
  try {
    // Update the supplier payout record
    const { error } = await supabase
      .from('supplier_payouts')
      .update({
        status: 'paid',
        arrival_date: new Date(payout.arrival_date * 1000).toISOString()
      })
      .eq('stripe_payout_id', payout.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error handling payout paid:', error);
  }
}

async function handlePayoutFailed(payout) {
  console.log('Payout failed:', payout.id);
  
  try {
    // Update the supplier payout record
    const { error } = await supabase
      .from('supplier_payouts')
      .update({
        status: 'failed'
      })
      .eq('stripe_payout_id', payout.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error handling payout failed:', error);
  }
}

async function handleAccountUpdated(account) {
  console.log('Account updated:', account.id);
  
  try {
    // Find the supplier with this Stripe account ID
    const { data: suppliers, error: fetchError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('stripe_account_id', account.id);

    if (fetchError) {
      throw fetchError;
    }

    if (suppliers && suppliers.length > 0) {
      // Update the supplier record with the latest account status
      const { error: updateError } = await supabase
        .from('suppliers')
        .update({
          stripe_charges_enabled: account.charges_enabled,
          stripe_payouts_enabled: account.payouts_enabled,
          stripe_details_submitted: account.details_submitted,
          stripe_requirements: account.requirements
        })
        .eq('stripe_account_id', account.id);

      if (updateError) {
        throw updateError;
      }
    }
  } catch (error) {
    console.error('Error handling account updated:', error);
  }
}