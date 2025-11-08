// Lightweight Supabase client wrapper for server-side use.
// Exports a configured supabase client. Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.
const { createClient } = require('@supabase/supabase-js');
const { supabaseUrl: configSupabaseUrl, supabaseServiceRoleKey: configSupabaseServiceRoleKey } = require('../../config');

const resolvedSupabaseUrl = (configSupabaseUrl || process.env.SUPABASE_URL || '').trim();
const resolvedServiceRoleKey = (configSupabaseServiceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

const mask = (value) => {
  if (!value) return 'undefined';
  if (value.length <= 8) return `${value[0]}***${value[value.length - 1]}`;
  return `${value.slice(0, 4)}…${value.slice(-4)}`;
};

const missingEnv = [];
if (!resolvedSupabaseUrl) missingEnv.push('SUPABASE_URL');
if (!resolvedServiceRoleKey) missingEnv.push('SUPABASE_SERVICE_ROLE_KEY');

if (missingEnv.length) {
  console.warn(
    `[Supabase] Missing required environment variables: ${missingEnv.join(', ')}. ` +
    'Supabase auth calls will throw until configuration is completed.'
  );
}

console.info('[Supabase] Initialising client', {
  urlConfigured: Boolean(resolvedSupabaseUrl),
  serviceRoleKeyPreview: mask(resolvedServiceRoleKey),
});

const ensureConfigured = () => {
  if (!resolvedSupabaseUrl || !resolvedServiceRoleKey) {
    throw new Error(
      'Supabase client not configured. Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your environment.'
    );
  }
};

const supabaseClient = resolvedSupabaseUrl && resolvedServiceRoleKey
  ? createClient(resolvedSupabaseUrl, resolvedServiceRoleKey)
  : null;

const statusSnapshot = () => ({
  isConfigured: Boolean(resolvedSupabaseUrl && resolvedServiceRoleKey),
  supabaseUrl: resolvedSupabaseUrl,
  serviceRoleKeyPreview: mask(resolvedServiceRoleKey),
});

const proxiedSupabase = new Proxy(
  {},
  {
    get(_target, prop) {
      if (prop === '__status') {
        return statusSnapshot;
      }
      if (prop === Symbol.for('nodejs.util.inspect.custom')) {
        return () => ({
          supabaseUrl: resolvedSupabaseUrl || '<not-configured>',
          serviceRoleKeyPreview: mask(resolvedServiceRoleKey),
        });
      }
      ensureConfigured();
      const value = supabaseClient[prop];
      if (typeof value === 'function') {
        return value.bind(supabaseClient);
      }
      return value;
    },
  }
);

module.exports = proxiedSupabase;
