import { addMinutes } from "date-fns";

import { SLOT_COLORS, SLOT_MINUTES } from "./constants";

import type { FreeTimeSlot, SerializedFreeTimeSlot } from "../../types/schedule";

export const normalizeSlot = (start: Date, end: Date) => {
  if (start >= end) {
    return { start, end: addMinutes(start, SLOT_MINUTES) };
  }

  return { start, end };
};

export const serializeSlots = (
  slots: FreeTimeSlot[]
): SerializedFreeTimeSlot[] =>
  slots.map((slot) => ({
    ...slot,
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
  }));

export const deserializeSlots = (
  slots: SerializedFreeTimeSlot[]
): FreeTimeSlot[] =>
  slots.map((slot) => ({
    ...slot,
    start: new Date(slot.start),
    end: new Date(slot.end),
  }));

export const getNextColor = (index: number) =>
  SLOT_COLORS[index % SLOT_COLORS.length];

export const createSlotId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `slot-${Math.random().toString(36).slice(2, 10)}`;
};

