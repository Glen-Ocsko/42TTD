export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  ad_id?: string;
  activity_id?: string;
  message_text: string;
  timestamp: string;
  read: boolean;
  conversation_id: string;
}

export interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  ad_id?: string;
  activity_id?: string;
}

export interface MessageFormData {
  receiver_id: string;
  ad_id?: string;
  activity_id?: string;
  message_text: string;
}