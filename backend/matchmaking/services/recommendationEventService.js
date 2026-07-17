const crypto = require("node:crypto");
const supabase = require("../../auth/services/supabaseClient");

const ALLOWED_TYPES = new Set(["impression", "profile_open", "dwell", "skip", "request", "accept", "reciprocal_action"]);
const memoryEvents = [];

const validateEvent = (event, index, actorId) => {
  const type = `${event?.type || ""}`.trim();
  if (!ALLOWED_TYPES.has(type)) throw new Error(`events[${index}].type is invalid`);
  if (!actorId || !event?.candidateId || !event?.requestId) throw new Error(`events[${index}] requires candidateId and requestId`);
  if (event.userId && `${event.userId}` !== `${actorId}`) throw new Error(`events[${index}].userId must match the authenticated user`);
  const dwellSeconds = type === "dwell" ? Number(event.dwellSeconds) : null;
  if (type === "dwell" && (!Number.isFinite(dwellSeconds) || dwellSeconds < 8)) {
    throw new Error(`events[${index}].dwellSeconds must be at least 8`);
  }
  return {
    id: crypto.randomUUID(),
    event_type: type,
    user_id: `${actorId}`,
    candidate_id: `${event.candidateId}`,
    request_id: `${event.requestId}`,
    match_version: `${event.matchVersion || "2.0"}`,
    dwell_seconds: dwellSeconds,
    metadata: event.metadata && typeof event.metadata === "object" ? event.metadata : {},
    occurred_at: event.occurredAt && !Number.isNaN(new Date(event.occurredAt).getTime()) ? new Date(event.occurredAt).toISOString() : new Date().toISOString(),
  };
};

const recordEvents = async (events, actorId) => {
  if (!Array.isArray(events) || events.length === 0 || events.length > 100) throw new Error("events must contain between 1 and 100 items");
  const rows = events.map((event, index) => validateEvent(event, index, actorId));
  if (typeof supabase.from === "function") {
    const { error } = await supabase.from("recommendation_events").insert(rows);
    if (error) throw error;
  } else {
    memoryEvents.push(...rows);
  }
  return rows;
};

module.exports = { ALLOWED_TYPES, recordEvents, __memoryEvents: memoryEvents };
