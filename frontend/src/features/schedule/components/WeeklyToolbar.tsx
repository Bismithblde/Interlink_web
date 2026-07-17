import { endOfWeek, format, startOfWeek } from "date-fns";
import type { ToolbarProps } from "react-big-calendar";

import type { FreeTimeSlot } from "../../../types/schedule";

type Props = ToolbarProps<FreeTimeSlot>;

const formatWeekRange = (date: Date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });

  return `${format(start, "MMM d")} - ${format(end, "MMM d")}`;
};

const WeeklyToolbar = (props: Props) => (
  <div className="schedule-toolbar">
    <div className="schedule-toolbar__heading">
      <h2 className="landing-display">Your week</h2>
      <span>{formatWeekRange(props.date)}</span>
    </div>
    <span className="schedule-toolbar__hint">
      Drag across the grid to add time
    </span>
  </div>
);

export default WeeklyToolbar;
