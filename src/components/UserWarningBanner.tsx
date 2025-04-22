import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X, Shield, Clock, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Dialog } from '@headlessui/react';
import AppealForm from './AppealForm';

interface Warning {
  id: string;
  action_type: string;
  reason: string;
  created_at: string;
  moderator_username: string;
  post_id?: string;
  has_appeal: boolean;
  appeal_status?: string;
}

interface Suspension {
  id: string;
  reason: string;
  start_date: string;
  end_date?: string;
  is_permanent: boolean;
  created_at: string;
  moderator_username: string;
  days_remaining?: number;
  has_appeal: boolean;
  appeal_status?: string;
}

interface UserWarningBannerProps {
  warnings: Warning[];
  suspension?: Suspension;
  userId: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export default function UserWarningBanner({
  warnings,
  suspension,
  userId,
  onClose,
  showCloseButton = true
}: UserWarningBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [selectedWarningId, setSelectedWarningId] = useState<string | null>(null);
  
  const handleAppeal = (warningId: string) => {
    setSelectedWarningId(warningId);
    setShowAppealModal(true);
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'post_removal':
        return <X className="h-5 w-5 text-red-500" />;
      case 'suspension':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'ban':
        return <Ban className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActionTitle = (actionType: string) => {
    switch (actionType) {
      case 'warning':
        return 'Warning';
      case 'post_removal':
        return 'Post Removed';
      case 'suspension':
        return 'Account Suspended';
      case 'ban':
        return 'Account Banned';
      default:
        return 'Moderation Action';
    }
  };

  const getAppealStatus = (status?: string) => {
    if (!status) return null;
    
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
            <Clock className="h-3 w-3" />
            Appeal Pending
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
            <Shield className="h-3 w-3" />
            Appeal Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
            <X className="h-3 w-3" />
            Appeal Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // If no warnings or suspension, don't show anything
  if (warnings.length === 0 && !suspension) {
    return null;
  }

  return (
    <>
      <div className={`bg-amber-50 border-l-4 ${suspension ? 'border-red-500' : 'border-amber-500'} p-4 mb-6`}>
        <div className="flex justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-full ${suspension ? 'bg-red-100' : 'bg-amber-100'}`}>
              {suspension ? (
                suspension.is_permanent ? (
                  <Ban className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-orange-500" />
                )
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
            </div>
            
            <div>
              <h3 className="font-medium text-lg">
                {suspension ? (
                  suspension.is_permanent ? 'Your Account Has Been Banned' : 'Your Account Is Suspended'
                ) : (
                  'Account Warning'
                )}
              </h3>
              
              {suspension ? (
                <div className="text-gray-700 mt-1">
                  <p>{suspension.reason}</p>
                  {!suspension.is_permanent && suspension.days_remaining && suspension.days_remaining > 0 && (
                    <p className="mt-1 font-medium">
                      Your suspension will be lifted in {suspension.days_remaining} day{suspension.days_remaining !== 1 ? 's' : ''}.
                    </p>
                  )}
                  {suspension.is_permanent && (
                    <p className="mt-1 font-medium text-red-600">
                      This is a permanent ban. Your account cannot be used.
                    </p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Issued by {suspension.moderator_username} on {format(new Date(suspension.created_at), 'MMMM d, yyyy')}</span>
                  </div>
                  
                  {suspension.has_appeal && (
                    <div className="mt-2">
                      {getAppealStatus(suspension.appeal_status)}
                    </div>
                  )}
                  
                  {!suspension.has_appeal && (
                    <button
                      onClick={() => handleAppeal(suspension.id)}
                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Appeal This Decision
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-gray-700">
                  <p>
                    {warnings.length === 1 
                      ? 'You have received a warning from our moderation team.' 
                      : `You have received ${warnings.length} warnings from our moderation team.`
                    }
                  </p>
                  
                  {warnings.length === 1 ? (
                    <div className="mt-2">
                      <p><strong>Reason:</strong> {warnings[0].reason}</p>
                      <div className="mt-1 text-sm text-gray-500">
                        <span>Issued by {warnings[0].moderator_username} on {format(new Date(warnings[0].created_at), 'MMMM d, yyyy')}</span>
                      </div>
                      
                      {warnings[0].has_appeal && (
                        <div className="mt-2">
                          {getAppealStatus(warnings[0].appeal_status)}
                        </div>
                      )}
                      
                      {!warnings[0].has_appeal && (
                        <button
                          onClick={() => handleAppeal(warnings[0].id)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Appeal This Warning
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2">
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Hide Warnings
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            View All Warnings
                          </>
                        )}
                      </button>
                      
                      {expanded && (
                        <div className="mt-3 space-y-3">
                          {warnings.map(warning => (
                            <div key={warning.id} className="border-t pt-3">
                              <div className="flex items-start gap-2">
                                {getActionIcon(warning.action_type)}
                                <div>
                                  <p className="font-medium">{getActionTitle(warning.action_type)}</p>
                                  <p>{warning.reason}</p>
                                  <div className="mt-1 text-sm text-gray-500">
                                    <span>Issued by {warning.moderator_username} on {format(new Date(warning.created_at), 'MMMM d, yyyy')}</span>
                                  </div>
                                  
                                  {warning.has_appeal && (
                                    <div className="mt-2">
                                      {getAppealStatus(warning.appeal_status)}
                                    </div>
                                  )}
                                  
                                  {!warning.has_appeal && (
                                    <button
                                      onClick={() => handleAppeal(warning.id)}
                                      className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      Appeal This Warning
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-3 text-sm">
                <Link to="/terms" className="text-blue-600 hover:underline">
                  View Community Guidelines
                </Link>
              </div>
            </div>
          </div>
          
          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      
      <Dialog
        open={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        className="fixed inset-0 z-10 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 p-6">
            <Dialog.Title className="text-lg font-bold mb-4">
              Appeal Moderation Action
            </Dialog.Title>
            
            <AppealForm 
              userId={userId}
              actionId={selectedWarningId || ''}
              onSuccess={() => {
                setShowAppealModal(false);
                // Refresh warnings/suspension data would happen here in a real implementation
              }}
              onCancel={() => setShowAppealModal(false)}
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}