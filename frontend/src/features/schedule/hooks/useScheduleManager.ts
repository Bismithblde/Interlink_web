import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EventPropGetter, SlotInfo } from "react-big-calendar";
import { areIntervalsOverlapping } from "date-fns";
import { format } from "date-fns";

import type { FreeTimeSlot } from "../../../types/schedule";
import { scheduleApi, ScheduleApiError } from "../../../services/scheduleApi";
import {
  createSlotId,
  deserializeSlots,
  getNextColor,
  normalizeSlot,
  serializeSlots,
} from "../utils";

type DragAndDropEvent = {
  event: FreeTimeSlot;
  start: Date | string;
  end: Date | string;
};

type ResizeEvent = DragAndDropEvent;

type SyncState = {
  isLoading: boolean;
  loadError: string | null;
  isSyncing: boolean;
  syncError: string | null;
};

const INITIAL_SYNC_STATE: SyncState = {
  isLoading: false,
  loadError: null,
  isSyncing: false,
  syncError: null,
};

export const useScheduleManager = (userId?: string | null) => {
  const [freeTimeSlots, setFreeTimeSlots] = useState<FreeTimeSlot[]>([]);
  const [syncState, setSyncState] = useState<SyncState>(INITIAL_SYNC_STATE);

  const lastSyncedRef = useRef<string>(JSON.stringify([]));
  const isFetchingRef = useRef(false);
  const activeUserRef = useRef<string | null>(null);
  const slotsRef = useRef<FreeTimeSlot[]>([]);

  useEffect(() => {
    slotsRef.current = freeTimeSlots;
  }, [freeTimeSlots]);

  const refreshSchedule = useCallback(async () => {
    if (!userId) {
      setFreeTimeSlots([]);
      setSyncState((prev) => ({
        ...prev,
        isLoading: false,
        loadError: null,
      }));
      lastSyncedRef.current = JSON.stringify([]);
      activeUserRef.current = null;
      isFetchingRef.current = false;
      return;
    }

    setSyncState((prev) => ({
      ...prev,
      isLoading: true,
      loadError: null,
    }));

    isFetchingRef.current = true;
    activeUserRef.current = userId;

    try {
      const remoteSlots = await scheduleApi.fetchSchedule(userId);
      if (activeUserRef.current !== userId) {
        return;
      }

      lastSyncedRef.current = JSON.stringify(remoteSlots);
      setFreeTimeSlots(deserializeSlots(remoteSlots));
      setSyncState((prev) => ({
        ...prev,
        isLoading: false,
        loadError: null,
      }));
    } catch (error) {
      if (activeUserRef.current !== userId) {
        return;
      }

      console.error("[Schedule] Failed to load schedule", error);
      const message =
        error instanceof ScheduleApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to load schedule.";

      lastSyncedRef.current = JSON.stringify([]);
      setFreeTimeSlots([]);
      setSyncState((prev) => ({
        ...prev,
        isLoading: false,
        loadError: message,
      }));
    } finally {
      if (activeUserRef.current === userId) {
        isFetchingRef.current = false;
      }
    }
  }, [userId]);

  useEffect(() => {
    void refreshSchedule();
  }, [refreshSchedule]);

  useEffect(() => {
    if (!userId) return;
    if (isFetchingRef.current) return;

    const serialized = serializeSlots(freeTimeSlots);
    const payloadHash = JSON.stringify(serialized);
    if (payloadHash === lastSyncedRef.current) {
      return;
    }

    let isActive = true;
    setSyncState((prev) => ({
      ...prev,
      isSyncing: true,
      syncError: null,
    }));

    const persist = async () => {
      try {
        const saved = await scheduleApi.saveSchedule(userId, serialized);
        if (!isActive) return;

        const savedHash = JSON.stringify(saved);
        lastSyncedRef.current = savedHash;

        const localHash = JSON.stringify(serializeSlots(slotsRef.current));
        if (savedHash !== localHash) {
          setFreeTimeSlots(deserializeSlots(saved));
        }

        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncError: null,
        }));
      } catch (error) {
        if (!isActive) return;
        console.error("[Schedule] Failed to save schedule", error);
        const message =
          error instanceof ScheduleApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Failed to save schedule.";

        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncError: message,
        }));
      }
    };

    void persist();

    return () => {
      isActive = false;
    };
  }, [freeTimeSlots, userId]);

  const scheduleSummary = useMemo(
    () =>
      freeTimeSlots
        .slice()
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map((slot) => ({
          id: slot.id,
          day: format(slot.start, "EEEE"),
          start: format(slot.start, "p"),
          end: format(slot.end, "p"),
          durationMinutes: Math.round(
            (slot.end.getTime() - slot.start.getTime()) / (1000 * 60)
          ),
        })),
    [freeTimeSlots]
  );

  const serializedSlots = useMemo(
    () => serializeSlots(freeTimeSlots),
    [freeTimeSlots]
  );

  const eventPropGetter = useCallback<EventPropGetter<FreeTimeSlot>>(
    (event) => ({
      className: "schedule-event",
      style: {
        backgroundColor: event.color ?? "#bae6fd",
      },
    }),
    []
  );

  const handleSelectSlot = useCallback(
    ({ start, end, action }: SlotInfo) => {
      if (action !== "select") return;
      if (!userId) return;

      const { start: nextStart, end: nextEnd } = normalizeSlot(
        start as Date,
        end as Date
      );

      const overlaps = freeTimeSlots.some((slot) =>
        areIntervalsOverlapping(
          { start: slot.start, end: slot.end },
          { start: nextStart, end: nextEnd },
          { inclusive: false }
        )
      );

      if (overlaps) {
        window.alert(
          "This time overlaps with an existing free slot. Move or resize the original slot instead."
        );
        return;
      }

      setFreeTimeSlots((prev) => [
        ...prev,
        {
          id: createSlotId(),
          title: "Free Time",
          start: nextStart,
          end: nextEnd,
          color: getNextColor(prev.length),
        },
      ]);
    },
    [freeTimeSlots, userId]
  );

  const handleEventDrop = useCallback(
    ({ event, start, end }: DragAndDropEvent) => {
      const { start: nextStart, end: nextEnd } = normalizeSlot(
        start as Date,
        end as Date
      );

      setFreeTimeSlots((prev) =>
        prev.map((slot) =>
          slot.id === event.id
            ? {
                ...slot,
                start: nextStart,
                end: nextEnd,
              }
            : slot
        )
      );
    },
    []
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: ResizeEvent) => {
      const { start: nextStart, end: nextEnd } = normalizeSlot(
        start as Date,
        end as Date
      );

      setFreeTimeSlots((prev) =>
        prev.map((slot) =>
          slot.id === event.id
            ? {
                ...slot,
                start: nextStart,
                end: nextEnd,
              }
            : slot
        )
      );
    },
    []
  );

  const handleSelectEvent = useCallback((event: FreeTimeSlot) => {
    const shouldDelete = window.confirm(
      "Remove this free time slot from your schedule?"
    );
    if (!shouldDelete) return;

    setFreeTimeSlots((prev) => prev.filter((slot) => slot.id !== event.id));
  }, []);

  const handleClearSchedule = useCallback(async () => {
    if (!userId) return;
    const shouldClear = window.confirm(
      "Clear all saved free time slots from your schedule?"
    );
    if (!shouldClear) return;

    lastSyncedRef.current = JSON.stringify([]);
    setFreeTimeSlots([]);
    setSyncState((prev) => ({
      ...prev,
      isSyncing: true,
      syncError: null,
    }));

    try {
      await scheduleApi.clearSchedule(userId);
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: null,
      }));
    } catch (error) {
      console.error("[Schedule] Failed to clear schedule", error);
      const message =
        error instanceof ScheduleApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Failed to clear schedule.";

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncError: message,
      }));
    }
  }, [userId]);

  return {
    freeTimeSlots,
    scheduleSummary,
    serializedSlots,
    eventPropGetter,
    refreshSchedule,
    isLoading: syncState.isLoading,
    loadError: syncState.loadError,
    isSyncing: syncState.isSyncing,
    syncError: syncState.syncError,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    handleSelectEvent,
    handleClearSchedule,
  };
};

