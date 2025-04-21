import React from 'react';
import { UserBooking } from '../types/booking';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  Building2, 
  Tag, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Printer
} from 'lucide-react';

interface BookingInvoiceProps {
  booking: UserBooking;
  onClose: () => void;
}

export default function BookingInvoice({ booking, onClose }: BookingInvoiceProps) {
  const formatCurrency = (amount: number, currency: string) => {
    const currencySymbols: Record<string, string> = {
      GBP: '£',
      USD: '$',
      EUR: '€',
      CAD: 'C$',
      AUD: 'A$',
      NZD: 'NZ$'
    };
    
    return `${currencySymbols[currency] || ''}${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Confirmed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
            <XCircle className="h-3 w-3" />
            Cancelled
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white p-6 rounded-lg max-w-2xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">Booking Invoice</h1>
          <p className="text-gray-600">Invoice #: {booking.id.substring(0, 8)}</p>
          <p className="text-gray-600">Date: {format(new Date(booking.created_at), 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          {booking.stripe_invoice_url && (
            <a
              href={booking.stripe_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Download className="h-4 w-4" />
              Download
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Supplier</h2>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{booking.supplier_name}</span>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-2">Booking Details</h2>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            {booking.time && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>{format(parseISO(`2000-01-01T${booking.time}`), 'h:mm a')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-gray-400" />
              <span>{booking.ad_title || booking.activity_title || 'Booking'}</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(booking.status)}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-b py-4 mb-8">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-500 text-sm">
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">
                <div className="font-medium">{booking.ad_title || booking.activity_title || 'Booking'}</div>
                <div className="text-sm text-gray-600">
                  {format(parseISO(booking.date), 'MMM d, yyyy')}
                  {booking.time && ` at ${format(parseISO(`2000-01-01T${booking.time}`), 'h:mm a')}`}
                </div>
              </td>
              <td className="py-2 text-right">{formatCurrency(booking.price_total, booking.currency)}</td>
            </tr>
            <tr>
              <td className="py-2">Platform Fee (10%)</td>
              <td className="py-2 text-right">{formatCurrency(booking.price_total * 0.1, booking.currency)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t">
              <td className="pt-2 font-bold">Total</td>
              <td className="pt-2 text-right font-bold">{formatCurrency(booking.price_total * 1.1, booking.currency)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="text-sm text-gray-600">
        <h2 className="font-medium text-gray-800 mb-2">Payment Information</h2>
        <p className="mb-1">
          {booking.status === 'confirmed' && !booking.stripe_invoice_url && (
            <span className="text-yellow-600">Payment pending</span>
          )}
          {booking.status === 'confirmed' && booking.stripe_invoice_url && (
            <span className="text-green-600">Payment completed</span>
          )}
          {booking.status === 'cancelled' && (
            <span className="text-red-600">Booking cancelled - no payment required</span>
          )}
          {booking.status === 'pending' && (
            <span className="text-gray-600">Payment will be processed after confirmation</span>
          )}
        </p>
        {booking.status === 'confirmed' && !booking.stripe_invoice_url && (
          <div className="mt-4">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={() => {
                // This would normally trigger a payment flow
                alert('Payment functionality would be implemented here with Stripe');
              }}
            >
              <CreditCard className="h-5 w-5" />
              Pay Now
            </button>
          </div>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Thank you for your booking!</p>
        <p>42 Things To Do Ltd</p>
      </div>
    </div>
  );
}