const friendStore = require("../store");

const respondWithError = (res, error) => {
  const status = error.status || 500;
  const payload = {
    error: error.message || "Unexpected error",
  };
  if (error.details !== undefined) {
    payload.details = error.details;
  }
  return res.status(status).json(payload);
};

const ensureAuthenticatedUser = (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
};

exports.getGraph = async (req, res) => {
  const userId = ensureAuthenticatedUser(req, res);
  if (!userId) return;

  try {
    const graph = await friendStore.getFriendGraph(userId);
    return res.json({
      userId,
      ...graph,
      counts: {
        friends: graph.friends.length,
        incoming: graph.incomingRequests.length,
        outgoing: graph.outgoingRequests.length,
      },
    });
  } catch (error) {
    console.error("[FriendController.getGraph]", error);
    return respondWithError(res, error);
  }
};

exports.sendRequest = async (req, res) => {
  const userId = ensureAuthenticatedUser(req, res);
  if (!userId) return;

  const { recipientId, message } = req.body || {};

  try {
    const request = await friendStore.sendFriendRequest(
      userId,
      recipientId,
      message
    );
    return res.status(201).json({ request });
  } catch (error) {
    console.error("[FriendController.sendRequest]", error);
    return respondWithError(res, error);
  }
};

exports.acceptRequest = async (req, res) => {
  const userId = ensureAuthenticatedUser(req, res);
  if (!userId) return;

  const { requestId } = req.params;

  try {
    const result = await friendStore.acceptFriendRequest(requestId, userId);
    return res.json(result);
  } catch (error) {
    console.error("[FriendController.acceptRequest]", error);
    return respondWithError(res, error);
  }
};

exports.declineRequest = async (req, res) => {
  const userId = ensureAuthenticatedUser(req, res);
  if (!userId) return;

  const { requestId } = req.params;

  try {
    const request = await friendStore.declineFriendRequest(requestId, userId);
    return res.json({ request });
  } catch (error) {
    console.error("[FriendController.declineRequest]", error);
    return respondWithError(res, error);
  }
};

exports.removeFriend = async (req, res) => {
  const userId = ensureAuthenticatedUser(req, res);
  if (!userId) return;

  const { friendId } = req.params;

  try {
    await friendStore.removeFriend(userId, friendId);
    return res.status(204).send();
  } catch (error) {
    console.error("[FriendController.removeFriend]", error);
    return respondWithError(res, error);
  }
};



