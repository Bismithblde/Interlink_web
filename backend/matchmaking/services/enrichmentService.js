const crypto = require("node:crypto");
const supabase = require("../../auth/services/supabaseClient");
const { canonicalTags, aliases } = require("../data/tagTaxonomy");
const { slugify } = require("./rankingService");
const { createMatchmakingLogger } = require("../utils/matchmakingLogger");

const ALLOWED_CATEGORIES = new Set(["academic", "hobby", "community", "social", "topic"]);
const SENSITIVE = /(?:race|ethnicity|religion|sexual orientation|gay|lesbian|transgender|disability|diagnosis|medical|health condition|political party|address|phone|email|student id|ssn)/i;
const MAX_TAGS = 5000;
const MAX_NEW_PER_RUN = 3;
const RETRY_DELAYS_MS = [60000, 300000, 1800000];
const memory = { registry: new Map(canonicalTags.map((tag) => [tag.slug, tag])), profiles: new Map(), jobs: new Map(), suppressions: new Map() };

const normalizeProfileContent = (profile = {}) => ({
  bio: `${profile.bio || ""}`.trim().replace(/\s+/g, " "),
  interests: [...new Set((profile.interests || []).map((v) => `${v}`.trim().toLowerCase()).filter(Boolean))].sort(),
  hobbies: [...new Set((profile.hobbies || []).map((v) => `${v}`.trim().toLowerCase()).filter(Boolean))].sort(),
  classes: [...new Set((profile.classes || []).map((v) => `${v}`.trim().toLowerCase()).filter(Boolean))].sort(),
  major: `${profile.major || ""}`.trim().toLowerCase(),
  openTo: [...new Set((profile.openTo || []).map((v) => `${v}`.trim().toLowerCase()).filter(Boolean))].sort(),
});

const contentHash = (profile) => crypto.createHash("sha256").update(JSON.stringify(normalizeProfileContent(profile))).digest("hex");
const profileText = (profile) => Object.values(normalizeProfileContent(profile)).flat().join("\n");

const deterministicTags = (profile) => {
  const text = profileText(profile).toLowerCase();
  const found = [];
  memory.registry.forEach((tag) => {
    const forms = [tag.slug.replace(/-/g, " "), tag.label.toLowerCase()];
    if (forms.some((form) => text.includes(form))) found.push({ ...tag, source: "deterministic", confidence: 1, confirmed: false });
  });
  Object.entries(aliases).forEach(([alias, slug]) => {
    if (text.includes(alias.toLowerCase()) && memory.registry.has(slug) && !found.some((tag) => tag.slug === slug)) {
      found.push({ ...memory.registry.get(slug), source: "alias", confidence: 1, confirmed: false });
    }
  });
  return found.slice(0, 30);
};

const validateNewTags = (proposals, sourceText) => {
  const accepted = [];
  for (const proposal of Array.isArray(proposals) ? proposals : []) {
    if (accepted.length >= MAX_NEW_PER_RUN || memory.registry.size + accepted.length >= MAX_TAGS) break;
    const slug = slugify(proposal?.slug || proposal?.label);
    const label = `${proposal?.label || ""}`.trim();
    const evidence = `${proposal?.evidence || ""}`.trim();
    const category = `${proposal?.category || ""}`.trim().toLowerCase();
    if (!slug || !label || Number(proposal?.confidence) < 0.92) continue;
    if (!ALLOWED_CATEGORIES.has(category) || SENSITIVE.test(`${label} ${evidence}`)) continue;
    if (!evidence || !sourceText.toLowerCase().includes(evidence.toLowerCase())) continue;
    if (memory.registry.has(slug) || aliases[slug] || accepted.some((tag) => tag.slug === slug)) continue;
    accepted.push({ id: slug, slug, label: label.slice(0, 80), category, active: true, source: "deepseek-created", confidence: Number(proposal.confidence), evidence });
  }
  return accepted;
};

const parseModelOutput = (payload, profile) => {
  const existing = [...new Set(payload?.matchedExistingTags || [])]
    .map(slugify).filter((slug) => memory.registry.has(slug))
    .map((slug) => ({ ...memory.registry.get(slug), source: "deepseek", confidence: 1, confirmed: false }));
  const created = validateNewTags(payload?.createCanonicalTags, profileText(profile));
  return [...existing, ...created];
};

const callDeepSeek = async (profile, logger) => {
  if (
    !process.env.DEEPSEEK_API_KEY ||
    (process.env.SUPABASE_USE_STUB === "true" &&
      process.env.DEEPSEEK_ALLOW_STUB_CALLS !== "true")
  ) {
    logger?.info("llm.skipped", {
      stage: "llm",
      provider: "deepseek",
      reason: !process.env.DEEPSEEK_API_KEY ? "api_key_missing" : "stub_calls_disabled",
    });
    return null;
  }
  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const model = process.env.DEEPSEEK_TAG_MODEL || "deepseek-v4-flash";
  const registry = [...memory.registry.values()].map(({ slug, label, category }) => ({ slug, label, category }));
  const finishCall = logger?.timer("llm.completed", { stage: "llm", provider: "deepseek", model });
  logger?.info("llm.started", {
    stage: "llm",
    provider: "deepseek",
    model,
    profileSignalCounts: {
      bioCharacters: normalizeProfileContent(profile).bio.length,
      interests: normalizeProfileContent(profile).interests.length,
      hobbies: normalizeProfileContent(profile).hobbies.length,
      classes: normalizeProfileContent(profile).classes.length,
      openTo: normalizeProfileContent(profile).openTo.length,
    },
    registrySize: registry.length,
  });
  let response;
  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`, "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ model, temperature: 0, thinking: { type: "disabled" }, response_format: { type: "json_object" }, messages: [
        { role: "system", content: "Extract profile tags. Return JSON with matchedExistingTags (canonical slugs) and createCanonicalTags (label, slug, category, confidence, evidence). Prefer the registry. Evidence must be an exact substring. Do not infer sensitive or identifying traits." },
        { role: "user", content: JSON.stringify({ profile: normalizeProfileContent(profile), registry }) },
      ] }),
    });
  } catch (error) {
    finishCall?.({ outcome: "provider_error", error }, "error");
    throw error;
  }
  if (!response.ok) {
    finishCall?.({ outcome: "http_error", statusCode: response.status }, "error");
    throw new Error(`DeepSeek tag extraction failed with ${response.status}`);
  }
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    finishCall?.({
      outcome: "success",
      statusCode: response.status,
      responseCharacterCount: content.length,
      finishReason: data?.choices?.[0]?.finish_reason || null,
      usage: data?.usage || null,
      proposedExistingTagCount: Array.isArray(parsed.matchedExistingTags) ? parsed.matchedExistingTags.length : 0,
      proposedNewTagCount: Array.isArray(parsed.createCanonicalTags) ? parsed.createCanonicalTags.length : 0,
    });
    return parsed;
  } catch (error) {
    finishCall?.({ outcome: "invalid_json", statusCode: response.status, responseCharacterCount: content.length, error }, "error");
    throw error;
  }
};

const persistProfileTags = async (userId, hash, tags) => {
  if (typeof supabase.from !== "function") return;
  const rows = tags.map((tag) => ({ user_id: userId, tag_id: tag.slug, source: tag.source, confidence: tag.confidence || 1, content_hash: hash }));
  if (rows.length) await supabase.from("profile_tags").upsert(rows, { onConflict: "user_id,tag_id" });
};

const persistNewCanonicalTags = async (tags) => {
  const created = tags.filter((tag) => tag.source === "deepseek-created");
  if (!created.length || typeof supabase.rpc !== "function") return;
  const { error } = await supabase.rpc("create_guarded_canonical_tags", {
    proposals: created.map(({ slug, label, category }) => ({ slug, label, category })),
  });
  if (error) throw error;
};

const enqueueEnrichment = async (userId, profile) => {
  const hash = contentHash(profile);
  const existing = memory.jobs.get(userId);
  const fallback = deterministicTags(profile);
  memory.profiles.set(userId, { hash, tags: fallback, updatedAt: new Date().toISOString() });
  if (existing?.contentHash === hash && ["pending", "processing", "complete"].includes(existing.status)) {
    createMatchmakingLogger({ requestId: existing.id, operation: "profile_enrichment" }).info("job.reused", { stage: "queue", userId, status: existing.status, deterministicTagCount: fallback.length });
    return existing;
  }
  if (typeof supabase.from === "function") {
    const { data: persisted, error } = await supabase.from("profile_enrichment_jobs")
      .select("id,user_id,content_hash,profile_snapshot,status,attempts,next_attempt_at,created_at,completed_at")
      .eq("user_id", userId).eq("content_hash", hash).maybeSingle();
    if (error) throw error;
    if (persisted) {
      const persistedJob = {
        id: persisted.id, userId: persisted.user_id, contentHash: persisted.content_hash,
        profile: persisted.profile_snapshot, status: persisted.status, attempts: persisted.attempts,
        nextAttemptAt: new Date(persisted.next_attempt_at).getTime(), createdAt: persisted.created_at,
        completedAt: persisted.completed_at,
      };
      memory.jobs.set(userId, persistedJob);
      createMatchmakingLogger({ requestId: persistedJob.id, operation: "profile_enrichment" }).info("job.restored", { stage: "queue", userId, status: persistedJob.status, deterministicTagCount: fallback.length });
      return persistedJob;
    }
  }
  const job = { id: crypto.randomUUID(), userId, contentHash: hash, profile: normalizeProfileContent(profile), status: "pending", attempts: 0, nextAttemptAt: Date.now(), createdAt: new Date().toISOString() };
  memory.jobs.set(userId, job);
  createMatchmakingLogger({ requestId: job.id, operation: "profile_enrichment" }).info("job.enqueued", {
    stage: "queue",
    userId,
    deterministicTagCount: fallback.length,
    contentHashPrefix: hash.slice(0, 12),
  });
  if (typeof supabase.from === "function") {
    const { error } = await supabase.from("profile_enrichment_jobs").upsert({
      id: job.id, user_id: userId, content_hash: hash, profile_snapshot: job.profile,
      status: "pending", attempts: 0, next_attempt_at: new Date(job.nextAttemptAt).toISOString(),
    }, { onConflict: "user_id,content_hash" });
    if (error) throw error;
  }
  setImmediate(() => processEnrichment(userId).catch((error) => {
    createMatchmakingLogger({ requestId: job.id, operation: "profile_enrichment" }).error("job.opportunistic_processing_failed", { stage: "queue", userId, error });
  }));
  return job;
};

const processEnrichment = async (userId) => {
  const job = memory.jobs.get(userId);
  if (!job || job.status === "complete" || job.nextAttemptAt > Date.now()) return job;
  const logger = createMatchmakingLogger({ requestId: job.id, operation: "profile_enrichment" });
  const finishJob = logger.timer("job.completed", { stage: "enrichment", userId });
  job.status = "processing";
  job.attempts += 1;
  logger.info("job.started", { stage: "enrichment", userId, attempt: job.attempts, deterministicTagCount: memory.profiles.get(userId)?.tags?.length || 0 });
  try {
    const modelOutput = await callDeepSeek(job.profile, logger);
    const current = memory.profiles.get(userId);
    if (!current || current.hash !== job.contentHash) {
      job.status = "stale";
      logger.warn("job.stale", { stage: "enrichment", userId, reason: "profile_content_changed" });
    } else {
      const extracted = modelOutput ? parseModelOutput(modelOutput, job.profile) : [];
      logger.info("tags.validated", {
        stage: "validation",
        proposedExistingCount: modelOutput?.matchedExistingTags?.length || 0,
        proposedNewCount: modelOutput?.createCanonicalTags?.length || 0,
        acceptedExistingCount: extracted.filter((tag) => tag.source === "deepseek").length,
        acceptedNewCount: extracted.filter((tag) => tag.source === "deepseek-created").length,
        acceptedTagSlugs: extracted.map((tag) => tag.slug),
      });
      await persistNewCanonicalTags(extracted);
      extracted
        .filter((tag) => tag.source === "deepseek-created")
        .forEach((tag) => memory.registry.set(tag.slug, tag));
      const combined = [...current.tags, ...extracted].filter((tag, index, all) => all.findIndex((entry) => entry.slug === tag.slug) === index);
      current.tags = combined;
      current.updatedAt = new Date().toISOString();
      job.status = "complete";
      job.completedAt = current.updatedAt;
      await persistProfileTags(userId, job.contentHash, combined);
      logger.info("tags.persisted", { stage: "persistence", userId, totalTagCount: combined.length });
    }
  } catch (error) {
    job.lastError = error.message;
    if (job.attempts > RETRY_DELAYS_MS.length) job.status = "failed";
    else { job.status = "pending"; job.nextAttemptAt = Date.now() + RETRY_DELAYS_MS[job.attempts - 1]; }
    logger.error("job.attempt_failed", { stage: "enrichment", userId, attempt: job.attempts, nextStatus: job.status, retryAt: job.status === "pending" ? new Date(job.nextAttemptAt).toISOString() : null, error });
  }
  if (typeof supabase.from === "function") {
    const update = { status: job.status, attempts: job.attempts, last_error: job.lastError || null,
      next_attempt_at: new Date(job.nextAttemptAt || Date.now()).toISOString(), completed_at: job.completedAt || null };
    const { error } = await supabase.from("profile_enrichment_jobs").update(update).eq("id", job.id);
    if (error) logger.warn("job.status_persistence_failed", { stage: "persistence", userId, error });
  }
  finishJob({ outcome: job.status, attempt: job.attempts }, job.status === "failed" ? "error" : "info");
  return job;
};

const getEnrichmentStatus = async (userId) => {
  if (!memory.jobs.has(userId) && typeof supabase.from === "function") {
    const { data: row } = await supabase.from("profile_enrichment_jobs").select("id,user_id,content_hash,profile_snapshot,status,attempts,next_attempt_at,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (row) {
      memory.jobs.set(userId, { id: row.id, userId: row.user_id, contentHash: row.content_hash, profile: row.profile_snapshot, status: row.status, attempts: row.attempts, nextAttemptAt: new Date(row.next_attempt_at).getTime(), createdAt: row.created_at });
      memory.profiles.set(userId, { hash: row.content_hash, tags: deterministicTags(row.profile_snapshot), updatedAt: row.created_at });
    }
  }
  await processEnrichment(userId);
  const job = memory.jobs.get(userId);
  const profile = memory.profiles.get(userId);
  const suppressed = memory.suppressions.get(userId) || new Set();
  return { status: job?.status || "not_started", contentHash: profile?.hash || null, tags: (profile?.tags || []).filter((tag) => !suppressed.has(tag.slug)), attempts: job?.attempts || 0 };
};

const setTagDecision = async (userId, tagId, decision) => {
  const profile = memory.profiles.get(userId);
  const slug = slugify(tagId);
  if (!profile?.tags.some((tag) => tag.slug === slug)) return null;
  if (decision === "dismissed") {
    if (!memory.suppressions.has(userId)) memory.suppressions.set(userId, new Set());
    memory.suppressions.get(userId).add(slug);
  } else {
    profile.tags = profile.tags.map((tag) => tag.slug === slug ? { ...tag, confirmed: true } : tag);
    memory.suppressions.get(userId)?.delete(slug);
  }
  if (typeof supabase.from === "function") {
    if (decision === "dismissed") {
      const { error } = await supabase.from("profile_tag_suppressions").upsert({ user_id: userId, tag_id: slug }, { onConflict: "user_id,tag_id" });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("profile_tags").update({ confirmed: true }).eq("user_id", userId).eq("tag_id", slug);
      if (error) throw error;
    }
  }
  return { tagId: slug, decision };
};

module.exports = { contentHash, deterministicTags, validateNewTags, parseModelOutput, enqueueEnrichment, processEnrichment, getEnrichmentStatus, setTagDecision, __memory: memory };
