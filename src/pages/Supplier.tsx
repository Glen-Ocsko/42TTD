import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Supplier, SupplierAd } from '../types/supplier';
import SupplierForm from '../components/SupplierForm';
import SupplierAdForm from '../components/SupplierAdForm';
import SupplierInbox from '../components/SupplierInbox';
import SupplierAnalytics from '../components/SupplierAnalytics';
import SupplierCalendar from '../components/SupplierCalendar';
import SupplierBookings from '../components/SupplierBookings';
import SupplierPayments from '../components/SupplierPayments';
import StripeConnectButton from '../components/StripeConnectButton';
import ApiTokenManager from '../components/ApiTokenManager';
import {
  Building2,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Edit2,
  BarChart2,
  Eye,
  ExternalLink,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Calendar,
  CreditCard,
  DollarSign,
  Key
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

export default function SupplierPage() {
  const { userId, isAuthenticated } = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [ads, setAds] = useState<SupplierAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdForm, setShowAdForm] = useState(false);
  const [editingAd, setEditingAd] = useState<SupplierAd | null>(null);
  const [activeTab, setActiveTab] = useState<'ads' | 'inbox' | 'analytics' | 'calendar' | 'bookings' | 'payments' | 'api'>('ads');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    loadSupplierData();
  }, [userId, isAuthenticated]);

  useEffect(() => {
    // Check for query parameters from Stripe Connect redirect
    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    const refresh = queryParams.get('refresh');
    
    if (success === 'true' || refresh === 'true') {
      // Clear the URL parameters
      navigate('/supplier', { replace: true });
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      toast.textContent = success === 'true' 
        ? 'Your Stripe account has been connected successfully!' 
        : 'Your Stripe account has been refreshed.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 5000);
      
      // Reload supplier data
      loadSupplierData();
    }
  }, [location]);

  const loadSupplierData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Load supplier profile - use maybeSingle() to handle the case where no supplier exists
      const { data: supplierData, error: supplierError } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (supplierError) throw supplierError;
      setSupplier(supplierData);

      // If supplier exists, load their ads
      if (supplierData) {
        const { data: adsData, error: adsError } = await supabase
          .from('supplier_ads')
          .select('*')
          .eq('supplier_id', supplierData.id)
          .order('created_at', { ascending: false });

        if (adsError) throw adsError;
        setAds(adsData || []);
      }
    } catch (err) {
      console.error('Error loading supplier data:', err);
      setError('Failed to load supplier data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdSubmitSuccess = () => {
    setShowAdForm(false);
    setEditingAd(null);
    loadSupplierData();
  };

  const getApprovalStatus = () => {
    if (!supplier) return null;
    
    if (supplier.approved) {
      return (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle2 className="h-5 w-5" />
          <div>
            <p className="font-medium">Approved Supplier</p>
            <p className="text-sm">You can now create and manage advertisements.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-4 rounded-lg">
        <Clock className="h-5 w-5" />
        <div>
          <p className="font-medium">Approval Pending</p>
          <p className="text-sm">Your application is being reviewed. This usually takes 1-2 business days.</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Building2 className="h-7 w-7 text-blue-600" />
        Supplier Dashboard
      </h1>

      {!supplier ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold mb-4">Become a Supplier</h2>
          <p className="text-gray-600 mb-6">
            Join our platform as a supplier and promote your activities, services, or products to our community of adventure seekers.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Reach Your Audience</h3>
              <p className="text-sm text-blue-700">
                Connect with users who are actively looking for experiences like yours.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-2">Targeted Advertising</h3>
              <p className="text-sm text-green-700">
                Your ads are shown to users based on their interests and activities.
              </p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-2">Member Discounts</h3>
              <p className="text-sm text-purple-700">
                Offer special discounts to our premium and pro members.
              </p>
            </div>
          </div>
          
          <h3 className="text-xl font-semibold mb-4">Apply to become a supplier</h3>
          <SupplierForm onSubmitSuccess={loadSupplierData} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Approval Status */}
          {getApprovalStatus()}
          
          {/* Supplier Profile */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {supplier.logo_url && (
                  <img 
                    src={supplier.logo_url} 
                    alt={supplier.supplier_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="text-2xl font-bold">{supplier.supplier_name}</h2>
                  <p className="text-gray-600">{supplier.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={supplier.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </div>
            
            <p className="text-gray-700 mb-4">{supplier.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Type:</span> {supplier.supplier_type.charAt(0).toUpperCase() + supplier.supplier_type.slice(1)}
              </div>
              <div>
                <span className="font-medium">Email:</span> {supplier.contact_email}
              </div>
              {supplier.phone_number && (
                <div>
                  <span className="font-medium">Phone:</span> {supplier.phone_number}
                </div>
              )}
              <div>
                <span className="font-medium">Currency:</span> {supplier.currency || 'GBP'}
              </div>
            </div>
          </div>
          
          {/* Tabs */}
          {supplier.approved && (
            <>
              <div className="border-b overflow-x-auto">
                <nav className="flex flex-nowrap -mb-px">
                  <button
                    onClick={() => setActiveTab('ads')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                      activeTab === 'ads'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Advertisements
                  </button>
                  <button
                    onClick={() => setActiveTab('inbox')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                      activeTab === 'inbox'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Inbox</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                      activeTab === 'calendar'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span>Calendar</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                      activeTab === 'bookings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Bookings</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                      activeTab === 'payments'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Payments</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                      activeTab === 'analytics'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart2 className="h-5 w-5" />
                      <span>Analytics</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('api')}
                    className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                      activeTab === 'api'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      <span>API Access</span>
                    </div>
                  </button>
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {activeTab === 'ads' && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold">Your Advertisements</h2>
                      <button
                        onClick={() => {
                          setEditingAd(null);
                          setShowAdForm(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-5 w-5" />
                        Create New Ad
                      </button>
                    </div>
                    
                    {ads.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 mb-4">You haven't created any advertisements yet.</p>
                        <button
                          onClick={() => setShowAdForm(true)}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Create Your First Ad
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {ads.map(ad => (
                          <div key={ad.id} className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {ad.approved ? (
                                  <span className="flex items-center gap-1 text-green-600 text-sm">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Approved
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-amber-600 text-sm">
                                    <Clock className="h-4 w-4" />
                                    Pending Approval
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingAd(ad)}
                                  className="p-1 text-gray-500 hover:text-gray-700"
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => window.open(ad.cta_link, '_blank')}
                                  className="p-1 text-gray-500 hover:text-gray-700"
                                  title="View"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-medium mb-2">{ad.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{ad.description}</p>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {ad.activity_tags?.map(tag => (
                                  <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">{ad.location}</span>
                                <div className="flex items-center gap-4">
                                  <span className="text-gray-500">Clicks: {ad.clicks}</span>
                                  <span className="text-gray-500">Impressions: {ad.impressions}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                
                {activeTab === 'inbox' && (
                  <SupplierInbox />
                )}
                
                {activeTab === 'analytics' && (
                  <SupplierAnalytics supplierId={supplier.id} ads={ads} />
                )}
                
                {activeTab === 'calendar' && (
                  <SupplierCalendar supplierId={supplier.id} />
                )}
                
                {activeTab === 'bookings' && (
                  <SupplierBookings supplierId={supplier.id} />
                )}
                
                {activeTab === 'payments' && (
                  <SupplierPayments supplierId={supplier.id} />
                )}

                {activeTab === 'api' && (
                  <ApiTokenManager supplierId={supplier.id} />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Ad Form Modal */}
      <Dialog
        open={showAdForm || !!editingAd}
        onClose={() => {
          setShowAdForm(false);
          setEditingAd(null);
        }}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold">
                {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
              </Dialog.Title>
              <button
                onClick={() => {
                  setShowAdForm(false);
                  setEditingAd(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <SupplierAdForm
                supplierId={supplier?.id || ''}
                onSubmitSuccess={handleAdSubmitSuccess}
                initialData={editingAd || undefined}
                isEditing={!!editingAd}
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}