import type { MatchMode } from "../../services/findFriendApi";

type MatchModeSelectorProps = {
  value: MatchMode;
  onChange: (mode: MatchMode) => void;
  disabled?: boolean;
};

const modes: Array<{
  value: MatchMode;
  label: string;
  description: string;
  badge: string;
}> = [
  {
    value: "ONE_ON_ONE",
    label: "1-on-1 Match",
    description:
      "Pair up with a single study partner whose availability closely aligns with yours.",
    badge: "Popular",
  },
  {
    value: "ONE_ON_THREE",
    label: "1-on-3 Pod",
    description:
      "Join a small pod of up to three peers to collaborate and stay accountable together.",
    badge: "New",
  },
];

const MatchModeSelector = ({
  value,
  onChange,
  disabled = false,
}: MatchModeSelectorProps) => {
  return (
    <section className="w-full rounded-[32px] border border-slate-700 bg-slate-900/70 p-6 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.75)] backdrop-blur">
      <header className="flex flex-col gap-2 pb-4 text-slate-200">
        <h2 className="text-lg font-semibold text-slate-100">Match Mode</h2>
        <p className="text-sm text-slate-300">
          Choose the matching experience that fits how you like to collaborate.
        </p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        {modes.map((mode) => {
          const isActive = value === mode.value;
          return (
            <button
              key={mode.value}
              type="button"
              onClick={() => onChange(mode.value)}
              disabled={disabled}
              className={`group relative flex flex-col gap-3 rounded-3xl border p-5 text-left transition ${
                isActive
                  ? "border-sky-400/70 bg-sky-500/15 text-white shadow-[0_18px_50px_-28px_rgba(56,189,248,0.65)]"
                  : "border-slate-700 bg-slate-900/60 text-slate-200 hover:border-sky-300/40 hover:bg-slate-800/60"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-sky-200">
                {mode.badge}
              </span>
              <div className="mt-6 flex flex-col gap-2">
                <span className="text-base font-semibold text-slate-100">
                  {mode.label}
                </span>
                <span className="text-sm text-slate-300">
                  {mode.description}
                </span>
              </div>
              <span
                className={`mt-auto inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] transition ${
                  isActive
                    ? "bg-sky-500 text-white"
                    : "bg-slate-800/60 text-slate-200 group-hover:bg-sky-200/25 group-hover:text-white"
                }`}
              >
                {isActive ? "Selected" : "Choose"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default MatchModeSelector;
