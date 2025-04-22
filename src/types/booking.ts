export interface Booking {
  id: string;
  user_id: string;
  supplier_id: string;
  ad_id?: string;
  activity_id?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  message?: string;
  date: string;
  time?: string;
  created_at: string;
  updated_at: string;
  price_total: number;
  currency: 'GBP' | 'USD' | 'EUR' | 'CAD' | 'AUD' | 'NZD';
  platform_fee: number;
  stripe_payment_id?: string;
  stripe_invoice_url?: string;
}

export interface SupplierBooking {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  ad_id?: string;
  ad_title?: string;
  activity_id?: string;
  activity_title?: string;
  activity_display_title?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  message?: string;
  date: string;
  time?: string;
  price_total: number;
  currency: 'GBP' | 'USD' | 'EUR' | 'CAD' | 'AUD' | 'NZD';
  platform_fee: number;
  created_at: string;
}

export interface UserBooking {
  id: string;
  supplier_id: string;
  supplier_name: string;
  ad_id?: string;
  ad_title?: string;
  activity_id?: string;
  activity_title?: string;
  activity_display_title?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  message?: string;
  date: string;
  time?: string;
  price_total: number;
  currency: 'GBP' | 'USD' | 'EUR' | 'CAD' | 'AUD' | 'NZD';
  created_at: string;
  stripe_invoice_url?: string;
}

export interface AvailabilityDate {
  date: string;
  available: boolean;
  has_bookings: boolean;
  note?: string;
}

export interface BookingFormData {
  supplier_id: string;
  ad_id?: string;
  activity_id?: string;
  date: string;
  time?: string;
  message?: string;
  price_total: number;
  currency: 'GBP' | 'USD' | 'EUR' | 'CAD' | 'AUD' | 'NZD';
}

export interface SupplierAvailability {
  id: string;
  supplier_id: string;
  date: string;
  available: boolean;
  note?: string;
  created_at: string;
}