import { Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import AuthHeading from "../components/AuthHeading";
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

  return (
    <AuthLayout>
      <div className="flex w-full flex-col items-center gap-10 px-2 text-center">
        <div className="relative flex w-full flex-col items-center gap-6 rounded-[32px] border border-white/60 bg-white/95 px-10 py-16 text-center shadow-[0_30px_90px_-40px_rgba(15,118,110,0.45)]">
          <AuthHeading
            title="Your Profile"
            eyebrow="Interlink Notebook"
            description="You are logged in. Review your details or sign out anytime."
          />

          <div className="mt-4 w-full space-y-4 rounded-3xl border border-sky-100 bg-slate-50 px-6 py-8 text-left text-sm text-slate-600">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                Email
              </span>
              <span className="text-base font-medium text-slate-900">
                {user.email ?? "Unknown"}
              </span>
            </div>
            {user.id && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                  User ID
                </span>
                <span className="font-mono text-sm text-slate-500">
                  {user.id}
                </span>
              </div>
            )}
            <div className="flex flex-col gap-3 pt-4">
              {major && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                    Major
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {major}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                  Hobbies
                </span>
                {hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((hobby) => (
                      <span
                        key={hobby}
                        className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">
                    No hobbies added yet.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                  Interests
                </span>
                {interests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">
                    No interests added yet.
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                  Classes
                </span>
                {classes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {classes.map((course) => (
                      <span
                        key={course}
                        className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600"
                      >
                        {course}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-slate-500">
                    No classes added yet.
                  </span>
                )}
              </div>

              {favoriteSpot && (
                <div className="grid gap-3 rounded-2xl bg-white/60 p-4 text-left text-sm text-slate-600 shadow-inner">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                      Favorite Spot
                    </span>
                    <p className="text-sm text-slate-700">{favoriteSpot}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
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
            className="inline-flex items-center rounded-full border border-sky-400 px-6 py-3 text-sm font-semibold text-sky-500 shadow-inner transition hover:bg-sky-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
          >
            Edit survey details
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ProfilePage;
