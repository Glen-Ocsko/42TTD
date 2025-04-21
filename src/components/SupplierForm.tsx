import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { SupplierFormData, SupplierType } from '../types/supplier';
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Image,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface SupplierFormProps {
  onSubmitSuccess?: () => void;
  initialData?: SupplierFormData;
  isEditing?: boolean;
}

export default function SupplierForm({ 
  onSubmitSuccess, 
  initialData,
  isEditing = false
}: SupplierFormProps) {
  const { userId } = useCurrentUser();
  const [formData, setFormData] = useState<SupplierFormData & { currency?: string }>({
    supplier_name: '',
    supplier_type: 'business',
    description: '',
    location: '',
    website_url: '',
    contact_email: '',
    phone_number: '',
    logo_url: '',
    currency: 'GBP'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        currency: initialData.currency || 'GBP'
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      // Validate website URL format
      if (formData.website_url && !formData.website_url.startsWith('http')) {
        formData.website_url = `https://${formData.website_url}`;
      }

      if (isEditing) {
        // Update existing supplier
        const { error: updateError } = await supabase
          .from('suppliers')
          .update({
            ...formData,
            approved: false // Reset approval status on edit
          })
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } else {
        // Create new supplier
        const { error: insertError } = await supabase
          .from('suppliers')
          .insert({
            user_id: userId,
            ...formData
          });

        if (insertError) throw insertError;
      }

      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      console.error('Error submitting supplier form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>
            {isEditing 
              ? 'Your supplier profile has been updated and is pending approval.' 
              : 'Your supplier application has been submitted and is pending approval.'}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="supplier_name" className="block text-sm font-medium text-gray-700 mb-1">
          Supplier Name
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="supplier_name"
            name="supplier_name"
            value={formData.supplier_name}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your business or organization name"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="supplier_type" className="block text-sm font-medium text-gray-700 mb-1">
          Supplier Type
        </label>
        <select
          id="supplier_type"
          name="supplier_type"
          value={formData.supplier_type}
          onChange={handleChange}
          className="pl-3 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="business">Business</option>
          <option value="peer">Individual / Peer</option>
          <option value="charity">Charity / Non-profit</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 text-gray-400" />
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Tell us about your business or organization"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Location
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="City, Country"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
          Preferred Currency
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="GBP">British Pound (£)</option>
            <option value="USD">US Dollar ($)</option>
            <option value="EUR">Euro (€)</option>
            <option value="CAD">Canadian Dollar (C$)</option>
            <option value="AUD">Australian Dollar (A$)</option>
            <option value="NZD">New Zealand Dollar (NZ$)</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-1">
          Website URL
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            id="website_url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 mb-1">
          Contact Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="email"
            id="contact_email"
            name="contact_email"
            value={formData.contact_email}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="contact@example.com"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number (optional)
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="tel"
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+44 123 456 7890"
          />
        </div>
      </div>

      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 mb-1">
          Logo URL (optional)
        </label>
        <div className="relative">
          <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="url"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/logo.png"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          isEditing ? 'Update Supplier Profile' : 'Submit Application'
        )}
      </button>
    </form>
  );
}