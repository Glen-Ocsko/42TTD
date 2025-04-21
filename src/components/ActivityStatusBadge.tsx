import React from 'react';
import { Target, Clock, CheckCircle2 } from 'lucide-react';

interface ActivityStatusBadgeProps {
  status: 'not_started' | 'in_progress' | 'completed';
  className?: string;
}

export default function ActivityStatusBadge({ status, className = '' }: ActivityStatusBadgeProps) {
  const statusConfig = {
    not_started: {
      icon: <Target className="h-4 w-4" />,
      text: '🎯 Yet to Start',
      classes: 'bg-gray-100 text-gray-700'
    },
    in_progress: {
      icon: <Clock className="h-4 w-4" />,
      text: '🚀 In Progress',
      classes: 'bg-blue-100 text-blue-700'
    },
    completed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      text: '✅ Completed',
      classes: 'bg-green-100 text-green-700'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${config.classes} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}