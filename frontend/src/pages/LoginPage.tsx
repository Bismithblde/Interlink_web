import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import AuthInput from "../components/AuthInput";
import AuthLayout from "../components/AuthLayout";
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
      setSuccessMessage(`Welcome back, ${welcomeName}. Redirecting now.`);

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
    <AuthLayout contentClassName="max-w-6xl">
      <section className="grid min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/30 lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="hidden border-r border-white/10 bg-black p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-lg bg-white px-3 text-sm font-semibold text-zinc-950"
            >
              Interlink
            </Link>
            <h1 className="mt-20 max-w-md text-5xl font-semibold leading-[1.02] tracking-[-0.04em]">
              Pick up where your matches left off.
            </h1>
            <p className="mt-5 max-w-sm text-base leading-7 text-zinc-400">
              Sign in to review schedule overlap, connection requests, and the
              profile details classmates see before they respond.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-zinc-400">
            {["Saved availability", "Connection inbox", "Profile context"].map(
              (item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                  {item}
                </div>
              )
            )}
          </div>
        </aside>

        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
          <form className="w-full max-w-md" onSubmit={handleSubmit}>
            <div className="mb-8">
              <p className="text-sm font-medium text-zinc-400">
                Welcome back
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-50">
                Log in to Interlink
              </h2>
              <p className="mt-3 text-base leading-7 text-zinc-400">
                Use the email and password attached to your account.
              </p>
            </div>

            <div className="grid gap-4">
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
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleCredentialChange("password")}
                required
              />
            </div>

            {errorMessage ? (
              <p
                className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300"
                role="alert"
              >
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p
                className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 shadow-sm transition duration-200 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300 active:scale-[0.99]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Log in"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Need an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-zinc-50 underline decoration-zinc-600 underline-offset-4 transition hover:decoration-zinc-50"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </section>
    </AuthLayout>
  );
};

export default LoginPage;
