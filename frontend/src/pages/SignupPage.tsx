import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FormEvent, InputHTMLAttributes } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import type { SignupPayload } from "../types/user";
import { authApi, AuthApiError } from "../services/authApi";
import { useAuth } from "../context/AuthContext";

type SignupFieldProps = {
  id: string;
  label: string;
  canRevealPassword?: boolean;
} & InputHTMLAttributes<HTMLInputElement>;

const SignupField = ({
  id,
  label,
  canRevealPassword = false,
  type = "text",
  ...inputProps
}: SignupFieldProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const resolvedType = canRevealPassword && isVisible ? "text" : type;

  return (
    <label className="signup-field" htmlFor={id}>
      <span>{label}</span>
      <span className="signup-field__control">
        <input id={id} type={resolvedType} {...inputProps} />
        {canRevealPassword ? (
          <button
            type="button"
            className="signup-field__reveal"
            aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            onClick={() => setIsVisible((current) => !current)}
          >
            {isVisible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        ) : null}
      </span>
    </label>
  );
};

const SignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
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

    if (!hasAcceptedTerms) {
      setErrorMessage("Please agree to the Terms and Privacy Policy.");
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
    <div className="signup-page">
      <img
        className="signup-page__backdrop"
        src="/assets/interlink-campus-dusk.png"
        alt=""
        aria-hidden="true"
      />
      <div className="signup-page__veil" aria-hidden="true" />

      <section className="signup-page__content" aria-labelledby="signup-title">
        <div className="signup-page__intro">
          <h1 id="signup-title" className="landing-display">
            Create your Interlink account
          </h1>
          <p>
            Start with the basics. Your schedule, interests, and campus context
            come next.
          </p>
        </div>

        <form className="signup-form" onSubmit={handleSubmit} noValidate>
          <div className="signup-tabs" role="tablist" aria-label="Signup progress">
            <button type="button" role="tab" aria-selected="true" className="is-active">
              Account
            </button>
            <button type="button" role="tab" aria-selected="false" disabled>
              Profile
            </button>
          </div>

          <div className="signup-form__fields">
            <SignupField
              id="fullName"
              label="Full name"
              autoComplete="name"
              placeholder="Avery Morgan"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
            <SignupField
              id="email"
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <SignupField
              id="password"
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              canRevealPassword
              required
            />
            <SignupField
              id="confirmPassword"
              label="Confirm password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              canRevealPassword
              required
            />
          </div>

          {errorMessage ? (
            <p className="signup-form__error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="signup-form__footer">
            <label className="signup-terms">
              <input
                type="checkbox"
                checked={hasAcceptedTerms}
                onChange={(event) => setHasAcceptedTerms(event.target.checked)}
              />
              <span>
                I agree to the <span className="signup-terms__legal">Terms</span> and{" "}
                <span className="signup-terms__legal">Privacy Policy</span>
              </span>
            </label>

            <button type="submit" className="signup-submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </form>

        <p className="signup-page__login">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </div>
  );
};

export default SignupPage;
