import { Database } from './supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

export type HealthConsideration = 'heart_condition' | 'fear_of_heights' | 'limited_mobility' | 'none';

export interface OnboardingFormData {
  full_name: string;
  username: string;
  age: number | null;
  location: string;
  avatar_url?: string;
  gender?: Gender;
  interests: string[];
  hobbies?: string;
  health_considerations: string[];
  notification_preferences?: {
    push: boolean;
    email: boolean;
  };
  privacy_default?: 'public' | 'friends' | 'private';
  onboarding_completed?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  location: string | null;
  age: number | null;
  gender: Gender | null;
  interests: string[];
  hobbies: string[] | null;
  profile_bio: string | null;
  privacy_default: 'public' | 'friends' | 'private';
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean;
  quiz_completed: boolean;
  is_admin: boolean;
  follower_count?: number;
  following_count?: number;
  is_following?: boolean;
  follow_status?: 'none' | 'following' | 'pending' | 'requested';
}

export interface FollowRequest {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  follower?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
  following?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}