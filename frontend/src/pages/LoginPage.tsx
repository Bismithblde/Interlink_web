import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthHeading from "../components/AuthHeading";
import AuthInput from "../components/AuthInput";
import AuthLayout from "../components/AuthLayout";
import NotebookCanvas from "../components/NotebookCanvas";
import type { AuthCredentials, SupabaseProfileResponse } from "../types/user";
import { authApi, AuthApiError } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

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

      const resolvedUser =
        profile ??
        authResponse.user ??
        authResponse.session?.user ??
        (credentials.email
          ? { id: credentials.email, email: credentials.email }
          : null);

      if (resolvedUser) {
        login(resolvedUser, authResponse.session ?? null);
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
      <div className="flex w-full flex-col items-center gap-10 px-2 text-center text-slate-100">
        <div className="notebook-scene w-full max-w-xl">
          <NotebookCanvas as="form" onSubmit={handleSubmit}>
            <AuthHeading
              title="Login"
              eyebrow="Interlink Notebook"
              description="Welcome back. Enter your credentials to continue exploring Interlink."
            />

            <div className="mt-4 grid w-full gap-6 text-left text-sm font-medium text-slate-200">
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
              className="mt-6 inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:bg-sky-800/60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing you in…" : "Log In"}
            </button>

            {errorMessage && (
              <p className="text-sm font-medium text-rose-300" role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-sm font-medium text-emerald-300" role="status">
                {successMessage}
              </p>
            )}

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-sky-200/80">
              Page 01
            </p>
            <p className="text-xs text-slate-300">
              Need an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-sky-300 underline decoration-dotted underline-offset-4 hover:text-sky-200"
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
