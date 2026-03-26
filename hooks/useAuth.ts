import { useEffect } from 'react';
import { supabase, fetchProfile } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { session, profile, isLoading, setSession, setProfile, setLoading, signOut } = useAuthStore();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id)
          .then(setProfile)
          .catch(console.error)
          .finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          try {
            const profile = await fetchProfile(session.user.id);
            setProfile(profile);
          } catch {
            // Profile may not exist yet — will be created on signup
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    signOut();
  };

  const refreshProfile = async () => {
    if (!session?.user) return;
    const updated = await fetchProfile(session.user.id);
    setProfile(updated);
  };

  return {
    session,
    profile,
    isLoading,
    userId: session?.user?.id ?? null,
    isAuthenticated: !!session,
    signOut: handleSignOut,
    refreshProfile,
  };
}
