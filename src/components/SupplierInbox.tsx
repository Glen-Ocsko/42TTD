import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { 
  MessageSquare, 
  User, 
  Clock, 
  Send, 
  Loader2, 
  Search,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  ad_id?: string;
  ad_title?: string;
  activity_id?: string;
  activity_title?: string;
  is_moderator_conversation?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  timestamp: string;
  read: boolean;
  ad_id?: string;
  ad_title?: string;
  activity_id?: string;
  activity_title?: string;
  from_moderator?: boolean;
}

export default function SupplierInbox() {
  const { userId, isDemoMode } = useCurrentUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const effectiveUserId = isDemoMode ? '00000000-0000-0000-0000-000000000000' : userId;

  useEffect(() => {
    if (effectiveUserId) {
      loadConversations();
    }
  }, [effectiveUserId]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_user_conversations_with_moderator', {
        p_user_id: effectiveUserId
      });
      
      if (error) throw error;
      
      setConversations(data || []);
      
      // Select first conversation if none selected
      if (data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0].id);
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Error loading conversations: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoadingMessages(true);
      
      if (!effectiveUserId) {
        setMessages([]);
        return;
      }
      
      // Parse the conversation ID to get user IDs
      const [user1, user2] = conversationId.split('-');
      const otherUserId = user1 === effectiveUserId ? user2 : user1;
      
      // Get messages between these users
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          message_text,
          timestamp,
          read,
          ad_id,
          activity_id,
          from_moderator,
          supplier_ads!left(title),
          activities!left(title)
        `)
        .or(`sender_id.eq.${effectiveUserId},receiver_id.eq.${effectiveUserId}`)
        .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
        .order('timestamp', { ascending: true });
      
      if (error) throw error;
      
      // Transform data to include ad and activity titles
      const transformedMessages = data
        ?.filter(msg => 
          (msg.sender_id === effectiveUserId && msg.receiver_id === otherUserId) || 
          (msg.sender_id === otherUserId && msg.receiver_id === effectiveUserId)
        )
        .map(msg => ({
          id: msg.id,
          sender_id: msg.sender_id,
          receiver_id: msg.receiver_id,
          message_text: msg.message_text,
          timestamp: msg.timestamp,
          read: msg.read,
          ad_id: msg.ad_id,
          ad_title: msg.supplier_ads?.title,
          activity_id: msg.activity_id,
          activity_title: msg.activities?.title,
          from_moderator: msg.from_moderator
        })) || [];
      
      setMessages(transformedMessages);
      
      // Mark unread messages as read
      const unreadMessages = transformedMessages
        .filter(msg => msg.receiver_id === effectiveUserId && !msg.read)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessages);
        
        // Refresh conversations to update unread counts
        loadConversations();
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      setError('Error loading messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !effectiveUserId) return;
    
    // Check if this is a moderator conversation
    const conversation = conversations.find(c => c.id === selectedConversation);
    if (conversation?.is_moderator_conversation) {
      setError("You cannot reply to moderator messages");
      return;
    }
    
    setSending(true);
    try {
      // Parse the conversation ID to get the other user's ID
      const [user1, user2] = selectedConversation.split('-');
      const otherUserId = user1 === effectiveUserId ? user2 : user1;
      
      // Get the ad_id and activity_id from the first message in the conversation
      const firstMessage = messages[0];
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: effectiveUserId,
          receiver_id: otherUserId,
          message_text: newMessage.trim(),
          ad_id: firstMessage?.ad_id,
          activity_id: firstMessage?.activity_id,
          from_moderator: false
        });
      
      if (error) throw error;
      
      // Clear input and reload messages
      setNewMessage('');
      loadMessages(selectedConversation);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv => 
    conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.ad_title && conv.ad_title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (conv.activity_title && conv.activity_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-[600px] flex flex-col md:flex-row border rounded-lg overflow-hidden">
      {/* Conversations List */}
      <div className="w-full md:w-1/3 border-r">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto h-[calc(600px-57px)]">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${
                  selectedConversation === conversation.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {conversation.is_moderator_conversation ? (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : conversation.other_user_avatar ? (
                    <img
                      src={conversation.other_user_avatar}
                      alt={conversation.other_user_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium truncate">
                        {conversation.is_moderator_conversation ? 'Moderation Team' : conversation.other_user_name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{conversation.last_message}</p>
                    {(conversation.ad_title || conversation.activity_title) && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Tag className="h-3 w-3" />
                        <span className="truncate">{conversation.ad_title || conversation.activity_title}</span>
                      </div>
                    )}
                    {conversation.is_moderator_conversation && (
                      <div className="flex items-center gap-1 text-xs text-blue-600">
                        <Shield className="h-3 w-3" />
                        <span>Moderation Message</span>
                      </div>
                    )}
                  </div>
                  {conversation.unread_count > 0 && (
                    <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                      {conversation.unread_count}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Messages */}
      <div className="w-full md:w-2/3 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-3 border-b">
              {loadingMessages ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span>Loading conversation...</span>
                </div>
              ) : messages.length > 0 ? (
                <div>
                  <h3 className="font-medium">
                    {messages[0].from_moderator ? 'Moderation Team' : 
                      conversations.find(c => c.id === selectedConversation)?.other_user_name}
                  </h3>
                  {messages[0].ad_title && (
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Tag className="h-3 w-3" />
                      <span>{messages[0].ad_title}</span>
                    </div>
                  )}
                  {messages[0].activity_title && !messages[0].ad_title && (
                    <div className="flex items-center gap-1 text-sm text-blue-600">
                      <Tag className="h-3 w-3" />
                      <span>{messages[0].activity_title}</span>
                    </div>
                  )}
                  {messages.some(m => m.from_moderator) && (
                    <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                      <Shield className="h-3 w-3" />
                      <span>This conversation contains moderation messages</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <span>Start a new conversation</span>
                </div>
              )}
            </div>
            
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map(message => {
                  const isCurrentUser = message.sender_id === effectiveUserId;
                  const isModeratorMessage = message.from_moderator;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          isModeratorMessage
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : isCurrentUser
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {isModeratorMessage && (
                          <div className="flex items-center gap-1 mb-1 text-blue-700 text-sm font-medium">
                            <Shield className="h-4 w-4" />
                            <span>Message from Moderator</span>
                          </div>
                        )}
                        <p>{message.message_text}</p>
                        <div
                          className={`text-xs mt-1 flex items-center gap-1 ${
                            isModeratorMessage
                              ? 'text-blue-600'
                              : isCurrentUser 
                              ? 'text-blue-200' 
                              : 'text-gray-500'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(message.timestamp), 'MMM d, h:mm a')}</span>
                          {isCurrentUser && message.read && (
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="p-3 border-t">
              {conversations.find(c => c.id === selectedConversation)?.is_moderator_conversation ? (
                <div className="bg-gray-100 p-3 rounded-lg text-center text-gray-600">
                  <Shield className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                  <p>You cannot reply to moderation messages</p>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-6">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Conversation Selected</h3>
              <p className="text-gray-500">
                Select a conversation from the list to view messages
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}