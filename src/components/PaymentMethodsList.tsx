import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { CreditCard, Loader2, Trash2, AlertTriangle, Plus } from 'lucide-react';
import { Dialog } from '@headlessui/react';
import { PaymentMethod } from '../types/payment';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripeClient';
import PaymentMethodForm from './PaymentMethodForm';

export default function PaymentMethodsList() {
  const { userId } = useCurrentUser();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadPaymentMethods();
    }
  }, [userId]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setPaymentMethods(data || []);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      // Refresh the list
      loadPaymentMethods();
    } catch (err) {
      console.error('Error deleting payment method:', err);
      setError('Failed to delete payment method');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // First, set all payment methods to non-default
      const { error: updateError } = await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      // Then set the selected one as default
      const { error: defaultError } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', userId);
      
      if (defaultError) throw defaultError;
      
      // Refresh the list
      loadPaymentMethods();
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError('Failed to set default payment method');
    }
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
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
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Payment Methods</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          Add Payment Method
        </button>
      </div>
      
      {paymentMethods.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Payment Methods</h3>
          <p className="text-gray-500 mb-4">
            You haven't added any payment methods yet.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Payment Method
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map(method => (
            <div key={method.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium">
                    {getCardIcon(method.card_brand)} •••• {method.card_last4}
                  </div>
                  <div className="text-sm text-gray-500">
                    Expires {method.card_exp_month}/{method.card_exp_year}
                    {method.is_default && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        Default
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.is_default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(method.id)}
                  disabled={deletingId === method.id}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  {deletingId === method.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Payment Method Modal */}
      <Dialog
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4">
            <Elements stripe={getStripe()}>
              <PaymentMethodForm
                onSuccess={() => {
                  setShowAddForm(false);
                  loadPaymentMethods();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </Elements>
          </div>
        </div>
      </Dialog>
    </div>
  );
}