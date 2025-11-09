import type { SerializedFreeTimeSlot } from "../types/schedule";
import { API_BASE_URL } from "./apiConfig";

export type MatchMode = "ONE_ON_ONE" | "ONE_ON_THREE";

export type MatchWindow = "NEXT_7_DAYS" | "NEXT_14_DAYS";

export type MatchRequestPayload = {
  mode: MatchMode;
  window: MatchWindow;
  minOverlapMinutes: number;
  requireSameCourse: boolean;
  slots: SerializedFreeTimeSlot[];
  hobbyQuery?: string;
  user?: {
    id?: string;
    name?: string | null;
    interests?: string[];
    major?: string | null;
    hobbies?: string[];
    favoriteSpot?: string | null;
    classes?: string[];
    funFact?: string | null;
    vibeCheck?: string | null;
    bio?: string | null;
    instagram?: string | null;
  };
};

export type MatchAvailabilitySlot = {
  dayLabel: string;
  start: string;
  end: string;
};

export type CompatibilityBreakdown = {
  schedule: number;
  affinity: number;
  hobbies: number;
  interests: number;
  majorBonus: number;
};

export type MatchPreview = {
  id: string;
  groupSize: number;
  compatibilityScore: number;
  overlapMinutes: number;
  sharedAvailability: MatchAvailabilitySlot[];
  summary: string;
  compatibilitySummary?: string;
  compatibilityBreakdown?: CompatibilityBreakdown;
  clusterLabel?: string;
  sharedHobbies?: string[];
  traitHighlights?: string[];
  participants?: Array<{
    id?: string;
    name?: string;
    major?: string;
    interests?: string[];
    classes?: string[];
    bio?: string;
    hobbies?: string[];
    funFact?: string;
    favoriteSpot?: string;
    vibeCheck?: string;
    instagram?: string;
  }>;
  sharedInterests?: string[];
  vibeHighlights?: string[];
  semanticSimilarity?: number;
  semanticHighlight?: string;
};

class MatchmakingApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "MatchmakingApiError";
    this.status = status;
    this.details = details;
  }
}

type MatchmakingResponse = {
  mode: string;
  generatedAt: string;
  datasetSize: number;
  emptyReason?: string | null;
  debug?: string[];
  seeker?: {
    id?: string;
    name?: string;
    interests?: string[];
  };
  matches: Array<{
    matchId: string;
    participants: Array<{
      id?: string;
      name?: string;
      major?: string;
      interests?: string[];
      classes?: string[];
      bio?: string;
      email?: string;
      hobbies?: string[];
      funFact?: string;
      favoriteSpot?: string;
      vibeCheck?: string;
      instagram?: string;
    }>;
    overlapMinutes: number;
    overlappingAvailability: Array<{
      start: string;
      end: string;
      durationMinutes: number;
    }>;
    sharedInterests?: string[];
    sharedHobbies?: string[];
    compatibilityScore?: number;
    compatibilityBreakdown?: CompatibilityBreakdown;
    compatibilitySummary?: string;
    clusterId?: string;
    clusterLabel?: string;
    traitHighlights?: string[];
    semanticSimilarity?: number;
    semanticHighlight?: string;
  }>;
};

export type MatchPreviewResult = {
  matches: MatchPreview[];
  emptyReason?: string | null;
  debug?: string[];
};

export type HobbySearchResult = {
  id: string;
  name?: string;
  email?: string;
  major?: string;
  hobbies: string[];
  interests: string[];
  instagram?: string;
};

export type ActivitySuggestion = {
  title: string;
  summary?: string;
  durationMinutes?: number;
  tags?: string[];
  primaryReason?: string;
};

type ErrorPayload = {
  error?: string;
  message?: string;
  details?: unknown;
};

const readJson = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("[findFriendApi] Failed to parse JSON response", error);
    return null;
  }
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = await readJson<T | ErrorPayload>(response);

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        payload.error) ||
      (payload &&
        typeof payload === "object" &&
        "message" in payload &&
        payload.message) ||
      response.statusText ||
      "Request failed";
    const details =
      payload && typeof payload === "object" && "details" in payload
        ? (payload as ErrorPayload).details
        : undefined;
    throw new MatchmakingApiError(response.status, message, details);
  }

  return (payload ?? ({} as T)) as T;
};

const MATCH_WINDOW_LABEL: Record<MatchWindow, string> = {
  NEXT_7_DAYS: "next 7 days",
  NEXT_14_DAYS: "next 14 days",
};

const MATCH_MODE_TO_BACKEND: Record<MatchMode, string> = {
  ONE_ON_ONE: "one-on-one",
  ONE_ON_THREE: "one-on-three",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const buildCompatibilityScore = (
  overlapMinutes: number,
  payload: MatchRequestPayload,
  sharedInterestsCount: number
) => {
  const overlapTarget = Math.max(payload.minOverlapMinutes, 1);
  const overlapRatio = clamp(overlapMinutes / overlapTarget, 0, 2);
  const overlapScore = overlapRatio * 55;
  const interestScore = clamp(sharedInterestsCount * 8, 0, 24);
  const modeBonus = payload.mode === "ONE_ON_ONE" ? 12 : 8;
  const courseBonus = payload.requireSameCourse ? 6 : 0;
  const rawScore = overlapScore + interestScore + modeBonus + courseBonus;
  return Math.round(clamp(rawScore, 45, 99));
};

const formatAvailability = (
  interval: MatchmakingResponse["matches"][number]["overlappingAvailability"][number]
): MatchAvailabilitySlot | null => {
  try {
    const startDate = new Date(interval.start);
    const endDate = new Date(interval.end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return null;
    }

    const dayLabel = startDate.toLocaleDateString(undefined, {
      weekday: "long",
    });
    const start = startDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const end = endDate.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });

    return { dayLabel, start, end };
  } catch (error) {
    console.warn("[findFriendApi] Failed to format availability slot", error);
    return null;
  }
};

const describeMatch = (
  match: MatchmakingResponse["matches"][number],
  payload: MatchRequestPayload
) => {
  const partnerNames = match.participants
    .map((participant) => participant.name)
    .filter((name): name is string => Boolean(name));

  const sharedInterests = match.sharedInterests ?? [];
  const windowLabel = MATCH_WINDOW_LABEL[payload.window];

  if (partnerNames.length === 0) {
    return `Shared availability over the ${windowLabel} window with ${Math.round(
      match.overlapMinutes
    )} minutes of overlap.`;
  }

  const readableParticipants =
    partnerNames.length === 1
      ? partnerNames[0]
      : `${partnerNames.slice(0, -1).join(", ")} and ${
          partnerNames[partnerNames.length - 1]
        }`;

  const interestFragment =
    sharedInterests.length > 0
      ? ` You overlap on ${sharedInterests.slice(0, 3).join(", ")}.`
      : "";

  return `Sync with ${readableParticipants} for ${Math.round(
    match.overlapMinutes
  )} minutes of shared focus time over the ${windowLabel} window.${interestFragment}`;
};

const sanitizeUser = (user: MatchRequestPayload["user"]) => {
  if (!user) return undefined;
  const toStringArray = (values?: string[] | null): string[] | undefined => {
    if (!Array.isArray(values)) return undefined;
    const normalized = values
      .map((value) => `${value}`.trim())
      .filter((value) => value.length > 0);
    return normalized.length > 0 ? normalized : undefined;
  };
  const sanitizeTextField = (value?: string | null): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };
  const sanitizeInstagram = (value?: string | null): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const withoutUrl = trimmed
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/\/+$/, "");
    const withoutAt =
      withoutUrl.startsWith("@") && withoutUrl.length > 1
        ? withoutUrl.slice(1)
        : withoutUrl;
    const compact = withoutAt.replace(/\s+/g, "");
    return compact.length > 0 ? compact : undefined;
  };

  return {
    id: typeof user.id === "string" ? user.id : undefined,
    name: typeof user.name === "string" ? user.name : undefined,
    interests: toStringArray(user.interests),
    hobbies: toStringArray(user.hobbies),
    major: sanitizeTextField(user.major ?? undefined),
    favoriteSpot: sanitizeTextField(user.favoriteSpot),
    classes: toStringArray(user.classes),
    funFact: sanitizeTextField(user.funFact),
    vibeCheck: sanitizeTextField(user.vibeCheck),
    bio: sanitizeTextField(user.bio),
    instagram: sanitizeTextField(user.instagram),
  };
};

const buildFilters = (payload: MatchRequestPayload) => {
  const filters: Record<string, unknown> = {};
  const normalizedUser = sanitizeUser(payload.user);

  if (normalizedUser?.interests && normalizedUser.interests.length > 0) {
    filters.interests = normalizedUser.interests;
  }

  if (payload.requireSameCourse && normalizedUser?.major) {
    filters.majors = [normalizedUser.major];
  }

  if (
    payload.requireSameCourse &&
    normalizedUser?.classes &&
    normalizedUser.classes.length > 0
  ) {
    filters.classes = normalizedUser.classes;
  }

  if (payload.requireSameCourse) {
    filters.requireSameCourse = true;
  }

  if (payload.hobbyQuery && payload.hobbyQuery.trim().length > 0) {
    filters.hobbyQuery = payload.hobbyQuery.trim();
  }

  return filters;
};

const transformMatches = (
  response: MatchmakingResponse,
  payload: MatchRequestPayload
): MatchPreview[] => {
  if (!response.matches || response.matches.length === 0) {
    return [];
  }

  return response.matches.map((match) => {
    const sharedAvailability = match.overlappingAvailability
      .map(formatAvailability)
      .filter((slot): slot is MatchAvailabilitySlot => Boolean(slot))
      .slice(0, 4);

    const sharedInterests = match.sharedInterests ?? [];
    const backendCompatibility = match.compatibilityScore;
    const compatibilityScore =
      typeof backendCompatibility === "number"
        ? backendCompatibility
        : buildCompatibilityScore(
            match.overlapMinutes,
            payload,
            sharedInterests.length
          );
    const summary =
      match.compatibilitySummary ?? describeMatch(match, payload);

    return {
      id: match.matchId,
      groupSize: match.participants.length + 1,
      compatibilityScore,
      overlapMinutes: Math.round(match.overlapMinutes),
      sharedAvailability,
      summary,
      compatibilitySummary: match.compatibilitySummary,
      compatibilityBreakdown: match.compatibilityBreakdown,
      participants: match.participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        major: participant.major,
        interests: participant.interests,
        classes: participant.classes,
        bio: participant.bio,
        hobbies: participant.hobbies,
        funFact: participant.funFact,
        favoriteSpot: participant.favoriteSpot,
        vibeCheck: participant.vibeCheck,
        instagram: participant.instagram,
      })),
      sharedInterests,
      sharedHobbies: match.sharedHobbies ?? [],
      clusterLabel: match.clusterLabel,
      semanticSimilarity: typeof match.semanticSimilarity === "number"
        ? Number(match.semanticSimilarity)
        : undefined,
      semanticHighlight: match.semanticHighlight,
    };
  });
};

export const findFriendApi = {
  async previewMatches(
    payload: MatchRequestPayload
  ): Promise<MatchPreviewResult> {
    if (!payload.slots.length) {
      throw new MatchmakingApiError(
        400,
        "Add at least one availability block before requesting matches."
      );
    }

    const body = {
      user: sanitizeUser(payload.user),
      availability: payload.slots,
      mode: MATCH_MODE_TO_BACKEND[payload.mode],
      filters: buildFilters(payload),
    };

    const response = await request<MatchmakingResponse>("/matchmaking/matches", {
      method: "POST",
      body: JSON.stringify(body),
    });

    return {
      matches: transformMatches(response, payload),
      emptyReason: response.emptyReason ?? null,
      debug: response.debug ?? [],
    };
  },

  async searchHobbies(term: string): Promise<HobbySearchResult[]> {
    const response = await request<{ results: HobbySearchResult[] }>(
      `/matchmaking/hobbies?hobby=${encodeURIComponent(term)}`
    );
    return Array.isArray(response?.results) ? response.results : [];
  },

  async suggestActivities(input: {
    description: string;
    hobbies?: string[];
  }): Promise<ActivitySuggestion[]> {
    const payload = {
      description: input.description.trim(),
      hobbies: Array.isArray(input.hobbies)
        ? input.hobbies
            .map((value) => `${value}`.trim())
            .filter((value) => value.length > 0)
        : undefined,
    };

    const response = await request<{
      suggestions?: ActivitySuggestion[];
    }>("/matchmaking/activity-suggestions", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (Array.isArray(response?.suggestions)) {
      return response.suggestions;
    }

    return [];
  },
};

export { MatchmakingApiError };

export const MATCH_WINDOW_OPTIONS: Array<{ value: MatchWindow; label: string }> =
  [
    { value: "NEXT_7_DAYS", label: "Next 7 days" },
    { value: "NEXT_14_DAYS", label: "Next 14 days" },
  ];

