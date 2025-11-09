const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const sanitizeList = (value) =>
  Array.isArray(value)
    ? value
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0)
    : [];

const clampSuggestions = (items) =>
  items
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        item.title.trim().length > 0
    )
    .slice(0, 4)
    .map((item) => ({
      title: item.title.trim(),
      summary:
        typeof item.summary === "string" && item.summary.trim().length > 0
          ? item.summary.trim()
          : undefined,
      durationMinutes:
        typeof item.durationMinutes === "number" && item.durationMinutes > 0
          ? Math.round(item.durationMinutes)
          : undefined,
      tags: sanitizeList(item.tags),
      primaryReason:
        typeof item.primaryReason === "string" &&
        item.primaryReason.trim().length > 0
          ? item.primaryReason.trim()
          : undefined,
    }));

const extractJson = (text) => {
  if (!text) return null;
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) return null;
  const jsonSlice = text.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(jsonSlice);
  } catch (error) {
    console.warn(
      "[activitySuggestionService] Failed to parse JSON response",
      error
    );
    return null;
  }
};

const buildPrompt = ({ description, hobbies }) => {
  const safeDescription =
    description ||
    "Co-working sessions or quick meetups that help commuters feel connected.";
  const hobbyList =
    hobbies.length > 0
      ? `The student enjoys: ${hobbies.slice(0, 8).join(", ")}.`
      : "No explicit hobbies provided.";

  return `
You coach commuter students on quick on-campus meetups that strengthen community.

Produce JSON in the following shape:
{
  "suggestions": [
    {
      "title": "Short, catchy activity name",
      "summary": "1-2 sentence description tailored to their interests",
      "durationMinutes": number,
      "tags": ["keyword", "another"],
      "primaryReason": "Why this fits their description or hobbies"
    }
  ]
}

Guidelines:
- Suggest 2-3 concrete activities that can fit in 20-90 minutes.
- Use spaces on or near campus (student union, library patio, commuter lounge, etc.).
- Blend in the provided description and hobbies; reflect their vibe.
- When no hobbies are given, pick approachable ideas any commuter could try.
- Keep language warm, inclusive, and campus-oriented.
- Respond with JSON only, no markdown fences or commentary.

Student request: ${safeDescription}
${hobbyList}
`.trim();
};

let cachedClient = null;

const getModel = () => {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const client = new GoogleGenerativeAI(apiKey);
  cachedClient = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      temperature: 0.8,
      topP: 0.9,
      topK: 40,
      maxOutputTokens: 512,
    },
  });
  return cachedClient;
};

const fallbackFromHobbies = ({ description, hobbies }) => {
  const topHobby = hobbies[0];
  const secondaryHobby = hobbies[1];
  const baseIdeas = [
    {
      title: "Commuter Coffee Catch-up",
      summary:
        "Meet at the campus coffee bar before class for a 30-minute vibe check and quick planning sprint.",
      durationMinutes: 30,
      tags: ["coffee", "hangout", "commuter"],
      primaryReason:
        "Works for tight schedules and gets commuters face time with peers.",
    },
    {
      title: "Library Focus Pod",
      summary:
        "Block off 45 minutes in the library's quiet zone to co-work and swap study playlists.",
      durationMinutes: 45,
      tags: ["study", "focus", "library"],
      primaryReason:
        "Easy to schedule between classes and keeps energy accountable.",
    },
    {
      title: "Campus Loop Reset",
      summary:
        "Take a 25-minute walk around campus to stretch, compare notes from classes, and reset before the next block.",
      durationMinutes: 25,
      tags: ["movement", "wellness"],
      primaryReason:
        "Keeps commuters energized without needing extra gear or planning.",
    },
  ];

  if (topHobby) {
    baseIdeas[0] = {
      title: `${topHobby} Micro Meetup`,
      summary: `Gather for a 30-minute ${topHobby.toLowerCase()} session in a common space so commuters can connect fast.`,
      durationMinutes: 30,
      tags: [topHobby.toLowerCase(), "commuter"],
      primaryReason: `Taps into their interest in ${topHobby} while staying campus friendly.`,
    };
  }

  if (secondaryHobby) {
    baseIdeas[1] = {
      title: `${secondaryHobby} Express Jam`,
      summary: `Host a 45-minute ${secondaryHobby.toLowerCase()} meetup in a lounge or multipurpose room and invite folks to bring a friend.`,
      durationMinutes: 45,
      tags: [secondaryHobby.toLowerCase(), "community"],
      primaryReason: `Builds on their ${secondaryHobby} hobby to attract similar commuters.`,
    };
  }

  if (description && description.length > 0) {
    baseIdeas[2] = {
      title: "Express Match Activity",
      summary: description.length > 180 ? description.slice(0, 177) + "…" : description,
      durationMinutes: 35,
      tags: ["custom", "commuter"],
      primaryReason:
        "Echoes the student's own idea so they can rally others around it quickly.",
    };
  }

  return baseIdeas;
};

const generateActivitySuggestions = async ({ description, hobbies }) => {
  const normalizedHobbies = sanitizeList(hobbies);
  const trimmedDescription =
    typeof description === "string" ? description.trim() : "";

  const model = getModel();
  const prompt = buildPrompt({
    description: trimmedDescription,
    hobbies: normalizedHobbies,
  });

  const response = await model.generateContent(prompt);

  const text = response?.response?.text?.() ?? "";
  const json = extractJson(text);

  if (!json || !Array.isArray(json.suggestions)) {
    console.warn(
      "[activitySuggestionService] Model response missing suggestions, using fallback"
    );
    return clampSuggestions(
      fallbackFromHobbies({
        description: trimmedDescription,
        hobbies: normalizedHobbies,
      })
    );
  }

  const suggestions = clampSuggestions(json.suggestions);
  if (suggestions.length === 0) {
    return clampSuggestions(
      fallbackFromHobbies({
        description: trimmedDescription,
        hobbies: normalizedHobbies,
      })
    );
  }
  return suggestions;
};

const describePerson = (profile) => {
  const parts = [];
  if (profile.name) {
    parts.push(profile.name);
  }
  if (profile.major) {
    parts.push(`studies ${profile.major}`);
  }
  if (profile.hobbies?.length) {
    parts.push(`into ${profile.hobbies.slice(0, 3).join(", ")}`);
  }
  if (profile.interests?.length && !profile.hobbies?.length) {
    parts.push(`interested in ${profile.interests.slice(0, 3).join(", ")}`);
  }
  return parts.join(" · ");
};

const summarizeProfiles = ({ seeker, friends }) => {
  const seekerSummary = describePerson(seeker);
  const friendSummaries = friends.map(describePerson).filter(Boolean);
  return {
    seeker: seekerSummary,
    friends: friendSummaries,
  };
};

const buildHangoutPrompt = ({
  seeker,
  friends,
  focus,
  durationMinutes,
}) => {
  const focusLine = focus
    ? `Priority or vibe the group mentioned: ${focus}.`
    : "No special focus was mentioned—suggest something energizing and welcoming.";
  const durationLine = durationMinutes
    ? `They have about ${durationMinutes} minutes together.`
    : "Assume they have 60 minutes together unless a better cadence emerges.";
  const { seeker: seekerSummary, friends: friendSummaries } = summarizeProfiles({
    seeker,
    friends,
  });

  const roster = [
    seekerSummary ? `Host: ${seekerSummary}` : null,
    ...friendSummaries.map((summary, index) => `Friend ${index + 1}: ${summary}`),
  ]
    .filter(Boolean)
    .join("\n");

  return `
You are a campus hangout concierge crafting inclusive, commuter-friendly plans.

Produce JSON in this shape:
{
  "plan": {
    "title": "short title",
    "summary": "1-2 sentence overview",
    "agenda": [
      {
        "label": "Kickoff coffee lap",
        "durationMinutes": 20,
        "detail": "Quick icebreaker while grabbing drinks near the student union."
      }
    ],
    "conversationStarters": [
      "Starter 1",
      "Starter 2",
      "Starter 3"
    ],
    "sharedConnections": [
      "Shared hobby or interest insight",
      "Another relevant overlap"
    ],
    "prepReminders": [
      "Reminder that helps the meetup go smoothly"
    ],
    "followUpIdeas": [
      "Lightweight next step to keep momentum going"
    ]
  }
}

Guidelines:
- Suggest an agenda that fits within the provided time.
- Reference their hobbies/interests so everyone feels seen.
- Keep conversation starters inclusive and curiosity-driven.
- If information is sparse, recommend universally friendly prompts.
- Avoid suggesting alcohol and keep everything campus-accessible.
- Respond with JSON only, no markdown or commentary.

${focusLine}
${durationLine}

People attending:
${roster || "No roster info provided."}
`.trim();
};

const fallbackHangoutPlan = ({ seeker, friends, focus, durationMinutes }) => {
  const participantNames = [
    seeker?.name ?? "You",
    ...friends.map((friend) => friend.name).filter(Boolean),
  ];
  const title = focus
    ? `${focus} meetup`
    : "Campus catch-up";
  const summary = focus
    ? `Swap stories and resources related to ${focus.toLowerCase()} while catching up in a relaxed campus spot.`
    : "Gather for a relaxed campus catch-up, share wins from the week, and line up the next meetup.";
  const time = durationMinutes && durationMinutes > 0 ? durationMinutes : 60;
  const kickoff = Math.min(20, Math.round(time / 3));
  const collaborate = Math.min(25, Math.round(time / 2));
  const wrap = Math.max(time - kickoff - collaborate, 15);

  const sharedConnections = [];
  const allHobbies = [
    ...(seeker?.hobbies ?? []),
    ...friends.flatMap((friend) => friend.hobbies ?? []),
  ];
  const uniqueHobbies = Array.from(new Set(allHobbies.map((hobby) => hobby.toLowerCase())));
  if (uniqueHobbies.length > 0) {
    sharedConnections.push(
      `Lean into your shared interest in ${uniqueHobbies.slice(0, 2).join(", ")}.`
    );
  } else {
    sharedConnections.push(
      "Swap quick wins from the week so everyone gets a turn to shine."
    );
  }

  return {
    title,
    summary,
    agenda: [
      {
        label: "Arrive & settle in",
        durationMinutes: kickoff,
        detail: `Grab drinks or snacks and do a quick high/low round so everyone feels caught up.`,
      },
      {
        label: "Shared focus",
        durationMinutes: collaborate,
        detail:
          focus
            ? `Collaborate on something tied to ${focus.toLowerCase()} or trade tips that help everyone move forward.`
            : "Work on personal goals side-by-side or share a playlist while you co-work.",
      },
      {
        label: "Wrap & plan next touchpoint",
        durationMinutes: wrap,
        detail: "Recap key takeaways, jot down next steps, and snap a photo to mark the moment.",
      },
    ],
    conversationStarters: [
      "What’s something that energized you this week?",
      "If we had another hour together, what would you want to dive into?",
      "Any campus hack or hidden spot worth sharing?",
    ],
    sharedConnections,
    prepReminders: [
      "Pick a spot with outlets and comfy seating so commuters can settle in.",
      "Bring a small treat or playlist suggestion to kick things off.",
    ],
    followUpIdeas: [
      "Drop a quick recap or photo in your group chat after the meetup.",
      "Lock in the next hang while everyone’s together.",
    ],
    participants: participantNames,
  };
};

const interpretHangoutPlan = (payload, fallbackArgs) => {
  if (!payload || typeof payload !== "object") {
    return fallbackHangoutPlan(fallbackArgs);
  }
  if (!("plan" in payload) || typeof payload.plan !== "object") {
    return fallbackHangoutPlan(fallbackArgs);
  }
  const plan = payload.plan;
  const ensureAgenda = Array.isArray(plan.agenda)
    ? plan.agenda
        .filter(
          (item) =>
            item &&
            typeof item === "object" &&
            typeof item.label === "string" &&
            item.label.trim().length > 0
        )
        .map((item) => ({
          label: item.label.trim(),
          durationMinutes:
            typeof item.durationMinutes === "number" && item.durationMinutes > 0
              ? Math.round(item.durationMinutes)
              : undefined,
          detail:
            typeof item.detail === "string" && item.detail.trim().length > 0
              ? item.detail.trim()
              : undefined,
        }))
    : [];

  const normalizeStringList = (value) =>
    Array.isArray(value)
      ? value
          .map((entry) => `${entry}`.trim())
          .filter((entry) => entry.length > 0)
      : [];

  const fallbackPlan = fallbackHangoutPlan(fallbackArgs);

  return {
    title:
      typeof plan.title === "string" && plan.title.trim().length > 0
        ? plan.title.trim()
        : fallbackPlan.title,
    summary:
      typeof plan.summary === "string" && plan.summary.trim().length > 0
        ? plan.summary.trim()
        : fallbackPlan.summary,
    agenda: ensureAgenda.length > 0 ? ensureAgenda : fallbackPlan.agenda,
    conversationStarters:
      normalizeStringList(plan.conversationStarters).length > 0
        ? normalizeStringList(plan.conversationStarters)
        : fallbackPlan.conversationStarters,
    sharedConnections:
      normalizeStringList(plan.sharedConnections).length > 0
        ? normalizeStringList(plan.sharedConnections)
        : fallbackPlan.sharedConnections,
    prepReminders:
      normalizeStringList(plan.prepReminders).length > 0
        ? normalizeStringList(plan.prepReminders)
        : fallbackPlan.prepReminders,
    followUpIdeas:
      normalizeStringList(plan.followUpIdeas).length > 0
        ? normalizeStringList(plan.followUpIdeas)
        : fallbackPlan.followUpIdeas,
    participants: fallbackPlan.participants,
  };
};

const generateHangoutPlan = async ({
  seeker,
  friends,
  focus,
  durationMinutes,
}) => {
  const model = getModel();
  const prompt = buildHangoutPrompt({
    seeker,
    friends,
    focus,
    durationMinutes,
  });

  const response = await model.generateContent(prompt);
  const text = response?.response?.text?.() ?? "";
  const json = extractJson(text);

  return interpretHangoutPlan(json, {
    seeker,
    friends,
    focus,
    durationMinutes,
  });
};

module.exports = {
  generateActivitySuggestions,
  generateHangoutPlan,
};


