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

export default function SignupScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Name is required';
    if (!username.trim()) errs.username = 'Username is required';
    else if (username.length < 3) errs.username = 'At least 3 characters';
    else if (!/^[a-z0-9_]+$/.test(username)) errs.username = 'Lowercase letters, numbers, underscores only';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 8) errs.password = 'At least 8 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, username: username.toLowerCase() },
      },
    });

    if (error) {
      setLoading(false);
      Alert.alert('Sign Up Failed', error.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: username.toLowerCase(),
        full_name: fullName,
        email,
      });
      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }

    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Ambient glow */}
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
              <View style={styles.backBtnInner}>
                <Ionicons name="arrow-back" size={20} color={COLORS.text} />
              </View>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
              <LinearGradient colors={['#00F5A0', '#00C9FF']} style={styles.logoIcon}>
                <Ionicons name="flash" size={28} color="#070711" />
              </LinearGradient>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join thousands of runners worldwide</Text>
            </View>

            {/* Feature chips */}
            <View style={styles.chips}>
              {[
                { icon: 'map-outline', text: 'GPS tracking' },
                { icon: 'people-outline', text: 'Virtual runs' },
                { icon: 'trophy-outline', text: 'Leaderboards' },
              ].map((chip) => (
                <View key={chip.text} style={styles.chip}>
                  <Ionicons name={chip.icon as any} size={13} color={COLORS.primary} />
                  <Text style={styles.chipText}>{chip.text}</Text>
                </View>
              ))}
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <View style={styles.fields}>
                <Input
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  leftIcon="person-outline"
                  error={errors.fullName}
                  placeholder="Jane Smith"
                  autoCapitalize="words"
                />
                <Input
                  label="Username"
                  value={username}
                  onChangeText={(v) => setUsername(v.toLowerCase())}
                  leftIcon="at-outline"
                  error={errors.username}
                  placeholder="janesmith"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
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
                  placeholder="Min. 8 characters"
                />
              </View>

              <Button
                label="Create Account"
                onPress={handleSignup}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.submitBtn}
              />

              <Text style={styles.terms}>
                By signing up you agree to our{' '}
                <Text style={styles.termsLink}>Terms</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                <Text style={styles.footerLink}>Sign In</Text>
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
  glowTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: COLORS.accentGlow,
    opacity: 0.4,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.primaryGlow,
    opacity: 0.2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  backBtn: {
    marginBottom: SPACING.md,
  },
  backBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: FONT_SIZE.h3,
    fontWeight: FONT_WEIGHT.black,
    color: COLORS.text,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,245,160,0.2)',
  },
  chipText: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHT.semibold,
    letterSpacing: 0.2,
  },
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
  fields: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  submitBtn: {},
  terms: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: SPACING.md,
  },
  termsLink: {
    color: COLORS.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
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
