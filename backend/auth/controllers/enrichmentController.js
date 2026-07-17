const { getEnrichmentStatus, setTagDecision } = require("../../matchmaking/services/enrichmentService");

exports.getStatus = async (req, res) => {
  const result = await getEnrichmentStatus(req.user.id);
  return res.status(200).json(result);
};

const decide = (decision) => async (req, res) => {
  const result = await setTagDecision(req.user.id, req.params.tagId, decision);
  if (!result) return res.status(404).json({ error: "Profile tag not found" });
  return res.status(200).json(await getEnrichmentStatus(req.user.id));
};

exports.confirm = decide("confirmed");
exports.dismiss = decide("dismissed");
