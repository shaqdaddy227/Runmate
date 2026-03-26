import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Ambient glows */}
      <View style={styles.glowA} pointerEvents="none" />
      <View style={styles.glowB} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo mark */}
            <View style={styles.logoSection}>
              <LinearGradient
                colors={['#00F5A0', '#00C9FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoIcon}
              >
                <Ionicons name="flash" size={34} color="#070711" />
              </LinearGradient>
              <Text style={styles.appName}>RunMate</Text>
              <Text style={styles.tagline}>Run together, anywhere.</Text>
            </View>

            {/* Form card */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Welcome back</Text>
              <Text style={styles.formSubtitle}>Sign in to continue your streak</Text>

              <View style={styles.fields}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  leftIcon="mail-outline"
                  error={errors.email}
                  placeholder="you@example.com"
                />
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  leftIcon="lock-closed-outline"
                  error={errors.password}
                  placeholder="••••••••"
                />
              </View>

              <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              <Button
                label="Sign In"
                onPress={handleLogin}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.submitBtn}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New to RunMate? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Create account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  glowA: {
    position: 'absolute',
    top: -120,
    left: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: COLORS.primaryGlow,
    opacity: 0.35,
  },
  glowB: {
    position: 'absolute',
    bottom: -100,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.secondaryGlow,
    opacity: 0.25,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
  },

  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  appName: {
    fontSize: FONT_SIZE.h2,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // Form
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  formTitle: {
    fontSize: FONT_SIZE.h3,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg,
  },
  fields: {
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  forgotText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
  },
  submitBtn: {},

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  footerText: {
    fontSize: FONT_SIZE.md,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: FONT_SIZE.md,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.bold,
  },
});
