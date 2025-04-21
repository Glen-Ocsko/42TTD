import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useUserRole } from '../contexts/UserRoleContext';
import { SupplierAd } from '../types/supplier';
import { 
  ExternalLink, 
  MapPin, 
  Tag, 
  X, 
  Flag, 
  Percent,
  Crown,
  Medal,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { Dialog } from '@headlessui/react';
import MessageSupplierButton from './MessageSupplierButton';
import BookingButton from './BookingButton';

interface SupplierAdCardProps {
  ad: SupplierAd;
  onHide?: () => void;
  compact?: boolean;
}

const FEEDBACK_REASONS = [
  'Not relevant to me',
  'Already tried this',
  'Too expensive',
  'Not available in my area',
  'Not interested in this activity',
  'Seen too many times',
  'Other'
];

export default function SupplierAdCard({ ad, onHide, compact = false }: SupplierAdCardProps) {
  const navigate = useNavigate();
  const { userId } = useCurrentUser();
  const { role } = useUserRole();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    try {
      // Increment click count
      await supabase.rpc('increment_ad_clicks', { ad_id: ad.id });
      
      // Open link in new tab
      window.open(ad.cta_link, '_blank');
    } catch (error) {
      console.error('Error tracking ad click:', error);
      // Still open the link even if tracking fails
      window.open(ad.cta_link, '_blank');
    }
  };

  const handleHide = () => {
    setShowFeedbackModal(true);
  };

  const handleReport = () => {
    setFeedbackReason('Report this ad');
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!feedbackReason || !ad.id || !userId) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .insert({
          ad_id: ad.id,
          user_id: userId,
          reason: feedbackReason,
          details: feedbackDetails
        });

      if (error) throw error;
      
      setShowFeedbackModal(false);
      if (onHide) onHide();
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine which discount to show based on user role
  const getDiscount = () => {
    if (!ad.member_discount) return null;
    
    if (role === 'pro' && ad.member_discount.pro !== '0%') {
      return {
        amount: ad.member_discount.pro,
        icon: <Medal className="h-4 w-4 text-purple-500" />
      };
    }
    
    if (role === 'premium' && ad.member_discount.premium !== '0%') {
      return {
        amount: ad.member_discount.premium,
        icon: <Crown className="h-4 w-4 text-amber-500" />
      };
    }
    
    if (ad.member_discount.all !== '0%') {
      return {
        amount: ad.member_discount.all,
        icon: <Percent className="h-4 w-4 text-blue-500" />
      };
    }
    
    return null;
  };

  const discount = getDiscount();

  if (compact) {
    return (
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="absolute top-2 right-2 flex gap-1">
          <button 
            onClick={handleHide}
            className="p-1 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-700"
            title="Hide this ad"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="flex items-start gap-3">
          {ad.supplier?.logo_url && (
            <img 
              src={ad.supplier.logo_url} 
              alt={ad.supplier.supplier_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 font-medium mb-1">Sponsored</div>
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{ad.title}</h3>
            
            {discount && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium mb-2">
                {discount.icon}
                <span>{discount.amount} off</span>
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={handleClick}
                className="flex-1 text-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {ad.cta_label}
              </button>
              
              {ad.supplier && (
                <MessageSupplierButton
                  supplierId={ad.supplier.user_id}
                  adId={ad.id}
                  adTitle={ad.title}
                  buttonClassName="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  iconOnly={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl overflow-hidden border border-blue-100">
      <div className="absolute top-3 right-3 flex gap-1 z-10">
        <button 
          onClick={handleHide}
          className="p-1.5 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-700"
          title="Hide this ad"
        >
          <X className="h-4 w-4" />
        </button>
        <button 
          onClick={handleReport}
          className="p-1.5 bg-white/80 hover:bg-white rounded-full text-gray-500 hover:text-gray-700"
          title="Report this ad"
        >
          <Flag className="h-4 w-4" />
        </button>
      </div>
      
      {ad.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img 
            src={ad.image_url} 
            alt={ad.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
            Sponsored
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start gap-3 mb-3">
          {ad.supplier?.logo_url && (
            <img 
              src={ad.supplier.logo_url} 
              alt={ad.supplier.supplier_name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          )}
          
          <div>
            <h3 className="font-bold text-lg text-gray-900">{ad.title}</h3>
            <p className="text-sm text-gray-600">{ad.supplier?.supplier_name}</p>
          </div>
        </div>
        
        <p className="text-gray-700 mb-3">{ad.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {ad.activity_tags?.map(tag => (
            <span 
              key={tag} 
              className="inline-flex items-center gap-1 px-2 py-1 bg-white text-gray-700 rounded-full text-xs"
            >
              <Tag className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-1 text-gray-600 text-sm mb-4">
          <MapPin className="h-4 w-4" />
          <span>{ad.location}</span>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {discount && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
              {discount.icon}
              <span>{discount.amount} off</span>
            </div>
          )}
          
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            {ad.supplier && (
              <>
                <MessageSupplierButton
                  supplierId={ad.supplier.user_id}
                  adId={ad.id}
                  adTitle={ad.title}
                  buttonText="Message"
                  buttonClassName="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                />
                
                <BookingButton
                  supplierId={ad.supplier.id}
                  adId={ad.id}
                  adTitle={ad.title}
                  buttonClassName="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                />
              </>
            )}
            
            <button
              onClick={handleClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {ad.cta_label}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      <Dialog
        open={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium">
                {feedbackReason === 'Report this ad' ? 'Report Ad' : 'Hide Ad'}
              </Dialog.Title>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {feedbackReason === 'Report this ad' 
                    ? 'Why are you reporting this ad?' 
                    : 'Why don\'t you want to see this ad?'}
                </label>
                <select
                  value={feedbackReason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  {feedbackReason === 'Report this ad' ? (
                    <>
                      <option value="Inappropriate content">Inappropriate content</option>
                      <option value="Misleading information">Misleading information</option>
                      <option value="Scam or fraud">Scam or fraud</option>
                      <option value="Other issue">Other issue</option>
                    </>
                  ) : (
                    FEEDBACK_REASONS.map((reason) => (
                      <option key={reason} value={reason}>
                        {reason}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={feedbackDetails}
                  onChange={(e) => setFeedbackDetails(e.target.value)}
                  rows={3}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us more..."
                />
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={!feedbackReason || submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}