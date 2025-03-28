export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  status: 'active' | 'blocked';
  created_at: string;
  updated_at: string;
  last_login_time?: string | null;
  last_activity_time?: string | null;
  activity_pattern?: ActivityPattern;
}

export interface ActivityPattern {
  pattern: Record<string, { count: number; minutes: number }>;
  total: {
    minutes: number;
    hours: number;
    displayTime: string;
  };
}
