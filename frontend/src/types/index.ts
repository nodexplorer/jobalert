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