import type { ComponentProps } from "react";
import type { EventPropGetter } from "react-big-calendar";

import type { FreeTimeSlot } from "../../../types/schedule";
import {
  DnDCalendar,
  DEFAULT_VIEW,
  calendarMessages,
  localizer,
  SLOT_MINUTES,
} from "../constants";
import WeeklyToolbar from "./WeeklyToolbar";

import "../styles/schedule-calendar.css";

type CalendarProps = ComponentProps<typeof DnDCalendar>;

type Props = {
  events: FreeTimeSlot[];
  eventPropGetter: EventPropGetter<FreeTimeSlot>;
  onSelectSlot: NonNullable<CalendarProps["onSelectSlot"]>;
  onEventDrop: CalendarProps["onEventDrop"];
  onEventResize: CalendarProps["onEventResize"];
  onSelectEvent: NonNullable<CalendarProps["onSelectEvent"]>;
};

const ScheduleCalendar = ({
  events,
  eventPropGetter,
  onSelectSlot,
  onEventDrop,
  onEventResize,
  onSelectEvent,
}: Props) => (
  <DnDCalendar
    className="schedule-calendar"
    localizer={localizer}
    events={events}
    view={DEFAULT_VIEW}
    defaultView={DEFAULT_VIEW}
    min={new Date(1970, 1, 1, 6, 0)}
    max={new Date(1970, 1, 1, 22, 0)}
    step={SLOT_MINUTES}
    timeslots={2}
    selectable
    resizable
    popup
    onSelectSlot={onSelectSlot}
    onEventDrop={onEventDrop}
    onEventResize={onEventResize}
    onSelectEvent={onSelectEvent}
    eventPropGetter={eventPropGetter}
    messages={calendarMessages}
    components={{
      toolbar: WeeklyToolbar,
    }}
    style={{
      height: "100%",
      minHeight: "540px",
      width: "100%",
    }}
  />
);

export default ScheduleCalendar;

