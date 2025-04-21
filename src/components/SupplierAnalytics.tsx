import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SupplierAd } from '../types/supplier';
import { 
  BarChart2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface SupplierAnalyticsProps {
  supplierId: string;
  ads: SupplierAd[];
}

interface BookingSummary {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  revenue: number;
  platformFees: number;
}

interface AdPerformance {
  id: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
  bookings: number;
  revenue: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function SupplierAnalytics({ supplierId, ads }: SupplierAnalyticsProps) {
  const [bookingSummary, setBookingSummary] = useState<BookingSummary>({
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    revenue: 0,
    platformFees: 0
  });
  const [adPerformance, setAdPerformance] = useState<AdPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (supplierId) {
      loadAnalytics();
    }
  }, [supplierId, timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get booking summary
      const { data: bookings, error: bookingsError } = await supabase.rpc('get_supplier_bookings', {
        supplier_id: supplierId,
        status_filter: null
      });
      
      if (bookingsError) throw bookingsError;
      
      // Filter bookings by timeframe
      const now = new Date();
      const filteredBookings = bookings?.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        if (timeframe === 'week') {
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return bookingDate >= oneWeekAgo;
        } else if (timeframe === 'month') {
          const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          return bookingDate >= oneMonthAgo;
        } else {
          const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          return bookingDate >= oneYearAgo;
        }
      }) || [];
      
      // Calculate booking summary
      const summary: BookingSummary = {
        total: filteredBookings.length,
        pending: filteredBookings.filter(b => b.status === 'pending').length,
        confirmed: filteredBookings.filter(b => b.status === 'confirmed').length,
        cancelled: filteredBookings.filter(b => b.status === 'cancelled').length,
        completed: filteredBookings.filter(b => b.status === 'completed').length,
        revenue: filteredBookings.reduce((sum, b) => sum + Number(b.price_total), 0),
        platformFees: filteredBookings.reduce((sum, b) => sum + Number(b.platform_fee), 0)
      };
      
      setBookingSummary(summary);
      
      // Calculate ad performance
      const performance: AdPerformance[] = ads.map(ad => {
        const adBookings = filteredBookings.filter(b => b.ad_id === ad.id);
        return {
          id: ad.id,
          title: ad.title,
          impressions: ad.impressions,
          clicks: ad.clicks,
          ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
          bookings: adBookings.length,
          revenue: adBookings.reduce((sum, b) => sum + Number(b.price_total), 0)
        };
      });
      
      setAdPerformance(performance);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
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

  const bookingStatusData = [
    { name: 'Pending', value: bookingSummary.pending },
    { name: 'Confirmed', value: bookingSummary.confirmed },
    { name: 'Completed', value: bookingSummary.completed },
    { name: 'Cancelled', value: bookingSummary.cancelled }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-blue-600" />
          Analytics Dashboard
        </h2>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Timeframe:</span>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'year')}
            className="border rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 12 months</option>
          </select>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Total Bookings</h3>
              <p className="text-2xl font-bold">{bookingSummary.total}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {bookingSummary.pending} pending, {bookingSummary.confirmed} confirmed
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold">{formatCurrency(bookingSummary.revenue)}</p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Platform fees: {formatCurrency(bookingSummary.platformFees)}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Conversion Rate</h3>
              <p className="text-2xl font-bold">
                {ads.reduce((sum, ad) => sum + ad.impressions, 0) > 0
                  ? ((bookingSummary.total / ads.reduce((sum, ad) => sum + ad.impressions, 0)) * 100).toFixed(2)
                  : '0.00'}%
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Impressions to bookings
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Completion Rate</h3>
              <p className="text-2xl font-bold">
                {bookingSummary.total > 0
                  ? ((bookingSummary.completed / bookingSummary.total) * 100).toFixed(2)
                  : '0.00'}%
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {bookingSummary.completed} completed bookings
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Status Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-4">Booking Status</h3>
          <div className="h-64">
            {bookingSummary.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} bookings`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No booking data available
              </div>
            )}
          </div>
        </div>
        
        {/* Ad Performance Chart */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-medium mb-4">Ad Performance</h3>
          <div className="h-64">
            {adPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={adPerformance}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="title" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="impressions" name="Impressions" fill="#8884d8" />
                  <Bar dataKey="clicks" name="Clicks" fill="#82ca9d" />
                  <Bar dataKey="bookings" name="Bookings" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No ad performance data available
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Ad Performance Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <h3 className="font-medium p-4 border-b">Ad Performance Details</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {adPerformance.length > 0 ? (
                adPerformance.map((ad) => (
                  <tr key={ad.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ad.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.impressions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.clicks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.ctr.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.bookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(ad.revenue)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No ad performance data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}