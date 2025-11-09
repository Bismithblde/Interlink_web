import type { MatchMode, MatchPreview } from "../../services/findFriendApi";
import { formatInstagramHandle } from "./utils";

type ConnectionStatus = "idle" | "sending" | "sent" | "error";

type MatchPreviewListProps = {
  mode: MatchMode;
  isLoading: boolean;
  matches: MatchPreview[];
  error?: string | null;
  hasRequested: boolean;
  emptyReason?: string | null;
  debugLog?: string[];
  hobbyFilter?: string;
  connectionStatuses?: Record<string, ConnectionStatus>;
  onRequestConnection?: (
    participantId: string,
    participantName?: string | null
  ) => void;
  connectionErrors?: Record<string, string | null>;
};

const DebugDetails = ({
  entries,
  variant = "default",
}: {
  entries: string[];
  variant?: "default" | "compact";
}) => {
  if (!entries.length) return null;

  const containerClassName =
    variant === "compact"
      ? "rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-left text-xs text-slate-300"
      : "rounded-3xl border border-slate-700 bg-slate-900/60 p-4 text-left text-xs text-slate-300";

  return (
    <details className={containerClassName}>
      <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
        Debug details
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        {entries.map((entry, index) => (
          <li key={`debug-${index}`}>
            <code className="break-all text-[11px] text-slate-600">
              {entry}
            </code>
          </li>
        ))}
      </ul>
    </details>
  );
};

const compatibilityLabel = (score: number) => {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Strong";
  if (score >= 60) return "Good";
  return "Schedule Match";
};

const MatchPreviewList = ({
  mode,
  isLoading,
  matches,
  error,
  hasRequested,
  emptyReason,
  debugLog = [],
  hobbyFilter,
  connectionStatuses = {},
  connectionErrors = {},
  onRequestConnection,
}: MatchPreviewListProps) => {
  const normalizedFilter = hobbyFilter?.trim().toLowerCase() ?? "";

  if (error) {
    return (
      <section className="w-full rounded-[32px] border border-rose-500/50 bg-rose-950/40 p-6 text-slate-100 shadow-[0_24px_60px_-36px_rgba(244,63,94,0.35)]">
        <header className="flex flex-col gap-2 pb-4">
          <h2 className="text-lg font-semibold text-rose-300">
            Unable to load matches
          </h2>
          <p className="text-sm text-rose-200">{error}</p>
        </header>
      </section>
    );
  }

  if (!hasRequested && matches.length === 0) {
    return (
      <section className="w-full rounded-[32px] border border-slate-700 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.75)]">
        <header className="flex flex-col gap-2 pb-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Preview your upcoming matches
          </h2>
          <p>
            After you set your preferences, we&apos;ll surface a shortlist of
            potential partners who share your availability.
          </p>
        </header>
      </section>
    );
  }

  return (
    <section className="w-full rounded-[32px] border border-slate-700 bg-slate-900/70 p-6 text-slate-200 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.75)]">
      <header className="flex flex-col gap-2 pb-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Suggested {mode === "ONE_ON_ONE" ? "partners" : "pods"}
          </h2>
          <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
            Preview
          </span>
        </div>
        <p className="text-sm text-slate-300">
          These aren&apos;t finalized matches yet — confirm once you like the
          look of a pod.
        </p>
        {normalizedFilter && (
          <p className="text-xs uppercase tracking-[0.3em] text-amber-300">
            Hobby filter: {normalizedFilter}
          </p>
        )}
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-3xl bg-slate-800/60"
            />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="flex flex-col gap-4 rounded-3xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-sm text-slate-300">
          <p>
            {emptyReason
              ? emptyReason
              : "No previews yet. Adjust your availability or broaden the match window to see more options."}
          </p>
          <DebugDetails entries={debugLog} variant="compact" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {matches.map((match) => (
            <article
              key={match.id}
              className="flex flex-col gap-4 rounded-3xl border border-slate-700 bg-slate-900/70 p-5 shadow-[0_28px_70px_-48px_rgba(8,47,73,0.8)]"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                    Compatibility
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-slate-100">
                      {match.compatibilityScore}%
                    </span>
                    <span className="text-xs font-medium uppercase tracking-[0.35em] text-sky-400">
                      {compatibilityLabel(match.compatibilityScore)}
                    </span>
                  </div>
                </div>
                <div className="rounded-full border border-sky-500/40 bg-sky-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                  {match.groupSize} members
                </div>
              </div>

              {match.clusterLabel && (
                <div className="inline-flex w-fit items-center rounded-full border border-sky-500/40 bg-sky-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-200">
                  {match.clusterLabel}
                </div>
              )}

              <p className="text-sm text-slate-300">{match.summary}</p>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-slate-800/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200">
                  {match.overlapMinutes} min overlap
                </span>
                {typeof match.semanticSimilarity === "number" && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-emerald-200">
                    Semantic match {Math.round(match.semanticSimilarity * 100)}%
                  </span>
                )}
                {match.sharedAvailability.map((slot, index) => (
                  <span
                    key={`${match.id}-${index}`}
                    className="inline-flex items-center rounded-full bg-sky-500/15 px-3 py-2 text-xs font-medium uppercase tracking-[0.25em] text-sky-200"
                  >
                    {slot.dayLabel}: {slot.start} – {slot.end}
                  </span>
                ))}
              </div>

              {match.participants && match.participants.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 flex justify-center align-center">
                  {match.participants.map((participant) => {
                    const instagramHandle = formatInstagramHandle(
                      participant.instagram
                    );
                    const participantId =
                      typeof participant.id === "string"
                        ? participant.id
                        : null;
                    const status: ConnectionStatus = participantId
                      ? connectionStatuses[participantId] ?? "idle"
                      : "idle";
                    const isSending = status === "sending";
                    const isSent = status === "sent";
                    const isError = status === "error";
                    const disabled =
                      !participantId ||
                      isSending ||
                      isSent ||
                      !onRequestConnection;
                    const label = isSent
                      ? "Request sent"
                      : isSending
                      ? "Sending..."
                      : "Add connection";
                    const errorMessage =
                      participantId && connectionErrors[participantId]
                        ? connectionErrors[participantId]
                        : null;

                    return (
                      <div
                        key={participant.id ?? participant.name}
                        className="w-90 flex flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-900/60 p-4 "
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-100">
                            {participant.name ?? "Future teammate"}
                          </span>
                          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
                            {participant.major ?? "Major TBD"}
                          </span>
                          {instagramHandle && (
                            <a
                              href={`https://instagram.com/${instagramHandle}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-500 underline-offset-4 hover:underline"
                            >
                              @{instagramHandle}
                            </a>
                          )}
                        </div>

                        {participant.favoriteSpot && (
                          <div className="mx-auto w-[90%]">
                            <p className="text-xs text-center uppercase tracking-[0.3em] text-sky-300">
                              Favorite campus spot: {participant.favoriteSpot}
                            </p>
                          </div>
                        )}

                        {participant.hobbies &&
                          participant.hobbies.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-center">
                              {participant.hobbies.slice(0, 4).map((hobby) => (
                                <span
                                  key={`${
                                    participant.id ?? participant.name
                                  }-${hobby}`}
                                  className="inline-flex items-center rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 shadow-inner shadow-slate-950/30"
                                >
                                  {normalizedFilter &&
                                  hobby
                                    .toLowerCase()
                                    .includes(normalizedFilter) ? (
                                    <span className="font-semibold text-amber-300">
                                      {hobby}
                                    </span>
                                  ) : (
                                    hobby
                                  )}
                                </span>
                              ))}
                            </div>
                          )}

                        {participant.classes &&
                          participant.classes.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                              {participant.classes.slice(0, 4).map((course) => (
                                <span
                                  key={`${
                                    participant.id ?? participant.name
                                  }-${course}`}
                                  className="inline-flex items-center rounded-full bg-slate-800/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200"
                                >
                                  {course}
                                </span>
                              ))}
                            </div>
                          )}

                        <div className="flex flex-col gap-2 pt-1">
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                              participantId &&
                              onRequestConnection?.(
                                participantId,
                                participant.name ?? null
                              )
                            }
                            className={[
                              "inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] transition",
                              disabled
                                ? "bg-slate-800/60 text-slate-500"
                                : "bg-sky-500 text-white hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
                            ].join(" ")}
                          >
                            {label}
                          </button>
                          {isError && errorMessage && (
                            <p className="text-center text-[11px] font-medium text-rose-500">
                              {errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          ))}
          <DebugDetails entries={debugLog} />
        </div>
      )}
    </section>
  );
};

export default MatchPreviewList;
