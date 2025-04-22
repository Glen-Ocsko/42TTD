import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  Shield, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Ban, 
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';

interface ModerationMessage {
  id: string;
  receiver_id: string;
  sender_id?: string;
  sender_username?: string;
  action_id?: string;
  action_type?: string;
  message_text: string;
  is_system: boolean;
  read: boolean;
  created_at: string;
}

export default function ModerationMessages() {
  const { userId } = useCurrentUser();
  const [messages, setMessages] = useState<ModerationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      loadModerationMessages();
    }
  }, [userId]);

  const loadModerationMessages = async () => {
    try {
      setLoading(true);
      
      const { data, error: fetchError } = await supabase
        .rpc('get_user_moderation_messages', { user_id: userId });
      
      if (fetchError) throw fetchError;
      
      setMessages(data || []);
      
      // Mark all messages as read
      if (data && data.length > 0) {
        const unreadMessages = data.filter(msg => !msg.read).map(msg => msg.id);
        
        if (unreadMessages.length > 0) {
          await supabase
            .from('moderation_messages')
            .update({ read: true })
            .in('id', unreadMessages);
        }
      }
    } catch (err) {
      console.error('Error loading moderation messages:', err);
      setError('Failed to load moderation messages');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType?: string) => {
    switch (actionType) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'post_removal':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'suspension':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'ban':
        return <Ban className="h-5 w-5 text-red-600" />;
      case 'report_dismissed':
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case 'report_resolved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Shield className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActionTitle = (actionType?: string) => {
    switch (actionType) {
      case 'warning':
        return 'Warning';
      case 'post_removal':
        return 'Post Removed';
      case 'suspension':
        return 'Account Suspended';
      case 'ban':
        return 'Account Banned';
      case 'report_dismissed':
        return 'Report Dismissed';
      case 'report_resolved':
        return 'Report Resolved';
      case 'escalated':
        return 'Escalated to Admin';
      default:
        return 'Moderation Notice';
    }
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
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Moderation Messages</h2>
      
      {messages.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Moderation Messages</h3>
          <p className="text-gray-600">
            You don't have any messages from our moderation team.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`p-4 rounded-lg ${
                message.is_system 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-white shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  message.is_system 
                    ? 'bg-blue-100' 
                    : 'bg-amber-100'
                }`}>
                  {getActionIcon(message.action_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">
                      {message.is_system 
                        ? 'System Notice' 
                        : `Moderator: ${message.sender_username || 'Unknown'}`}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {format(new Date(message.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  
                  {message.action_type && (
                    <div className="text-sm font-medium mb-2 text-gray-700">
                      {getActionTitle(message.action_type)}
                    </div>
                  )}
                  
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {message.message_text}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}