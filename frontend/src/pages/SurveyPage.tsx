import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthHeading from "../components/AuthHeading";
import AuthInput from "../components/AuthInput";
import { authApi, AuthApiError } from "../services/authApi";
import type { SupabaseUser } from "../types/user";
import { useAuth } from "../context/AuthContext";

type SurveyLocationState = {
  name?: string;
  email?: string;
} | null;

const SurveyPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const locationState = (location.state ?? null) as SurveyLocationState;

  const userMetadata = useMemo(
    () =>
      (user as unknown as { user_metadata?: Record<string, unknown> })
        ?.user_metadata ?? {},
    [user]
  );

  const toInputList = (value: unknown) => {
    if (Array.isArray(value)) {
      return value.map((entry) => `${entry}`.trim()).join(", ");
    }
    if (typeof value === "string") {
      return value;
    }
    return "";
  };

  const metadataName =
    typeof userMetadata.name === "string" && userMetadata.name.trim()
      ? userMetadata.name.trim()
      : undefined;
  const metadataPreferredEmail =
    typeof userMetadata.preferredEmail === "string" &&
    userMetadata.preferredEmail.trim()
      ? userMetadata.preferredEmail.trim()
      : undefined;
  const metadataMajor =
    typeof userMetadata.major === "string" && userMetadata.major.trim()
      ? userMetadata.major.trim()
      : "";
  const metadataFavoriteSpot =
    typeof userMetadata.favoriteSpot === "string"
      ? userMetadata.favoriteSpot
      : "";

  const initialName = useMemo(
    () => locationState?.name ?? metadataName ?? "",
    [locationState, metadataName]
  );
  const initialEmail = useMemo(
    () =>
      locationState?.email ??
      metadataPreferredEmail ??
      (typeof user?.email === "string" ? user.email : ""),
    [locationState, metadataPreferredEmail, user]
  );

  const [displayName, setDisplayName] = useState(initialName);
  const [age, setAge] = useState(
    typeof userMetadata.age === "number" ? `${userMetadata.age}` : ""
  );
  const [major, setMajor] = useState(metadataMajor);
  const [interests, setInterests] = useState(
    toInputList(userMetadata.interests)
  );
  const [hobbies, setHobbies] = useState(toInputList(userMetadata.hobbies));
  const [classes, setClasses] = useState(toInputList(userMetadata.classes));
  const [favoriteSpot, setFavoriteSpot] = useState(metadataFavoriteSpot);
  const [preferredEmail, setPreferredEmail] = useState(initialEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const extractAccessToken = () => {
    try {
      const raw = localStorage.getItem("interlink.auth.session");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.session?.access_token ?? null;
    } catch (error) {
      console.warn("[SurveyPage] Failed to read stored session", error);
      return null;
    }
  };

  const toList = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = displayName.trim();
    const trimmedEmail = preferredEmail.trim();
    const ageString = `${age}`.trim();
    const hobbyList = toList(hobbies);
    const interestList = toList(interests);
    const classList = toList(classes);

    if (!trimmedName || !trimmedEmail || !ageString || hobbyList.length === 0) {
      setErrorMessage(
        "Please share your name, contact email, age, and a few hobbies."
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const accessToken = extractAccessToken();
      if (!accessToken) {
        throw new Error(
          "Your session has expired. Please log out and log back in."
        );
      }

      const trimmedFavoriteSpot = favoriteSpot.trim();
      const trimmedMajor = major.trim();

      const profilePayload: Record<string, unknown> = {
        name: trimmedName,
        preferredEmail: trimmedEmail,
        hobbies: hobbyList,
        interests: interestList,
        classes: classList,
        favoriteSpot: trimmedFavoriteSpot || undefined,
        major: trimmedMajor || undefined,
      };

      const numericAge = Number(ageString);
      if (!Number.isNaN(numericAge)) {
        profilePayload.age = numericAge;
      }

      const response = await authApi.updateProfile(
        accessToken,
        profilePayload
      );

      const updatedUser = response.user as SupabaseUser | undefined;
      if (updatedUser) {
        login(updatedUser);
      }

      setSuccessMessage(
        "Thanks! Your profile survey is saved. We’ll take you to your profile."
      );
      setTimeout(() => navigate("/profile"), 800);
    } catch (error) {
      const message =
        error instanceof AuthApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "We couldn't save your survey right now. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="flex w-full flex-col items-center gap-10 px-2">
        <form
          className="relative flex w-full flex-col gap-8 rounded-[32px] border border-white/60 bg-white/95 px-10 py-16 shadow-[0_30px_90px_-40px_rgba(15,118,110,0.45)]"
          onSubmit={handleSubmit}
        >
          <AuthHeading
            title="Shape Your Profile"
            eyebrow="Profile Survey"
            description="You're almost done! Share a few personality details so your future collaborators can get a sense of your vibe."
          />

          <div className="grid w-full gap-6 text-left text-sm font-medium text-slate-600">
            <AuthInput
              id="displayName"
              label="Full Name"
              placeholder="Avery Interlink"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              autoComplete="name"
              required
            />

            <AuthInput
              id="preferredEmail"
              label="Contact Email"
              type="email"
              placeholder="you@example.com"
              value={preferredEmail}
              onChange={(event) => setPreferredEmail(event.target.value)}
              autoComplete="email"
              required
            />

            <AuthInput
              id="age"
              label="Age"
              type="number"
              min="13"
              max="120"
              placeholder="20"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              required
            />

            <AuthInput
              id="interests"
              label="Top Interests"
              placeholder="AI, robotics, design labs…"
              value={interests}
              onChange={(event) => setInterests(event.target.value)}
            />

            <AuthInput
              id="major"
              label="Major"
              placeholder="Computer Science"
              value={major}
              onChange={(event) => setMajor(event.target.value)}
            />

            <label className="flex items-start gap-6" htmlFor="hobbies">
              <span className="w-32 shrink-0 pt-3 text-xs uppercase tracking-wide text-slate-400">
                Hobbies
              </span>
              <textarea
                id="hobbies"
                placeholder="List a few favorite ways you recharge. Separate with commas."
                className="h-24 flex-1 rounded-3xl border border-dashed border-slate-300 bg-white/90 px-6 py-4 text-sm text-slate-700 shadow-inner shadow-white/40 outline-none transition hover:border-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/60"
                value={hobbies}
                onChange={(event) => setHobbies(event.target.value)}
                required
              />
            </label>

            <AuthInput
              id="favoriteSpot"
              label="Favorite Spot"
              placeholder="Innovation hub mezzanine, campus greenhouse..."
              value={favoriteSpot}
              onChange={(event) => setFavoriteSpot(event.target.value)}
            />

            <label className="flex items-start gap-6" htmlFor="classes">
              <span className="w-32 shrink-0 pt-3 text-xs uppercase tracking-wide text-slate-400">
                Classes
              </span>
              <textarea
                id="classes"
                placeholder="List courses you're taking. Separate with commas."
                className="h-24 flex-1 rounded-3xl border border-dashed border-slate-300 bg-white/90 px-6 py-4 text-sm text-slate-700 shadow-inner shadow-white/40 outline-none transition hover:border-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-300/60"
                value={classes}
                onChange={(event) => setClasses(event.target.value)}
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 text-center">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save and Continue"}
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
            {!successMessage && (
              <p className="text-xs font-medium uppercase tracking-[0.4em] text-sky-200/80">
                Page 03
              </p>
            )}
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default SurveyPage;
