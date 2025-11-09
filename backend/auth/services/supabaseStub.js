const crypto = require("crypto");

const users = new Map();
const sessions = new Map();

const buildUserResponse = (user) => ({
  data: {
    user,
  },
});

const nowSeconds = () => Math.floor(Date.now() / 1000);

const maskEmail = (email) => {
  if (!email) return "unknown";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
};

const createSession = (user) => {
  const accessToken = crypto.randomUUID();
  const refreshToken = crypto.randomUUID();
  const expiresIn = 60 * 60; // 1 hour

  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: nowSeconds() + expiresIn,
    user,
    created_at: new Date().toISOString(),
  };

  sessions.set(accessToken, session);
  return { data: { session, user } };
};

const normalizeEmail = (email) => `${email}`.trim().toLowerCase();

const clone = (value) => JSON.parse(JSON.stringify(value));

const findUserByEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  for (const user of users.values()) {
    if (normalizeEmail(user.email) === normalizedEmail) {
      return user;
    }
  }
  return null;
};

const upsertUser = ({
  id = crypto.randomUUID(),
  email,
  password,
  user_metadata = {},
  email_confirm = false,
}) => {
  if (!email) {
    throw new Error("Email is required to create a stub Supabase user");
  }

  const existing = findUserByEmail(email);
  if (existing) {
    existing.password = password ?? existing.password;
    existing.user_metadata = {
      ...existing.user_metadata,
      ...user_metadata,
      updatedAt: new Date().toISOString(),
    };
    users.set(existing.id, existing);
    return existing;
  }

  const user = {
    id,
    email,
    email_confirmed_at: email_confirm ? new Date().toISOString() : null,
    created_at: new Date().toISOString(),
    user_metadata: {
      ...user_metadata,
      createdAt: new Date().toISOString(),
    },
    password,
  };

  users.set(user.id, user);
  return user;
};

const createUser = async ({ email, password, user_metadata, email_confirm }) => {
  const user = upsertUser({
    email,
    password,
    user_metadata,
    email_confirm,
  });

  return buildUserResponse(sanitizeUser(user));
};

const signUp = async ({ email, password, options = {} }) => {
  const user = upsertUser({
    email,
    password,
    user_metadata: options.data,
    email_confirm: options.emailRedirectTo ? false : true,
  });

  return buildUserResponse(sanitizeUser(user));
};

const signInWithPassword = async ({ email, password }) => {
  const user = findUserByEmail(email);
  if (!user || (user.password && user.password !== password)) {
    const error = new Error("Invalid login credentials");
    error.status = 400;
    throw error;
  }

  return createSession(sanitizeUser(user));
};

const getUser = async (accessToken) => {
  const session = sessions.get(accessToken);
  if (!session) {
    return { data: { user: null }, error: new Error("Invalid token") };
  }

  return {
    data: {
      user: session.user,
    },
  };
};

const updateUserById = async (id, attributes = {}) => {
  const existing = users.get(id);
  if (!existing) {
    const error = new Error(`User ${id} not found`);
    error.status = 404;
    throw error;
  }

  if (attributes.email) {
    existing.email = attributes.email;
  }

  if (attributes.user_metadata) {
    existing.user_metadata = {
      ...existing.user_metadata,
      ...attributes.user_metadata,
    };
  }

  users.set(id, existing);

  return {
    data: {
      user: sanitizeUser(existing),
    },
  };
};

const getUserById = async (id) => {
  const existing = users.get(id);
  if (!existing) {
    const error = new Error(`User ${id} not found`);
    error.status = 404;
    return { data: null, error };
  }

  return buildUserResponse(sanitizeUser(existing));
};

const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...rest } = user;
  return clone(rest);
};

const reset = () => {
  users.clear();
  sessions.clear();
};

const status = () => ({
  isConfigured: false,
  usesStub: true,
  users: users.size,
  sessions: sessions.size,
});

console.warn(
  "[SupabaseStub] Using in-memory Supabase stub. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to connect to a real Supabase project."
);

module.exports = {
  auth: {
    admin: {
      createUser,
      updateUserById,
      getUserById,
    },
    signUp,
    signInWithPassword,
    getUser,
  },
  __status: status,
  __reset: reset,
  __debug: {
    users,
    sessions,
    maskEmail,
  },
};

