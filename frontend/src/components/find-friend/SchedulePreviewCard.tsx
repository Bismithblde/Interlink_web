import { Link } from "react-router-dom";

export type DayAvailabilitySummary = {
  day: string;
  totalMinutes: number;
  slots: Array<{
    id: string;
    start: string;
    end: string;
    durationLabel: string;
  }>;
};

export type SchedulePreviewData = {
  totalSlots: number;
  totalMinutes: number;
  dailySummaries: DayAvailabilitySummary[];
};

type SchedulePreviewCardProps = {
  data: SchedulePreviewData | null;
  onRefresh?: () => void;
};

const formatTotalHours = (minutes: number) => {
  if (minutes <= 0) {
    return "0 hours";
  }

  const hours = minutes / 60;
  if (hours < 3) {
    return `${minutes} minutes`;
  }

  return `${hours.toFixed(hours >= 5 ? 0 : 1)} hours`;
};

const SchedulePreviewCard = ({ data, onRefresh }: SchedulePreviewCardProps) => {
  const hasAvailability = data && data.totalSlots > 0;

  return (
    <section className="w-full rounded-[32px] border border-slate-700 bg-slate-900/70 p-6 text-slate-200 shadow-[0_24px_60px_-36px_rgba(8,47,73,0.75)]">
      <header className="flex flex-col gap-2 pb-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100">
            Your Availability Snapshot
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-sky-500/15 px-3 py-1 font-semibold uppercase tracking-[0.35em] text-sky-200">
              Beta
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          We use the free time blocks from your schedule to find overlap with
          potential study partners.
        </p>
      </header>

      {!hasAvailability ? (
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-dashed border-slate-600 bg-slate-900/60 p-6 text-sm text-slate-300">
          <p>
            You haven&apos;t added any free time blocks yet. Head over to your
            schedule to outline when you&apos;re available.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/schedule"
              className="inline-flex items-center rounded-full bg-sky-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Update Schedule
            </Link>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center rounded-full border border-slate-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-300 transition hover:border-sky-400 hover:text-sky-200"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-sky-500/30 bg-sky-500/10 px-5 py-4 text-slate-100">
            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">
                Total Free Blocks
              </span>
              <span className="text-xl font-semibold text-white">
                {data.totalSlots} time block{data.totalSlots === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex flex-col border-l border-sky-500/40 pl-5">
              <span className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-200">
                Weekly Availability
              </span>
              <span className="text-xl font-semibold text-white">
                {formatTotalHours(data.totalMinutes)}
              </span>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="ml-auto inline-flex items-center rounded-full border border-slate-600 px-5 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:border-sky-400 hover:text-sky-100"
            >
              Refresh
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {data.dailySummaries.map((day) => (
              <div
                key={day.day}
                className="flex flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-900/60 px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-100">
                    {day.day}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.35em] text-sky-300">
                    {formatTotalHours(day.totalMinutes)}
                  </span>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-slate-300">
                  {day.slots.map((slot) => (
                    <li
                      key={slot.id}
                      className="flex items-center justify-between rounded-2xl bg-slate-800/70 px-3 py-2"
                    >
                      <span className="font-medium text-slate-100">
                        {slot.start} – {slot.end}
                      </span>
                      <span className="text-xs uppercase tracking-[0.25em] text-slate-400">
                        {slot.durationLabel}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default SchedulePreviewCard;


