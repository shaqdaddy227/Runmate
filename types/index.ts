export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  total_distance_km: number;
  total_runs: number;
  total_duration_seconds: number;
  weekly_goal_km: number;
  created_at: string;
}

export interface Run {
  id: string;
  user_id: string;
  title: string | null;
  distance_km: number;
  duration_seconds: number;
  avg_pace_seconds_per_km: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  calories: number | null;
  elevation_gain_m: number | null;
  route: RoutePoint[];
  started_at: string;
  ended_at: string | null;
  is_virtual: boolean;
  virtual_room_id: string | null;
  created_at: string;
  // Joined
  profile?: Profile;
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp?: number;
  altitude?: number | null;
}

export interface Friendship {
  id: string;
  follower_id: string;
  following_id: string;
  status: 'pending' | 'accepted';
  created_at: string;
  profile?: Profile;
}

export interface Like {
  id: string;
  run_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  run_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export interface VirtualRoom {
  id: string;
  host_id: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  host?: Profile;
  participant_count?: number;
}

export interface LiveParticipant {
  user_id: string;
  room_id: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  duration_seconds: number;
  updated_at: string;
  profile?: Profile;
}

export interface Achievement {
  id: string;
  user_id: string;
  type: AchievementType;
  earned_at: string;
}

export type AchievementType =
  | 'first_run'
  | 'run_5k'
  | 'run_10k'
  | 'run_half_marathon'
  | 'run_marathon'
  | 'streak_7'
  | 'streak_30'
  | 'total_100k'
  | 'total_500k'
  | 'virtual_run'
  | 'early_bird'
  | 'night_runner';

export interface WeeklyStats {
  week_start: string;
  total_distance_km: number;
  total_runs: number;
  total_duration_seconds: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  total_distance_km: number;
  run_count: number;
  is_current_user?: boolean;
}

// Active run state
export interface ActiveRunState {
  isRunning: boolean;
  isPaused: boolean;
  startTime: number | null;
  pausedDuration: number;
  distance_km: number;
  routePoints: RoutePoint[];
  heartRate: number | null;
  virtualRoomId: string | null;
}
