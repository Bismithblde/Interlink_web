import { Check, RefreshCw } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ScheduleCalendar from "../features/schedule/components/ScheduleCalendar";
import ScheduleSummaryPanel from "../features/schedule/components/ScheduleSummaryPanel";
import { useScheduleManager } from "../features/schedule/hooks/useScheduleManager";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "../features/schedule/styles/schedule-page.css";

const SchedulePage = () => {
  const { user } = useAuth();
  const {
    freeTimeSlots,
    scheduleSummary,
    eventPropGetter,
    refreshSchedule,
    isLoading,
    loadError,
    isSyncing,
    syncError,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    handleSelectEvent,
    handleClearSchedule,
  } = useScheduleManager(user?.id);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const saveStatus = isLoading
    ? "Loading your availability"
    : isSyncing
      ? "Saving changes"
      : syncError
        ? `Unable to save changes: ${syncError}`
        : "All changes saved";

  return (
    <main className="schedule-page">
      <div className="schedule-page__frame">
        <header className="schedule-page__intro">
          <h1 className="landing-display">Make room for each other.</h1>
        </header>

        {loadError ? (
          <div className="schedule-page__error" role="alert">
            <span>{loadError}</span>
            <button type="button" onClick={() => void refreshSchedule()}>
              <RefreshCw aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : null}

        <section
          className="schedule-page__workspace"
          aria-label="Weekly availability editor"
        >
          <div className="schedule-page__calendar-panel">
            <ScheduleCalendar
              events={freeTimeSlots}
              eventPropGetter={eventPropGetter}
              onSelectSlot={handleSelectSlot}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onSelectEvent={handleSelectEvent}
            />
          </div>

          <ScheduleSummaryPanel
            scheduleSummary={scheduleSummary}
            onClearSchedule={handleClearSchedule}
          />
        </section>

        <footer className="schedule-page__footer">
          <div
            className={
              syncError
                ? "schedule-page__status is-error"
                : "schedule-page__status"
            }
            role="status"
          >
            <Check aria-hidden="true" />
            <span>{saveStatus}</span>
          </div>
          <Link to="/" className="schedule-page__done">
            Done with this week
          </Link>
        </footer>
      </div>
    </main>
  );
};

export default SchedulePage;
