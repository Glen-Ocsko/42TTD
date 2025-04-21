import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Building2,
  User,
  Mail,
  Globe,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Activity
} from 'lucide-react';

interface Activity {
  id: string;
  title: string;
}

export default function ContactSupplier() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activityId = searchParams.get('activity_id');

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    websiteUrl: '',
    message: ''
  });

  useEffect(() => {
    if (activityId) {
      loadActivity();
    } else {
      setLoading(false);
    }
  }, [activityId]);

  const loadActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title')
        .eq('id', activityId)
        .single();

      if (error) throw error;
      setActivity(data);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError('Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Basic validation
      if (!formData.businessName.trim()) throw new Error('Business name is required');
      if (!formData.contactName.trim()) throw new Error('Contact name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.message.trim()) throw new Error('Message is required');

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Website URL validation (if provided)
      if (formData.websiteUrl && !formData.websiteUrl.startsWith('http')) {
        formData.websiteUrl = `https://${formData.websiteUrl}`;
      }

      const { error: submitError } = await supabase
        .from('supplier_requests')
        .insert({
          activity_id: activityId,
          business_name: formData.businessName.trim(),
          contact_name: formData.contactName.trim(),
          email: formData.email.trim(),
          website_url: formData.websiteUrl.trim() || null,
          message: formData.message.trim()
        });

      if (submitError) throw submitError;
      setSubmitted(true);

    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-success-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Thank You!</h1>
          <p className="text-xl text-gray-600 mb-8">
            Your request has been submitted successfully. We'll review your information and get back to you soon.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/activities"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              <Activity className="h-5 w-5" />
              Browse More Activities
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
      >
        <ArrowLeft className="h-5 w-5" />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-2">Promote Your Activity</h1>
        
        {activity && (
          <p className="text-lg text-gray-600 mb-6">
            You're contacting us about: <span className="font-medium">{activity.title}</span>
          </p>
        )}

        {error && (
          <div className="flex items-center gap-2 text-danger-600 bg-danger-50 p-4 rounded-lg mb-6">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
              Business Name
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your business name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleInputChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL (optional)
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="url"
                id="websiteUrl"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 text-gray-400" />
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={4}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Tell us about your business and how you'd like to promote this activity..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}