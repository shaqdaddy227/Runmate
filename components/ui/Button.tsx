import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, GRADIENTS } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const sizeStyles = SIZE_MAP[size];

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={isDisabled ? ['#2D2D4A', '#2D2D4A'] : GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyles.container]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#070711" />
          ) : (
            <Text style={[styles.textPrimary, sizeStyles.text, textStyle]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const containerStyle = [
    styles.base,
    sizeStyles.container,
    VARIANT_MAP[variant],
    isDisabled && styles.disabled,
    fullWidth && styles.fullWidth,
    style,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <Text style={[styles.text, VARIANT_TEXT_MAP[variant], sizeStyles.text, textStyle]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.3,
  },
  textPrimary: {
    color: '#070711',
    fontWeight: FONT_WEIGHT.bold,
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.4,
  },
});

const VARIANT_MAP: Record<Exclude<Variant, 'primary'>, ViewStyle> = {
  secondary: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.dangerGlow,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
};

const VARIANT_TEXT_MAP: Record<Exclude<Variant, 'primary'>, TextStyle> = {
  secondary: { color: COLORS.secondary },
  outline: { color: COLORS.primary },
  ghost: { color: COLORS.textSecondary },
  danger: { color: COLORS.danger },
};

const SIZE_MAP: Record<Size, { container: ViewStyle; text: TextStyle }> = {
  sm: {
    container: { paddingVertical: 10, paddingHorizontal: 16 },
    text: { fontSize: FONT_SIZE.sm },
  },
  md: {
    container: { paddingVertical: 14, paddingHorizontal: 24 },
    text: { fontSize: FONT_SIZE.md },
  },
  lg: {
    container: { paddingVertical: 18, paddingHorizontal: 32 },
    text: { fontSize: FONT_SIZE.lg },
  },
};
