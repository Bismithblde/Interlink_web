import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Link, Navigate } from "react-router-dom";
import MatchModeSelector from "../components/find-friend/MatchModeSelector";
import SchedulePreviewCard, {
  type SchedulePreviewData,
} from "../components/find-friend/SchedulePreviewCard";
import MatchRequestForm, {
  type MatchPreferences,
} from "../components/find-friend/MatchRequestForm";
import MatchPreviewList from "../components/find-friend/MatchPreviewList";
import TopMatchRecommendations from "../components/find-friend/TopMatchRecommendations";
import ActivityIdeaGenerator from "../components/find-friend/ActivityIdeaGenerator";
import { useAuth } from "../context/AuthContext";
import {
  findFriendApi,
  type MatchMode,
  type MatchPreview,
  type HobbySearchResult,
  type ActivitySuggestion,
  MatchmakingApiError,
} from "../services/findFriendApi";
import { scheduleApi, ScheduleApiError } from "../services/scheduleApi";
import { deserializeSlots, serializeSlots } from "../features/schedule/utils";
import type { FreeTimeSlot } from "../types/schedule";
import {
  ConnectionsApiError,
  connectionsApi,
} from "../services/connectionsApi";
import {
  UsersRound,
  CalendarDays,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";

const durationLabel = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
};

const dayOrder = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const buildSchedulePreview = (
  slots: FreeTimeSlot[]
): SchedulePreviewData | null => {
  if (!slots.length) return null;

  const summaries = new Map<
    string,
    {
      totalMinutes: number;
      slots: SchedulePreviewData["dailySummaries"][number]["slots"];
    }
  >();

  let totalMinutes = 0;

  slots.forEach((slot) => {
    const day = slot.start.toLocaleDateString(undefined, {
      weekday: "long",
    });
    const startLabel = slot.start.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const endLabel = slot.end.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
    const durationMinutes = Math.round(
      (slot.end.getTime() - slot.start.getTime()) / (1000 * 60)
    );

    totalMinutes += durationMinutes;

    const entry = summaries.get(day) ?? {
      totalMinutes: 0,
      slots: [],
    };

    entry.totalMinutes += durationMinutes;
    entry.slots.push({
      id: slot.id,
      start: startLabel,
      end: endLabel,
      durationLabel: durationLabel(durationMinutes),
    });

    summaries.set(day, entry);
  });

  const dailySummaries = Array.from(summaries.entries())
    .map(([day, summary]) => ({
      day,
      totalMinutes: summary.totalMinutes,
      slots: summary.slots.sort((a, b) => a.start.localeCompare(b.start)),
    }))
    .sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  return {
    totalSlots: slots.length,
    totalMinutes,
    dailySummaries,
  };
};

const sanitizeInterests = (value: unknown): string[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const normalized = value
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length > 0);
    return normalized.length > 0 ? normalized : undefined;
  }
  if (typeof value === "string") {
    const normalized = value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
    return normalized.length > 0 ? normalized : undefined;
  }
  return undefined;
};

const sanitizeText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const sanitizeClasses = (value: unknown): string[] | undefined => {
  const list = sanitizeInterests(value);
  return Array.isArray(list) && list.length > 0 ? list : undefined;
};

const sanitizeInstagramHandle = (value: unknown): string | undefined => {
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

type ConnectionStatus = "idle" | "sending" | "sent" | "error";

const FindFriend = () => {
  const { user, session } = useAuth();

  const [matchMode, setMatchMode] = useState<MatchMode>("ONE_ON_ONE");
  const [preferences, setPreferences] = useState<MatchPreferences>({
    window: "NEXT_7_DAYS",
    minOverlapMinutes: 60,
    requireSameCourse: false,
  });
  const [storedSlots, setStoredSlots] = useState<FreeTimeSlot[]>([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchPreview[]>([]);
  const [matchDebug, setMatchDebug] = useState<string[]>([]);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasRequested, setHasRequested] = useState(false);
  const [hobbyQuery, setHobbyQuery] = useState("");
  const [hobbyResults, setHobbyResults] = useState<HobbySearchResult[]>([]);
  const [isHobbySearching, setIsHobbySearching] = useState(false);
  const [hobbyError, setHobbyError] = useState<string | null>(null);
  const [matchHobbyInput, setMatchHobbyInput] = useState("");
  const [matchHobbyFilter, setMatchHobbyFilter] = useState("");
  const [connectionStatuses, setConnectionStatuses] = useState<
    Record<string, ConnectionStatus>
  >({});
  const [connectionErrors, setConnectionErrors] = useState<
    Record<string, string | null>
  >({});
  const [activityPrompt, setActivityPrompt] = useState("");
  const [activitySuggestions, setActivitySuggestions] = useState<
    ActivitySuggestion[]
  >([]);
  const [isGeneratingActivities, setIsGeneratingActivities] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const activityAiEnabled =
    (import.meta.env.VITE_ACTIVITY_AI_ENABLED ?? "true") !== "false";

  const serializedSlots = useMemo(
    () => serializeSlots(storedSlots),
    [storedSlots]
  );

  const schedulePreview = useMemo(
    () => buildSchedulePreview(storedSlots),
    [storedSlots]
  );

  const submitDisabledReason = useMemo(() => {
    if (isLoadingSchedule) {
      return "Loading your availability…";
    }
    if (!storedSlots.length) {
      return "Add availability on your schedule to preview matches.";
    }
    if (scheduleError) {
      return "Fix schedule sync issues before previewing matches.";
    }
    return null;
  }, [isLoadingSchedule, scheduleError, storedSlots.length]);

  const refreshAvailability = useCallback(async () => {
    if (!user?.id) {
      setStoredSlots([]);
      setScheduleError(null);
      return;
    }

    setIsLoadingSchedule(true);
    setScheduleError(null);

    try {
      const remoteSlots = await scheduleApi.fetchSchedule(user.id);
      setStoredSlots(deserializeSlots(remoteSlots));
    } catch (fetchError) {
      console.error("[FindFriend] Failed to load schedule", fetchError);
      const message =
        fetchError instanceof ScheduleApiError
          ? fetchError.message
          : fetchError instanceof Error
          ? fetchError.message
          : "Unable to load your saved availability.";
      setStoredSlots([]);
      setScheduleError(message);
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void refreshAvailability();
  }, [refreshAvailability]);

  useEffect(() => {
    const handleFocus = () => {
      void refreshAvailability();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshAvailability]);

  const seekerProfile = useMemo(() => {
    if (!user) return undefined;
    const metadata =
      (user as unknown as { user_metadata?: Record<string, unknown> })
        ?.user_metadata ?? {};

    const interests =
      sanitizeInterests(metadata.interests) ??
      sanitizeInterests(metadata.hobbies);
    const hobbies = sanitizeInterests(metadata.hobbies);
    const classes = sanitizeClasses(metadata.classes);

    const major = metadata.major;

    return {
      id: user.id,
      name:
        (typeof metadata.name === "string" && metadata.name) ||
        user.email ||
        undefined,
      interests,
      major: typeof major === "string" ? major : undefined,
      hobbies,
      favoriteSpot: sanitizeText(metadata.favoriteSpot),
      classes,
      funFact: sanitizeText((metadata as Record<string, unknown>).funFact),
      vibeCheck: sanitizeText((metadata as Record<string, unknown>).vibeCheck),
      bio: sanitizeText((metadata as Record<string, unknown>).bio),
      instagram: sanitizeInstagramHandle(
        (metadata as Record<string, unknown>).instagram ??
          (metadata as Record<string, unknown>).instagramHandle ??
          (metadata as Record<string, unknown>).socialInstagram
      ),
    };
  }, [user]);

  const handleRequestMatches = useCallback(
    async (overrideHobbyFilter?: string) => {
      setStatus("loading");
      setError(null);
      setHasRequested(true);
      setEmptyReason(null);
      setMatchDebug([]);

      const hobbyFilterToUse =
        (overrideHobbyFilter ?? matchHobbyFilter).trim() || "";

      try {
        const response = await findFriendApi.previewMatches({
          mode: matchMode,
          ...preferences,
          slots: serializedSlots,
          user: seekerProfile,
          hobbyQuery: hobbyFilterToUse || undefined,
        });

        setMatches(response.matches);
        setEmptyReason(response.emptyReason ?? null);
        setMatchDebug(response.debug ?? []);
        setStatus("success");
      } catch (requestError) {
        console.error("[FindFriend] Failed to preview matches", requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Something went wrong. Please try again."
        );
        setStatus("error");
      }
    },
    [matchMode, preferences, seekerProfile, serializedSlots, matchHobbyFilter]
  );

  const handleHobbySearch = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = hobbyQuery.trim();
      if (!trimmed) {
        setHobbyError("Enter a hobby to search for.");
        setHobbyResults([]);
        return;
      }

      setIsHobbySearching(true);
      setHobbyError(null);

      try {
        const results = await findFriendApi.searchHobbies(trimmed);
        setHobbyResults(results);
      } catch (searchError) {
        console.error("[FindFriend] Hobby search failed", searchError);
        setHobbyError(
          searchError instanceof Error
            ? searchError.message
            : "Unable to search hobbies right now."
        );
        setHobbyResults([]);
      } finally {
        setIsHobbySearching(false);
      }
    },
    [hobbyQuery]
  );

  const handleApplyMatchHobbyFilter = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = matchHobbyInput.trim();
      setMatchHobbyFilter(trimmed);
      void handleRequestMatches(trimmed);
    },
    [handleRequestMatches, matchHobbyInput]
  );

  const handleActivityPromptChange = useCallback((next: string) => {
    setActivityPrompt(next);
    setActivityError(null);
  }, []);

  const handleGenerateActivityIdeas = useCallback(async () => {
    const trimmedPrompt = activityPrompt.trim();
    const hobbies = seekerProfile?.hobbies ?? [];

    if (!trimmedPrompt && hobbies.length === 0) {
      setActivityError("Add a quick description or at least one hobby.");
      setActivitySuggestions([]);
      return;
    }

    setIsGeneratingActivities(true);
    setActivityError(null);

    try {
      const suggestions = await findFriendApi.suggestActivities({
        description: trimmedPrompt,
        hobbies,
      });
      setActivitySuggestions(suggestions);
      if (suggestions.length === 0) {
        setActivityError("No suggestions yet—try adding a bit more detail.");
      }
    } catch (error) {
      const message =
        error instanceof MatchmakingApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Unable to generate suggestions right now.";
      setActivityError(message);
      setActivitySuggestions([]);
    } finally {
      setIsGeneratingActivities(false);
    }
  }, [activityPrompt, seekerProfile]);

  const handleApplyActivitySuggestion = useCallback(
    (suggestion: ActivitySuggestion) => {
      if (!suggestion) return;
      const fallback = suggestion.title?.trim() ?? "";
      const tagValue =
        suggestion.tags?.find((tag) => tag.trim().length > 0)?.trim() ||
        fallback;
      if (!tagValue) return;

      setMatchHobbyInput(tagValue);
      setMatchHobbyFilter(tagValue);
      void handleRequestMatches(tagValue);
    },
    [handleRequestMatches]
  );

  useEffect(() => {
    setMatches([]);
    setHasRequested(false);
    setError(null);
    setStatus("idle");
    setMatchDebug([]);
    setEmptyReason(null);
    setMatchHobbyFilter("");
    setMatchHobbyInput("");
    setConnectionStatuses({});
    setConnectionErrors({});
  }, [matchMode]);

  const accessToken = session?.access_token ?? null;

  const handleSendConnection = useCallback(
    async (participantId: string) => {
      if (!participantId) return;
      if (!accessToken) {
        setConnectionStatuses((prev) => ({
          ...prev,
          [participantId]: "error",
        }));
        setConnectionErrors((prev) => ({
          ...prev,
          [participantId]: "Sign in to send connection requests.",
        }));
        return;
      }

      setConnectionStatuses((prev) => ({
        ...prev,
        [participantId]: "sending",
      }));
      setConnectionErrors((prev) => ({
        ...prev,
        [participantId]: null,
      }));

      try {
        await connectionsApi.sendConnectionRequest(accessToken, participantId);
        setConnectionStatuses((prev) => ({
          ...prev,
          [participantId]: "sent",
        }));
      } catch (error) {
        const message =
          error instanceof ConnectionsApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Unable to send connection request.";
        setConnectionStatuses((prev) => ({
          ...prev,
          [participantId]: "error",
        }));
        setConnectionErrors((prev) => ({
          ...prev,
          [participantId]: message,
        }));
      }
    },
    [accessToken]
  );

  useEffect(() => {
    setConnectionStatuses({});
    setConnectionErrors({});
  }, [user?.id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const totalAvailabilityBlocks = storedSlots.length;
  const totalHobbies = seekerProfile?.hobbies?.length ?? 0;
  const totalClasses = seekerProfile?.classes?.length ?? 0;
  const totalAvailabilityMinutes = schedulePreview?.totalMinutes ?? 0;
  const availabilityLabel = totalAvailabilityMinutes
    ? durationLabel(totalAvailabilityMinutes)
    : "0 min";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute right-[-15%] top-10 h-96 w-96 rounded-full bg-indigo-500/25 blur-[160px]" />
        <div className="absolute bottom-[-18%] left-[25%] h-[26rem] w-[26rem] rounded-full bg-cyan-400/20 blur-[180px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">
                <UsersRound className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300">
                  Match Studio
                </p>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  Discover your next focus pod
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/schedule"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-sky-500/60 hover:bg-slate-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/40"
              >
                <CalendarDays className="h-4 w-4" />
                Update availability
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/40 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-400/60 hover:bg-slate-900/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400/40"
              >
                <Sparkles className="h-4 w-4" />
                Refresh profile
              </Link>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Align your availability and preferences to preview who fits your
            study rhythm. Tune the filters on the left, then review suggested
            partners on the right before you lock in a collaboration.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-200 sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
              <CalendarDays className="h-4 w-4 text-sky-200" />
              {totalAvailabilityBlocks} block
              {totalAvailabilityBlocks === 1 ? "" : "s"} saved ·{" "}
              {availabilityLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
              <Sparkles className="h-4 w-4 text-amber-200" />
              {totalHobbies} hobby tag{totalHobbies === 1 ? "" : "s"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
              <Filter className="h-4 w-4 text-emerald-200" />
              {totalClasses} class match flag{totalClasses === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[360px,minmax(0,1fr)] xl:grid-cols-[380px,minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/30 backdrop-blur">
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-sky-500/15 p-2 text-sky-200">
                  <CalendarDays className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-200">
                    Availability overview
                  </h2>
                  <p className="text-sm text-slate-300">
                    Keep these blocks fresh so we can surface overlap that
                    actually works for you.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <SchedulePreviewCard
                  data={schedulePreview}
                  onRefresh={() => void refreshAvailability()}
                />
              </div>
            </div>

            <MatchModeSelector
              value={matchMode}
              onChange={setMatchMode}
              disabled={status === "loading"}
            />

            {isLoadingSchedule && (
              <div className="rounded-3xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                Syncing your latest availability…
              </div>
            )}

            {scheduleError && (
              <div className="rounded-3xl border border-rose-400/40 bg-rose-500/15 px-4 py-3 text-sm text-rose-100">
                {scheduleError}{" "}
                <button
                  type="button"
                  onClick={() => void refreshAvailability()}
                  className="font-semibold underline decoration-rose-200 transition hover:decoration-rose-100"
                >
                  Try again
                </button>
              </div>
            )}

            <MatchRequestForm
              mode={matchMode}
              preferences={preferences}
              onChange={setPreferences}
              onSubmit={() => {
                void handleRequestMatches();
              }}
              isSubmitting={status === "loading"}
              disabled={isLoadingSchedule}
              submitDisabled={
                isLoadingSchedule ||
                !storedSlots.length ||
                Boolean(scheduleError)
              }
              submitDisabledReason={submitDisabledReason}
            />

            {activityAiEnabled && (
              <ActivityIdeaGenerator
                description={activityPrompt}
                onDescriptionChange={handleActivityPromptChange}
                onGenerate={() => void handleGenerateActivityIdeas()}
                isGenerating={isGeneratingActivities}
                suggestions={activitySuggestions}
                error={activityError}
                disabled={status === "loading"}
                userHobbies={seekerProfile?.hobbies ?? []}
                onApplySuggestion={handleApplyActivitySuggestion}
              />
            )}

            <form
              onSubmit={handleApplyMatchHobbyFilter}
              className="flex flex-col gap-3 rounded-[24px] border border-slate-700 bg-slate-900/70 p-4 backdrop-blur md:flex-row md:items-center"
            >
              <div className="flex-1">
                <label
                  htmlFor="match-hobby-filter"
                  className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200"
                >
                  <Filter className="h-4 w-4" />
                  Filter preview by hobby
                </label>
                <input
                  id="match-hobby-filter"
                  type="text"
                  value={matchHobbyInput}
                  onChange={(event) => setMatchHobbyInput(event.target.value)}
                  placeholder="Example: espresso, gaming, robotics"
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring focus:ring-sky-500/30"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                  disabled={status === "loading"}
                >
                  Apply
                </button>
                {matchHobbyFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setMatchHobbyFilter("");
                      setMatchHobbyInput("");
                      void handleRequestMatches("");
                    }}
                    className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400/40"
                    disabled={status === "loading"}
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            <section className="flex flex-col gap-4 rounded-[32px] border border-amber-400/30 bg-amber-500/15 p-6 backdrop-blur">
              <header className="flex items-center gap-3">
                <span className="rounded-full bg-slate-900/70 p-2 text-white">
                  <Search className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Search matches by hobby
                  </h2>
                  <p className="text-sm text-amber-100/80">
                    Already have previews? Find who lists the interest you need.
                  </p>
                </div>
              </header>

              <form
                onSubmit={handleHobbySearch}
                className="flex flex-col gap-3 md:flex-row"
              >
                <input
                  type="text"
                  value={hobbyQuery}
                  onChange={(event) => setHobbyQuery(event.target.value)}
                  placeholder="Search for hobbies, e.g. gaming"
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-slate-950/40 focus:border-amber-400 focus:outline-none focus:ring focus:ring-amber-500/30"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  disabled={isHobbySearching}
                >
                  {isHobbySearching ? "Searching…" : "Search"}
                </button>
              </form>

              {hobbyError && (
                <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm text-slate-100">
                  {hobbyError}
                </div>
              )}

              {isHobbySearching ? (
                <p className="text-sm text-white/90">Looking up matches…</p>
              ) : hobbyResults.length > 0 ? (
                <ul className="grid gap-3 text-sm text-white/90">
                  {hobbyResults.map((candidate) => (
                    <li
                      key={candidate.id}
                      className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 backdrop-blur"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-white">
                          {candidate.name ?? "Match candidate"}
                        </span>
                        {candidate.instagram && (
                          <a
                            href={`https://instagram.com/${candidate.instagram}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-fit text-xs font-semibold uppercase tracking-[0.3em] text-amber-200 underline-offset-4 hover:underline"
                          >
                            @{candidate.instagram}
                          </a>
                        )}
                        {candidate.hobbies.length > 0 && (
                          <span className="text-xs uppercase tracking-[0.3em] text-amber-100">
                            {candidate.hobbies.join(", ")}
                          </span>
                        )}
                        {candidate.interests.length > 0 && (
                          <span className="text-xs uppercase tracking-[0.3em] text-sky-200">
                            Interests: {candidate.interests.join(", ")}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-white/80">
                  {hobbyQuery.trim()
                    ? "No matches mention that hobby yet."
                    : "Enter a hobby to see who lists it."}
                </p>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <TopMatchRecommendations
              matches={matches}
              isLoading={status === "loading"}
              hasRequested={hasRequested}
            />
            <MatchPreviewList
              mode={matchMode}
              isLoading={status === "loading"}
              matches={matches}
              error={error}
              hasRequested={hasRequested}
              emptyReason={emptyReason}
              debugLog={matchDebug}
              hobbyFilter={matchHobbyFilter}
              connectionStatuses={connectionStatuses}
              connectionErrors={connectionErrors}
              onRequestConnection={handleSendConnection}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindFriend;
