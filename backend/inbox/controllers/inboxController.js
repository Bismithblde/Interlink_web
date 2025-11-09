const inboxStore = require("../store");

const ensureAuthenticatedUser = (req, res) => {
  if (!req.user || !req.user.id) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return req.user.id;
};

const respondWithError = (res, error) => {
  const status = error.status || 500;
  const payload = {
    error: error.message || "Unexpected inbox error",
  };
  if (error.details !== undefined) {
    payload.details = error.details;
  }
  return res.status(status).json(payload);
};

exports.getInbox = async (req, res) => {
  const userId = ensureAuthenticatedUser(req, res);
  if (!userId) return;

  try {
    const inbox = await inboxStore.getInbox(userId);
    return res.json(inbox);
  } catch (error) {
    console.error("[InboxController.getInbox]", error);
    return respondWithError(res, error);
  }
};


