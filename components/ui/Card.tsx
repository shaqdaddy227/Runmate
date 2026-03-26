import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glow?: 'primary' | 'secondary' | 'accent' | 'danger' | null;
  padding?: number;
}

export default function Card({ children, style, glow, padding = 16 }: CardProps) {
  const glowStyle = glow ? SHADOWS.glow(GLOW_COLOR[glow]) : {};

  return (
    <View style={[styles.card, { padding }, glowStyle, style]}>
      {children}
    </View>
  );
}

const GLOW_COLOR = {
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  danger: COLORS.danger,
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
});
