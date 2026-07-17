type SummaryItem = {
  id: string;
  day: string;
  start: string;
  end: string;
  color?: string;
  durationMinutes: number;
};

type Props = {
  scheduleSummary: SummaryItem[];
  onClearSchedule: () => void;
};

const formatDuration = (minutes: number) => {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}` : hours.toFixed(1);
};

const ScheduleSummaryPanel = ({
  scheduleSummary,
  onClearSchedule,
}: Props) => {
  const hasSlots = scheduleSummary.length > 0;
  const totalMinutes = scheduleSummary.reduce(
    (total, slot) => total + slot.durationMinutes,
    0,
  );
  const openHoursLabel = totalMinutes === 60 ? "open hour" : "open hours";

  return (
    <aside className="schedule-summary" aria-labelledby="saved-times-title">
      <header className="schedule-summary__header">
        <div>
          <h2 id="saved-times-title" className="landing-display">
            Saved times
          </h2>
          <p>
            {scheduleSummary.length}{" "}
            {scheduleSummary.length === 1 ? "window" : "windows"}
            {hasSlots
              ? ` - ${formatDuration(totalMinutes)} ${openHoursLabel}`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onClearSchedule}
          disabled={!hasSlots}
          className="schedule-summary__clear"
        >
          Clear all
        </button>
      </header>

      {hasSlots ? (
        <ul className="schedule-summary__list">
          {scheduleSummary.map((slot) => (
            <li key={slot.id}>
              <span
                className="schedule-summary__color"
                style={{ backgroundColor: slot.color ?? "#e7ad4b" }}
                aria-hidden="true"
              />
              <span className="schedule-summary__day">{slot.day}</span>
              <span className="schedule-summary__time">
                {slot.start} - {slot.end}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="schedule-summary__empty">
          <p>Drag across the calendar to add the times you are free.</p>
        </div>
      )}

    </aside>
  );
};

export default ScheduleSummaryPanel;
