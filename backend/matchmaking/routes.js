const express = require("express");
const matchController = require("./controllers/matchController");
const authMiddleware = require("../auth/middleware/authMiddleware");

const router = express.Router();

router.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "matchmaking" })
);

router.get("/hobbies", matchController.searchHobbies);

router.post("/matches", matchController.createMatchPlan);
router.post("/events", authMiddleware, matchController.recordRecommendationEvents);
router.post(
  "/activity-suggestions",
  matchController.suggestActivities
);
router.post("/hangout-plans", matchController.planHangout);

module.exports = router;

