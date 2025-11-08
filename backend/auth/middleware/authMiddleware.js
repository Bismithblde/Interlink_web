const supabase = require('../services/supabaseClient');

const maskToken = (token) => {
  if (!token) return 'undefined';
  if (token.length <= 10) return `${token.slice(0, 3)}***`;
  return `${token.slice(0, 5)}…${token.slice(-5)}`;
};

const debug = (message, meta) => {
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
