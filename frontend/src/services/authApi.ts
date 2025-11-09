import type {
  AuthCredentials,
  SignupPayload,
  SignInResponse,
  SupabaseProfileResponse,
  SupabaseUser,
} from "../types/user";

const normalizeBaseUrl = (value?: string) => {
  if (!value) return undefined;
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

const API_BASE_URL =
  normalizeBaseUrl(import.meta.env.VITE_BACKEND_URL) ?? "http://localhost:3001";

type ErrorPayload = {
  error?: string;
  message?: string;
  details?: unknown;
};

class AuthApiError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "AuthApiError";
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
    console.warn("[authApi] Failed to parse JSON response", error);
    return null;
  }
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

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
        ? (payload as ErrorPayload).details
        : undefined;
    throw new AuthApiError(response.status, message, details);
  }

  return (payload ?? ({} as T)) as T;
};

const sanitizeSignupBody = (payload: SignupPayload) => {
  const body: Record<string, unknown> = {
    email: payload.email,
    password: payload.password,
    name: payload.name,
  };

  if (typeof payload.major === "string" && payload.major.trim()) {
    body.major = payload.major.trim();
  }

  if (typeof payload.age === "number" && Number.isFinite(payload.age)) {
    body.age = payload.age;
  }

  if (Array.isArray(payload.hobbies) && payload.hobbies.length > 0) {
    body.hobbies = payload.hobbies
      .map((hobby) => `${hobby}`.trim())
      .filter((hobby) => hobby.length > 0);
  }

  body.profile = {
    name: payload.name,
    major: body.major,
    age: body.age,
    hobbies: body.hobbies,
  };

  return body;
};

export const authApi = {
  async signUp(payload: SignupPayload) {
    return request<{ user: SupabaseUser | null }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(sanitizeSignupBody(payload)),
    });
  },

  async signIn(credentials: AuthCredentials) {
    return request<SignInResponse>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  async getProfile(accessToken: string) {
    return request<SupabaseProfileResponse>("/auth/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  async updateProfile(
    accessToken: string,
    profileUpdates: Record<string, unknown>
  ) {
    return request<{ user: SupabaseUser | null }>("/auth/profile", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(profileUpdates),
    });
  },
};

export { AuthApiError };
