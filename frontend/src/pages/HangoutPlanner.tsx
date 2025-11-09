import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  connectionsApi,
  ConnectionsApiError,
} from "../services/connectionsApi";
import {
  findFriendApi,
  MatchmakingApiError,
  type HangoutPlan,
} from "../services/findFriendApi";
import type { FriendEdge } from "../types/user";
import {
  Sparkles,
  Users,
  Timer,
  AlignLeft,
  MessageCircle,
  Link2,
  ClipboardCheck,
  PartyPopper,
} from "lucide-react";

const sanitizeTextList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => `${entry}`.trim())
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return [];
};

const sanitizeText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

type PlannerProfileSummary = {
  id: string;
  name?: string;
  major?: string;
  hobbies?: string[];
  interests?: string[];
};

const buildSeekerProfile = (
  user: ReturnType<typeof useAuth>["user"]
): PlannerProfileSummary => {
  if (!user) {
    return {
      id: "",
      name: "You",
      hobbies: [],
      interests: [],
    };
  }

  const metadata =
    (user as unknown as { user_metadata?: Record<string, unknown> })
      ?.user_metadata ?? {};

  const name =
    (typeof metadata.name === "string" && metadata.name) ||
    user.email ||
    undefined;
  const major = sanitizeText(metadata.major);
  const hobbies = sanitizeTextList(metadata.hobbies);
  const interests =
    sanitizeTextList(metadata.interests) || sanitizeTextList(metadata.hobbies);

  return {
    id: user.id,
    name,
    major,
    hobbies,
    interests,
  };
};

const summarizeProfile = (profile: FriendEdge["profile"]) => {
  if (!profile) return "Friend";
  return profile.name || profile.major || profile.email || "Friend";
};

const HangoutPlanner = () => {
  const { user, session, logout } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [friends, setFriends] = useState<FriendEdge[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(true);
  const [friendError, setFriendError] = useState<string | null>(null);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [focus, setFocus] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isPlanning, setIsPlanning] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [plan, setPlan] = useState<HangoutPlan | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const friendsLoadedRef = useRef(false);

  const loadFriends = useCallback(async () => {
    if (!accessToken) {
      setFriends([]);
      setFriendError(null);
      setIsLoadingFriends(false);
      friendsLoadedRef.current = false;
      return;
    }

    if (friendsLoadedRef.current) {
      return;
    }

    const currentToken = accessToken;
    friendsLoadedRef.current = true;
    setIsLoadingFriends(true);
    setFriendError(null);

    try {
      const graph = await connectionsApi.getFriendGraph(currentToken);
      if (accessToken !== currentToken) {
        return;
      }
      setFriends(graph.friends);
    } catch (error) {
      friendsLoadedRef.current = false;
      if (
        error instanceof ConnectionsApiError &&
        (error.status === 401 || error.status === 403)
      ) {
        setFriendError("Session expired. Please sign in again.");
        logout();
        return;
      }
      const message =
        error instanceof ConnectionsApiError
          ? error.message
          : error instanceof Error
          ? error.message
          : "Unable to load your friends right now.";
      setFriendError(message);
    } finally {
      if (accessToken === currentToken) {
        setIsLoadingFriends(false);
      }
    }
  }, [accessToken, logout]);

  useEffect(() => {
    friendsLoadedRef.current = false;
  }, [accessToken]);

  useEffect(() => {
    void loadFriends();
  }, [loadFriends]);

  const seekerProfile = useMemo(() => buildSeekerProfile(user), [user]);

  const selectedFriends = useMemo(
    () =>
      friends.filter((friend) =>
        selectedFriendIds.includes(friend.profile?.id ?? friend.id)
      ),
    [friends, selectedFriendIds]
  );

  const toggleFriendId = useCallback((friendId: string) => {
    setSelectedFriendIds((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    const ids = friends
      .map((friend) => friend.profile?.id ?? friend.id)
      .filter(Boolean);
    setSelectedFriendIds(ids);
  }, [friends]);

  const handleClearSelection = useCallback(() => {
    setSelectedFriendIds([]);
  }, []);

  const handleRefreshFriends = useCallback(() => {
    friendsLoadedRef.current = false;
    void loadFriends();
  }, [loadFriends]);

  const handleGenerate = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      if (!user || !accessToken) {
        setPlanError("Sign in to generate a hangout plan.");
        return;
      }
      if (selectedFriends.length === 0) {
        setPlanError("Select at least one friend to craft a plan.");
        return;
      }

      setIsPlanning(true);
      setPlanError(null);

      try {
        const response = await findFriendApi.planHangout(
          {
            seeker: seekerProfile,
            friends: selectedFriends.map((friend) => ({
              id: friend.profile?.id ?? friend.id,
              name: friend.profile?.name ?? undefined,
              major: friend.profile?.major ?? undefined,
              hobbies: friend.profile?.hobbies ?? undefined,
              interests: friend.profile?.interests ?? undefined,
            })),
            focus: focus.trim() || undefined,
            durationMinutes,
          },
          accessToken ?? undefined
        );
        setPlan(response.plan);
        setGeneratedAt(response.generatedAt);
      } catch (error) {
        if (
          error instanceof MatchmakingApiError &&
          (error.status === 401 || error.status === 403)
        ) {
          setPlanError("Session expired. Please sign in again.");
          logout();
          return;
        }
        const message =
          error instanceof MatchmakingApiError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Unable to generate a hangout plan right now.";
        setPlanError(message);
        setPlan(null);
        setGeneratedAt(null);
      } finally {
        setIsPlanning(false);
      }
    },
    [
      accessToken,
      durationMinutes,
      focus,
      logout,
      seekerProfile,
      selectedFriends,
      user,
    ]
  );

  useEffect(() => {
    setPlan(null);
    setPlanError(null);
    setGeneratedAt(null);
  }, [selectedFriendIds, focus, durationMinutes]);

  if (!session?.access_token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-sky-500/15 blur-[200px]" />
        <div className="absolute right-[-20%] top-[30%] h-80 w-80 rounded-full bg-indigo-500/15 blur-[200px]" />
        <div className="absolute bottom-[-15%] left-[25%] h-[22rem] w-[22rem] rounded-full bg-cyan-400/15 blur-[180px]" />
      </div>

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 text-left">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-200">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
                  Hangout Studio
                </p>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  Shape your next meetup plan
                </h1>
              </div>
            </div>
          </div>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Select friends, note the vibe you&apos;re going for, and let our
            Gemini-powered concierge suggest an agenda, conversation prompts,
            and follow-up ideas tailored to your crew.
          </p>
        </header>

        <div className="grid items-start gap-8 lg:grid-cols-[380px,minmax(0,1fr)]">
          <section className="space-y-6 rounded-[32px] border border-slate-800/70 bg-slate-900/70 p-6 shadow-[0_32px_80px_-48px_rgba(56,189,248,0.35)] backdrop-blur">
            <header className="flex items-start gap-3">
              <span className="rounded-full bg-slate-900/80 p-2 text-sky-200">
                <Users className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-200">
                  Pick your crew
                </h2>
                <p className="text-xs text-slate-300">
                  Choose friends who will join. We&apos;ll pull their hobbies
                  and interests into the plan.
                </p>
              </div>
            </header>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-100 transition hover:border-sky-400/60 hover:text-white"
                disabled={friends.length === 0}
              >
                Select all
              </button>
              <button
                type="button"
                onClick={handleClearSelection}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300 transition hover:border-rose-400/60 hover:text-rose-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleRefreshFriends}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300 transition hover:border-sky-400/60 hover:text-white disabled:opacity-60"
                disabled={isLoadingFriends}
              >
                Refresh
              </button>
              <span className="ml-auto text-xs uppercase tracking-[0.35em] text-slate-400">
                {selectedFriendIds.length} selected
              </span>
            </div>

            {isLoadingFriends ? (
              <div className="grid gap-3">
                {[0, 1, 2].map((index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-16 animate-pulse rounded-2xl bg-slate-800/60"
                  />
                ))}
              </div>
            ) : friendError ? (
              <div className="rounded-2xl border border-rose-500/40 bg-rose-900/30 px-4 py-3 text-xs text-rose-200">
                {friendError}
              </div>
            ) : friends.length === 0 ? (
              <div className="rounded-2xl border border-slate-800/70 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
                You haven&apos;t added any friends yet. Send a few connection
                requests from your matches to get started.
              </div>
            ) : (
              <ul className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-1">
                {friends.map((friend) => {
                  const profile = friend.profile || { id: friend.id };
                  const friendId = profile.id ?? friend.id;
                  const isSelected = selectedFriendIds.includes(friendId);
                  const hobbies = profile.hobbies ?? [];
                  const interests = profile.interests ?? [];

                  return (
                    <li key={friendId}>
                      <button
                        type="button"
                        onClick={() => toggleFriendId(friendId)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          isSelected
                            ? "border-sky-400/70 bg-sky-500/10 text-sky-100 shadow-lg shadow-sky-900/40"
                            : "border-slate-800/70 bg-slate-900/70 text-slate-200 hover:border-sky-400/40 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">
                              {summarizeProfile(profile)}
                            </p>
                            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">
                              {profile.major || profile.vibeCheck || "Friend"}
                            </p>
                          </div>
                          <span
                            className={`h-3 w-3 rounded-full ${
                              isSelected
                                ? "bg-sky-400 shadow shadow-sky-400/70"
                                : "bg-slate-700"
                            }`}
                          />
                        </div>
                        {(hobbies.length > 0 || interests.length > 0) && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[...hobbies.slice(0, 3), ...interests.slice(0, 2)].map(
                              (tag) => (
                                <span
                                  key={`${friendId}-${tag}`}
                                  className="inline-flex items-center rounded-full bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-200"
                                >
                                  {tag}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="space-y-6">
            <form
              onSubmit={handleGenerate}
              className="space-y-6 rounded-[32px] border border-slate-800/70 bg-slate-900/60 p-6 shadow-[0_32px_80px_-48px_rgba(14,165,233,0.4)] backdrop-blur"
            >
              <header className="flex items-start gap-3">
                <span className="rounded-full bg-slate-900/70 p-2 text-sky-200">
                  <AlignLeft className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-200">
                    Customize the vibe
                  </h2>
                  <p className="text-xs text-slate-300">
                    Optional details help the plan feel made-for-you.
                  </p>
                </div>
              </header>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                  What do you want to focus on?
                </span>
                <textarea
                  value={focus}
                  onChange={(event) => setFocus(event.target.value)}
                  placeholder="Example: Prep for our design studio critique, share playlists, celebrate job wins"
                  className="min-h-[88px] rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring focus:ring-sky-500/30"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                  How much time do you have together?
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={30}
                    max={180}
                    step={15}
                    value={durationMinutes}
                    onChange={(event) =>
                      setDurationMinutes(Number(event.target.value))
                    }
                    className="w-full accent-sky-500"
                  />
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200">
                    <Timer className="h-3.5 w-3.5" />
                    {durationMinutes} min
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={isPlanning || selectedFriends.length === 0}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                  isPlanning || selectedFriends.length === 0
                    ? "bg-slate-700/60 text-slate-400"
                    : "bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
                }`}
              >
                {isPlanning ? "Crafting plan…" : "Generate hangout plan"}
              </button>

              {planError && (
                <div className="rounded-2xl border border-rose-400/40 bg-rose-900/30 px-4 py-3 text-xs text-rose-200">
                  {planError}
                </div>
              )}
              {!planError && plan && generatedAt && (
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                  Generated {new Date(generatedAt).toLocaleString()}
                </p>
              )}
            </form>

            <div className="space-y-4 rounded-[32px] border border-slate-800/70 bg-slate-900/70 p-6 backdrop-blur">
              <header className="flex items-start gap-3">
                <span className="rounded-full bg-slate-900/70 p-2 text-sky-200">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-sky-200">
                    Plan preview
                  </h2>
                  <p className="text-xs text-slate-300">
                    We&apos;ll show the full agenda, conversation starters, and
                    follow-up ideas here once generated.
                  </p>
                </div>
              </header>

              {!plan ? (
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-6 text-center text-sm text-slate-400">
                  Pick at least one friend and tap <strong>Generate hangout plan</strong> to
                  see suggestions tailored to your crew.
                </div>
              ) : (
                <article className="flex flex-col gap-5">
                  <div className="rounded-2xl border border-sky-500/40 bg-sky-500/10 px-4 py-3">
                    <h3 className="text-lg font-semibold text-white">
                      {plan.title}
                    </h3>
                    <p className="text-sm text-slate-200">{plan.summary}</p>
                  </div>

                  <section className="space-y-3">
                    <header className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                      <ClipboardCheck className="h-4 w-4" />
                      Agenda
                    </header>
                    <ul className="space-y-3">
                      {plan.agenda.map((item, index) => (
                        <li
                          key={`${item.label}-${index}`}
                          className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-white">
                              {item.label}
                            </h4>
                            {item.durationMinutes && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300">
                                <Timer className="h-3 w-3" />
                                {item.durationMinutes} min
                              </span>
                            )}
                          </div>
                          {item.detail && (
                            <p className="mt-1 text-sm text-slate-300">
                              {item.detail}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <header className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                      <MessageCircle className="h-4 w-4" />
                      Conversation starters
                    </header>
                    <ul className="space-y-2">
                      {plan.conversationStarters.map((starter, index) => (
                        <li
                          key={`starter-${index}`}
                          className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
                        >
                          {starter}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <header className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                      <Link2 className="h-4 w-4" />
                      Shared connections
                    </header>
                    <ul className="space-y-2">
                      {plan.sharedConnections.map((connection, index) => (
                        <li
                          key={`connection-${index}`}
                          className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
                        >
                          {connection}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <header className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                      <ClipboardCheck className="h-4 w-4" />
                      Prep reminders
                    </header>
                    <ul className="space-y-2">
                      {plan.prepReminders.map((reminder, index) => (
                        <li
                          key={`reminder-${index}`}
                          className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
                        >
                          {reminder}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-3">
                    <header className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                      <PartyPopper className="h-4 w-4" />
                      Follow-up ideas
                    </header>
                    <ul className="space-y-2">
                      {plan.followUpIdeas.map((idea, index) => (
                        <li
                          key={`followup-${index}`}
                          className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-200"
                        >
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section className="space-y-2 rounded-2xl border border-slate-800/70 bg-slate-900/70 px-4 py-3">
                    <header className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
                      People in this plan
                    </header>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-200">
                      {plan.participants.map((participant, index) => (
                        <span
                          key={`participant-${index}`}
                          className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 uppercase tracking-[0.3em]"
                        >
                          {participant}
                        </span>
                      ))}
                    </div>
                  </section>
                </article>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HangoutPlanner;


