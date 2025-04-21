import React from 'react';
import { SupplierAd } from '../types/supplier';
import { ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface AdPerformanceTableProps {
  ads: SupplierAd[];
  timeRange: string;
  bookings?: Record<string, number>;
  inquiries?: Record<string, number>;
  revenue?: Record<string, number>;
  previousStats?: Record<string, {
    impressions: number;
    clicks: number;
  }>;
}

export default function AdPerformanceTable({ 
  ads, 
  timeRange,
  bookings = {},
  inquiries = {},
  revenue = {},
  previousStats = {}
}: AdPerformanceTableProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Calculate CTR
  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return 0;
    return (clicks / impressions) * 100;
  };

  // Calculate percent change
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Get total stats
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const totalCTR = calculateCTR(totalClicks, totalImpressions);
  const totalBookings = Object.values(bookings).reduce((sum, count) => sum + count, 0);
  const totalInquiries = Object.values(inquiries).reduce((sum, count) => sum + count, 0);
  const totalRevenue = Object.values(revenue).reduce((sum, amount) => sum + amount, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b">
            <th className="pb-3 font-medium">Ad Title</th>
            <th className="pb-3 font-medium text-right">Impressions</th>
            <th className="pb-3 font-medium text-right">Clicks</th>
            <th className="pb-3 font-medium text-right">CTR</th>
            {Object.keys(bookings).length > 0 && (
              <th className="pb-3 font-medium text-right">Bookings</th>
            )}
            {Object.keys(inquiries).length > 0 && (
              <th className="pb-3 font-medium text-right">Inquiries</th>
            )}
            {Object.keys(revenue).length > 0 && (
              <th className="pb-3 font-medium text-right">Revenue</th>
            )}
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => {
            const ctr = calculateCTR(ad.clicks, ad.impressions);
            const prevStats = previousStats[ad.id] || { impressions: 0, clicks: 0 };
            const impressionChange = calculateChange(ad.impressions, prevStats.impressions);
            const clickChange = calculateChange(ad.clicks, prevStats.clicks);
            const prevCTR = calculateCTR(prevStats.clicks, prevStats.impressions);
            const ctrChange = calculateChange(ctr, prevCTR);
            
            return (
              <tr key={ad.id} className="border-b hover:bg-gray-50">
                <td className="py-3 pr-4">
                  <div className="line-clamp-1 font-medium">{ad.title}</div>
                </td>
                <td className="py-3 text-right">
                  <div>{ad.impressions.toLocaleString()}</div>
                  {prevStats.impressions > 0 && (
                    <div className={`text-xs flex items-center justify-end ${
                      impressionChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {impressionChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      <span>{Math.abs(impressionChange).toFixed(1)}%</span>
                    </div>
                  )}
                </td>
                <td className="py-3 text-right">
                  <div>{ad.clicks.toLocaleString()}</div>
                  {prevStats.clicks > 0 && (
                    <div className={`text-xs flex items-center justify-end ${
                      clickChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {clickChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      <span>{Math.abs(clickChange).toFixed(1)}%</span>
                    </div>
                  )}
                </td>
                <td className="py-3 text-right">
                  <div className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                    ctr > 5 ? 'bg-green-100 text-green-800' : 
                    ctr > 2 ? 'bg-blue-100 text-blue-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ctr.toFixed(2)}%
                  </div>
                  {prevCTR > 0 && (
                    <div className={`text-xs flex items-center justify-end ${
                      ctrChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {ctrChange >= 0 ? (
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                      )}
                      <span>{Math.abs(ctrChange).toFixed(1)}%</span>
                    </div>
                  )}
                </td>
                {Object.keys(bookings).length > 0 && (
                  <td className="py-3 text-right">
                    {bookings[ad.id] || 0}
                  </td>
                )}
                {Object.keys(inquiries).length > 0 && (
                  <td className="py-3 text-right">
                    {inquiries[ad.id] || 0}
                  </td>
                )}
                {Object.keys(revenue).length > 0 && (
                  <td className="py-3 text-right">
                    {formatCurrency(revenue[ad.id] || 0)}
                  </td>
                )}
                <td className="py-3 text-right">
                  <a 
                    href={ad.cta_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center p-1 text-gray-500 hover:text-blue-600"
                    title="View Ad Destination"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-50 font-medium">
            <td className="py-3">TOTAL</td>
            <td className="py-3 text-right">{totalImpressions.toLocaleString()}</td>
            <td className="py-3 text-right">{totalClicks.toLocaleString()}</td>
            <td className="py-3 text-right">{totalCTR.toFixed(2)}%</td>
            {Object.keys(bookings).length > 0 && (
              <td className="py-3 text-right">{totalBookings}</td>
            )}
            {Object.keys(inquiries).length > 0 && (
              <td className="py-3 text-right">{totalInquiries}</td>
            )}
            {Object.keys(revenue).length > 0 && (
              <td className="py-3 text-right">{formatCurrency(totalRevenue)}</td>
            )}
            <td className="py-3 text-right"></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}