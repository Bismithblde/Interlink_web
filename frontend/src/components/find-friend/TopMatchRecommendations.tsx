import { useMemo } from "react";
import { ArrowUpRight, Clock, Flame } from "lucide-react";
import type { MatchPreview } from "../../services/findFriendApi";
import { formatInstagramHandle } from "./utils";

const rankLabel = (index: number) => {
  if (index === 0) return "Top pick";
  if (index === 1) return "Great fit";
  return "Worth a look";
};

const buildWhyThisMatch = (match: MatchPreview) => {
  if (match.semanticHighlight) {
    return match.semanticHighlight;
  }

  const [primarySlot] = match.sharedAvailability;
  if (primarySlot) {
    return `Shared focus time ${primarySlot.dayLabel} ${primarySlot.start} – ${primarySlot.end}`;
  }

  if (match.sharedHobbies && match.sharedHobbies.length > 0) {
    return `Shared hobby: ${match.sharedHobbies[0]}`;
  }

  if (match.sharedInterests && match.sharedInterests.length > 0) {
    return `Shared interest: ${match.sharedInterests[0]}`;
  }

  return match.summary;
};

const formatParticipants = (match: MatchPreview) => {
  const names = match.participants
    ?.map((participant) => participant.name)
    .filter((name): name is string => Boolean(name));

  if (!names || names.length === 0) {
    return `${match.groupSize - 1} potential partner${match.groupSize === 2 ? "" : "s"}`;
  }

  if (names.length === 1) {
    return names[0];
  }

  if (names.length === 2) {
    return `${names[0]} & ${names[1]}`;
  }

  return `${names[0]}, ${names[1]} +${names.length - 2}`;
};

const extractInstagramHandles = (match: MatchPreview) =>
  (match.participants || [])
    .map((participant) => formatInstagramHandle(participant.instagram ?? undefined))
    .filter((handle): handle is string => Boolean(handle));

const compareMatches = (a: MatchPreview, b: MatchPreview) => {
  if (b.overlapMinutes !== a.overlapMinutes) {
    return b.overlapMinutes - a.overlapMinutes;
  }
  return (b.compatibilityScore ?? 0) - (a.compatibilityScore ?? 0);
};

type TopMatchRecommendationsProps = {
  matches: MatchPreview[];
  isLoading: boolean;
  hasRequested: boolean;
  limit?: number;
};

const TopMatchRecommendations = ({
  matches,
  isLoading,
  hasRequested,
  limit = 3,
}: TopMatchRecommendationsProps) => {
  const topMatches = useMemo(() => {
    if (!matches || matches.length === 0) {
      return [];
    }
    return matches
      .slice()
      .sort(compareMatches)
      .slice(0, Math.max(0, limit));
  }, [matches, limit]);

  if (!hasRequested && matches.length === 0) {
    return (
      <section className="rounded-[32px] border border-emerald-400/30 bg-emerald-500/10 p-6 text-sm text-emerald-100 shadow-[0_28px_70px_-42px_rgba(16,185,129,0.55)]">
        <header className="flex flex-col gap-2 pb-2 text-emerald-50">
          <h2 className="text-lg font-semibold">Smart recommendations</h2>
          <p>
            Preview matches to get instant highlights of the strongest
            availability overlaps.
          </p>
        </header>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-[32px] border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-[0_28px_70px_-42px_rgba(16,185,129,0.55)]">
        <header className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2 text-emerald-50">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-semibold uppercase tracking-[0.35em]">
              Smart picks
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
            Loading
          </span>
        </header>
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <div
              key={`placeholder-${index}`}
              className="h-24 animate-pulse rounded-3xl bg-emerald-400/20"
            />
          ))}
        </div>
      </section>
    );
  }

  if (topMatches.length === 0) {
    return (
      <section className="rounded-[32px] border border-emerald-400/30 bg-emerald-500/10 p-6 shadow-[0_28px_70px_-42px_rgba(16,185,129,0.55)]">
        <header className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2 text-emerald-50">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-semibold uppercase tracking-[0.35em]">
              Smart picks
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
            Waiting
          </span>
        </header>
        <p className="text-sm text-emerald-100/80">
          No strong overlaps yet. Try widening your match window or adding more
          availability blocks.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[32px] border border-emerald-400/30 bg-emerald-500/10 p-6 text-emerald-50 shadow-[0_28px_70px_-42px_rgba(16,185,129,0.55)]">
      <header className="flex items-center justify-between pb-5">
        <div className="flex items-center gap-2 text-emerald-50">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-semibold uppercase tracking-[0.35em]">
            Smart picks
          </span>
        </div>
        <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
          Top {topMatches.length}
        </span>
      </header>

      <div className="flex flex-col gap-4">
        {topMatches.map((match, index) => {
          const instagramHandles = extractInstagramHandles(match);
          const semanticPercent =
            typeof match.semanticSimilarity === "number"
              ? Math.round(match.semanticSimilarity * 100)
              : null;
          return (
            <article
              key={match.id}
              className="flex flex-col gap-3 rounded-3xl border border-emerald-400/40 bg-emerald-500/10 p-4 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-200">
                      {rankLabel(index)}
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      {formatParticipants(match)}
                    </h3>
                  </div>
                  {instagramHandles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {instagramHandles.slice(0, 2).map((handle) => (
                        <a
                          key={`${match.id}-${handle}`}
                          href={`https://instagram.com/${handle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200 underline-offset-4 hover:underline"
                        >
                          @{handle}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100">
                  <Clock className="h-3.5 w-3.5" />
                  {match.overlapMinutes} min
                </div>
              </div>

              <p className="text-sm text-emerald-100/80">
                {buildWhyThisMatch(match)}
              </p>

              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-emerald-200">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-3 py-1 font-semibold">
                  <ArrowUpRight className="h-3 w-3" /> {match.compatibilityScore}%
                </span>
                {semanticPercent !== null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1">
                    Semantic match: {semanticPercent}%
                  </span>
                )}
                {match.sharedHobbies && match.sharedHobbies.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1">
                    Hobby match: {match.sharedHobbies.slice(0, 2).join(", ")}
                    {match.sharedHobbies.length > 2 ? "…" : ""}
                  </span>
                )}
                {match.sharedInterests && match.sharedInterests.length > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1">
                    Interest match: {match.sharedInterests.slice(0, 2).join(", ")}
                    {match.sharedInterests.length > 2 ? "…" : ""}
                  </span>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default TopMatchRecommendations;
