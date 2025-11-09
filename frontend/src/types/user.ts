export interface UserConnection {
  id: string;
  name: string;
  avatarUrl?: string;
  status: "pending" | "accepted" | "blocked";
  mutualConnections?: number;
  lastInteractedAt?: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  age?: number;
  major?: string;
  interests?: string[];
  classes?: string[];
  bio?: string;
  favoriteSpot?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  hobbies: string[];
  connections: UserConnection[];
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

export type AuthCredentials = {
  email: string;
  password: string;
};

export interface SignupPayload extends AuthCredentials {
  name: string;
  age?: number;
  major?: string;
  hobbies?: string[];
}

export interface SupabaseUser {
  id: string;
  email?: string;
  [key: string]: unknown;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  expires_at?: number;
  user?: SupabaseUser | null;
  [key: string]: unknown;
}

export interface SignInResponse {
  user: SupabaseUser | null;
  session: SupabaseSession | null;
  provider_token?: string;
  provider_refresh_token?: string;
  [key: string]: unknown;
}

export interface SupabaseProfileResponse {
  user: SupabaseUser | null;
  [key: string]: unknown;
}

export interface UpdateProfilePayload
  extends Partial<
    Pick<
      UserProfile,
      | "name"
      | "email"
      | "age"
      | "major"
      | "interests"
      | "classes"
      | "favoriteSpot"
      | "bio"
      | "avatarUrl"
      | "bannerUrl"
      | "hobbies"
      | "metadata"
    >
  > {
  connections?: UserConnection[];
}
