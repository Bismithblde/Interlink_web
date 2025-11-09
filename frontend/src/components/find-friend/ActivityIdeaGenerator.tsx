import { Wand2 } from "lucide-react";
import type { ActivitySuggestion } from "../../services/findFriendApi";

type ActivityIdeaGeneratorProps = {
  description: string;
  onDescriptionChange: (next: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  suggestions: ActivitySuggestion[];
  error: string | null;
  disabled?: boolean;
  userHobbies: string[];
  onApplySuggestion: (suggestion: ActivitySuggestion) => void;
};

const formatDuration = (minutes?: number) => {
  if (!minutes || minutes <= 0) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (remainder === 0) return `${hours} hr`;
  return `${hours} hr ${remainder} min`;
};

const ActivityIdeaGenerator = ({
  description,
  onDescriptionChange,
  onGenerate,
  isGenerating,
  suggestions,
  error,
  disabled = false,
  userHobbies,
  onApplySuggestion,
}: ActivityIdeaGeneratorProps) => {
  const hasSuggestions = suggestions.length > 0;
  const canGenerate = description.trim().length > 0 || userHobbies.length > 0;

  return (
    <section className="flex flex-col gap-4 rounded-[28px] border border-slate-700 bg-slate-900/70 p-5 shadow-[0_32px_80px_-48px_rgba(14,116,144,0.8)] backdrop-blur">
      <header className="flex items-start gap-3">
        <span className="rounded-full bg-sky-500/15 p-2 text-sky-200">
          <Wand2 className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.38em] text-sky-200">
            Activity spark
          </h2>
          <p className="text-sm text-slate-300">
            Describe the meetup vibe you&apos;re chasing and we&apos;ll pitch a
            few commuter-friendly ideas that match your hobbies.
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        <label
          htmlFor="activity-idea-description"
          className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300"
        >
          What do you want to do?
        </label>
        <textarea
          id="activity-idea-description"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder="Example: Short creative meetup before our afternoon classes"
          className="min-h-[96px] w-full resize-y rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring focus:ring-sky-500/30"
          disabled={disabled || isGenerating}
        />
        {userHobbies.length > 0 && (
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Hobbies we&apos;ll include: {userHobbies.join(", ")}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={disabled || isGenerating || !canGenerate}
        className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-semibold uppercase tracking-[0.35em] transition ${
          disabled || isGenerating || !canGenerate
            ? "bg-slate-700/60 text-slate-300"
            : "bg-sky-500 text-white shadow-lg shadow-sky-500/30 hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
        }`}
      >
        {isGenerating ? "Generating ideas…" : "Suggest activities"}
      </button>

      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-xs font-medium uppercase tracking-[0.32em] text-rose-100">
          {error}
        </div>
      )}

      {hasSuggestions ? (
        <ul className="flex flex-col gap-3">
          {suggestions.map((suggestion) => {
            const durationLabel = formatDuration(suggestion.durationMinutes);
            return (
              <li
                key={`${suggestion.title}-${durationLabel ?? "noduration"}`}
                className="flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 p-4"
              >
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-semibold text-white">
                    {suggestion.title}
                  </h3>
                  {suggestion.summary && (
                    <p className="text-sm text-slate-200">
                      {suggestion.summary}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  {durationLabel && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1">
                      {durationLabel}
                    </span>
                  )}
                  {suggestion.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 uppercase tracking-[0.3em]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {suggestion.primaryReason && (
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    {suggestion.primaryReason}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onApplySuggestion(suggestion)}
                    className="inline-flex items-center justify-center rounded-full border border-sky-400/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-100 transition hover:border-sky-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  >
                    Use this idea
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-slate-300">
          {isGenerating
            ? "Tuning suggestions to your profile…"
            : canGenerate
            ? "Tap suggest activities to spark quick commuter-friendly plans."
            : "Add a short description or update your hobbies to get smarter ideas."}
        </p>
      )}
    </section>
  );
};

export default ActivityIdeaGenerator;



