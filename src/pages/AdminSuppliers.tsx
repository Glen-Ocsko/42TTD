import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { Supplier, SupplierAd } from '../types/supplier';
import {
  Building2,
  CheckCircle2,
  X,
  Shield,
  ExternalLink,
  Eye,
  Loader2,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  Layers
} from 'lucide-react';
import { Dialog } from '@headlessui/react';

export default function AdminSuppliers() {
  const { userId } = useCurrentUser();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [ads, setAds] = useState<SupplierAd[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedAd, setSelectedAd] = useState<SupplierAd | null>(null);
  
  const [showSupplierDetails, setShowSupplierDetails] = useState(false);
  const [showAdDetails, setShowAdDetails] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'suppliers' | 'ads'>('suppliers');

  useEffect(() => {
    checkAdminStatus();
  }, [userId]);

  useEffect(() => {
    if (isAdmin) {
      loadSuppliers();
      loadAds();
    }
  }, [isAdmin, filterStatus]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (!data?.is_admin) {
        navigate('/');
        return;
      }
      
      setIsAdmin(true);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setError('You do not have permission to access this page');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      let query = supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (filterStatus !== 'all') {
        query = query.eq('approved', filterStatus === 'approved');
      }
      
      if (searchQuery) {
        query = query.ilike('supplier_name', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError('Failed to load suppliers');
    }
  };

  const loadAds = async () => {
    try {
      let query = supabase
        .from('supplier_ads')
        .select(`
          *,
          supplier:suppliers (*)
        `)
        .order('created_at', { ascending: false });
      
      if (filterStatus !== 'all') {
        query = query.eq('approved', filterStatus === 'approved');
      }
      
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setAds(data || []);
    } catch (err) {
      console.error('Error loading ads:', err);
      setError('Failed to load advertisements');
    }
  };

  const approveSupplier = async (supplierId: string, trusted: boolean = false) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ 
          approved: true,
          trusted_supplier: trusted
        })
        .eq('id', supplierId);

      if (error) throw error;
      
      setSuppliers(prev => 
        prev.map(s => 
          s.id === supplierId 
            ? { ...s, approved: true, trusted_supplier: trusted } 
            : s
        )
      );
      
      if (selectedSupplier?.id === supplierId) {
        setSelectedSupplier(prev => 
          prev ? { ...prev, approved: true, trusted_supplier: trusted } : null
        );
      }
    } catch (err) {
      console.error('Error approving supplier:', err);
      setError('Failed to approve supplier');
    }
  };

  const rejectSupplier = async (supplierId: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId);

      if (error) throw error;
      
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
      
      if (selectedSupplier?.id === supplierId) {
        setShowSupplierDetails(false);
        setSelectedSupplier(null);
      }
    } catch (err) {
      console.error('Error rejecting supplier:', err);
      setError('Failed to reject supplier');
    }
  };

  const approveAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_ads')
        .update({ approved: true })
        .eq('id', adId);

      if (error) throw error;
      
      setAds(prev => 
        prev.map(ad => 
          ad.id === adId 
            ? { ...ad, approved: true } 
            : ad
        )
      );
      
      if (selectedAd?.id === adId) {
        setSelectedAd(prev => 
          prev ? { ...prev, approved: true } : null
        );
      }
    } catch (err) {
      console.error('Error approving ad:', err);
      setError('Failed to approve advertisement');
    }
  };

  const rejectAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('supplier_ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;
      
      setAds(prev => prev.filter(ad => ad.id !== adId));
      
      if (selectedAd?.id === adId) {
        setShowAdDetails(false);
        setSelectedAd(null);
      }
    } catch (err) {
      console.error('Error rejecting ad:', err);
      setError('Failed to reject advertisement');
    }
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-blue-600" />
        <h1 className="text-3xl font-bold">Admin: Supplier Management</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'suppliers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Suppliers
        </button>
        <button
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'ads'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Advertisements
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'suppliers' ? 'suppliers' : 'advertisements'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'approved')}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No suppliers found
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {supplier.logo_url ? (
                            <img
                              src={supplier.logo_url}
                              alt={supplier.supplier_name}
                              className="h-10 w-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <Building2 className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{supplier.supplier_name}</div>
                            <div className="text-sm text-gray-500">{supplier.contact_email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="capitalize">{supplier.supplier_type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {supplier.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {supplier.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {supplier.trusted_supplier && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Trusted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(supplier.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedSupplier(supplier);
                            setShowSupplierDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        {!supplier.approved && (
                          <>
                            <button
                              onClick={() => approveSupplier(supplier.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectSupplier(supplier.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ads Tab */}
      {activeTab === 'ads' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Advertisement
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metrics
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No advertisements found
                    </td>
                  </tr>
                ) : (
                  ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          {ad.image_url && (
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="h-12 w-20 object-cover rounded mr-3"
                            />
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{ad.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{ad.description}</div>
                            {ad.linked_activities && ad.linked_activities.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                <LinkIcon className="h-3 w-3" />
                                <span>{ad.linked_activities.length} linked activities</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ad.supplier?.supplier_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {ad.approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {ad.priority_level && ad.priority_level > 0 && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Priority {ad.priority_level}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Clicks: {ad.clicks}</div>
                        <div>Impressions: {ad.impressions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedAd(ad);
                            setShowAdDetails(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View
                        </button>
                        {!ad.approved && (
                          <>
                            <button
                              onClick={() => approveAd(ad.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => rejectAd(ad.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Details Modal */}
      <Dialog
        open={showSupplierDetails}
        onClose={() => setShowSupplierDetails(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold">
                Supplier Details
              </Dialog.Title>
              <button
                onClick={() => setShowSupplierDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedSupplier && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {selectedSupplier.logo_url ? (
                    <img
                      src={selectedSupplier.logo_url}
                      alt={selectedSupplier.supplier_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-bold">{selectedSupplier.supplier_name}</h3>
                    <p className="text-gray-600">{selectedSupplier.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span> {selectedSupplier.supplier_type}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedSupplier.approved ? 'Approved' : 'Pending'}
                  </div>
                  <div>
                    <span className="font-medium">Email:</span> {selectedSupplier.contact_email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedSupplier.phone_number || 'N/A'}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Website:</span>{' '}
                    <a 
                      href={selectedSupplier.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {selectedSupplier.website_url}
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700">{selectedSupplier.description}</p>
                </div>

                {!selectedSupplier.approved && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        approveSupplier(selectedSupplier.id);
                        setShowSupplierDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        approveSupplier(selectedSupplier.id, true);
                        setShowSupplierDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Approve as Trusted
                    </button>
                    <button
                      onClick={() => {
                        rejectSupplier(selectedSupplier.id);
                        setShowSupplierDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Dialog>

      {/* Ad Details Modal */}
      <Dialog
        open={showAdDetails}
        onClose={() => setShowAdDetails(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

          <div className="relative bg-white rounded-lg max-w-2xl w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-xl font-bold">
                Advertisement Details
              </Dialog.Title>
              <button
                onClick={() => setShowAdDetails(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {selectedAd && (
              <div className="space-y-4">
                {selectedAd.image_url && (
                  <img
                    src={selectedAd.image_url}
                    alt={selectedAd.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                <div>
                  <h3 className="text-xl font-bold">{selectedAd.title}</h3>
                  <p className="text-gray-600">By {selectedAd.supplier?.supplier_name}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-700">{selectedAd.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Status:</span> {selectedAd.approved ? 'Approved' : 'Pending'}
                  </div>
                  <div>
                    <span className="font-medium">Location:</span> {selectedAd.location}
                  </div>
                  <div>
                    <span className="font-medium">CTA:</span> {selectedAd.cta_label}
                  </div>
                  <div>
                    <span className="font-medium">Link:</span>{' '}
                    <a 
                      href={selectedAd.cta_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  </div>
                  <div>
                    <span className="font-medium">Priority Level:</span> {selectedAd.priority_level || 0}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Activity Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedAd.activity_tags?.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedAd.linked_activities && selectedAd.linked_activities.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Linked Activities</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAd.linked_activities.map(activity => (
                        <span key={activity} className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          <LinkIcon className="h-3 w-3" />
                          {activity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAd.linked_categories && selectedAd.linked_categories.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Linked Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAd.linked_categories.map(category => (
                        <span key={category} className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                          <Layers className="h-3 w-3" />
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Member Discounts</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">All:</span> {selectedAd.member_discount?.all || '0%'}
                    </div>
                    <div>
                      <span className="font-medium">Premium:</span> {selectedAd.member_discount?.premium || '0%'}
                    </div>
                    <div>
                      <span className="font-medium">Pro:</span> {selectedAd.member_discount?.pro || '0%'}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Metrics</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Clicks:</span> {selectedAd.clicks}
                    </div>
                    <div>
                      <span className="font-medium">Impressions:</span> {selectedAd.impressions}
                    </div>
                    <div>
                      <span className="font-medium">CTR:</span> {selectedAd.impressions > 0 ? ((selectedAd.clicks / selectedAd.impressions) * 100).toFixed(2) : 0}%
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(selectedAd.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {!selectedAd.approved && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        approveAd(selectedAd.id);
                        setShowAdDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        rejectAd(selectedAd.id);
                        setShowAdDetails(false);
                      }}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}