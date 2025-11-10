export interface User {
  pk: string; // USER#${userId}
  sk: string; // PROFILE
  entity_type: "USER";
  user_id: string;
  email: string;
  name?: string;
  picture?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  pk: string; // USER#${userId}
  sk: string; // PREFERENCES
  entity_type: "USER_PREFERENCES";
  user_id: string;
  theme?: "light" | "dark" | "system";
  notifications_enabled?: boolean;
  updated_at: string;
}
