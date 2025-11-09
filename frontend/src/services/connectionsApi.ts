import { API_BASE_URL } from "./apiConfig";
import type {
  FriendGraph,
  FriendInbox,
  FriendRequestSummary,
} from "../types/user";

class ConnectionsApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ConnectionsApiError";
    this.status = status;
    this.details = details;
  }
}

type ErrorPayload = {
  error?: string;
  message?: string;
  details?: unknown;
};

const readJson = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    console.warn("[connectionsApi] Failed to parse JSON response", error);
    return null;
  }
};

const request = async <T>(
  path: string,
  accessToken: string,
  init: RequestInit = {}
): Promise<T | null> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
  });

  if (response.status === 204) {
    return null;
  }

  const payload = await readJson<T | ErrorPayload>(response);

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
    const details =
      payload && typeof payload === "object" && "details" in payload
        ? payload.details
        : undefined;
    throw new ConnectionsApiError(response.status, message, details);
  }

  return (payload ?? null) as T | null;
};

const post = <T>(
  path: string,
  accessToken: string,
  body?: unknown
): Promise<T | null> =>
  request<T>(path, accessToken, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

const del = <T>(path: string, accessToken: string): Promise<T | null> =>
  request<T>(path, accessToken, {
    method: "DELETE",
  });

export const connectionsApi = {
  async getFriendGraph(accessToken: string): Promise<FriendGraph> {
    const payload = await request<FriendGraph>("/connections", accessToken);
    if (!payload) {
      throw new ConnectionsApiError(
        500,
        "Empty response from connections graph"
      );
    }
    return payload;
  },

  async sendConnectionRequest(
    accessToken: string,
    recipientId: string,
    message?: string | null
  ): Promise<{ request: FriendRequestSummary }> {
    const payload = await post<{ request: FriendRequestSummary }>(
      "/connections/requests",
      accessToken,
      {
        recipientId,
        message: message ?? undefined,
      }
    );
    if (!payload) {
      throw new ConnectionsApiError(
        500,
        "Empty response from connection request"
      );
    }
    return payload;
  },

  async acceptRequest(
    accessToken: string,
    requestId: string
  ): Promise<{ request: FriendRequestSummary }> {
    const payload = await post<{ request: FriendRequestSummary }>(
      `/connections/requests/${encodeURIComponent(requestId)}/accept`,
      accessToken
    );
    if (!payload) {
      throw new ConnectionsApiError(500, "Empty response on accept");
    }
    return payload;
  },

  async declineRequest(
    accessToken: string,
    requestId: string
  ): Promise<{ request: FriendRequestSummary }> {
    const payload = await post<{ request: FriendRequestSummary }>(
      `/connections/requests/${encodeURIComponent(requestId)}/decline`,
      accessToken
    );
    if (!payload) {
      throw new ConnectionsApiError(500, "Empty response on decline");
    }
    return payload;
  },

  async removeFriend(
    accessToken: string,
    friendId: string
  ): Promise<void> {
    await del(
      `/connections/friends/${encodeURIComponent(friendId)}`,
      accessToken
    );
  },

  async getInbox(accessToken: string): Promise<FriendInbox> {
    const payload = await request<FriendInbox>("/inbox", accessToken);
    if (!payload) {
      throw new ConnectionsApiError(500, "Empty response from inbox");
    }
    return payload;
  },
};

export { ConnectionsApiError };


