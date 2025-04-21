import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  DollarSign, 
  Calendar, 
  Download, 
  Filter, 
  Loader2, 
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  FileText,
  CreditCard
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PaymentSummary from './PaymentSummary';
import StripeConnectButton from './StripeConnectButton';
import ExportDataButton from './ExportDataButton';

interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  supplier_amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  created_at: string;
  paid_at?: string;
  booking: {
    user_name: string;
    ad_title?: string;
    activity_title?: string;
  };
}

interface Invoice {
  id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  supplier_amount: number;
  currency: string;
  status: 'draft' | 'issued' | 'paid' | 'cancelled';
  issue_date: string;
  due_date: string;
  paid_date?: string;
  stripe_invoice_url?: string;
  booking: {
    user_name: string;
    ad_title?: string;
    activity_title?: string;
  };
}

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled';
  created_at: string;
  arrival_date?: string;
}

export default function SupplierPayments({ supplierId }: { supplierId: string }) {
  const { userId } = useCurrentUser();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'payments' | 'invoices' | 'payouts'>('payments');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<any>(null);

  useEffect(() => {
    if (supplierId) {
      loadSupplier();
      loadData();
    }
  }, [supplierId, activeTab, timeRange, statusFilter]);

  const loadSupplier = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', supplierId)
        .single();
      
      if (error) throw error;
      setSupplier(data);
    } catch (err) {
      console.error('Error loading supplier:', err);
      setError('Failed to load supplier details');
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range based on timeRange
      let startDate = null;
      const now = new Date();
      
      if (timeRange === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === 'year') {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      if (activeTab === 'payments') {
        const { data, error } = await supabase
          .from('supplier_payments')
          .select(`
            *,
            booking:bookings (
              user:profiles (username),
              ad:supplier_ads (title),
              activity:activities (title)
            )
          `)
          .eq('supplier_id', supplierId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Transform data
        const transformedPayments = data?.map(payment => ({
          ...payment,
          booking: {
            user_name: payment.booking?.user?.username || 'Unknown User',
            ad_title: payment.booking?.ad?.title,
            activity_title: payment.booking?.activity?.title
          }
        })) || [];
        
        // Apply filters
        let filteredPayments = transformedPayments;
        
        if (startDate) {
          filteredPayments = filteredPayments.filter(payment => 
            new Date(payment.created_at) >= startDate!
          );
        }
        
        if (statusFilter) {
          filteredPayments = filteredPayments.filter(payment => 
            payment.status === statusFilter
          );
        }
        
        setPayments(filteredPayments);
      } else if (activeTab === 'invoices') {
        const { data, error } = await supabase
          .from('invoices')
          .select(`
            *,
            booking:bookings (
              user:profiles (username),
              ad:supplier_ads (title),
              activity:activities (title)
            )
          `)
          .eq('supplier_id', supplierId)
          .order('issue_date', { ascending: false });
        
        if (error) throw error;
        
        // Transform data
        const transformedInvoices = data?.map(invoice => ({
          ...invoice,
          booking: {
            user_name: invoice.booking?.user?.username || 'Unknown User',
            ad_title: invoice.booking?.ad?.title,
            activity_title: invoice.booking?.activity?.title
          }
        })) || [];
        
        // Apply filters
        let filteredInvoices = transformedInvoices;
        
        if (startDate) {
          filteredInvoices = filteredInvoices.filter(invoice => 
            new Date(invoice.issue_date) >= startDate!
          );
        }
        
        if (statusFilter) {
          filteredInvoices = filteredInvoices.filter(invoice => 
            invoice.status === statusFilter
          );
        }
        
        setInvoices(filteredInvoices);
      } else if (activeTab === 'payouts') {
        const { data, error } = await supabase
          .from('supplier_payouts')
          .select('*')
          .eq('supplier_id', supplierId)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Apply filters
        let filteredPayouts = data || [];
        
        if (startDate) {
          filteredPayouts = filteredPayouts.filter(payout => 
            new Date(payout.created_at) >= startDate!
          );
        }
        
        if (statusFilter) {
          filteredPayouts = filteredPayouts.filter(payout => 
            payout.status === statusFilter
          );
        }
        
        setPayouts(filteredPayouts);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const exportData = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    
    if (activeTab === 'payments') {
      headers = ['Date', 'Customer', 'Description', 'Amount', 'Platform Fee', 'Your Earnings', 'Status'];
      rows = payments.map(payment => [
        format(parseISO(payment.created_at), 'yyyy-MM-dd'),
        payment.booking.user_name,
        payment.booking.ad_title || payment.booking.activity_title || 'Booking',
        payment.amount,
        payment.platform_fee,
        payment.supplier_amount,
        payment.status
      ]);
      return Promise.resolve(
        [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      );
    } else if (activeTab === 'invoices') {
      headers = ['Issue Date', 'Due Date', 'Customer', 'Description', 'Amount', 'Status'];
      rows = invoices.map(invoice => [
        format(parseISO(invoice.issue_date), 'yyyy-MM-dd'),
        format(parseISO(invoice.due_date), 'yyyy-MM-dd'),
        invoice.booking.user_name,
        invoice.booking.ad_title || invoice.booking.activity_title || 'Booking',
        invoice.amount,
        invoice.status
      ]);
      return Promise.resolve(
        [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      );
    } else if (activeTab === 'payouts') {
      headers = ['Date', 'Amount', 'Status', 'Arrival Date'];
      rows = payouts.map(payout => [
        format(parseISO(payout.created_at), 'yyyy-MM-dd'),
        payout.amount,
        payout.status,
        payout.arrival_date ? format(parseISO(payout.arrival_date), 'yyyy-MM-dd') : 'N/A'
      ]);
      return Promise.resolve(
        [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
      );
    }
    
    return Promise.reject('Invalid export type');
  };

  const getStatusBadge = (status: string, type: 'payment' | 'invoice' | 'payout') => {
    let bgColor = '';
    let textColor = '';
    
    if (type === 'payment' || type === 'payout') {
      switch (status) {
        case 'pending':
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          break;
        case 'paid':
        case 'in_transit':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          break;
        case 'failed':
        case 'canceled':
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
      }
    } else if (type === 'invoice') {
      switch (status) {
        case 'draft':
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
          break;
        case 'issued':
          bgColor = 'bg-yellow-100';
          textColor = 'text-yellow-800';
          break;
        case 'paid':
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          break;
        case 'cancelled':
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          break;
        default:
          bgColor = 'bg-gray-100';
          textColor = 'text-gray-800';
      }
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && !supplier) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {/* Stripe Connect Status */}
      {supplier && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">Payment Account</h2>
          
          {supplier.stripe_account_id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                <CreditCard className="h-5 w-5" />
                <span>Your Stripe account is connected</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Charges Enabled:</span>{' '}
                  {supplier.stripe_charges_enabled ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-medium">Payouts Enabled:</span>{' '}
                  {supplier.stripe_payouts_enabled ? 'Yes' : 'No'}
                </div>
                <div>
                  <span className="font-medium">Details Submitted:</span>{' '}
                  {supplier.stripe_details_submitted ? 'Yes' : 'No'}
                </div>
              </div>
              
              <StripeConnectButton
                supplierId={supplierId}
                isConnected={true}
                buttonText="Manage Stripe Account"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Connect your Stripe account to receive payments directly to your bank account.
              </p>
              
              <StripeConnectButton
                supplierId={supplierId}
                buttonText="Connect with Stripe"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Payment Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Payment Summary</h2>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="border rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 12 months</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        <PaymentSummary supplierId={supplierId} timeRange={timeRange} />
      </div>
      
      {/* Tabs */}
      <div className="border-b">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowDownLeft className="h-5 w-5" />
              <span>Incoming Payments</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Invoices</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`py-4 px-6 font-medium text-sm border-b-2 ${
              activeTab === 'payouts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5" />
              <span>Payouts</span>
            </div>
          </button>
        </nav>
      </div>
      
      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value || null)}
            className="border rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {activeTab === 'payments' && (
              <>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
              </>
            )}
            {activeTab === 'invoices' && (
              <>
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </>
            )}
            {activeTab === 'payouts' && (
              <>
                <option value="pending">Pending</option>
                <option value="in_transit">In Transit</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="canceled">Canceled</option>
              </>
            )}
          </select>
        </div>
        
        <ExportDataButton
          onExport={exportData}
          filename={`${activeTab}-${timeRange}`}
          label={`Export ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
        />
      </div>
      
      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <>
              {payments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Payments Found</h3>
                  <p className="text-gray-500">
                    {statusFilter 
                      ? `You don't have any ${statusFilter} payments.` 
                      : "You haven't received any payments yet."}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Platform Fee
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Your Earnings
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                          <tr key={payment.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(parseISO(payment.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {payment.booking.user_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payment.booking.ad_title || payment.booking.activity_title || 'Booking'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(payment.amount, payment.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                              {formatCurrency(payment.platform_fee, payment.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                              {formatCurrency(payment.supplier_amount, payment.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {getStatusBadge(payment.status, 'payment')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <>
              {invoices.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Invoices Found</h3>
                  <p className="text-gray-500">
                    {statusFilter 
                      ? `You don't have any ${statusFilter} invoices.` 
                      : "You haven't received any invoices yet."}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Issue Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(parseISO(invoice.issue_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(parseISO(invoice.due_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {invoice.booking.user_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {invoice.booking.ad_title || invoice.booking.activity_title || 'Booking'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              {getStatusBadge(invoice.status, 'invoice')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {invoice.stripe_invoice_url && (
                                <a
                                  href={invoice.stripe_invoice_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </a>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <>
              {payouts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <ArrowUpRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Payouts Found</h3>
                  <p className="text-gray-500">
                    {statusFilter 
                      ? `You don't have any ${statusFilter} payouts.` 
                      : "You haven't received any payouts yet."}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Arrival Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payouts.map((payout) => (
                          <tr key={payout.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {format(parseISO(payout.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(payout.amount, payout.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {getStatusBadge(payout.status, 'payout')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {payout.arrival_date 
                                ? format(parseISO(payout.arrival_date), 'MMM d, yyyy')
                                : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}