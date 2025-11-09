const supabase = require("../services/supabaseClient");

// Simple controller examples. Adjust to your Supabase client version and security needs.
const logDebug = (method, message, details) => {
  if (details) {
    console.debug(`[AuthController.${method}] ${message}`, details);
  } else {
    console.debug(`[AuthController.${method}] ${message}`);
  }
};

const logError = (method, error) => {
  console.error(`[AuthController.${method}]`, error);
};

const coerceOptionalString = (value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const coerceOptionalNumber = (value) => {
  if (value === null || value === undefined) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const coerceArrayOfStrings = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => coerceOptionalString(item))
      .filter((item) => Boolean(item));
    return normalized.length > 0 ? normalized : undefined;
  }
  if (typeof value === "string") {
    const normalized = value
      .split(",")
      .map((item) => coerceOptionalString(item))
      .filter((item) => Boolean(item));
    return normalized.length > 0 ? normalized : undefined;
  }
  return undefined;
};

const sanitizeInstagramHandle = (value) => {
  const raw = coerceOptionalString(value);
  if (!raw) return undefined;

  const withoutUrl = raw
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
  const normalized =
    withoutUrl.startsWith("@") && withoutUrl.length > 1
      ? withoutUrl.slice(1)
      : withoutUrl;
  const cleaned = normalized.replace(/\s+/g, "");

  return cleaned.length > 0 ? cleaned : undefined;
};

const buildSignupMetadata = (body = {}) => {
  const profile = typeof body.profile === "object" ? body.profile : {};
  const metadata = {
    name:
      coerceOptionalString(body.name) ??
      coerceOptionalString(profile.name) ??
      coerceOptionalString(profile.fullName),
    major:
      coerceOptionalString(body.major) ?? coerceOptionalString(profile.major),
    focusArea:
      coerceOptionalString(body.focusArea) ??
      coerceOptionalString(profile.focusArea),
    headline:
      coerceOptionalString(body.headline) ??
      coerceOptionalString(profile.headline),
    bio: coerceOptionalString(body.bio) ?? coerceOptionalString(profile.bio),
    preferredEmail:
      coerceOptionalString(body.preferredEmail) ??
      coerceOptionalString(profile.preferredEmail),
    experienceLevel:
      coerceOptionalString(body.experienceLevel) ??
      coerceOptionalString(profile.experienceLevel),
    company:
      coerceOptionalString(body.company) ??
      coerceOptionalString(profile.company),
    hobbies:
      coerceArrayOfStrings(body.hobbies) ??
      coerceArrayOfStrings(profile.hobbies),
    interests:
      coerceArrayOfStrings(body.interests) ??
      coerceArrayOfStrings(profile.interests),
    club: coerceOptionalString(body.club) ?? coerceOptionalString(profile.club),
    age: coerceOptionalNumber(body.age) ?? coerceOptionalNumber(profile.age),
    instagram:
      sanitizeInstagramHandle(body.instagram) ??
      sanitizeInstagramHandle(profile.instagram) ??
      sanitizeInstagramHandle(profile.instagramHandle),
  };

  const sanitizedEntries = Object.entries(metadata).filter(
    ([, value]) => value !== undefined
  );

  return {
    ...Object.fromEntries(sanitizedEntries),
    createdVia: "api",
  };
};

exports.signUp = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  logDebug("signUp", "Incoming sign up request", { email });

  try {
    const supabaseStatus =
      typeof supabase.__status === "function"
        ? supabase.__status()
        : { isConfigured: true };
    logDebug("signUp", "Supabase client status", supabaseStatus);

    const metadata = buildSignupMetadata(req.body);

    // Try server-side create (service role) if available
    if (
      supabase.auth &&
      supabase.auth.admin &&
      supabase.auth.admin.createUser
    ) {
      logDebug("signUp", "Attempting Supabase admin createUser");
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: metadata,
      });
      if (error) throw error;
      logDebug("signUp", "Supabase admin createUser succeeded", {
        email,
        userId: data?.user?.id || data?.id,
        metadataKeys: Object.keys(metadata),
      });
      const user = data?.user || data;
      return res.status(201).json({ user });
    }

    // Fallback: sign up (may require email confirmation depending on Supabase settings)
    if (supabase.auth && supabase.auth.signUp) {
      logDebug("signUp", "Attempting Supabase auth.signUp");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      if (error) throw error;
      logDebug("signUp", "Supabase auth.signUp succeeded", {
        email,
        userId: data?.user?.id || data?.id,
        metadataKeys: Object.keys(metadata),
      });
      const user = data?.user || data;
      return res.status(201).json({ user });
    }

    logDebug(
      "signUp",
      "Supabase client does not provide supported sign up method"
    );
    return res.status(501).json({
      error: "Supabase client does not expose a supported sign up method",
    });
  } catch (err) {
    logError("signUp", err);
    return res.status(500).json({ error: err.message || err });
  }
};

exports.signIn = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "email and password required" });

  logDebug("signIn", "Incoming sign in request", { email });

  try {
    if (supabase.auth && supabase.auth.signInWithPassword) {
      // v2 API
      logDebug("signIn", "Attempting Supabase signInWithPassword");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      logDebug("signIn", "Supabase signInWithPassword succeeded", {
        email,
        hasSession: Boolean(data?.session),
        hasUser: Boolean(data?.user),
      });
      return res.status(200).json(data);
    }

    if (supabase.auth && supabase.auth.signIn) {
      logDebug("signIn", "Attempting Supabase v1 signIn fallback");
      const { data, error } = await supabase.auth.signIn({ email, password });
      if (error) throw error;
      logDebug("signIn", "Supabase v1 signIn succeeded", {
        email,
        hasSession: Boolean(data?.session),
        hasUser: Boolean(data?.user),
      });
      return res.status(200).json(data);
    }

    // Fallback: no-op
    logDebug(
      "signIn",
      "Supabase client does not expose signIn methods for this version"
    );
    return res
      .status(501)
      .json({ error: "Sign-in not implemented for this client version" });
  } catch (err) {
    logError("signIn", err);
    return res.status(500).json({ error: err.message || err });
  }
};

const allowedMetadataFields = [
  "displayName",
  "headline",
  "company",
  "experienceLevel",
  "focusArea",
  "bio",
  "club",
  "preferredEmail",
  "name",
  "major",
  "age",
  "avatarUrl",
  "bannerUrl",
  "hobbies",
  "interests",
  "favoriteSpot",
  "classes",
  "metadata",
  "connections",
  "instagram",
];

exports.updateProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const userId = req.user.id;
  if (!userId)
    return res.status(400).json({ error: "Authenticated user is missing id" });

  const nextEmail =
    typeof req.body.email === "string" && req.body.email.trim()
      ? req.body.email.trim()
      : undefined;

  const metadataUpdates = allowedMetadataFields.reduce((accumulator, field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      accumulator[field] = req.body[field];
    }
    return accumulator;
  }, {});

  const normalizeList = (value) => {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      const list = value
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0);
      return list.length ? list : undefined;
    }
    if (typeof value === "string") {
      const list = value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
      return list.length ? list : undefined;
    }
    return undefined;
  };

  if (metadataUpdates.hobbies !== undefined) {
    metadataUpdates.hobbies = normalizeList(metadataUpdates.hobbies) || [];
  }

  if (metadataUpdates.interests !== undefined) {
    metadataUpdates.interests = normalizeList(metadataUpdates.interests) || [];
  }

  if (metadataUpdates.classes !== undefined) {
    metadataUpdates.classes = normalizeList(metadataUpdates.classes) || [];
  }

  if (metadataUpdates.favoriteSpot !== undefined) {
    const trimmed =
      typeof metadataUpdates.favoriteSpot === "string"
        ? metadataUpdates.favoriteSpot.trim()
        : "";
    metadataUpdates.favoriteSpot = trimmed || null;
  }

  if (metadataUpdates.major !== undefined) {
    const trimmed =
      typeof metadataUpdates.major === "string"
        ? metadataUpdates.major.trim()
        : "";
    metadataUpdates.major = trimmed || null;
  }

  if (metadataUpdates.preferredEmail !== undefined) {
    const trimmed =
      typeof metadataUpdates.preferredEmail === "string"
        ? metadataUpdates.preferredEmail.trim()
        : "";
    metadataUpdates.preferredEmail = trimmed || null;
  }

  if (metadataUpdates.name !== undefined) {
    const trimmed =
      typeof metadataUpdates.name === "string"
        ? metadataUpdates.name.trim()
        : "";
    metadataUpdates.name = trimmed || null;
  }

  if (metadataUpdates.instagram !== undefined) {
    const sanitized = sanitizeInstagramHandle(metadataUpdates.instagram);
    metadataUpdates.instagram = sanitized || null;
  }

  const hasMetadataUpdates = Object.keys(metadataUpdates).length > 0;
  const wantsEmailUpdate =
    nextEmail && (!req.user.email || nextEmail !== req.user.email);

  if (!hasMetadataUpdates && !wantsEmailUpdate) {
    return res
      .status(400)
      .json({ error: "No updatable profile fields were provided" });
  }

  if (
    !supabase.auth ||
    !supabase.auth.admin ||
    !supabase.auth.admin.updateUserById
  ) {
    logDebug(
      "updateProfile",
      "Supabase admin client does not expose updateUserById"
    );
    return res
      .status(501)
      .json({ error: "Profile updates are not configured on the server" });
  }

  const attributes = {};

  if (wantsEmailUpdate) {
    attributes.email = nextEmail;
  }

  const currentMetadata =
    req.user.user_metadata && typeof req.user.user_metadata === "object"
      ? req.user.user_metadata
      : {};

  let nextUserMetadata = currentMetadata;

  if (hasMetadataUpdates) {
    nextUserMetadata = {
      ...currentMetadata,
      ...metadataUpdates,
      updatedAt: new Date().toISOString(),
    };
    attributes.user_metadata = nextUserMetadata;
  }

  try {
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      attributes
    );
    if (error) throw error;
    const updatedUser = data?.user || data;
    logDebug("updateProfile", "Profile updated successfully", {
      userId,
      emailChanged: Boolean(attributes.email),
      metadataKeys: hasMetadataUpdates ? Object.keys(metadataUpdates) : [],
    });

    if (typeof supabase.from === "function") {
      const toStringArray = (value) => {
        if (!value) return [];
        if (Array.isArray(value)) {
          return value
            .map((entry) => `${entry}`.trim())
            .filter((entry) => entry.length > 0);
        }
        if (typeof value === "string") {
          return value
            .split(",")
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
        }
        return [];
      };

      const profilePayload = {
        id: userId,
        full_name:
          nextUserMetadata.name ||
          nextUserMetadata.displayName ||
          updatedUser?.user_metadata?.name ||
          updatedUser?.email,
        email: attributes.email || updatedUser?.email || req.user.email,
        major: nextUserMetadata.major || null,
        interests: toStringArray(nextUserMetadata.interests),
        hobbies: toStringArray(nextUserMetadata.hobbies),
        classes: toStringArray(nextUserMetadata.classes),
        bio: nextUserMetadata.bio || null,
        fun_fact: null,
        favorite_spot: nextUserMetadata.favoriteSpot || null,
        vibe_check: null,
        is_opted_in: true,
        instagram: nextUserMetadata.instagram || null,
      };

      const { error: profileError } = await supabase
        .from("match_profiles")
        .upsert(profilePayload, { onConflict: "id" });

      if (profileError) {
        console.warn(
          "[AuthController.updateProfile] Failed to sync match_profiles",
          profileError
        );
      }
    }

    return res.status(200).json({ user: updatedUser });
  } catch (err) {
    logError("updateProfile", err);
    return res.status(500).json({ error: err.message || err });
  }
};

exports.getProfile = async (req, res) => {
  // authMiddleware should have attached `req.user` if available
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ user: req.user });
};
