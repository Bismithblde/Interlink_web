import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  CalendarDays,
  Sparkles,
  UsersRound,
  NotebookPen,
  Compass,
  ArrowRight,
  UserCircle2,
} from "lucide-react";

const shimmerBackground =
  "pointer-events-none absolute inset-0 overflow-hidden opacity-60";

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const metadata =
    (user as unknown as { user_metadata?: Record<string, unknown> })
      ?.user_metadata ?? {};

  const displayName =
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    user?.email?.split("@")[0] ||
    "there";

  const hobbiesCount = Array.isArray(metadata.hobbies)
    ? metadata.hobbies.filter((value) => `${value}`.trim().length > 0).length
    : 0;
  const classesCount = Array.isArray(metadata.classes)
    ? metadata.classes.filter((value) => `${value}`.trim().length > 0).length
    : 0;

  const featureCards = [
    {
      title: "Preview matches",
      description:
        "See who overlaps with your schedule before you commit to pairing up.",
      to: "/find-friends",
      icon: UsersRound,
      accent: "from-sky-500 via-sky-400 to-cyan-400",
    },
    {
      title: "Tune your schedule",
      description:
        "Update your free time blocks so the matcher can find better fits.",
      to: "/schedule",
      icon: CalendarDays,
      accent: "from-violet-500 via-fuchsia-400 to-sky-400",
    },
    {
      title: "Refresh your profile",
      description:
        "Keep your major, hobbies, and vibe current so people know how to collaborate with you.",
      to: "/profile",
      icon: NotebookPen,
      accent: "from-emerald-500 via-teal-400 to-sky-400",
    },
  ];

  const quickActions = [
    {
      label: "Update survey",
      description: "Resubmit the onboarding survey with fresh details.",
      to: "/survey",
      icon: Sparkles,
    },
    {
      label: "Invite a teammate",
      description: "Share Interlink with a study partner you trust.",
      to: "https://share.interlink.study",
      icon: UsersRound,
      external: true,
    },
  ];

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className={shimmerBackground}>
          <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
          <div className="absolute right-[-10%] top-[-10%] h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute bottom-[-15%] left-[30%] h-96 w-96 rounded-full bg-cyan-400/20 blur-3xl" />
        </div>
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">
            Interlink
          </span>
          <h1 className="mt-6 text-4xl font-semibold text-white sm:text-5xl">
            Match into better focus pods in minutes
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Bring your availability, we&apos;ll surface the people who mesh with
            your schedule and energy. Create an account to try the matchmaking
            preview.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className={shimmerBackground}>
        <div className="absolute -left-28 top-10 h-64 w-64 rounded-full bg-sky-500/25 blur-3xl" />
        <div className="absolute right-[-18%] top-[15%] h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[25%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <header className="mb-12 flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-500/20 text-sky-300">
                <UserCircle2 className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300">
                  Welcome back
                </p>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  Hey {displayName}, let&apos;s queue up your next pod
                </h1>
              </div>
            </div>
            <Link
              to="/find-friends"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              Continue matchmaking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="max-w-2xl text-base text-slate-300">
            Keep your profile aligned and your availability fresh. Use the
            shortcuts below to jump back into the parts of Interlink that help
            you find the right teammates faster.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
              <UsersRound className="h-4 w-4 text-sky-300" />
              {hobbiesCount} hobby
              {hobbiesCount === 1 ? "" : " tags"}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-4 py-2">
              <CalendarDays className="h-4 w-4 text-emerald-300" />
              {classesCount} course
              {classesCount === 1 ? "" : " connections"}
            </span>
          </div>
        </header>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.to}
                className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/40 transition hover:border-sky-500/40 hover:bg-slate-900/70"
              >
                <span
                  className={`absolute inset-x-[-40%] top-[-60%] h-48 rounded-full bg-gradient-to-br ${card.accent} opacity-40 blur-3xl transition group-hover:opacity-60`}
                />
                <div className="relative flex flex-col gap-4 text-left">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900/70 text-white backdrop-blur">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-semibold text-white">
                    {card.title}
                  </h2>
                  <p className="text-sm text-slate-200">{card.description}</p>
                  <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
                    Open
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60 p-8 shadow-lg shadow-slate-950/40">
            <div className="flex flex-col gap-4 text-left">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
                Roadmap
              </span>
              <h2 className="text-2xl font-semibold text-white">
                Ready when you are
              </h2>
              <p className="max-w-2xl text-sm text-slate-200">
                Matching works best when your availability, classes, and hobbies
                are all up to date. Take a minute to review the checklist and
                keep your signal strong.
              </p>
              <ul className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                <li className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 backdrop-blur">
                  <span className="mt-1 rounded-full bg-sky-500/20 p-2 text-sky-200">
                    <Compass className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">
                      Capture your cadence
                    </p>
                    <p className="text-sm text-slate-300">
                      Save at least three blocks of free time so overlap has a
                      clearer picture.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 backdrop-blur">
                  <span className="mt-1 rounded-full bg-emerald-500/20 p-2 text-emerald-200">
                    <UsersRound className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-white">
                      Call out your vibe
                    </p>
                    <p className="text-sm text-slate-300">
                      Share the hobbies and classes that would make a partner
                      feel aligned.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg shadow-slate-950/35">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-300">
              Quick actions
            </span>
            <ul className="flex flex-col gap-3 text-left text-sm text-slate-200">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const content = (
                  <span className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span className="rounded-full bg-slate-900/70 p-2">
                        <Icon className="h-4 w-4 text-white" />
                      </span>
                      <span className="flex flex-col">
                        <span className="font-semibold text-white">
                          {action.label}
                        </span>
                        <span className="text-xs text-slate-300">
                          {action.description}
                        </span>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-sky-200" />
                  </span>
                );

                return (
                  <li key={action.label}>
                    {action.external ? (
                      <a
                        href={action.to}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 transition hover:border-sky-500/40 hover:bg-slate-900/70"
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        to={action.to}
                        className="block rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 transition hover:border-sky-500/40 hover:bg-slate-900/70"
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
