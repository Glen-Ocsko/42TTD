export interface StripeAccount {
  id: string;
  business_type: 'individual' | 'company' | 'non_profit';
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
    disabled_reason: string | null;
  };
  details_submitted: boolean;
}

export interface StripeCustomer {
  id: string;
  email: string;
  name: string;
  default_payment_method?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret: string;
  payment_method?: string;
  created: number;
}

export interface StripeSetupIntent {
  id: string;
  client_secret: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'canceled' | 'succeeded';
}

export interface StripeInvoice {
  id: string;
  customer: string;
  number: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  amount_due: number;
  amount_paid: number;
  currency: string;
  created: number;
  due_date: number | null;
  hosted_invoice_url: string;
  invoice_pdf: string;
  lines: {
    data: Array<{
      id: string;
      amount: number;
      currency: string;
      description: string;
    }>;
  };
}

export interface StripeTransfer {
  id: string;
  amount: number;
  currency: string;
  destination: string;
  created: number;
  description: string;
  source_transaction: string;
}

export interface StripePayout {
  id: string;
  amount: number;
  currency: string;
  arrival_date: number;
  description: string;
  status: 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';
}

export interface StripeConnectAccountLink {
  url: string;
  created: number;
  expires_at: number;
}

export interface StripeLoginLink {
  url: string;
  created: number;
}

export interface StripeBalanceTransaction {
  id: string;
  amount: number;
  currency: string;
  description: string;
  fee: number;
  net: number;
  status: 'available' | 'pending';
  type: 'charge' | 'payment' | 'payout' | 'transfer' | 'refund';
  created: number;
}

export interface StripeBalance {
  available: Array<{
    amount: number;
    currency: string;
  }>;
  pending: Array<{
    amount: number;
    currency: string;
  }>;
}

export interface PaymentSettings {
  platform_fee_percentage: number;
  payout_schedule: 'instant' | 'daily' | 'weekly' | 'monthly';
  automatic_payouts: boolean;
}

export interface Invoice {
  id: string;
  booking_id: string;
  supplier_id: string;
  user_id: string;
  amount: number;
  platform_fee: number;
  supplier_amount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issue_date: string;
  due_date: string;
  paid_date?: string;
  stripe_invoice_id?: string;
  stripe_invoice_url?: string;
  stripe_payment_intent_id?: string;
  stripe_transfer_id?: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'card';
  card_brand?: string;
  card_last4?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default: boolean;
  created_at: string;
  stripe_payment_method_id: string;
}

export interface SupplierPayment {
  id: string;
  booking_id: string;
  supplier_id: string;
  amount: number;
  platform_fee: number;
  supplier_amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  paid_at?: string;
  stripe_transfer_id?: string;
}

export interface SupplierPayout {
  id: string;
  supplier_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
  created_at: string;
  arrival_date?: string;
  stripe_payout_id?: string;
}

export interface PaymentSummary {
  total_revenue: number;
  platform_fees: number;
  supplier_earnings: number;
  pending_payouts: number;
  completed_payouts: number;
  currency: string;
}