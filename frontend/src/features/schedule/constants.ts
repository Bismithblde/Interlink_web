import { Calendar, Views, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, getDay, parse as parseDate, startOfWeek } from "date-fns";
import { enUS } from "date-fns/locale";

import type { FreeTimeSlot } from "../../types/schedule";

export const SLOT_MINUTES = 30;
export const SLOT_COLORS = [
  "#e7ad4b",
  "#8eafc8",
];

const locales = {
  "en-US": enUS,
};

export const localizer = dateFnsLocalizer({
  format,
  parse: (value: string, formatString: string) =>
    parseDate(value, formatString, new Date()),
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export const calendarMessages = {
  week: "Week",
  work_week: "Work Week",
  day: "Day",
  month: "Month",
  previous: "Back",
  next: "Next",
  today: "Today",
};

export const calendarFormats = {
  dayFormat: (date: Date) => format(date, "EEE dd").toUpperCase(),
};

export const DnDCalendar = withDragAndDrop<FreeTimeSlot>(Calendar);
export const DEFAULT_VIEW = Views.WEEK;

