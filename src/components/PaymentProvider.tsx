import React, { createContext, useContext, ReactNode } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../lib/stripeClient';

interface PaymentContextType {
  // Add any payment-related context values here
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}

interface PaymentProviderProps {
  children: ReactNode;
}

export function PaymentProvider({ children }: PaymentProviderProps) {
  // Initialize Stripe
  const stripePromise = getStripe();

  return (
    <PaymentContext.Provider value={{}}>
      <Elements stripe={stripePromise}>
        {children}
      </Elements>
    </PaymentContext.Provider>
  );
}