import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { AuthContext } from './useAuth';

/**
 * Provides Supabase session state and auth helpers across the app.
 */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async ({ email, password, fullName }) => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error(
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
        ),
      };
    }

    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });
  };

  const signIn = async ({ email, password }) => {
    if (!isSupabaseConfigured) {
      return {
        data: null,
        error: new Error(
          'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
        ),
      };
    }

    return supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return { error: null };
    return supabase.auth.signOut();
  };

  const resendConfirmation = async (email) => {
    if (!isSupabaseConfigured) return { error: null };
    return supabase.auth.resend({
      type: 'signup',
      email,
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, resendConfirmation }}
    >
      {children}
    </AuthContext.Provider>
  );
}
