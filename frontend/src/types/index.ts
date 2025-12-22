export interface User {
  id: number;
  email: string;
  username: string;
  preferences: string[];
  telegram_chat_id?: string;
  created_at: string;
}

export interface Job {
  id: number;
  tweet_id: string;
  tweet_url: string;
  author: string;
  username: string;
  text: string;
  category: string;
  posted_at: string;
  engagement: {
    likes: number;
    retweets: number;
  };
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Notification {
  id: number;
  user_id: number;
  job_id?: number;
  title: string;
  message: string;
  notification_type: string;
  job_title?: string;
  job_category?: string;
  job_url?: string;
  is_read: boolean;
  is_clicked: boolean;
  sent_via_email: boolean;
  sent_via_telegram: boolean;
  sent_via_push: boolean;
  sent_at: string;
  read_at?: string;
  clicked_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  clicked: number;
  today: number;
  this_week: number;
}