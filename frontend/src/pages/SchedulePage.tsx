import { Link, Navigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthHeading from "../components/AuthHeading";
import { useAuth } from "../context/AuthContext";
import ScheduleCalendar from "../features/schedule/components/ScheduleCalendar";
import ScheduleSummaryPanel from "../features/schedule/components/ScheduleSummaryPanel";
import { useScheduleManager } from "../features/schedule/hooks/useScheduleManager";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const SchedulePage = () => {
  const { user } = useAuth();
  const {
    freeTimeSlots,
    scheduleSummary,
    serializedSlots,
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

  return (
    <AuthLayout alignTop contentClassName="max-w-6xl">
      <div className="flex w-full justify-center">
        <div className="flex w-full flex-col gap-10 px-2 pb-16 sm:px-4 md:scale-[0.95] md:[transform-origin:top_center] lg:scale-[0.9]">
          <div className="relative flex w-full flex-col gap-6 rounded-[32px] border border-white/60 bg-white/95 px-6 py-10 shadow-[0_30px_90px_-40px_rgba(15,118,110,0.45)] sm:px-10 sm:py-12">
            <Link
              to="/find-friends"
              className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-200 bg-white text-sm font-semibold uppercase text-sky-600 shadow-lg transition hover:scale-105 hover:border-sky-300 hover:text-sky-700"
              aria-label="Find friends"
            >
              FF
            </Link>
            <AuthHeading
              eyebrow="Availability"
              title="Weekly Free Time"
              description="Drag and drop to add free slots to your weekly calendar. Your availability is saved to your account so it follows you wherever you sign in."
            />

            {loadError && (
              <div className="rounded-3xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
                {loadError}{" "}
                <button
                  type="button"
                  onClick={() => void refreshSchedule()}
                  className="font-semibold underline decoration-red-400 hover:decoration-red-600"
                >
                  Try again
                </button>
              </div>
            )}

            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="relative w-full overflow-x-auto pb-2 sm:pb-3 lg:flex-1 lg:pb-0">
                <div className="min-w-[720px] sm:min-w-[880px] lg:w-full">
                  <div className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm shadow-sky-200/60">
                    <ScheduleCalendar
                      events={freeTimeSlots}
                      eventPropGetter={eventPropGetter}
                      onSelectSlot={handleSelectSlot}
                      onEventDrop={handleEventDrop}
                      onEventResize={handleEventResize}
                      onSelectEvent={handleSelectEvent}
                    />
                  </div>
                  {isLoading && (
                    <div className="mt-4 text-sm text-slate-500">
                      Loading your availability…
                    </div>
                  )}
                </div>
              </div>

              <ScheduleSummaryPanel
                scheduleSummary={scheduleSummary}
                serializedSlots={serializedSlots}
                onClearSchedule={handleClearSchedule}
              />
            </div>
            <div className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
              {isLoading
                ? "Loading your availability…"
                : isSyncing
                  ? "Saving changes…"
                  : syncError
                    ? `Unable to save changes: ${syncError}`
                    : "All changes saved"}
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SchedulePage;

