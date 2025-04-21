import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  CreditCard, 
  Loader2, 
  AlertTriangle,
  X,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  Mail
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import MessageSupplierButton from './MessageSupplierButton';
import ExportDataButton from './ExportDataButton';

interface Booking {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  ad_id?: string;
  ad_title?: string;
  activity_id?: string;
  activity_title?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  message?: string;
  date: string;
  booking_time?: string;
  price_total: number;
  currency: string;
  platform_fee: number;
  created_at: string;
}

export default function SupplierBookings({ supplierId }: { supplierId: string }) {
  const { userId, isDemoMode } = useCurrentUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    if (supplierId) {
      loadBookings();
    }
  }, [supplierId, statusFilter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_supplier_bookings', {
        supplier_id: supplierId,
        status_filter: statusFilter
      });
      
      if (error) throw error;
      
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingStatus(bookingId);
      
      const { data, error } = await supabase.rpc('update_booking_status', {
        booking_id: bookingId,
        new_status: newStatus
      });
      
      if (error) throw error;
      
      if (data) {
        // Refresh bookings
        loadBookings();
        
        // Show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = `Booking ${newStatus} successfully!`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    } catch (err) {
      console.error('Error updating booking status:', err);
      setError('Failed to update booking status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode
    });
    
    return formatter.format(value);
  };

  const exportBookings = () => {
    // Create CSV content
    const headers = ['Date', 'Time', 'Customer', 'Email', 'Activity', 'Status', 'Price', 'Currency', 'Platform Fee'];
    const rows = bookings.map(booking => [
      booking.date,
      booking.booking_time || 'N/A',
      booking.user_name,
      booking.user_email,
      booking.ad_title || booking.activity_title || 'N/A',
      booking.status,
      booking.price_total,
      booking.currency,
      booking.platform_fee
    ]);
    
    // Return CSV string
    return Promise.resolve(
      [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    );
  };

  if (loading) {
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
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Bookings
        </h2>
        
        <div className="flex gap-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-gray-400 mr-2" />
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="border rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          {bookings.length > 0 && (
            <ExportDataButton
              onExport={exportBookings}
              filename="bookings"
            />
          )}
        </div>
      </div>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Bookings Found</h3>
          <p className="text-gray-500">
            {statusFilter 
              ? `You don't have any ${statusFilter} bookings.` 
              : "You haven't received any bookings yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {booking.ad_title || booking.activity_title || 'Booking'}
                    </h3>
                    <div className="text-sm text-gray-600">
                      {format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}
                      {booking.booking_time && ` at ${booking.booking_time}`}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">{booking.user_name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span>{booking.user_email}</span>
                    </div>
                    
                    {(booking.ad_title || booking.activity_title) && (
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="h-5 w-5 text-gray-400" />
                        <span>{booking.ad_title || booking.activity_title}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-gray-400" />
                      <span>
                        {format(parseISO(booking.date), 'MMMM d, yyyy')}
                        {booking.booking_time && ` at ${booking.booking_time}`}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <span className="font-medium">
                        {formatCurrency(booking.price_total, booking.currency)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">Platform Fee:</span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(booking.platform_fee, booking.currency)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-500">You Receive:</span>
                      <span className="font-medium">
                        {formatCurrency(booking.price_total - booking.platform_fee, booking.currency)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <span className="text-sm">Booked on {format(parseISO(booking.created_at), 'MMMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                
                {booking.message && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium mb-1">Customer Message:</div>
                    <p className="text-gray-600">{booking.message}</p>
                  </div>
                )}
                
                <div className="mt-4 flex flex-wrap gap-3">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        disabled={updatingStatus === booking.id}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        {updatingStatus === booking.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-5 w-5" />
                        )}
                        Confirm Booking
                      </button>
                      
                      <button
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        disabled={updatingStatus === booking.id}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                      >
                        {updatingStatus === booking.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        )}
                        Decline
                      </button>
                    </>
                  )}
                  
                  {booking.status === 'confirmed' && (
                    <button
                      onClick={() => updateBookingStatus(booking.id, 'completed')}
                      disabled={updatingStatus === booking.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingStatus === booking.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5" />
                      )}
                      Mark as Completed
                    </button>
                  )}
                  
                  <MessageSupplierButton
                    supplierId={booking.user_id}
                    adId={booking.ad_id}
                    activityId={booking.activity_id}
                    adTitle={booking.ad_title}
                    activityTitle={booking.activity_title}
                    buttonText="Message Customer"
                    buttonClassName="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}