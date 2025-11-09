const supabase = require('../services/supabaseClient');

const maskToken = (token) => {
  if (!token) return 'undefined';
  if (token.length <= 10) return `${token.slice(0, 3)}***`;
  return `${token.slice(0, 5)}…${token.slice(-5)}`;
};

const debugEnabled = process.env.AUTH_DEBUG === "true";

const debug = (message, meta) => {
  if (!debugEnabled) return;
  if (meta) {
    console.debug(`[authMiddleware] ${message}`, meta);
  } else {
    console.debug(`[authMiddleware] ${message}`);
  }
};

/**
 * Very small auth middleware that attempts to verify a Bearer token with Supabase.
 * Attaches `req.user` when successful. Adjust to your project's auth flow.
 */
module.exports = async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });

    const token = auth.split(' ')[1];

    debug('Received request with bearer token', { tokenPreview: maskToken(token) });

    if (supabase.auth && supabase.auth.getUser) {
      // v2: getUser(token)
      const { data, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      req.user = data.user || data;

      // Fetch latest unified profile to merge metadata
      try {
        if (req.user?.id && typeof supabase.from === "function") {
          const profile = await supabase
            .from("match_profiles")
            .select(
              "full_name,email,major,interests,hobbies,bio,fun_fact,favorite_spot,vibe_check"
            )
            .eq("id", req.user.id)
            .maybeSingle();

          if (!profile.error && profile.data) {
            const metadata = {
              ...(req.user.user_metadata || {}),
              name:
                profile.data.full_name ||
                req.user.user_metadata?.name ||
                req.user.user_metadata?.full_name,
              major: profile.data.major ?? req.user.user_metadata?.major,
              interests: profile.data.interests ?? req.user.user_metadata?.interests,
              hobbies: profile.data.hobbies ?? req.user.user_metadata?.hobbies,
              bio: profile.data.bio ?? req.user.user_metadata?.bio,
              funFact:
                profile.data.fun_fact ?? req.user.user_metadata?.funFact,
              favoriteSpot:
                profile.data.favorite_spot ??
                req.user.user_metadata?.favoriteSpot,
              vibeCheck:
                profile.data.vibe_check ?? req.user.user_metadata?.vibeCheck,
            };
            req.user.user_metadata = metadata;
          }
        }
      } catch (profileError) {
        console.warn(
          "[authMiddleware] Failed to merge match profile metadata",
          profileError
        );
      }

      debug('Supabase token verification succeeded', {
        userId: req.user?.id,
        email: req.user?.email,
      });
      return next();
    }

    // If supabase client doesn't provide getUser, try decoding token server-side (not implemented here)
    debug('Supabase client does not expose auth.getUser; cannot verify token with current client version');
    return res.status(501).json({ error: 'Token verification not implemented for this client' });
  } catch (err) {
    console.error('[authMiddleware] Verification error', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
