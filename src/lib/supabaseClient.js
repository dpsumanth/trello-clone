import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const rawKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  ''
).trim();

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isPlaceholder(value) {
  const lower = value.toLowerCase();
  return (
    !lower ||
    lower.includes('your-project') ||
    lower.includes('your_supabase') ||
    lower.includes('your-supabase') ||
    lower.includes('placeholder')
  );
}

export const isSupabaseConfigured =
  isValidHttpUrl(rawUrl) && !isPlaceholder(rawUrl) && !isPlaceholder(rawKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing or invalid. Set a valid https://... VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.'
  );
}

/**
 * Shared Supabase client instance.
 * Falls back to a harmless valid URL when .env is unconfigured so the UI can
 * render a helpful setup banner instead of crashing on import.
 */
export const supabase = createClient(
  isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? rawKey : 'placeholder-anon-key'
);
