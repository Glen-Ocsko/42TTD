import React, { useState, useEffect } from 'react';
import { supabase, safeUserQuery } from '../lib/supabase';
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
  Loader2,
  WifiOff
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface ActivityAdBlockProps {
  activityId: string;
  activityTitle: string;
  activityTags?: string[];
  maxAds?: number;
}

export default function ActivityAdBlock({ 
  activityId, 
  activityTitle, 
  activityTags = [], 
  maxAds = 3 
}: ActivityAdBlockProps) {
  const { userId } = useCurrentUser();
  const { role } = useUserRole();
  const [ads, setAds] = useState<SupplierAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [hiddenAds, setHiddenAds] = useState<string[]>([]);
  const [selectedAd, setSelectedAd] = useState<SupplierAd | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackDetails, setFeedbackDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if we're online
    setIsOffline(!navigator.onLine);
    
    if (navigator.onLine) {
      loadHiddenAds();
      loadRelevantAds();
    }
    
    // Add event listeners for online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      loadHiddenAds();
      loadRelevantAds();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [activityId, activityTitle, activityTags]);

  const loadHiddenAds = async () => {
    if (!userId) {
      setHiddenAds([]);
      return;
    }
    
    try {
      const { data } = await safeUserQuery(
        async (uid) => {
          return await supabase
            .from('ad_feedback')
            .select('ad_id')
            .eq('user_id', uid);
        },
        userId
      );
      
      setHiddenAds(data?.map(item => item.ad_id) || []);
    } catch (error) {
      console.error('Error loading hidden ads:', error);
      setHiddenAds([]);
    }
  };

  const loadRelevantAds = async () => {
    if (isOffline) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Track which ads we've already shown to avoid repetition
      const viewedAds = JSON.parse(localStorage.getItem('viewedAds') || '[]');
      
      // Build the query
      let query = supabase
        .from('supplier_ads')
        .select(`
          *,
          supplier:suppliers (*)
        `)
        .eq('approved', true);
      
      // Add filter to exclude hidden and viewed ads if there are any
      const excludedIds = [...hiddenAds, ...viewedAds].filter(Boolean);
      if (excludedIds.length > 0) {
        query = query.not('id', 'in', `(${excludedIds.join(',')})`);
      }
      
      // Build the OR conditions for matching
      const conditions = [];
      
      // Match by linked activities
      if (activityTitle) {
        conditions.push(`linked_activities.cs.{${activityTitle}}`);
      }
      
      // Match by linked categories
      if (activityTags && activityTags.length > 0) {
        activityTags.forEach(tag => {
          conditions.push(`linked_categories.cs.{${tag}}`);
        });
      }
      
      // Match by activity tags
      if (activityTags && activityTags.length > 0) {
        activityTags.forEach(tag => {
          conditions.push(`activity_tags.cs.{${tag}}`);
        });
      }
      
      // Add the OR conditions if we have any
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
      
      // Order by priority level (descending) and limit to maxAds
      query = query.order('priority_level', { ascending: false })
                   .order('created_at', { ascending: false })
                   .limit(maxAds);
      
      const { data, error } = await query;

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAds(data);
        
        // Track impressions for each ad
        data.forEach(async (ad) => {
          await supabase.rpc('increment_ad_impressions', { ad_id: ad.id });
        });
        
        // Add to viewed ads
        const updatedViewedAds = [...viewedAds, ...data.map(ad => ad.id)].slice(-20); // Keep last 20
        localStorage.setItem('viewedAds', JSON.stringify(updatedViewedAds));
      } else {
        setAds([]);
      }
    } catch (err) {
      console.error('Error loading ads:', err);
      setError('Failed to load relevant offers');
      setAds([]); // Ensure ads is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleAdClick = async (ad: SupplierAd) => {
    try {
      // Increment click count
      await supabase.rpc('increment_ad_clicks', { ad_id: ad.id });
      
      // Show ad details
      setSelectedAd(ad);
    } catch (error) {
      console.error('Error tracking ad click:', error);
      // Still show the ad details even if tracking fails
      setSelectedAd(ad);
    }
  };

  const handleHideAd = (adId: string) => {
    setHiddenAds(prev => [...prev, adId]);
    setAds(prev => prev.filter(ad => ad.id !== adId));
  };

  const handleReport = (ad: SupplierAd) => {
    setSelectedAd(ad);
    setFeedbackReason('Report this ad');
    setShowFeedbackModal(true);
  };

  const submitFeedback = async () => {
    if (!feedbackReason || !selectedAd || !userId) return;
    
    setSubmitting(true);
    try {
      await safeUserQuery(
        async (uid) => {
          const { error } = await supabase
            .from('ad_feedback')
            .insert({
              ad_id: selectedAd.id,
              user_id: uid,
              reason: feedbackReason,
              details: feedbackDetails
            });
          
          if (error) throw error;
        },
        userId
      );
      
      setShowFeedbackModal(false);
      handleHideAd(selectedAd.id);
      setSelectedAd(null);
    } catch (err) {
      console.error('Error submitting feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Determine which discount to show based on user role
  const getDiscount = (ad: SupplierAd) => {
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

  if (isOffline) {
    return null; // Don't show ads when offline
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Related Offers</h2>
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error || ads.length === 0) {
    return null; // Don't show errors or empty ad block to users
  }

  return (
    <>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Related Offers</h2>
        <div className="space-y-4">
          {ads.map(ad => {
            const discount = getDiscount(ad);
            
            return (
              <div 
                key={ad.id} 
                className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAdClick(ad)}
              >
                <div className="absolute top-2 right-2 flex gap-1 z-10">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHideAd(ad.id);
                    }}
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
                    <div className="text-xs text-blue-600 font-medium mb-1">Partner</div>
                    <h3 className="font-medium text-gray-900 mb-1">{ad.title}</h3>
                    
                    {discount && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium mb-2">
                        {discount.icon}
                        <span>{discount.amount} off</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1 text-gray-600 text-xs mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{ad.location}</span>
                    </div>
                    
                    <button
                      className="w-full text-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {ad.cta_label}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ad Detail Modal */}
      <Dialog
        open={!!selectedAd}
        onClose={() => setSelectedAd(null)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-lg w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-medium">
                {selectedAd?.title}
              </Dialog.Title>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReport(selectedAd!)}
                  className="text-gray-400 hover:text-gray-500"
                  title="Report this ad"
                >
                  <Flag className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedAd(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {selectedAd && (
              <div className="space-y-4">
                {selectedAd.image_url && (
                  <img
                    src={selectedAd.image_url}
                    alt={selectedAd.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/800x500?text=Image+Not+Available';
                    }}
                  />
                )}

                <div className="flex items-center gap-3">
                  {selectedAd.supplier?.logo_url && (
                    <img
                      src={selectedAd.supplier.logo_url}
                      alt={selectedAd.supplier.supplier_name}
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/100?text=Logo';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="font-bold">{selectedAd.supplier?.supplier_name}</h3>
                    <div className="flex items-center gap-1 text-gray-600 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedAd.location}</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-700">{selectedAd.description}</p>

                <div className="flex flex-wrap gap-2">
                  {selectedAd.activity_tags?.map(tag => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {getDiscount(selectedAd) && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Special Offer</h4>
                    <div className="space-y-2">
                      {selectedAd.member_discount.all !== '0%' && (
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-green-600" />
                          <span>{selectedAd.member_discount.all} off for all members</span>
                        </div>
                      )}
                      {selectedAd.member_discount.premium !== '0%' && (
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <span>{selectedAd.member_discount.premium} off for Premium members</span>
                        </div>
                      )}
                      {selectedAd.member_discount.pro !== '0%' && (
                        <div className="flex items-center gap-2">
                          <Medal className="h-4 w-4 text-purple-500" />
                          <span>{selectedAd.member_discount.pro} off for Pro members</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <a
                  href={selectedAd.cta_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {selectedAd.cta_label}
                </a>

                <p className="text-xs text-gray-500 text-center mt-2">
                  This is a sponsored offer from a verified partner.
                </p>
              </div>
            )}
          </div>
        </div>
      </Dialog>

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
                Report Ad
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
                  Why are you reporting this ad?
                </label>
                <select
                  value={feedbackReason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Misleading information">Misleading information</option>
                  <option value="Scam or fraud">Scam or fraud</option>
                  <option value="Not relevant">Not relevant</option>
                  <option value="Other issue">Other issue</option>
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
    </>
  );
}