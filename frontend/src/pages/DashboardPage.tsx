import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  NotebookPen,
  Sparkles,
  UserCircle2,
  UsersRound,
} from "lucide-react";

const profileValueCount = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item) => `${item}`.trim().length > 0).length
    : 0;

const featureCards = [
  {
    title: "Preview compatible study partners",
    description:
      "Compare schedule overlap, shared classes, and interests before sending a request.",
    to: "/find-friends",
    icon: UsersRound,
    className: "lg:col-span-5",
    image: "https://picsum.photos/seed/interlink-study-table/900/680",
  },
  {
    title: "Keep your availability honest",
    description:
      "Adjust free blocks as your week changes so every match starts from a current schedule.",
    to: "/schedule",
    icon: CalendarDays,
    className: "lg:col-span-7",
    image: "https://picsum.photos/seed/interlink-calendar-desk/1200/680",
  },
  {
    title: "Shape your signal",
    description:
      "Update the classes, hobbies, and working style that help other students understand where you fit.",
    to: "/profile",
    icon: NotebookPen,
    className: "lg:col-span-7",
    image: "https://picsum.photos/seed/interlink-campus-notebook/1200/680",
  },
  {
    title: "Plan a low-friction meetup",
    description:
      "Turn a promising connection into a concrete study session or campus hangout.",
    to: "/hangout-planner",
    icon: Sparkles,
    className: "lg:col-span-5",
    image: "https://picsum.photos/seed/interlink-evening-campus/900/680",
  },
];

const quickActions = [
  {
    label: "Refresh survey",
    description: "Update your onboarding answers with current context.",
    to: "/survey",
    icon: Sparkles,
  },
  {
    label: "Review friends",
    description: "Check accepted connections and pending study partners.",
    to: "/friends",
    icon: UsersRound,
  },
  {
    label: "Tune profile",
    description: "Edit the profile details people use to evaluate fit.",
    to: "/profile",
    icon: UserCircle2,
  },
];

const trustSignals = [
  "Schedule-first matching",
  "Profile context before requests",
  "Fast edits when your week changes",
  "Connection inbox built in",
];

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const metadata =
    (user as unknown as { user_metadata?: Record<string, unknown> })
      ?.user_metadata ?? {};

  const displayName =
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    user?.email?.split("@")[0] ||
    "there";

  const hobbiesCount = profileValueCount(metadata.hobbies);
  const classesCount = profileValueCount(metadata.classes);

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0d1110] text-stone-100">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-24 grayscale contrast-125"
          style={{
            backgroundImage:
              "url(https://picsum.photos/seed/interlink-campus-library/1920/1080)",
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(214,168,79,0.22),transparent_30%),linear-gradient(110deg,rgba(13,17,16,0.98),rgba(13,17,16,0.82)_52%,rgba(13,17,16,0.95))]"
          aria-hidden="true"
        />

        <section className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="max-w-[1120px]">
            <p className="mb-7 max-w-xl text-base font-medium text-[#d6a84f]">
              Interlink turns messy college schedules into usable study
              matches.
            </p>
            <h1 className="text-balance text-[clamp(2.35rem,7vw,6.8rem)] font-extrabold leading-[0.9] tracking-normal text-stone-50">
              Find people who can actually meet{" "}
              <span
                className="mx-2 inline-flex h-[0.58em] w-[1.35em] translate-y-[0.06em] overflow-hidden rounded-full align-baseline"
                aria-hidden="true"
              >
                <img
                  src="https://picsum.photos/seed/interlink-inline-study/360/160"
                  alt=""
                  className="h-full w-full object-cover grayscale contrast-125"
                />
              </span>
              this week.
            </h1>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(320px,0.38fr)] lg:items-end">
            <p className="max-w-2xl text-pretty text-xl leading-8 text-stone-300">
              Bring your availability, classes, and interests. Interlink shows
              where the overlap is strong enough to start a real connection.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-100 px-6 py-3 text-sm font-bold text-[#11140f] shadow-[0_24px_60px_-30px_rgba(255,255,255,0.8)] transition duration-200 hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 active:translate-y-px"
              >
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-bold text-stone-100 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 active:translate-y-px"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>

        <section className="relative border-y border-white/8 bg-[#121611]/80 py-5">
          <div className="mx-auto flex w-full max-w-7xl overflow-hidden px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-full animate-[marquee_28s_linear_infinite] gap-10 whitespace-nowrap text-sm font-semibold text-stone-300">
              {[...trustSignals, ...trustSignals].map((signal, index) => (
                <span key={`${signal}-${index}`} className="inline-flex gap-10">
                  {signal}
                  <span className="text-[#d6a84f]">/</span>
                </span>
              ))}
            </div>
          </div>
        </section>

        <footer className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-12 text-sm text-stone-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Interlink for student study groups.</p>
          <div className="flex gap-5">
            <Link className="transition hover:text-stone-100" to="/login">
              Log in
            </Link>
            <Link className="transition hover:text-stone-100" to="/signup">
              Create account
            </Link>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d1110] text-stone-100">
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(214,168,79,0.16),transparent_28%),radial-gradient(circle_at_90%_16%,rgba(95,128,105,0.2),transparent_34%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        <header className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.45fr)] lg:items-end">
          <div>
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-stone-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#d6a84f] text-[#17140c]">
                <UserCircle2 className="h-4 w-4" />
              </span>
              Welcome back, {displayName}
            </div>
            <h1 className="max-w-[1120px] text-balance text-[clamp(2.35rem,6vw,6.4rem)] font-extrabold leading-[0.92] tracking-normal text-stone-50">
              Keep your next study pod within reach.
            </h1>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.95)] backdrop-blur">
            <p className="text-pretty text-base leading-7 text-stone-300">
              Matching works best when your profile and weekly availability stay
              current. Your signal today:
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#171b15] p-4">
                <p className="text-3xl font-bold text-stone-50">
                  {hobbiesCount}
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  hobby {hobbiesCount === 1 ? "tag" : "tags"}
                </p>
              </div>
              <div className="rounded-2xl bg-[#171b15] p-4">
                <p className="text-3xl font-bold text-stone-50">
                  {classesCount}
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  course {classesCount === 1 ? "connection" : "connections"}
                </p>
              </div>
            </div>
            <Link
              to="/find-friends"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#d6a84f] px-5 py-3 text-sm font-bold text-[#151208] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e4bc67] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 active:translate-y-px"
            >
              Continue matchmaking
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="mt-28 grid grid-cols-1 gap-4 lg:grid-cols-12 lg:grid-flow-dense">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.to}
                className={`group relative min-h-[25rem] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#151915] p-6 shadow-[0_30px_90px_-62px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-[#d6a84f]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${card.className}`}
              >
                <img
                  src={card.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale contrast-125 transition duration-700 group-hover:scale-105 group-hover:opacity-42"
                />
                <span
                  className="absolute inset-0 bg-gradient-to-t from-[#0d1110] via-[#0d1110]/78 to-[#0d1110]/30"
                  aria-hidden="true"
                />
                <div className="relative flex h-full flex-col justify-between gap-10">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-[#11140f]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="max-w-xl text-balance text-3xl font-bold leading-tight text-stone-50">
                      {card.title}
                    </h2>
                    <p className="mt-4 max-w-lg text-pretty text-base leading-7 text-stone-300">
                      {card.description}
                    </p>
                    <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#d6a84f]">
                      Open
                      <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="mt-32 grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(300px,0.45fr)]">
          <article className="rounded-[1.75rem] border border-white/10 bg-[#ebe6d8] p-7 text-[#171711] shadow-[0_32px_100px_-70px_rgba(235,230,216,0.5)] sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="max-w-2xl text-balance text-4xl font-extrabold leading-tight">
                  Build a sharper profile before your next request.
                </h2>
                <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-stone-700">
                  A complete profile gives classmates enough context to respond
                  with confidence. Start with schedule overlap, then add the
                  details that make collaboration feel natural.
                </p>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#11140f] px-5 py-3 text-sm font-bold text-stone-100 transition duration-200 hover:-translate-y-0.5 hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#11140f] active:translate-y-px"
              >
                Edit profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                "Add at least three free-time blocks",
                "Keep current classes visible",
                "Name the work style you prefer",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-2xl bg-[#d9d1bd]/70 p-4 text-sm font-semibold text-stone-800"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#725318]" />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_28px_80px_-52px_rgba(0,0,0,0.95)] backdrop-blur">
            <h2 className="text-2xl font-bold text-stone-50">Fast moves</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.label}>
                    <Link
                      to={action.to}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-[#151915] px-4 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#d6a84f]/40 hover:bg-[#191e18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 active:translate-y-px"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-stone-100">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block font-bold text-stone-50">
                            {action.label}
                          </span>
                          <span className="block text-sm leading-5 text-stone-400">
                            {action.description}
                          </span>
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-[#d6a84f] transition duration-200 group-hover:translate-x-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>
        </section>

        <footer className="mt-32 flex flex-col gap-6 border-t border-white/10 pt-10 text-sm text-stone-400 md:flex-row md:items-center md:justify-between">
          <p>Interlink keeps schedules, profiles, and connection requests close.</p>
          <Link
            to="/schedule"
            className="inline-flex items-center gap-2 font-bold text-stone-100 transition hover:text-[#d6a84f]"
          >
            Open schedule
            <Compass className="h-4 w-4" />
          </Link>
        </footer>
      </div>
    </div>
  );
};

export default DashboardPage;
