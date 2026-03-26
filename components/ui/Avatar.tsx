import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONT_WEIGHT } from '../../constants/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
  style?: ViewStyle;
  showBorder?: boolean;
  isOnline?: boolean;
}

const SIZE_MAP: Record<AvatarSize, number> = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 60,
  xl: 80,
};

export default function Avatar({
  uri,
  name,
  size = 'md',
  style,
  showBorder = false,
  isOnline,
}: AvatarProps) {
  const dim = SIZE_MAP[size];
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase()
    : '?';
  const fontSize = dim * 0.35;

  return (
    <View style={[{ width: dim, height: dim }, style]}>
      {showBorder ? (
        <LinearGradient
          colors={GRADIENTS.primary}
          style={[styles.borderGradient, { borderRadius: dim / 2 }]}
        >
          <View style={[styles.inner, { borderRadius: dim / 2 - 2, width: dim - 4, height: dim - 4 }]}>
            {uri ? (
              <Image
                source={{ uri }}
                style={{ width: dim - 4, height: dim - 4, borderRadius: dim / 2 - 2 }}
              />
            ) : (
              <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
            )}
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.avatarBase, { borderRadius: dim / 2, width: dim, height: dim }]}>
          {uri ? (
            <Image
              source={{ uri }}
              style={{ width: dim, height: dim, borderRadius: dim / 2 }}
            />
          ) : (
            <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
          )}
        </View>
      )}

      {isOnline !== undefined && (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: isOnline ? COLORS.primary : COLORS.textMuted,
              width: dim * 0.25,
              height: dim * 0.25,
              borderRadius: (dim * 0.25) / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBase: {
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  borderGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
  onlineDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
});
