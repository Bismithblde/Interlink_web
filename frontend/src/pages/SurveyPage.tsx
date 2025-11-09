import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthHeading from "../components/AuthHeading";
import AuthInput from "../components/AuthInput";
import NotebookCanvas from "../components/NotebookCanvas";
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
  const { login, user, logout, session } = useAuth();
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
  const metadataInstagram =
    typeof userMetadata.instagram === "string" && userMetadata.instagram.trim()
      ? userMetadata.instagram.trim()
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
  const [instagram, setInstagram] = useState(metadataInstagram);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toList = (value: string) =>
    value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

  const normalizeInstagram = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    const withoutUrl = trimmed
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/\/+$/, "");
    const withoutAt =
      withoutUrl.startsWith("@") && withoutUrl.length > 1
        ? withoutUrl.slice(1)
        : withoutUrl;
    return withoutAt.replace(/\s+/g, "");
  };

  const handleExpiredSession = (message?: string) => {
    logout();
    setSuccessMessage(null);
    setErrorMessage(
      message ??
        "Your session has expired. Please log in again to edit your profile."
    );
    window.setTimeout(() => {
      navigate("/login", {
        replace: true,
        state: { redirectTo: "/survey" },
      });
    }, 1200);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = displayName.trim();
    const trimmedEmail = preferredEmail.trim();
    const ageString = `${age}`.trim();
    const hobbyList = toList(hobbies);
    const interestList = toList(interests);
    const classList = toList(classes);
    const instagramHandle = normalizeInstagram(instagram);

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
      const accessToken = session?.access_token ?? null;
      if (!accessToken) {
        handleExpiredSession(
          "Your session has expired. Please log in again before editing your profile."
        );
        return;
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

      if (instagram.trim().length > 0 || metadataInstagram) {
        profilePayload.instagram = instagramHandle ? instagramHandle : null;
      }

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
      if (error instanceof AuthApiError && error.status === 401) {
        console.warn("[SurveyPage] Session token rejected, forcing re-login");
        handleExpiredSession(
          "Your session has expired. Please log in again before editing your profile."
        );
        return;
      }
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
      <div className="flex w-full flex-col items-center gap-10 px-2 text-slate-100">
        <div className="notebook-scene w-full max-w-4xl">
          <NotebookCanvas
            as="form"
            onSubmit={handleSubmit}
            className="items-stretch text-left"
          >
            <AuthHeading
              title="Shape Your Profile"
              eyebrow="Profile Survey"
              description="You're almost done! Share a few personality details so your future collaborators can get a sense of your vibe."
            />

            <div className="grid w-full gap-6 text-left text-sm font-medium text-slate-200">
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
                id="instagram"
                label="Instagram (optional)"
                placeholder="@yourhandle"
                value={instagram}
                onChange={(event) => setInstagram(event.target.value)}
                autoComplete="off"
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
                  className="h-24 flex-1 rounded-3xl border border-dashed border-slate-600 bg-slate-900/60 px-6 py-4 text-sm text-slate-100 shadow-inner shadow-slate-950/40 outline-none transition hover:border-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
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
                  className="h-24 flex-1 rounded-3xl border border-dashed border-slate-600 bg-slate-900/60 px-6 py-4 text-sm text-slate-100 shadow-inner shadow-slate-950/40 outline-none transition hover:border-slate-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/40"
                  value={classes}
                  onChange={(event) => setClasses(event.target.value)}
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 text-center text-slate-200">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 disabled:cursor-not-allowed disabled:bg-sky-800/60"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save and Continue"}
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
              {!successMessage && (
                <p className="text-xs font-medium uppercase tracking-[0.4em] text-sky-200/80">
                  Page 03
                </p>
              )}
            </div>
          </NotebookCanvas>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SurveyPage;
