import { format } from "date-fns";
import type { ToolbarProps } from "react-big-calendar";

import type { FreeTimeSlot } from "../../../types/schedule";

type Props = ToolbarProps<FreeTimeSlot>;

const WeeklyToolbar = (props: Props) => (
  <div className="mb-3 flex flex-col gap-3 border-b border-slate-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => props.onNavigate("TODAY")}
        className="rounded-full border border-slate-700 bg-slate-900/60 px-4 py-1 text-sm font-medium text-slate-200 transition hover:bg-slate-900/70"
      >
        Today
      </button>
      <button
        type="button"
        onClick={() => props.onNavigate("PREV")}
        className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-900/70"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => props.onNavigate("NEXT")}
        className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-sm text-slate-200 transition hover:bg-slate-900/70"
      >
        →
      </button>
    </div>
    <div className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-400">
      {format(props.date, "MMMM d, yyyy")}
    </div>
  </div>
);

export default WeeklyToolbar;

