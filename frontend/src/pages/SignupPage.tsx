import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import AuthInput from "../components/AuthInput";
import AuthLayout from "../components/AuthLayout";
import type { SignupPayload } from "../types/user";
import { authApi, AuthApiError } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage("Please complete all fields before signing up.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords must match.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const signupPayload: SignupPayload = {
        name: fullName,
        email,
        password,
      };

      await authApi.signUp(signupPayload);

      try {
        const signInResponse = await authApi.signIn({
          email,
          password,
        });
        if (signInResponse?.user) {
          login(signInResponse.user, signInResponse.session ?? null);
        }
      } catch (autoLoginError) {
        console.warn(
          "[SignupPage] Auto sign-in after signup failed; continuing to survey",
          autoLoginError
        );
      }

      navigate("/survey", {
        replace: true,
        state: {
          name: fullName,
          email,
        },
      });
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : "We could not complete your signup right now. Please try again.";
      console.error("[SignupPage] Signup failure", error);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout contentClassName="max-w-6xl">
      <section className="grid min-h-[calc(100dvh-8rem)] overflow-hidden rounded-[1.75rem] border border-white/10 bg-zinc-950 shadow-2xl shadow-black/30 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-16">
          <form className="w-full max-w-md" onSubmit={handleSubmit}>
            <div className="mb-8">
              <p className="text-sm font-medium text-zinc-400">
                Start matching
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-50">
                Create your Interlink account
              </h1>
              <p className="mt-3 text-base leading-7 text-zinc-400">
                Set up the basics now. You will add schedule and profile context
                next.
              </p>
            </div>

            <div className="grid gap-4">
              <AuthInput
                id="fullName"
                label="Full name"
                autoComplete="name"
                placeholder="Avery Morgan"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
              <AuthInput
                id="email"
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <AuthInput
                id="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <AuthInput
                id="confirmPassword"
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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

            <button
              type="submit"
              className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 shadow-sm transition duration-200 hover:bg-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300 active:scale-[0.99]"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-zinc-50 underline decoration-zinc-600 underline-offset-4 transition hover:decoration-zinc-50"
              >
                Log in
              </Link>
            </p>
          </form>
        </div>

        <aside className="hidden border-l border-white/10 bg-black p-10 lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-lg bg-white px-3 text-sm font-semibold text-zinc-950 shadow-sm"
            >
              Interlink
            </Link>
            <h2 className="mt-20 max-w-md text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-zinc-50">
              Build your profile around real availability.
            </h2>
            <p className="mt-5 max-w-sm text-base leading-7 text-zinc-400">
              Interlink starts with when you can meet, then adds classes,
              interests, and connection requests around that signal.
            </p>
          </div>
          <div className="grid gap-3 text-sm text-zinc-400">
            {[
              "Create an account",
              "Add schedule context",
              "Review compatible classmates",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-zinc-50" />
                {item}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </AuthLayout>
  );
};

export default SignupPage;
