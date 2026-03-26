import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ActivityCard from '../../components/feed/ActivityCard';
import Avatar from '../../components/ui/Avatar';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants/theme';
import { fetchFeed, addComment } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Run } from '../../types';

export default function FeedScreen() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [commentRunId, setCommentRunId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  const { data: runs = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['feed', profile?.id],
    queryFn: () => fetchFeed(profile!.id),
    enabled: !!profile?.id,
  });

  const handleSendComment = useCallback(async () => {
    if (!commentRunId || !profile || !commentText.trim()) return;
    setSendingComment(true);
    await addComment(commentRunId, profile.id, commentText.trim()).catch(console.error);
    setSendingComment(false);
    setCommentText('');
    setCommentRunId(null);
    queryClient.invalidateQueries({ queryKey: ['feed'] });
  }, [commentRunId, profile, commentText, queryClient]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activity Feed</Text>
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
          <Ionicons name="options-outline" size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (runs as Run[]).length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🏃</Text>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>Follow friends to see their runs here</Text>
        </View>
      ) : (
        <FlatList
          data={runs as Run[]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ActivityCard
              run={item}
              onCommentPress={() => setCommentRunId(item.id)}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* Comment Modal */}
      <Modal
        visible={!!commentRunId}
        animationType="slide"
        transparent
        onRequestClose={() => setCommentRunId(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCommentRunId(null)}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.commentSheet}
        >
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Add a comment</Text>
            <TouchableOpacity onPress={() => setCommentRunId(null)}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.commentInputRow}>
            <Avatar
              uri={profile?.avatar_url}
              name={profile?.full_name ?? profile?.username}
              size="sm"
            />
            <View style={styles.commentInputWrapper}>
              <TextInput
                style={styles.commentInput}
                placeholder="Great run! 🔥"
                placeholderTextColor={COLORS.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                autoFocus
                maxLength={280}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                commentText.trim() && styles.sendBtnActive,
              ]}
              onPress={handleSendComment}
              disabled={!commentText.trim() || sendingComment}
              activeOpacity={0.7}
            >
              {sendingComment ? (
                <ActivityIndicator size="small" color={COLORS.bg} />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={commentText.trim() ? COLORS.bg : COLORS.textMuted}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listContent: { paddingTop: SPACING.xs },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  commentSheet: {
    backgroundColor: COLORS.bgCard,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  commentTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: FONT_WEIGHT.bold,
    color: COLORS.text,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.sm,
  },
  commentInputWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgInput,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 10,
    minHeight: 44,
  },
  commentInput: {
    color: COLORS.text,
    fontSize: FONT_SIZE.md,
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendBtnActive: {
    backgroundColor: COLORS.primary,
  },
});
