import { useMemo } from "react";
import type { FormEvent } from "react";
import type { MatchMode, MatchWindow } from "../../services/findFriendApi";
import { MATCH_WINDOW_OPTIONS } from "../../services/findFriendApi";

export type MatchPreferences = {
  window: MatchWindow;
  minOverlapMinutes: number;
  requireSameCourse: boolean;
};

type MatchRequestFormProps = {
  mode: MatchMode;
  preferences: MatchPreferences;
  onChange: (nextPreferences: MatchPreferences) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  submitDisabled?: boolean;
  submitDisabledReason?: string | null;
};

const overlapOptions = [30, 45, 60, 75, 90, 120];

const MatchRequestForm = ({
  mode,
  preferences,
  onChange,
  onSubmit,
  isSubmitting,
  disabled = false,
  submitDisabled = false,
  submitDisabledReason = null,
}: MatchRequestFormProps) => {
  const groupSizeLabel = useMemo(
    () => (mode === "ONE_ON_ONE" ? "You + 1" : "You + 3"),
    [mode]
  );

  const handleOverlapChange = (value: number) => {
    onChange({
      ...preferences,
      minOverlapMinutes: value,
    });
  };

  const handleWindowChange = (value: MatchWindow) => {
    onChange({
      ...preferences,
      window: value,
    });
  };

  const handleRequireSameCourseChange = (checked: boolean) => {
    onChange({
      ...preferences,
      requireSameCourse: checked,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disabled && !isSubmitting && !submitDisabled) {
      onSubmit();
    }
  };

  const controlsDisabled = disabled || isSubmitting;

  return (
    <section className="w-full rounded-[32px] border border-slate-700 bg-slate-900/70 p-6 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.75)] backdrop-blur">
      <header className="flex flex-col gap-2 pb-4 text-slate-200">
        <h2 className="text-lg font-semibold text-slate-100">
          Match Preferences
        </h2>
        <p className="text-sm text-slate-300">
          Tell us how you want to use your overlapping time. We&apos;ll suggest
          compatible peers before confirming the match.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 rounded-3xl border border-slate-700 bg-slate-900/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
              Match Window
            </span>
            <select
              value={preferences.window}
              onChange={(event) =>
                handleWindowChange(event.target.value as MatchWindow)
              }
              disabled={controlsDisabled}
              className="rounded-2xl border border-slate-600 bg-slate-950/70 px-4 py-3 text-sm font-medium text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring focus:ring-sky-500/30"
            >
              {MATCH_WINDOW_OPTIONS.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="bg-slate-900 text-slate-100"
                >
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400">
              We&apos;ll look for peers free within this cadence.
            </span>
          </label>

          <label className="flex flex-col gap-2 rounded-3xl border border-slate-700 bg-slate-900/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
              Minimum Overlap
            </span>
            <div className="flex items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {overlapOptions.map((value) => {
                  const isActive = preferences.minOverlapMinutes === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleOverlapChange(value)}
                      disabled={controlsDisabled}
                      className={`inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                        isActive
                          ? "bg-sky-500 text-white shadow-lg shadow-sky-900/40"
                          : "bg-slate-800/60 text-slate-200 hover:bg-slate-700/70 hover:text-white"
                      } ${controlsDisabled ? "opacity-70" : ""}`}
                    >
                      {value} min
                    </button>
                  );
                })}
              </div>
            </div>
            <span className="text-xs text-slate-400">
              Partners must share at least this much consecutive free time.
            </span>
          </label>
        </div>

        <label className="flex items-center justify-between gap-4 rounded-3xl border border-slate-700 bg-slate-900/60 px-5 py-4">
          <div className="flex flex-col gap-1 text-slate-200">
            <span className="text-sm font-semibold text-slate-100">
              Prioritize classmates
            </span>
            <span className="text-xs text-slate-400">
              We&apos;ll only show partners who opted into sharing course info.
            </span>
          </div>
          <input
            type="checkbox"
            checked={preferences.requireSameCourse}
            onChange={(event) =>
              handleRequireSameCourseChange(event.target.checked)
            }
            disabled={controlsDisabled}
            className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-sky-400 focus:ring-sky-400"
          />
        </label>

        <div className="flex items-center justify-between rounded-3xl border border-slate-700 bg-slate-900/60 px-5 py-4 text-sm text-slate-200">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
              Pod Size
            </span>
            <span className="text-base font-semibold text-slate-100">
              {groupSizeLabel}
            </span>
          </div>
          <button
            type="submit"
            disabled={controlsDisabled || submitDisabled}
            className={`inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.4em] text-white shadow-lg shadow-sky-900/40 transition ${
              controlsDisabled || submitDisabled
                ? "cursor-not-allowed opacity-60"
                : "hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            }`}
          >
            {isSubmitting ? "Finding Matches..." : "Preview Matches"}
          </button>
        </div>
        {submitDisabledReason && (
          <p className="px-5 text-xs font-medium uppercase tracking-[0.3em] text-rose-300">
            {submitDisabledReason}
          </p>
        )}
      </form>
    </section>
  );
};

export default MatchRequestForm;
