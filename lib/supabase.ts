import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper: get current user id
export async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

// Helper: fetch profile
export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// Helper: fetch feed (runs from people the user follows + own runs)
export async function fetchFeed(userId: string, page = 0, limit = 20) {
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      profile:profiles!runs_user_id_fkey(*),
      like_count:likes(count),
      comment_count:comments(count),
      user_has_liked:likes!inner(user_id)
    `)
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (error) throw error;
  return data;
}

// Helper: fetch runs for a user
export async function fetchUserRuns(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

// Helper: save a completed run
export async function saveRun(run: {
  user_id: string;
  title?: string;
  distance_km: number;
  duration_seconds: number;
  avg_pace_seconds_per_km?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  calories?: number;
  route: Array<{ latitude: number; longitude: number }>;
  started_at: string;
  ended_at: string;
  is_virtual?: boolean;
  virtual_room_id?: string;
}) {
  const { data, error } = await supabase
    .from('runs')
    .insert(run)
    .select()
    .single();
  if (error) throw error;

  // Update profile aggregate stats
  await supabase.rpc('increment_profile_stats', {
    p_user_id: run.user_id,
    p_distance_km: run.distance_km,
    p_duration_seconds: run.duration_seconds,
  });

  return data;
}

// Helper: toggle like
export async function toggleLike(runId: string, userId: string, liked: boolean) {
  if (liked) {
    await supabase.from('likes').delete().eq('run_id', runId).eq('user_id', userId);
  } else {
    await supabase.from('likes').insert({ run_id: runId, user_id: userId });
  }
}

// Helper: add comment
export async function addComment(runId: string, userId: string, content: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({ run_id: runId, user_id: userId, content })
    .select(`*, profile:profiles!comments_user_id_fkey(*)`)
    .single();
  if (error) throw error;
  return data;
}

// Helper: fetch leaderboard
export async function fetchLeaderboard(period: 'week' | 'month' | 'alltime', limit = 25) {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_period: period,
    p_limit: limit,
  });
  if (error) throw error;
  return data;
}

// Helper: search users
export async function searchUsers(query: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
    .limit(20);
  if (error) throw error;
  return data;
}

// Helper: follow / unfollow
export async function toggleFollow(followerId: string, followingId: string, isFollowing: boolean) {
  if (isFollowing) {
    await supabase
      .from('friendships')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
  } else {
    await supabase.from('friendships').insert({
      follower_id: followerId,
      following_id: followingId,
      status: 'accepted',
    });
  }
}

// Helper: create virtual room
export async function createVirtualRoom(hostId: string, name: string) {
  const roomId = `RM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const { data, error } = await supabase
    .from('virtual_rooms')
    .insert({ id: roomId, host_id: hostId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Helper: update live location in virtual room
export async function updateLiveLocation(
  userId: string,
  roomId: string,
  lat: number,
  lng: number,
  distanceKm: number,
  durationSeconds: number,
) {
  await supabase.from('live_locations').upsert({
    user_id: userId,
    room_id: roomId,
    latitude: lat,
    longitude: lng,
    distance_km: distanceKm,
    duration_seconds: durationSeconds,
    updated_at: new Date().toISOString(),
  });
}
