import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  name: string;
  impressions: number;
  clicks: number;
  bookings?: number;
  revenue?: number;
}

interface PerformanceChartProps {
  data: ChartData[];
  showRevenue?: boolean;
  showBookings?: boolean;
  height?: number;
}

export default function PerformanceChart({ 
  data, 
  showRevenue = false, 
  showBookings = false,
  height = 300
}: PerformanceChartProps) {
  // Format numbers for tooltip
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name === 'Revenue' 
                ? formatCurrency(entry.value) 
                : formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          {showRevenue && <YAxis yAxisId="right" orientation="right" />}
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="impressions" name="Impressions" fill="#3B82F6" />
          <Bar yAxisId="left" dataKey="clicks" name="Clicks" fill="#10B981" />
          {showBookings && <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="#8B5CF6" />}
          {showRevenue && <Bar yAxisId="right" dataKey="revenue" name="Revenue" fill="#F59E0B" />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}