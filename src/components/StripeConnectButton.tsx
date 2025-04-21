import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CreditCard, Loader2, AlertTriangle } from 'lucide-react';

interface StripeConnectButtonProps {
  supplierId: string;
  isConnected?: boolean;
  buttonText?: string;
  className?: string;
}

export default function StripeConnectButton({
  supplierId,
  isConnected = false,
  buttonText = 'Connect with Stripe',
  className = 'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700'
}: StripeConnectButtonProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('You must be logged in to connect your Stripe account');
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-connect-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          supplierId,
          returnUrl: `${window.location.origin}/supplier`
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create Stripe Connect account');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Connect onboarding
      window.location.href = url;
    } catch (err) {
      console.error('Error connecting to Stripe:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to Stripe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg mb-4 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      <button
        onClick={handleConnect}
        disabled={loading}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="h-5 w-5" />
        )}
        <span>{isConnected ? 'Manage Stripe Account' : buttonText}</span>
      </button>
    </div>
  );
}