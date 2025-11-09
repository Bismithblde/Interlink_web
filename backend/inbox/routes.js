const express = require("express");
const authMiddleware = require("../auth/middleware/authMiddleware");
const inboxController = require("./controllers/inboxController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", inboxController.getInbox);

module.exports = router;



