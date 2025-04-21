import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  formatter?: (value: number) => string;
}

export default function MetricsCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeLabel = 'vs. previous period',
  formatter = (val) => val.toString()
}: MetricsCardProps) {
  // Format the value if it's a number and a formatter is provided
  const formattedValue = typeof value === 'number' ? formatter(value) : value;
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold">{formattedValue}</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-full">
          {icon}
        </div>
      </div>
      
      {change !== undefined && (
        <div className={`flex items-center text-xs mt-2 ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {change >= 0 ? (
            <ArrowUpRight className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 mr-1" />
          )}
          <span>{Math.abs(change).toFixed(1)}% {changeLabel}</span>
        </div>
      )}
    </div>
  );
}