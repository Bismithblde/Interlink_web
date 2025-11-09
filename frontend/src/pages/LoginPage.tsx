import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthHeading from "../components/AuthHeading";
import AuthInput from "../components/AuthInput";
import AuthLayout from "../components/AuthLayout";
import NotebookCanvas from "../components/NotebookCanvas";
import type {
  AuthCredentials,
  SignInResponse,
  SupabaseProfileResponse,
} from "../types/user";
import { authApi, AuthApiError } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "interlink.auth.session";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<AuthCredentials>({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleCredentialChange =
    (field: keyof AuthCredentials) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setCredentials((previous) => ({
        ...previous,
        [field]: value,
      }));
    };

  const persistSession = (
    authResponse: SignInResponse,
    profile: SupabaseProfileResponse["user"]
  ) => {
    if (typeof window === "undefined") return;

    const storagePayload = {
      user: profile ?? authResponse.user ?? null,
      session: authResponse.session ?? null,
      storedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storagePayload));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!credentials.email || !credentials.password) {
      setErrorMessage("Please fill in both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const authResponse = await authApi.signIn(credentials);
      const accessToken = authResponse.session?.access_token ?? null;

      let profile: SupabaseProfileResponse["user"] = authResponse.user;

      if (accessToken) {
        try {
          const profileResponse = await authApi.getProfile(accessToken);
          profile = profileResponse.user ?? profile;
        } catch (profileError) {
          console.warn("[LoginPage] Unable to fetch profile", profileError);
        }
      }

      persistSession(authResponse, profile ?? null);

      const resolvedUser =
        profile ??
        authResponse.user ??
        authResponse.session?.user ??
        (credentials.email
          ? { id: credentials.email, email: credentials.email }
          : null);

      if (resolvedUser) {
        login(resolvedUser);
      } else {
        console.warn("[LoginPage] No user information returned from sign-in.");
      }

      const welcomeName =
        profile?.email ?? profile?.id ?? credentials.email ?? "there";
      setSuccessMessage(`Welcome back, ${welcomeName}! Redirecting you now…`);

      window.setTimeout(() => {
        setIsSubmitting(false);
        navigate("/");
      }, 800);
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : "We could not sign you in right now. Please try again.";
      console.error("[LoginPage] Sign-in failure", error);
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex w-full flex-col items-center gap-10 px-2 text-center">
        <div className="notebook-scene w-full max-w-xl">
          <NotebookCanvas as="form" onSubmit={handleSubmit}>
            <AuthHeading
              title="Login"
              eyebrow="Interlink Notebook"
              description="Welcome back. Enter your credentials to continue exploring Interlink."
            />

            <div className="mt-4 grid w-full gap-6 text-left text-sm font-medium text-slate-600">
              <AuthInput
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={credentials.email}
                onChange={handleCredentialChange("email")}
                required
              />
              <AuthInput
                id="password"
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={credentials.password}
                onChange={handleCredentialChange("password")}
                required
              />
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing you in…" : "Log In"}
            </button>

            {errorMessage && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-sm font-medium text-emerald-600" role="status">
                {successMessage}
              </p>
            )}

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-sky-200/80">
              Page 01
            </p>
            <p className="text-xs text-slate-500">
              Need an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-sky-500 underline decoration-dotted underline-offset-4 hover:text-sky-400"
              >
                Create one here
              </Link>
              .
            </p>
          </NotebookCanvas>
        </div>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
