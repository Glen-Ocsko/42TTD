import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Loader2, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PaymentSummary as PaymentSummaryType } from '../types/payment';

interface PaymentSummaryProps {
  supplierId: string;
  timeRange?: 'week' | 'month' | 'year' | 'all';
}

export default function PaymentSummary({ supplierId, timeRange = 'month' }: PaymentSummaryProps) {
  const [summary, setSummary] = useState<PaymentSummaryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (supplierId) {
      loadPaymentSummary();
    }
  }, [supplierId, timeRange]);

  const loadPaymentSummary = async () => {
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
      
      const { data, error } = await supabase.rpc('get_supplier_payment_summary', {
        supplier_id: supplierId,
        start_date: startDate ? startDate.toISOString() : null,
        end_date: null
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSummary(data[0]);
      } else {
        setSummary({
          total_revenue: 0,
          platform_fees: 0,
          supplier_earnings: 0,
          pending_payouts: 0,
          completed_payouts: 0,
          currency: 'GBP'
        });
      }
    } catch (err) {
      console.error('Error loading payment summary:', err);
      setError('Failed to load payment summary');
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold">{formatCurrency(summary.total_revenue, summary.currency)}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Platform fees: {formatCurrency(summary.platform_fees, summary.currency)}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <ArrowDownLeft className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Your Earnings</h3>
            <p className="text-2xl font-bold">{formatCurrency(summary.supplier_earnings, summary.currency)}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          After platform fees
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <ArrowUpRight className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm text-gray-500">Pending Payouts</h3>
            <p className="text-2xl font-bold">{formatCurrency(summary.pending_payouts, summary.currency)}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          Completed: {formatCurrency(summary.completed_payouts, summary.currency)}
        </div>
      </div>
    </div>
  );
}