const friendStore = require("../connections/store");

const inboxCache = new Map();

const cloneRequests = (requests = []) =>
  requests.map((request) => ({
    id: request.id,
    requesterId: request.requesterId,
    recipientId: request.recipientId,
    status: request.status,
    message: request.message ?? null,
    createdAt: request.createdAt ?? null,
    respondedAt: request.respondedAt ?? null,
    requesterProfile:
      request.requesterProfile && typeof request.requesterProfile === "object"
        ? { ...request.requesterProfile }
        : undefined,
    recipientProfile:
      request.recipientProfile && typeof request.recipientProfile === "object"
        ? { ...request.recipientProfile }
        : undefined,
  }));

const snapshotInbox = (userId, graph) => {
  const payload = {
    userId,
    incomingRequests: cloneRequests(graph.incomingRequests),
    outgoingRequests: cloneRequests(graph.outgoingRequests),
    counts: {
      incoming: graph.incomingRequests.length,
      outgoing: graph.outgoingRequests.length,
    },
    fetchedAt: new Date().toISOString(),
  };
  inboxCache.set(userId, payload);
  return payload;
};

const getInbox = async (userId) => {
  if (!userId) {
    const error = new Error("userId is required");
    error.status = 400;
    throw error;
  }

  const graph = await friendStore.getFriendGraph(userId);
  return snapshotInbox(userId, graph);
};

const clear = () => {
  inboxCache.clear();
};

module.exports = {
  getInbox,
  __reset: clear,
  __cache: inboxCache,
};



