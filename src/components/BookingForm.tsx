import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  Calendar, 
  Clock, 
  MessageSquare, 
  CreditCard, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog } from '@headlessui/react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripeClient';
import PaymentMethodForm from './PaymentMethodForm';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface BookingFormProps {
  supplierId: string;
  adId?: string;
  activityId?: string;
  adTitle?: string;
  activityTitle?: string;
  price: number;
  currency: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BookingForm({
  supplierId,
  adId,
  activityId,
  adTitle,
  activityTitle,
  price,
  currency,
  onSuccess,
  onCancel
}: BookingFormProps) {
  const { userId, isAuthenticated } = useCurrentUser();
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [availableDates, setAvailableDates] = useState<{date: string, available: boolean, has_bookings: boolean}[]>([]);
  const [loadingDates, setLoadingDates] = useState<boolean>(true);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState<boolean>(false);
  const [useNewCard, setUseNewCard] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');
  
  const stripe = useStripe();
  const elements = useElements();

  useEffect(() => {
    if (supplierId) {
      loadAvailableDates();
      loadPaymentMethods();
    }
  }, [supplierId]);

  const loadAvailableDates = async () => {
    try {
      setLoadingDates(true);
      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 90); // Get availability for next 90 days
      
      const { data, error } = await supabase.rpc('get_supplier_available_dates', {
        supplier_id: supplierId,
        start_date: format(today, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      setAvailableDates(data || []);
    } catch (err) {
      console.error('Error loading available dates:', err);
      setError('Failed to load available dates');
    } finally {
      setLoadingDates(false);
    }
  };

  const loadPaymentMethods = async () => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      
      if (error) throw error;
      
      setPaymentMethods(data || []);
      
      // Set the default payment method if available
      const defaultMethod = data?.find(method => method.is_default);
      if (defaultMethod) {
        setSelectedPaymentMethod(defaultMethod.id);
      }
    } catch (err) {
      console.error('Error loading payment methods:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('You must be logged in to make a booking');
      return;
    }
    
    if (!date) {
      setError('Please select a date');
      return;
    }
    
    if (!agreedToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }
    
    if (!selectedPaymentMethod && !useNewCard) {
      setError('Please select a payment method or add a new one');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Check if date is available
      const selectedDate = availableDates.find(d => d.date === date);
      if (selectedDate && !selectedDate.available) {
        throw new Error('This date is not available for booking');
      }
      
      // Create booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          supplier_id: supplierId,
          ad_id: adId,
          activity_id: activityId,
          status: 'pending',
          message: message,
          date: date,
          booking_time: time || null,
          price_total: price,
          currency: currency
        })
        .select()
        .single();
      
      if (bookingError) throw bookingError;
      
      setBookingId(bookingData.id);
      
      // If using a new card, we'll handle payment after adding the card
      if (useNewCard) {
        // Create a payment intent without confirming
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId: bookingData.id
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }
        
        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
        setProcessingPayment(true);
      } else {
        // Use existing payment method
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;
        
        if (!token) {
          throw new Error('Authentication token not found');
        }
        
        // Get the Stripe payment method ID
        const { data: paymentMethodData, error: paymentMethodError } = await supabase
          .from('payment_methods')
          .select('stripe_payment_method_id')
          .eq('id', selectedPaymentMethod)
          .single();
        
        if (paymentMethodError) throw paymentMethodError;
        
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            bookingId: bookingData.id,
            paymentMethodId: paymentMethodData.stripe_payment_method_id
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create payment intent');
        }
        
        const { status } = await response.json();
        
        if (status === 'succeeded') {
          setSuccess(true);
          
          // Reset form
          setDate(format(new Date(), 'yyyy-MM-dd'));
          setTime('');
          setMessage('');
          setAgreedToTerms(false);
          
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
            }, 2000);
          }
        } else {
          setClientSecret(clientSecret);
          setProcessingPayment(true);
        }
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Customer Name', // Ideally get this from the user profile
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      if (paymentIntent.status === 'succeeded') {
        setSuccess(true);
        
        // Reset form
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setTime('');
        setMessage('');
        setAgreedToTerms(false);
        setProcessingPayment(false);
        
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setProcessingPayment(false);
    }
  };

  const formatCurrency = (value: number, currencyCode: string) => {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode
    });
    
    return formatter.format(value);
  };

  const isDateAvailable = (dateStr: string) => {
    const found = availableDates.find(d => d.date === dateStr);
    return found ? found.available : true;
  };

  const getCardIcon = (brand?: string) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return '💳 Visa';
      case 'mastercard':
        return '💳 Mastercard';
      case 'amex':
        return '💳 American Express';
      case 'discover':
        return '💳 Discover';
      default:
        return '💳 Card';
    }
  };

  return (
    <Dialog
      open={true}
      onClose={() => onCancel?.()}
      className="fixed inset-0 z-10 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

        <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-bold">
              {success ? 'Booking Confirmed' : processingPayment ? 'Payment' : 'Request Booking'}
            </Dialog.Title>
            <button
              onClick={() => onCancel?.()}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Booking Confirmed</h3>
              <p className="text-gray-600 mb-6">
                Your booking has been confirmed. Thank you for your payment!
              </p>
              <button
                onClick={() => onCancel?.()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          ) : processingPayment ? (
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {adTitle || activityTitle || 'Booking Details'}
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Price:</span>
                    <span className="font-bold">{formatCurrency(price, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Platform fee (10%):</span>
                    <span>{formatCurrency(price * 0.1, currency)}</span>
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(price * 1.1, currency)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Details
                </label>
                <div className="border rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                  <CardElement
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProcessingPayment(false);
                    setClientSecret('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!stripe || loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Pay {formatCurrency(price * 1.1, currency)}
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">
                  {adTitle || activityTitle || 'Booking Details'}
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>Price:</span>
                    <span className="font-bold">{formatCurrency(price, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <span>Platform fee (10%):</span>
                    <span>{formatCurrency(price * 0.1, currency)}</span>
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span>{formatCurrency(price * 1.1, currency)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className={`pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !isDateAvailable(date) ? 'border-red-300 bg-red-50' : ''
                    }`}
                    required
                  />
                </div>
                {!isDateAvailable(date) && (
                  <p className="text-sm text-red-600 mt-1">
                    This date is not available. Please select another date.
                  </p>
                )}
                {loadingDates && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading available dates...</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preferred Time (Optional)
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message to Supplier (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any special requests or questions?"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                
                {paymentMethods.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {paymentMethods.map(method => (
                      <label key={method.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={selectedPaymentMethod === method.id && !useNewCard}
                          onChange={() => {
                            setSelectedPaymentMethod(method.id);
                            setUseNewCard(false);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-3">
                          {getCardIcon(method.card_brand)} •••• {method.card_last4}
                          <span className="text-sm text-gray-500 ml-2">
                            Expires {method.card_exp_month}/{method.card_exp_year}
                          </span>
                          {method.is_default && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                              Default
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                    
                    <label className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={useNewCard}
                        onChange={() => {
                          setUseNewCard(true);
                          setSelectedPaymentMethod('');
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-3 flex items-center gap-2">
                        <Plus className="h-4 w-4 text-blue-600" />
                        Use a new card
                      </span>
                    </label>
                  </div>
                )}
                
                {(paymentMethods.length === 0 || useNewCard) && (
                  <div className="border rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                          invalid: {
                            color: '#9e2146',
                          },
                        },
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1"
                  required
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the <a href="/terms" className="text-blue-600 hover:underline" target="_blank">terms and conditions</a> and understand that my card will be charged immediately upon confirmation.
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onCancel?.()}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isDateAvailable(date) || (!selectedPaymentMethod && !useNewCard)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Book Now
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Add Payment Method Modal */}
      <Dialog
        open={showAddPaymentMethod}
        onClose={() => setShowAddPaymentMethod(false)}
        className="fixed inset-0 z-20 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4">
            <Elements stripe={getStripe()}>
              <PaymentMethodForm
                onSuccess={() => {
                  setShowAddPaymentMethod(false);
                  loadPaymentMethods();
                }}
                onCancel={() => setShowAddPaymentMethod(false)}
              />
            </Elements>
          </div>
        </div>
      </Dialog>
    </Dialog>
  );
}