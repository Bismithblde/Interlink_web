import { API_BASE_URL } from "./apiConfig";
import type { SerializedFreeTimeSlot } from "../types/schedule";

type ScheduleResponse = {
  slots?: SerializedFreeTimeSlot[];
  updatedAt?: string;
};

class ScheduleApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ScheduleApiError";
    this.status = status;
    this.details = details;
  }
}

const readJson = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("[scheduleApi] Failed to parse JSON response", error);
    return null;
  }
};

const request = async <T>(
  path: string,
  init: RequestInit = {}
): Promise<T | null> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await readJson<T | { error?: string; message?: string }>(
    response
  );

  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        payload.error) ||
      (payload &&
        typeof payload === "object" &&
        "message" in payload &&
        payload.message) ||
      response.statusText ||
      "Request failed";
    throw new ScheduleApiError(response.status, message);
  }

  return (payload ?? null) as T | null;
};

const encodeUserId = (userId: string) => encodeURIComponent(userId);

export const scheduleApi = {
  async fetchSchedule(userId: string): Promise<SerializedFreeTimeSlot[]> {
    const payload = await request<ScheduleResponse>(
      `/schedules/${encodeUserId(userId)}`
    );
    return Array.isArray(payload?.slots) ? payload!.slots : [];
  },

  async saveSchedule(
    userId: string,
    slots: SerializedFreeTimeSlot[]
  ): Promise<SerializedFreeTimeSlot[]> {
    const payload = await request<ScheduleResponse>(
      `/schedules/${encodeUserId(userId)}`,
      {
        method: "PUT",
        body: JSON.stringify({ slots }),
      }
    );
    return Array.isArray(payload?.slots) ? payload!.slots : [];
  },

  async clearSchedule(userId: string): Promise<void> {
    await request(`/schedules/${encodeUserId(userId)}`, {
      method: "DELETE",
    });
  },
};

export { ScheduleApiError };


