import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables');
}

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Sign out
 */
export async function signOutUser() {
  try {
    const { error } = await supabaseAuth.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    return { error };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string) {
  try {
    // Detect if running on localhost for development
    let redirectUrl = `${window.location.origin}/reset-password`;
    
    // If on localhost, use http://localhost:PORT/reset-password
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      redirectUrl = `http://localhost:${window.location.port}/reset-password`;
    }
    
    const { data, error } = await supabaseAuth.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Update password with reset token
 */
export async function updatePasswordWithToken(newPassword: string) {
  try {
    const { data, error } = await supabaseAuth.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabaseAuth.auth.getUser();
    if (error) throw error;
    return { data: data?.user || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Get session
 */
export async function getSession() {
  try {
    const { data, error } = await supabaseAuth.auth.getSession();
    if (error) throw error;
    return { data: data?.session || null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: any) => void) {
  const { data } = supabaseAuth.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
  return data;
}
