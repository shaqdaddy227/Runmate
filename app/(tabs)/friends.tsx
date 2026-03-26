import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, searchUsers, toggleFollow, createVirtualRoom } from '../../lib/supabase';
import Avatar from '../../components/ui/Avatar';
import Card from '../../components/ui/Card';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { Profile } from '../../types';

type Tab = 'following' | 'discover' | 'rooms';

export default function FriendsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Fetch people the user follows
  const { data: following = [] } = useQuery({
    queryKey: ['following', profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('friendships')
        .select('following_id, profiles!friendships_following_id_fkey(*)')
        .eq('follower_id', profile!.id)
        .eq('status', 'accepted');
      return (data ?? []).map((f: any) => f.profiles as Profile);
    },
    enabled: !!profile?.id,
  });

  // Search users
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['searchUsers', searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: ({ followingId, isFollowing }: { followingId: string; isFollowing: boolean }) =>
      toggleFollow(profile!.id, followingId, isFollowing),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
    },
  });

  const handleCreateRoom = useCallback(async () => {
    if (!profile) return;
    setCreatingRoom(true);
    try {
      const room = await createVirtualRoom(profile.id, `${profile.username}'s Run`);
      router.push('/active-run');
    } catch (e) {
      Alert.alert('Error', 'Failed to create virtual run room');
    } finally {
      setCreatingRoom(false);
    }
  }, [profile, router]);

  const displayedUsers =
    searchQuery.length >= 2 ? (searchResults as Profile[]) : (following as Profile[]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['following', 'discover', 'rooms'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'rooms' ? (
        <VirtualRoomsTab onCreateRoom={handleCreateRoom} creatingRoom={creatingRoom} userId={profile?.id} />
      ) : (
        <>
          {/* Search */}
          <View style={styles.searchWrapper}>
            <Ionicons name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'discover' ? 'Search runners...' : 'Search following...'}
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {isSearching ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={displayedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RunnerRow
                  user={item}
                  isFollowing={(following as Profile[]).some((f) => f.id === item.id)}
                  isCurrentUser={item.id === profile?.id}
                  onToggleFollow={() =>
                    followMutation.mutate({
                      followingId: item.id,
                      isFollowing: (following as Profile[]).some((f) => f.id === item.id),
                    })
                  }
                />
              )}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons
                    name={activeTab === 'following' ? 'people-outline' : 'search-outline'}
                    size={40}
                    color={COLORS.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    {activeTab === 'following'
                      ? 'Find runners to follow'
                      : 'No results found'}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              ListFooterComponent={<View style={{ height: 100 }} />}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function RunnerRow({
  user,
  isFollowing,
  isCurrentUser,
  onToggleFollow,
}: {
  user: Profile;
  isFollowing: boolean;
  isCurrentUser: boolean;
  onToggleFollow: () => void;
}) {
  return (
    <View style={rowStyles.container}>
      <Avatar uri={user.avatar_url} name={user.full_name ?? user.username} size="md" />
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{user.full_name ?? user.username}</Text>
        <Text style={rowStyles.username}>@{user.username}</Text>
        <Text style={rowStyles.stats}>
          {user.total_runs} runs · {user.total_distance_km.toFixed(0)} km
        </Text>
      </View>
      {!isCurrentUser && (
        <TouchableOpacity
          style={[rowStyles.followBtn, isFollowing && rowStyles.followingBtn]}
          onPress={onToggleFollow}
          activeOpacity={0.75}
        >
          <Text style={[rowStyles.followBtnText, isFollowing && rowStyles.followingBtnText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function VirtualRoomsTab({
  onCreateRoom,
  creatingRoom,
  userId,
}: {
  onCreateRoom: () => void;
  creatingRoom: boolean;
  userId?: string;
}) {
  const { data: rooms = [] } = useQuery({
    queryKey: ['virtualRooms'],
    queryFn: async () => {
      const { data } = await supabase
        .from('virtual_rooms')
        .select('*, host:profiles!virtual_rooms_host_id_fkey(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Create Room CTA */}
      <TouchableOpacity
        style={styles.createRoomBtn}
        onPress={onCreateRoom}
        disabled={creatingRoom}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#8B5CF6', '#00C9FF']} style={styles.createRoomGradient}>
          {creatingRoom ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <View>
                <Text style={styles.createRoomTitle}>Create Virtual Run</Text>
                <Text style={styles.createRoomSub}>Invite friends to run together</Text>
              </View>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.roomsLabel}>Active Rooms</Text>

      {(rooms as any[]).length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={40} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No active virtual runs right now</Text>
        </View>
      ) : (
        <FlatList
          data={rooms as any[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.roomCard} padding={14}>
              <View style={styles.roomCardLeft}>
                <Avatar uri={item.host?.avatar_url} name={item.host?.full_name} size="sm" />
                <View>
                  <Text style={styles.roomName}>{item.name ?? 'Virtual Run'}</Text>
                  <Text style={styles.roomHost}>Hosted by @{item.host?.username}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.joinBtn} activeOpacity={0.75}>
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </Card>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabActive: {
    backgroundColor: COLORS.primaryDim,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    fontWeight: FONT_WEIGHT.medium,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgInput,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    gap: SPACING.xs,
  },
  searchIcon: { marginLeft: 4 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
  },
  listContent: { paddingHorizontal: SPACING.md },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: SPACING.sm,
  },

  emptyText: { fontSize: FONT_SIZE.md, color: COLORS.textMuted },
  createRoomBtn: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  createRoomGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  createRoomTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: '#fff',
  },
  createRoomSub: { fontSize: FONT_SIZE.sm, color: 'rgba(255,255,255,0.7)' },
  roomsLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  roomCard: { marginBottom: SPACING.sm, flexDirection: 'row', alignItems: 'center' },
  roomCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  roomName: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  roomHost: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  joinBtn: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  joinBtnText: { fontSize: FONT_SIZE.sm, color: COLORS.primary, fontWeight: FONT_WEIGHT.bold },
});

const rowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  info: { flex: 1 },
  name: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, color: COLORS.text },
  username: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 1 },
  stats: { fontSize: FONT_SIZE.xs, color: COLORS.textMuted, marginTop: 2 },
  followBtn: {
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followingBtn: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
  },
  followBtnText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  followingBtnText: {
    color: COLORS.textSecondary,
  },
});
