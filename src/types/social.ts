export interface Post {
  id: string;
  user_id: string;
  activity_id?: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  user: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  activity?: {
    id?: string;
    title: string;
    display_title?: string;
  };
  likes_count?: number;
  comments_count?: number;
  user_liked?: boolean;
  status?: 'not_started' | 'in_progress' | 'completed';
  hashtags?: string[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  gif_url?: string | null;
  emoji_reactions?: string[];
  user: {
    username: string;
    avatar_url: string | null;
    full_name?: string | null;
  };
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Flag {
  id: string;
  post_id: string;
  user_id: string;
  reason: string;
  extra_notes?: string;
  created_at: string;
  status?: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
}

export interface Hashtag {
  id: string;
  name: string;
  post_count: number;
  created_at: string;
}

export interface UserHashtag {
  id: string;
  user_id: string;
  hashtag_id: string;
  hashtag_name: string;
  hashtag_name: string;
  created_at: string;
}

export type FeedFilter = 'all' | 'following' | 'friends' | 'hashtags';

export interface CustomActivity {
  id: string;
  user_id: string;
  title: string;
  display_title?: string;
  description: string;
  category_tags: string[];
  created_at: string;
  activity_posts?: {
    id: string;
    visibility: 'public' | 'friends' | 'private';
  }[];
  profiles?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  proposed_for_main_list?: boolean;
  moderation_status?: 'pending' | 'approved' | 'rejected' | 'requested_changes';
  moderator_notes?: string;
}