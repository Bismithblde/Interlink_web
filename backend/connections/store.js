const { randomUUID } = require("node:crypto");
const supabase = require("../auth/services/supabaseClient");

const friendRequests = new Map();
const friendships = new Map();

const getClientStatus =
  typeof supabase.__status === "function" ? supabase.__status : () => null;
const supabaseStatus = getClientStatus() || {};
const isSupabaseConfigured =
  typeof supabase.from === "function" &&
  !supabaseStatus.usesStub &&
  (supabaseStatus.isConfigured === undefined || supabaseStatus.isConfigured);

const createHttpError = (status, message, details) => {
  const error = new Error(message);
  error.status = status;
  if (details !== undefined) {
    error.details = details;
  }
  return error;
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const ensureFriendshipMap = (userId) => {
  if (!friendships.has(userId)) {
    friendships.set(userId, new Map());
  }
  return friendships.get(userId);
};

const sanitizeMessage = (message) => {
  if (typeof message !== "string") return null;
  const trimmed = message.trim();
  if (!trimmed) return null;
  if (trimmed.length > 500) {
    return trimmed.slice(0, 500);
  }
  return trimmed;
};

const normalizeRequestRecord = (record) => ({
  id: record.id,
  requesterId: record.requester_id || record.requesterId,
  recipientId: record.recipient_id || record.recipientId,
  status: record.status,
  message: record.message ?? null,
  createdAt: record.created_at || record.createdAt || null,
  respondedAt: record.responded_at || record.respondedAt || null,
});

const normalizeFriendshipRecord = (record) => ({
  userId: record.user_id || record.userId,
  friendId: record.friend_id || record.friendId,
  createdAt: record.created_at || record.createdAt || null,
  requestId: record.request_id || record.requestId || null,
});

const buildProfileSnapshot = (user) => {
  if (!user) return null;
  const metadata =
    user.user_metadata && typeof user.user_metadata === "object"
      ? user.user_metadata
      : {};
  return {
    id: user.id,
    email: user.email || null,
    name:
      metadata.name ||
      metadata.fullName ||
      metadata.full_name ||
      metadata.displayName ||
      metadata.nickname ||
      null,
    avatarUrl: metadata.avatarUrl || metadata.avatar_url || null,
    major: metadata.major || null,
    interests: Array.isArray(metadata.interests)
      ? metadata.interests
      : undefined,
    hobbies: Array.isArray(metadata.hobbies) ? metadata.hobbies : undefined,
    instagram: metadata.instagram || null,
  };
};

const fetchProfilesByIds = async (userIds) => {
  const uniqueIds = Array.from(
    new Set(userIds.filter((id) => typeof id === "string" && id.length > 0))
  );
  if (!uniqueIds.length) {
    return new Map();
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("match_profiles")
        .select(
          "id,full_name,email,major,interests,hobbies,favorite_spot,vibe_check,instagram"
        )
        .in("id", uniqueIds);

      if (error) {
        console.warn(
          "[friendStore] Failed to fetch profiles from match_profiles",
          error
        );
        return new Map();
      }

      const resolved = new Map();
      (data || []).forEach((profile) => {
        resolved.set(profile.id, {
          id: profile.id,
          email: profile.email || null,
          name: profile.full_name || null,
          major: profile.major || null,
          interests: Array.isArray(profile.interests)
            ? profile.interests
            : undefined,
          hobbies: Array.isArray(profile.hobbies)
            ? profile.hobbies
            : undefined,
          favoriteSpot: profile.favorite_spot || null,
          vibeCheck: profile.vibe_check || null,
          instagram: profile.instagram || null,
        });
      });
      return resolved;
    } catch (error) {
      console.warn("[friendStore] match_profiles query threw", error);
      return new Map();
    }
  }

  if (
    supabase.auth &&
    supabase.auth.admin &&
    typeof supabase.auth.admin.getUserById === "function"
  ) {
    const entries = await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const { data, error } = await supabase.auth.admin.getUserById(id);
          if (error) {
            return [id, null];
          }
          const user = data?.user || data;
          return [id, buildProfileSnapshot(user)];
        } catch (error) {
          console.warn("[friendStore] getUserById threw", error);
          return [id, null];
        }
      })
    );
    return new Map(entries);
  }

  return new Map();
};

const sendFriendRequestInMemory = async ({
  requesterId,
  recipientId,
  message,
}) => {
  for (const request of friendRequests.values()) {
    if (
      (request.requesterId === requesterId &&
        request.recipientId === recipientId) ||
      (request.requesterId === recipientId &&
        request.recipientId === requesterId)
    ) {
      if (request.status === "pending") {
        throw createHttpError(
          409,
          "A pending friend request already exists between these users"
        );
      }

      if (request.status === "accepted") {
        throw createHttpError(409, "Users are already friends");
      }
    }
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const record = {
    id,
    requesterId,
    recipientId,
    status: "pending",
    message: message ?? null,
    createdAt: now,
    respondedAt: null,
  };

  friendRequests.set(id, record);

  return clone(record);
};

const acceptFriendRequestInMemory = async ({ requestId, recipientId }) => {
  const request = friendRequests.get(requestId);
  if (!request) {
    throw createHttpError(404, "Friend request not found");
  }
  if (request.recipientId !== recipientId) {
    throw createHttpError(
      403,
      "Only the recipient can accept this friend request"
    );
  }
  if (request.status !== "pending") {
    throw createHttpError(409, "Friend request is not pending");
  }

  const now = new Date().toISOString();
  request.status = "accepted";
  request.respondedAt = now;
  friendRequests.set(requestId, request);

  const requesterFriendships = ensureFriendshipMap(request.requesterId);
  requesterFriendships.set(request.recipientId, {
    friendId: request.recipientId,
    createdAt: now,
    requestId,
  });

  const recipientFriendships = ensureFriendshipMap(request.recipientId);
  recipientFriendships.set(request.requesterId, {
    friendId: request.requesterId,
    createdAt: now,
    requestId,
  });

  return {
    request: clone(request),
    friendships: [
      {
        userId: request.requesterId,
        friendId: request.recipientId,
        createdAt: now,
        requestId,
      },
      {
        userId: request.recipientId,
        friendId: request.requesterId,
        createdAt: now,
        requestId,
      },
    ],
  };
};

const declineFriendRequestInMemory = async ({ requestId, recipientId }) => {
  const request = friendRequests.get(requestId);
  if (!request) {
    throw createHttpError(404, "Friend request not found");
  }
  if (request.recipientId !== recipientId) {
    throw createHttpError(
      403,
      "Only the recipient can decline this friend request"
    );
  }
  if (request.status !== "pending") {
    throw createHttpError(409, "Friend request is not pending");
  }

  const now = new Date().toISOString();
  request.status = "declined";
  request.respondedAt = now;
  friendRequests.set(requestId, request);

  return clone(request);
};

const removeFriendInMemory = async ({ userId, friendId }) => {
  const userFriends = friendships.get(userId);
  const friendFriends = friendships.get(friendId);

  let changed = false;
  if (userFriends && userFriends.delete(friendId)) {
    changed = true;
  }
  if (friendFriends && friendFriends.delete(userId)) {
    changed = true;
  }

  if (!changed) {
    throw createHttpError(404, "Friendship not found");
  }
};

const getGraphInMemory = async (userId) => {
  const incoming = [];
  const outgoing = [];

  for (const request of friendRequests.values()) {
    if (request.status !== "pending") continue;
    if (request.recipientId === userId) {
      incoming.push(clone(request));
    } else if (request.requesterId === userId) {
      outgoing.push(clone(request));
    }
  }

  const friends = [];
  const userFriends = friendships.get(userId);
  if (userFriends) {
    for (const record of userFriends.values()) {
      friends.push({
        id: record.friendId,
        since: record.createdAt,
        requestId: record.requestId || null,
      });
    }
  }

  const relatedUserIds = [
    ...incoming.map((request) => request.requesterId),
    ...outgoing.map((request) => request.recipientId),
    ...friends.map((friend) => friend.id),
  ];
  const profileMap = await fetchProfilesByIds(relatedUserIds);

  return {
    friends: friends.map((friend) => ({
      ...friend,
      profile: profileMap.get(friend.id) || { id: friend.id },
    })),
    incomingRequests: incoming.map((request) => ({
      ...request,
      requesterProfile:
        profileMap.get(request.requesterId) || { id: request.requesterId },
    })),
    outgoingRequests: outgoing.map((request) => ({
      ...request,
      recipientProfile:
        profileMap.get(request.recipientId) || { id: request.recipientId },
    })),
  };
};

const sendFriendRequestWithSupabase = async ({
  requesterId,
  recipientId,
  message,
}) => {
  const sanitizedMessage = sanitizeMessage(message);

  const existingQuery = await supabase
    .from("friend_requests")
    .select(
      "id,status,requester_id,recipient_id,responded_at,created_at,message"
    )
    .or(
      `and(requester_id.eq.${requesterId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${requesterId})`
    )
    .limit(10);

  if (existingQuery.error) {
    const error = existingQuery.error;
    error.status = error.status || 500;
    throw error;
  }

  for (const record of existingQuery.data || []) {
    if (record.status === "pending") {
      throw createHttpError(
        409,
        "A pending friend request already exists between these users"
      );
    }
    if (record.status === "accepted") {
      throw createHttpError(409, "Users are already friends");
    }
  }

  const insertPayload = {
    requester_id: requesterId,
    recipient_id: recipientId,
    message: sanitizedMessage,
  };

  const insertResult = await supabase
    .from("friend_requests")
    .insert(insertPayload)
    .select(
      "id,status,requester_id,recipient_id,created_at,responded_at,message"
    )
    .single();

  if (insertResult.error) {
    const error = insertResult.error;
    error.status = error.status || 500;
    throw error;
  }

  return normalizeRequestRecord(insertResult.data);
};

const acceptFriendRequestWithSupabase = async ({
  requestId,
  recipientId,
}) => {
  const query = await supabase
    .from("friend_requests")
    .select(
      "id,status,requester_id,recipient_id,created_at,responded_at,message"
    )
    .eq("id", requestId)
    .maybeSingle();

  if (query.error) {
    const error = query.error;
    error.status = error.status || 500;
    throw error;
  }

  const record = query.data;
  if (!record) {
    throw createHttpError(404, "Friend request not found");
  }

  if (record.recipient_id !== recipientId) {
    throw createHttpError(
      403,
      "Only the recipient can accept this friend request"
    );
  }

  if (record.status !== "pending") {
    throw createHttpError(409, "Friend request is not pending");
  }

  const now = new Date().toISOString();

  const updateResult = await supabase
    .from("friend_requests")
    .update({ status: "accepted", responded_at: now })
    .eq("id", requestId)
    .select(
      "id,status,requester_id,recipient_id,created_at,responded_at,message"
    )
    .single();

  if (updateResult.error) {
    const error = updateResult.error;
    error.status = error.status || 500;
    throw error;
  }

  const friendshipsToUpsert = [
    {
      user_id: record.requester_id,
      friend_id: record.recipient_id,
      created_at: now,
      request_id: record.id,
    },
    {
      user_id: record.recipient_id,
      friend_id: record.requester_id,
      created_at: now,
      request_id: record.id,
    },
  ];

  const upsertResult = await supabase
    .from("friendships")
    .upsert(friendshipsToUpsert, { onConflict: "user_id,friend_id" })
    .select("user_id,friend_id,created_at,request_id");

  if (upsertResult.error) {
    const error = upsertResult.error;
    error.status = error.status || 500;
    throw error;
  }

  return {
    request: normalizeRequestRecord(updateResult.data),
    friendships: (upsertResult.data || []).map(normalizeFriendshipRecord),
  };
};

const declineFriendRequestWithSupabase = async ({
  requestId,
  recipientId,
}) => {
  const query = await supabase
    .from("friend_requests")
    .select("id,status,requester_id,recipient_id,created_at,responded_at")
    .eq("id", requestId)
    .maybeSingle();

  if (query.error) {
    const error = query.error;
    error.status = error.status || 500;
    throw error;
  }

  const record = query.data;
  if (!record) {
    throw createHttpError(404, "Friend request not found");
  }

  if (record.recipient_id !== recipientId) {
    throw createHttpError(
      403,
      "Only the recipient can decline this friend request"
    );
  }

  if (record.status !== "pending") {
    throw createHttpError(409, "Friend request is not pending");
  }

  const now = new Date().toISOString();

  const updateResult = await supabase
    .from("friend_requests")
    .update({ status: "declined", responded_at: now })
    .eq("id", requestId)
    .select(
      "id,status,requester_id,recipient_id,created_at,responded_at,message"
    )
    .single();

  if (updateResult.error) {
    const error = updateResult.error;
    error.status = error.status || 500;
    throw error;
  }

  return normalizeRequestRecord(updateResult.data);
};

const removeFriendWithSupabase = async ({ userId, friendId }) => {
  const deleteResult = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`
    )
    .select("user_id,friend_id");

  if (deleteResult.error) {
    const error = deleteResult.error;
    error.status = error.status || 500;
    throw error;
  }

  if (!deleteResult.data || deleteResult.data.length === 0) {
    throw createHttpError(404, "Friendship not found");
  }
};

const getGraphWithSupabase = async (userId) => {
  const requestResult = await supabase
    .from("friend_requests")
    .select(
      "id,status,requester_id,recipient_id,created_at,responded_at,message"
    )
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  if (requestResult.error) {
    const error = requestResult.error;
    error.status = error.status || 500;
    throw error;
  }

  const pendingIncoming = [];
  const pendingOutgoing = [];

  for (const record of requestResult.data || []) {
    if (record.status === "pending") {
      if (record.recipient_id === userId) {
        pendingIncoming.push(normalizeRequestRecord(record));
      } else if (record.requester_id === userId) {
        pendingOutgoing.push(normalizeRequestRecord(record));
      }
    }
  }

  const friendshipsResult = await supabase
    .from("friendships")
    .select("friend_id,created_at,request_id")
    .eq("user_id", userId);

  if (friendshipsResult.error) {
    const error = friendshipsResult.error;
    error.status = error.status || 500;
    throw error;
  }

  const friends = (friendshipsResult.data || []).map((row) => ({
    id: row.friend_id,
    since: row.created_at,
    requestId: row.request_id || null,
  }));

  const relatedIds = [
    ...pendingIncoming.map((request) => request.requesterId),
    ...pendingOutgoing.map((request) => request.recipientId),
    ...friends.map((friend) => friend.id),
  ];

  const profiles = await fetchProfilesByIds(relatedIds);

  return {
    friends: friends.map((friend) => ({
      ...friend,
      profile: profiles.get(friend.id) || { id: friend.id },
    })),
    incomingRequests: pendingIncoming.map((request) => ({
      ...request,
      requesterProfile:
        profiles.get(request.requesterId) || { id: request.requesterId },
    })),
    outgoingRequests: pendingOutgoing.map((request) => ({
      ...request,
      recipientProfile:
        profiles.get(request.recipientId) || { id: request.recipientId },
    })),
  };
};

const guardUserIds = (requesterId, recipientId) => {
  if (!requesterId || !recipientId) {
    throw createHttpError(400, "Both requesterId and recipientId are required");
  }
  if (requesterId === recipientId) {
    throw createHttpError(400, "Users cannot send friend requests to themselves");
  }
};

const guardRemovalIds = (userId, friendId) => {
  if (!userId || !friendId) {
    throw createHttpError(400, "Both userId and friendId are required");
  }
  if (userId === friendId) {
    throw createHttpError(400, "Cannot remove yourself as a friend");
  }
};

const sendFriendRequest = async (requesterId, recipientId, message) => {
  guardUserIds(requesterId, recipientId);

  if (isSupabaseConfigured) {
    return sendFriendRequestWithSupabase({
      requesterId,
      recipientId,
      message,
    });
  }

  return sendFriendRequestInMemory({
    requesterId,
    recipientId,
    message: sanitizeMessage(message),
  });
};

const acceptFriendRequest = async (requestId, recipientId) => {
  if (!requestId) {
    throw createHttpError(400, "requestId is required");
  }
  if (!recipientId) {
    throw createHttpError(400, "recipientId is required");
  }

  if (isSupabaseConfigured) {
    return acceptFriendRequestWithSupabase({ requestId, recipientId });
  }

  return acceptFriendRequestInMemory({ requestId, recipientId });
};

const declineFriendRequest = async (requestId, recipientId) => {
  if (!requestId) {
    throw createHttpError(400, "requestId is required");
  }
  if (!recipientId) {
    throw createHttpError(400, "recipientId is required");
  }

  if (isSupabaseConfigured) {
    return declineFriendRequestWithSupabase({ requestId, recipientId });
  }

  return declineFriendRequestInMemory({ requestId, recipientId });
};

const removeFriend = async (userId, friendId) => {
  guardRemovalIds(userId, friendId);

  if (isSupabaseConfigured) {
    return removeFriendWithSupabase({ userId, friendId });
  }

  return removeFriendInMemory({ userId, friendId });
};

const getFriendGraph = async (userId) => {
  if (!userId) {
    throw createHttpError(400, "userId is required");
  }

  if (isSupabaseConfigured) {
    return getGraphWithSupabase(userId);
  }

  return getGraphInMemory(userId);
};

const resetStore = () => {
  friendRequests.clear();
  friendships.clear();
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriendGraph,
  __reset: resetStore,
};


