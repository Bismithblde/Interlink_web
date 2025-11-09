const express = require("express");
const authMiddleware = require("../auth/middleware/authMiddleware");
const friendController = require("./controllers/friendController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", friendController.getGraph);
router.post("/requests", friendController.sendRequest);
router.post("/requests/:requestId/accept", friendController.acceptRequest);
router.post("/requests/:requestId/decline", friendController.declineRequest);
router.delete("/friends/:friendId", friendController.removeFriend);

module.exports = router;



