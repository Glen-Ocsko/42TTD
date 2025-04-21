export interface ModerationAction {
  id: string;
  action_type: 'warning' | 'post_removal' | 'suspension' | 'ban' | 'report_dismissed' | 'report_resolved' | 'escalated';
  reason: string;
  notes?: string;
  target_user_id: string;
  post_id?: string;
  moderator_user_id: string;
  created_at: string;
  moderator?: {
    username: string;
    avatar_url: string | null;
  };
  target_user?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface UserSuspension {
  id: string;
  user_id: string;
  reason: string;
  start_date: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  is_permanent?: boolean;
  moderator?: {
    username: string;
    avatar_url: string | null;
  };
}

export interface ModerationStats {
  total_reports: number;
  open_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
  warnings_issued: number;
  posts_removed: number;
  users_suspended: number;
  users_banned: number;
}

export interface ReportedPost {
  report_id: string;
  post_id: string;
  reporter_id: string;
  reporter_username: string;
  reported_user_id: string;
  reported_username: string;
  post_content: string;
  reason: string;
  extra_notes?: string;
  status: 'open' | 'in_review' | 'resolved' | 'dismissed' | 'escalated';
  created_at: string;
  image_url?: string;
}

export interface CannedResponse {
  id: string;
  title: string;
  message: string;
  action_type: 'warning' | 'post_removal' | 'suspension' | 'ban' | 'report_dismissed' | 'report_resolved';
}

export interface ModerationMessage {
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

export const DEFAULT_CANNED_RESPONSES: CannedResponse[] = [
  {
    id: '1',
    title: 'Spam Warning',
    message: 'Your post has been flagged for containing spam. Please review our community guidelines regarding promotional content. This is a warning, and repeated violations may result in further action.',
    action_type: 'warning'
  },
  {
    id: '2',
    title: 'Inappropriate Content Removal',
    message: 'Your post has been removed for containing inappropriate content that violates our community guidelines. Please ensure future posts adhere to our standards.',
    action_type: 'post_removal'
  },
  {
    id: '3',
    title: 'Harassment Warning',
    message: 'Your post has been flagged for containing harassing content. Please be respectful of all community members. This is a warning, and continued behavior of this nature may result in suspension.',
    action_type: 'warning'
  },
  {
    id: '4',
    title: 'Account Suspension',
    message: 'Due to repeated violations of our community guidelines, your account has been temporarily suspended. During this time, you will not be able to post or comment.',
    action_type: 'suspension'
  },
  {
    id: '5',
    title: 'Account Ban',
    message: 'Due to severe or repeated violations of our community guidelines, your account has been permanently banned from our platform.',
    action_type: 'ban'
  },
  {
    id: '6',
    title: 'Report Dismissed',
    message: 'Thank you for your report. After review, we have determined that the reported content does not violate our community guidelines.',
    action_type: 'report_dismissed'
  },
  {
    id: '7',
    title: 'Report Resolved',
    message: 'Thank you for your report. We have taken appropriate action regarding the content you reported.',
    action_type: 'report_resolved'
  }
];