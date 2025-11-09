import { Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthHeading from "../components/AuthHeading";
import NotebookCanvas from "../components/NotebookCanvas";
import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const metadata =
    (user as unknown as { user_metadata?: Record<string, unknown> })
      ?.user_metadata ?? {};

  const toStringList = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value
        .map((entry) => `${entry}`.trim())
        .filter((entry) => entry.length > 0);
    }
    if (typeof value === "string") {
      return value
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
    return [];
  };

  const normalizeInstagram = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const withoutUrl = trimmed
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/\/+$/, "");
    const withoutAt =
      withoutUrl.startsWith("@") && withoutUrl.length > 1
        ? withoutUrl.slice(1)
        : withoutUrl;
    const compact = withoutAt.replace(/\s+/g, "");
    return compact.length > 0 ? compact : undefined;
  };

  const hobbies = toStringList(metadata.hobbies);
  const interests = toStringList(metadata.interests);
  const favoriteSpot =
    typeof metadata.favoriteSpot === "string" && metadata.favoriteSpot.trim()
      ? metadata.favoriteSpot.trim()
      : undefined;
  const classes = toStringList(metadata.classes);
  const major =
    typeof metadata.major === "string" && metadata.major.trim()
      ? metadata.major.trim()
      : undefined;
  const instagramHandle = normalizeInstagram(metadata.instagram);

  return (
    <AuthLayout>
      <div className="flex w-full flex-col items-center gap-10 px-2 text-center text-slate-100">
        <div className="notebook-scene w-full max-w-4xl">
          <NotebookCanvas className="items-stretch text-left">
            <AuthHeading
              title="Your Profile"
              eyebrow="Interlink Notebook"
              description="You are logged in. Review your details or sign out anytime."
            />

            <div className="mt-4 w-full space-y-4 rounded-3xl border border-slate-700 bg-slate-900/70 px-6 py-8 text-left text-sm text-slate-200">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                  Email
                </span>
                <span className="text-base font-medium text-slate-100">
                  {user.email ?? "Unknown"}
                </span>
              </div>
              {user.id && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    User ID
                  </span>
                  <span className="font-mono text-sm text-slate-400">
                    {user.id}
                  </span>
                </div>
              )}
              {instagramHandle && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    Instagram
                  </span>
                  <a
                    href={`https://instagram.com/${instagramHandle}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-sky-300 underline-offset-4 hover:underline"
                  >
                    @{instagramHandle}
                  </a>
                </div>
              )}
              <div className="flex flex-col gap-3 pt-4">
                {major && (
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                      Major
                    </span>
                    <span className="text-sm font-medium text-slate-100">
                      {major}
                    </span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    Hobbies
                  </span>
                  {hobbies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {hobbies.map((hobby) => (
                        <span
                          key={hobby}
                          className="inline-flex items-center rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200"
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No hobbies added yet.
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    Interests
                  </span>
                  {interests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {interests.map((interest) => (
                        <span
                          key={interest}
                          className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No interests added yet.
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                    Classes
                  </span>
                  {classes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {classes.map((course) => (
                        <span
                          key={course}
                          className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200"
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">
                      No classes added yet.
                    </span>
                  )}
                </div>

                {favoriteSpot && (
                  <div className="grid gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-left text-sm text-slate-200 shadow-inner shadow-slate-950/40">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">
                        Favorite Spot
                      </span>
                      <p className="text-sm text-slate-100">{favoriteSpot}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate("/survey", {
                    state: {
                      name:
                        typeof metadata.name === "string"
                          ? metadata.name
                          : user.email,
                      email: user.email,
                    },
                  })
                }
                className="inline-flex items-center rounded-full border border-sky-500/60 px-6 py-3 text-sm font-semibold text-sky-200 shadow-inner shadow-slate-950/40 transition hover:border-sky-400 hover:text-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              >
                Edit survey details
              </button>
            </div>
          </NotebookCanvas>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ProfilePage;
