import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { deserializeSlots, serializeSlots } from "../features/schedule/utils";
import {
  findFriendApi,
  type MatchPreview,
} from "../services/findFriendApi";
import { scheduleApi } from "../services/scheduleApi";
import type { FreeTimeSlot } from "../types/schedule";
import MatchRankingDebug from "./matchmaking/MatchRankingDebug";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const HOUR_START = 8;
const HOUR_END = 20;
const MATCHMAKING_DEBUG_ENABLED =
  import.meta.env.VITE_MATCHMAKING_DEBUG === "true";

const toDateInputValue = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const sanitizeList = (value: unknown): string[] | undefined => {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  const normalized = values
    .map((item) => `${item}`.trim())
    .filter(Boolean);
  return normalized.length ? normalized : undefined;
};

const sanitizeText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const weekdayIndex = (date: Date) => (date.getDay() + 6) % 7;

const slotStyle = (slot: FreeTimeSlot): CSSProperties => {
  const startHour = slot.start.getHours() + slot.start.getMinutes() / 60;
  const endHour = slot.end.getHours() + slot.end.getMinutes() / 60;
  const clampedStart = Math.max(HOUR_START, Math.min(HOUR_END, startHour));
  const clampedEnd = Math.max(clampedStart + 0.35, Math.min(HOUR_END, endHour));

  return {
    top: `${((clampedStart - HOUR_START) / (HOUR_END - HOUR_START)) * 100}%`,
    height: `${Math.max(
      4,
      ((clampedEnd - clampedStart) / (HOUR_END - HOUR_START)) * 100,
    )}%`,
  };
};

const formatHours = (slots: FreeTimeSlot[]) => {
  const totalMinutes = slots.reduce(
    (total, slot) =>
      total + Math.max(0, (slot.end.getTime() - slot.start.getTime()) / 60_000),
    0,
  );
  const hours = Math.round(totalMinutes / 60);
  return `${hours} open ${hours === 1 ? "hour" : "hours"}`;
};

const formatMinutes = (minutes: number) => {
  const rounded = Math.max(0, Math.round(minutes));
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  if (!hours) return `${remainder} min`;
  if (!remainder) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
};

const SignedInDashboard = () => {
  const { user } = useAuth();
  const pageRef = useRef<HTMLElement>(null);
  const [minOverlapMinutes, setMinOverlapMinutes] = useState(60);
  const [startDate, setStartDate] = useState(() => toDateInputValue(new Date()));
  const [endDate, setEndDate] = useState(() =>
    toDateInputValue(addDays(new Date(), 7)),
  );
  const [slots, setSlots] = useState<FreeTimeSlot[]>([]);
  const [matches, setMatches] = useState<MatchPreview[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [isMatching, setIsMatching] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [emptyReason, setEmptyReason] = useState<string | null>(null);

  const slotsByDay = useMemo(
    () =>
      DAY_LABELS.map((_, index) =>
        slots
          .filter((slot) => weekdayIndex(slot.start) === index)
          .sort((a, b) => a.start.getTime() - b.start.getTime())
          .slice(0, 3),
      ),
    [slots],
  );

  const profile = useMemo(() => {
    if (!user) return undefined;
    const metadata =
      (user as unknown as { user_metadata?: Record<string, unknown> })
        .user_metadata ?? {};

    return {
      id: user.id,
      name: sanitizeText(metadata.name) ?? user.email ?? undefined,
      interests: sanitizeList(metadata.interests) ?? sanitizeList(metadata.hobbies),
      hobbies: sanitizeList(metadata.hobbies),
      classes: sanitizeList(metadata.classes),
      major: sanitizeText(metadata.major),
      favoriteSpot: sanitizeText(metadata.favoriteSpot),
      funFact: sanitizeText(metadata.funFact),
      vibeCheck: sanitizeText(metadata.vibeCheck),
      bio: sanitizeText(metadata.bio),
      instagram: sanitizeText(metadata.instagram),
    };
  }, [user]);

  const loadSchedule = useCallback(async () => {
    if (!user?.id) {
      setSlots([]);
      setIsLoadingSchedule(false);
      return;
    }

    setIsLoadingSchedule(true);
    setScheduleError(null);
    try {
      const storedSlots = await scheduleApi.fetchSchedule(user.id);
      setSlots(deserializeSlots(storedSlots));
    } catch (error) {
      setSlots([]);
      setScheduleError(
        error instanceof Error ? error.message : "Unable to load your availability.",
      );
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduceMotion) return;

      gsap.from(".match-dashboard__reveal", {
        y: 24,
        opacity: 0,
        duration: 0.9,
        stagger: 0.1,
        ease: "power3.out",
      });

      gsap.fromTo(
        ".match-dashboard__backdrop",
        { scale: 1.02 },
        {
          scale: 1.08,
          ease: "none",
          scrollTrigger: {
            trigger: pageRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: pageRef },
  );

  useGSAP(
    () => {
      if (!matches.length) return;
      gsap.from(".match-result", {
        y: 48,
        opacity: 0,
        scale: 0.97,
        duration: 0.75,
        stagger: 0.12,
        ease: "power3.out",
      });
    },
    { scope: pageRef, dependencies: [matches] },
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!slots.length) return;

    setIsMatching(true);
    setMatchError(null);
    setEmptyReason(null);

    const rangeDays = Math.max(
      1,
      Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
          86_400_000,
      ),
    );

    try {
      const result = await findFriendApi.previewMatches({
        mode: "ONE_ON_ONE",
        window: rangeDays > 7 ? "NEXT_14_DAYS" : "NEXT_7_DAYS",
        minOverlapMinutes,
        requireSameCourse: false,
        slots: serializeSlots(slots),
        user: profile,
      });
      const eligibleMatches = result.matches.filter(
        (match) => match.overlapMinutes >= minOverlapMinutes,
      );
      setMatches(eligibleMatches);
      setSelectedProfileIds(new Set());
      setEmptyReason(
        eligibleMatches.length
          ? null
          : result.emptyReason ??
              `No matches have at least ${minOverlapMinutes} minutes of overlap yet.`,
      );
      requestAnimationFrame(() => {
        document
          .querySelector("#match-results")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (error) {
      setMatches([]);
      setMatchError(
        error instanceof Error ? error.message : "Unable to find matches right now.",
      );
    } finally {
      setIsMatching(false);
    }
  };

  const toggleProfileSelection = (profileId: string) => {
    setSelectedProfileIds((current) => {
      const next = new Set(current);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  };

  return (
    <main ref={pageRef} className="match-dashboard">
      <img
        className="match-dashboard__backdrop"
        src="/assets/interlink-dashboard-paper-topography.png"
        alt=""
        aria-hidden="true"
      />
      <div className="match-dashboard__wash" aria-hidden="true" />

      <div className="match-dashboard__frame">
        <h1 className="match-dashboard__title match-dashboard__reveal landing-display">
          Find time together.
        </h1>

        <section
          className="availability-overview match-dashboard__reveal"
          aria-labelledby="availability-title"
        >
          <header className="availability-overview__header">
            <h2 id="availability-title" className="landing-display">
              Your availability
            </h2>
            <span>{isLoadingSchedule ? "Loading" : formatHours(slots)}</span>
            <Link to="/schedule">Edit schedule</Link>
          </header>

          <div className="availability-overview__calendar">
            <div className="availability-overview__corner" aria-hidden="true" />
            <div className="availability-overview__days" aria-hidden="true">
              {DAY_LABELS.map((day, dayIndex) => (
                <span key={`${day}-heading-${dayIndex}`}>{day}</span>
              ))}
            </div>
            <div className="availability-overview__times" aria-hidden="true">
              <span>8 AM</span>
              <span>12 PM</span>
              <span>4 PM</span>
              <span>8 PM</span>
            </div>
            <div className="availability-overview__chart">
              {DAY_LABELS.map((day, dayIndex) => (
                <div className="availability-day" key={`${day}-${dayIndex}`}>
                  {slotsByDay[dayIndex]?.map((slot, slotIndex) => (
                    <span
                      className={`availability-day__slot availability-day__slot--${
                        (dayIndex + slotIndex) % 2 === 0 ? "amber" : "blue"
                      }`}
                      style={slotStyle(slot)}
                      title={`${slot.title}: ${slot.start.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })} - ${slot.end.toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                      })}`}
                      key={slot.id}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {!isLoadingSchedule && !slots.length && (
            <div className="availability-overview__empty">
              <span>{scheduleError ?? "Add a few free windows to start matching."}</span>
              <Link to="/schedule">Add availability</Link>
            </div>
          )}
        </section>

        <form
          id="matching-form"
          className="match-dashboard__form match-dashboard__reveal"
          onSubmit={handleSubmit}
        >
          <label className="match-field">
            <span>Minimum consecutive overlap</span>
            <span className="match-field__control">
              <Clock3 aria-hidden="true" />
              <select
                value={minOverlapMinutes}
                onChange={(event) =>
                  setMinOverlapMinutes(Number(event.target.value))
                }
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>2 hours</option>
              </select>
              <ChevronDown aria-hidden="true" />
            </span>
          </label>

          <fieldset className="match-field match-field--dates">
            <legend>Dates</legend>
            <div className="match-field__control match-date-range">
              <CalendarDays aria-hidden="true" />
              <label>
                <span className="sr-only">Start date</span>
                <input
                  type="date"
                  required
                  value={startDate}
                  max={endDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <ArrowRight aria-hidden="true" />
              <label>
                <span className="sr-only">End date</span>
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <div className="match-dashboard__action">
            <button
              className="app-primary-action"
              type="submit"
              disabled={!slots.length || isLoadingSchedule || isMatching}
            >
              {isMatching ? (
                <>
                  <LoaderCircle className="match-dashboard__spinner" aria-hidden="true" />
                  Finding your time
                </>
              ) : (
                <>
                  Find our time
                  <ArrowRight aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </form>

        {(matchError || emptyReason) && (
          <p className="match-dashboard__message" role="status">
            {matchError ?? emptyReason}
          </p>
        )}

        {matches.length > 0 && (
          <section id="match-results" className="match-results" aria-live="polite">
            <header>
              <div>
                <h2 className="landing-display">People worth meeting</h2>
                <p>Browse individual profiles and select the people you want in your group.</p>
              </div>
              <div className="match-results__selection" aria-live="polite">
                <strong>{selectedProfileIds.size}</strong>
                <span>{selectedProfileIds.size === 1 ? "person" : "people"} selected</span>
                {selectedProfileIds.size > 0 && (
                  <button type="button" onClick={() => setSelectedProfileIds(new Set())}>
                    Clear
                  </button>
                )}
              </div>
            </header>
            <div className="match-results__stack">
              {matches.map((match) => {
                const participant = match.participants?.[0];
                const name = participant?.name || "A new connection";
                const profileId = participant?.id || match.id;
                const isSelected = selectedProfileIds.has(profileId);
                const initials = name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase();
                const reasons = match.matchReasons?.length
                  ? match.matchReasons
                  : [{ type: "schedule" as const, label: `${formatMinutes(match.overlapMinutes)} of shared availability` }];
                return (
                  <article
                    className={`match-result${isSelected ? " is-selected" : ""}`}
                    key={match.id}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onClick={() => toggleProfileSelection(profileId)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleProfileSelection(profileId);
                      }
                    }}
                  >
                    <div className="match-result__score">
                      <strong>{match.compatibilityScore}%</strong>
                      <span>fit</span>
                    </div>
                    <div className="match-result__body">
                      <header className="match-result__profile-header">
                        <span className="match-result__avatar" aria-hidden="true">{initials}</span>
                        <div>
                          <h3 className="landing-display">{name}</h3>
                          <p>
                            {[participant?.major, participant?.graduationYear ? `Class of ${participant.graduationYear}` : null]
                              .filter(Boolean)
                              .join(" · ") || "Interlink member"}
                          </p>
                        </div>
                        <span className="match-result__select-state">
                          <Check aria-hidden="true" />
                          {isSelected ? "Selected" : "Add to group"}
                        </span>
                      </header>

                      <p className="match-result__bio">{participant?.bio || match.summary}</p>

                      <dl className="match-result__profile-details">
                        {participant?.interests?.length ? (
                          <div><dt>Interests</dt><dd>{participant.interests.join(", ")}</dd></div>
                        ) : null}
                        {participant?.hobbies?.length ? (
                          <div><dt>Outside class</dt><dd>{participant.hobbies.join(", ")}</dd></div>
                        ) : null}
                        {participant?.classes?.length ? (
                          <div><dt>Classes</dt><dd>{participant.classes.join(", ")}</dd></div>
                        ) : null}
                        {participant?.favoriteSpot ? (
                          <div><dt>Campus spot</dt><dd>{participant.favoriteSpot}</dd></div>
                        ) : null}
                      </dl>

                      {participant?.funFact ? (
                        <p className="match-result__fun-fact"><span>Something memorable</span>{participant.funFact}</p>
                      ) : null}

                      <section className="match-result__why" aria-label={`Why you matched with ${name}`}>
                        <h4>Why you matched</h4>
                        <ul>
                          {reasons.slice(0, 4).map((reason) => (
                            <li key={`${reason.type}-${reason.label}`}>
                              <Check aria-hidden="true" />
                              <span>{reason.label}</span>
                            </li>
                          ))}
                        </ul>
                      </section>

                      {MATCHMAKING_DEBUG_ENABLED && (
                        match.rankingDebug ? (
                          <MatchRankingDebug debug={match.rankingDebug} />
                        ) : (
                          <aside className="match-ranking-debug match-ranking-debug--unavailable">
                            Ranking diagnostics were not included in this response.
                          </aside>
                        )
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default SignedInDashboard;
