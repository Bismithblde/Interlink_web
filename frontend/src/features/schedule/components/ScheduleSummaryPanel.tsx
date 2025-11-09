import type { SerializedFreeTimeSlot } from "../../../types/schedule";

type SummaryItem = {
  id: string;
  day: string;
  start: string;
  end: string;
  durationMinutes: number;
};

type Props = {
  scheduleSummary: SummaryItem[];
  serializedSlots: SerializedFreeTimeSlot[];
  onClearSchedule: () => void;
};

const ScheduleSummaryPanel = ({
  scheduleSummary,
  serializedSlots,
  onClearSchedule,
}: Props) => {
  const hasSlots = scheduleSummary.length > 0;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 self-start rounded-3xl border border-slate-700 bg-slate-900/70 p-5 text-left text-sm text-slate-200 shadow-inner shadow-slate-950/40 lg:w-80 lg:shrink-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-100">
          Saved Slots
        </span>
        <button
          type="button"
          onClick={onClearSchedule}
          disabled={!hasSlots}
          className="rounded-full border border-rose-500/50 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:border-rose-400 hover:bg-rose-900/30 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
        >
          Clear all
        </button>
      </div>

      {hasSlots ? (
        <ul className="flex flex-col gap-3">
          {scheduleSummary.map((slot) => (
            <li
              key={slot.id}
              className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 shadow-sm shadow-slate-950/30"
            >
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.3em] text-slate-100">
                <span>{slot.day}</span>
                <span>{slot.durationMinutes} min</span>
              </div>
              <div className="mt-1 text-base font-medium text-slate-100">
                {slot.start} – {slot.end}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-600 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-300">
          Click and drag on the calendar to mark when you&apos;re free. Slots
          will appear here and stay synced to your account.
        </p>
      )}

      <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-100">
          Data Structure
        </div>
        <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200">
          {JSON.stringify(serializedSlots, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ScheduleSummaryPanel;

