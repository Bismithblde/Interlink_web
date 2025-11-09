import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import AuthHeading from "../components/AuthHeading";
import AuthInput from "../components/AuthInput";
import AuthLayout from "../components/AuthLayout";
import NotebookCanvas from "../components/NotebookCanvas";
import type { SignupPayload } from "../types/user";
import { authApi, AuthApiError } from "../services/authApi";

const SignupPage = () => {
  const navigate = useNavigate();
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
    <AuthLayout>
      <div className="flex w-full flex-col items-center gap-10 px-2 text-center text-slate-100">
        <div className="notebook-scene w-full max-w-xl">
          <NotebookCanvas as="form" onSubmit={handleSubmit}>
            <AuthHeading
              title="Signup"
              eyebrow="Interlink Notebook"
              description="Join us by filling out the fields below. We’ll take it from here."
            />

            <div className="mt-4 grid w-full gap-6 text-left text-sm font-medium text-slate-200">
              <AuthInput
                id="fullName"
                label="Full Name"
                autoComplete="name"
                placeholder="Avery Interlink"
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
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <AuthInput
                id="confirmPassword"
                label="Confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:bg-sky-800/60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account…" : "Create Account"}
            </button>

            {errorMessage && (
              <p className="text-sm font-medium text-rose-300" role="alert">
                {errorMessage}
              </p>
            )}

            <p className="text-xs font-medium uppercase tracking-[0.4em] text-sky-200/80">
              Page 02
            </p>
            <p className="text-xs text-slate-300">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-semibold text-sky-300 underline decoration-dotted underline-offset-4 hover:text-sky-200"
              >
                Return to login
              </Link>
              .
            </p>
          </NotebookCanvas>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignupPage;
