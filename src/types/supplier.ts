import { Database } from './supabase';

export type SupplierType = 'business' | 'peer' | 'charity';

export interface Supplier {
  id: string;
  user_id: string;
  supplier_name: string;
  supplier_type: SupplierType;
  description: string;
  location: string;
  website_url: string;
  contact_email: string;
  phone_number?: string;
  logo_url?: string;
  approved: boolean;
  trusted_supplier: boolean;
  created_at: string;
}

export interface SupplierAd {
  id: string;
  supplier_id: string;
  title: string;
  description: string;
  image_url?: string;
  cta_label: string;
  cta_link: string;
  activity_tags: string[];
  linked_activities?: string[];
  linked_categories?: string[];
  priority_level?: number;
  location: string;
  approved: boolean;
  highlight_discount: boolean;
  member_discount: {
    all: string;
    premium: string;
    pro: string;
  };
  clicks: number;
  impressions: number;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface SupplierFormData {
  supplier_name: string;
  supplier_type: SupplierType;
  description: string;
  location: string;
  website_url: string;
  contact_email: string;
  phone_number?: string;
  logo_url?: string;
}

export interface SupplierAdFormData {
  title: string;
  description: string;
  image_url?: string;
  cta_label: string;
  cta_link: string;
  activity_tags: string[];
  linked_activities?: string[];
  linked_categories?: string[];
  location: string;
  highlight_discount: boolean;
  member_discount: {
    all: string;
    premium: string;
    pro: string;
  };
}

export interface AdFeedback {
  ad_id: string;
  user_id: string;
  reason: string;
  details?: string;
  created_at: string;
}

export interface AdStats {
  impressions: number;
  clicks: number;
  ctr: number;
  bookings: number;
  inquiries: number;
  revenue: number;
  timeRange: string;
}

export interface AdBooking {
  id: string;
  ad_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface AdInquiry {
  id: string;
  ad_id: string;
  user_id: string;
  message: string;
  status: 'new' | 'replied' | 'closed';
  created_at: string;
}