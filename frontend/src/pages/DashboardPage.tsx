import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../context/AuthContext";
import {
  ArrowRight,
  CalendarDays,
  NotebookPen,
  Sparkles,
  UserCircle2,
  UsersRound,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

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
  },
  {
    title: "Keep your availability honest",
    description:
      "Adjust free blocks as your week changes so every match starts from a current schedule.",
    to: "/schedule",
    icon: CalendarDays,
  },
  {
    title: "Shape your signal",
    description:
      "Update the classes, hobbies, and working style that help other students understand where you fit.",
    to: "/profile",
    icon: NotebookPen,
  },
  {
    title: "Plan a low-friction meetup",
    description:
      "Turn a promising connection into a concrete study session or campus hangout.",
    to: "/hangout-planner",
    icon: Sparkles,
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

const landingInterests = [
  "Film",
  "Climbing",
  "Late-night study",
  "Live music",
  "Robotics",
  "Coffee walks",
  "Studio art",
];

const matchingSteps = [
  {
    title: "Share the hours you have",
    description: "Mark the windows when meeting is actually possible.",
  },
  {
    title: "Tell us what brings you alive",
    description: "Classes, hobbies, places, and the pace you prefer.",
  },
  {
    title: "Choose who feels right",
    description: "See why you match before you send a request.",
  },
];

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuth();
  const processSectionRef = useRef<HTMLElement>(null);
  const processPinRef = useRef<HTMLDivElement>(null);
  const metadata =
    (user as unknown as { user_metadata?: Record<string, unknown> })
      ?.user_metadata ?? {};

  const displayName =
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    user?.email?.split("@")[0] ||
    "there";

  const hobbiesCount = profileValueCount(metadata.hobbies);
  const classesCount = profileValueCount(metadata.classes);

  useGSAP(
    () => {
      if (isAuthenticated || !processSectionRef.current || !processPinRef.current) {
        return;
      }

      const media = gsap.matchMedia();

      media.add(
        "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
        () => {
          const section = processSectionRef.current;
          const pin = processPinRef.current;

          if (!section || !pin) {
            return;
          }

          const scenes = gsap.utils.toArray<HTMLElement>(
            section.querySelectorAll(".matching-preview__scene"),
          );
          const steps = gsap.utils.toArray<HTMLElement>(
            section.querySelectorAll(".matching-steps li"),
          );
          const dots = gsap.utils.toArray<HTMLElement>(
            section.querySelectorAll(".matching-steps__rail"),
          );
          const progress = section.querySelector<HTMLElement>(
            ".matching-steps__progress",
          );

          if (scenes.length < 2 || steps.length !== scenes.length || !progress) {
            return;
          }

          gsap.set(scenes, { autoAlpha: 0, yPercent: 8, scale: 0.97, zIndex: 0 });
          gsap.set(scenes[0], { autoAlpha: 1, yPercent: 0, scale: 1, zIndex: 1 });
          gsap.set(steps, { opacity: 0.28 });
          gsap.set(steps[0], { opacity: 1 });
          gsap.set(dots, { backgroundColor: "#cbc7bd", scale: 0.72 });
          gsap.set(dots[0], { backgroundColor: "#171817", scale: 1 });
          gsap.set(progress, { scaleY: 0, transformOrigin: "top center" });

          const timeline = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${Math.round(window.innerHeight * 3)}`,
              pin,
              pinSpacing: true,
              scrub: 0.45,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          const holdDuration = 1;
          const transitionDuration = 0.55;
          const chapterDuration = holdDuration + transitionDuration;
          const totalDuration =
            holdDuration * scenes.length + transitionDuration * (scenes.length - 1);

          timeline.to(progress, { scaleY: 1, duration: totalDuration, ease: "none" }, 0);

          for (let index = 1; index < scenes.length; index += 1) {
            const transitionStart = holdDuration + (index - 1) * chapterDuration;

            timeline
              .to(
                scenes[index - 1],
                {
                  autoAlpha: 0,
                  yPercent: -8,
                  scale: 0.97,
                  zIndex: 0,
                  duration: transitionDuration,
                },
                transitionStart,
              )
              .fromTo(
                scenes[index],
                { autoAlpha: 0, yPercent: 8, scale: 0.97, zIndex: 1 },
                {
                  autoAlpha: 1,
                  yPercent: 0,
                  scale: 1,
                  zIndex: 1,
                  duration: transitionDuration,
                },
                transitionStart,
              )
              .to(
                steps[index - 1],
                { opacity: 0.28, duration: transitionDuration },
                transitionStart,
              )
              .to(
                steps[index],
                { opacity: 1, duration: transitionDuration },
                transitionStart,
              )
              .to(
                dots[index - 1],
                {
                  backgroundColor: "#cbc7bd",
                  scale: 0.72,
                  duration: transitionDuration,
                },
                transitionStart,
              )
              .to(
                dots[index],
                {
                  backgroundColor: "#171817",
                  scale: 1,
                  duration: transitionDuration,
                },
                transitionStart,
              );
          }

          return () => timeline.kill();
        },
      );

      return () => media.revert();
    },
    { scope: processSectionRef, dependencies: [isAuthenticated] },
  );

  if (!isAuthenticated) {
    return (
      <div className="interlink-landing">
        <section className="landing-hero" aria-labelledby="landing-title">
          <img
            src="/assets/interlink-campus-dusk.png"
            alt="A softly blurred campus at sunset"
            className="landing-hero__image"
          />
          <div className="landing-hero__veil" aria-hidden="true" />
          <div className="landing-hero__content">
            <h1 id="landing-title" className="landing-display landing-hero__title">
              Meet your people.
            </h1>
            <p className="landing-hero__copy">
              Match through the hours you share, the things you love, and the
              kind of connection you are looking for.
            </p>
            <Link to="/signup" className="landing-button landing-button--ink">
              Start matching
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/login" className="landing-text-link">
              I already have an account
            </Link>
            <div className="landing-overlap-mark" aria-hidden="true">
              <span />
              <span />
            </div>
          </div>
        </section>

        <div className="landing-atmosphere">
          <section
            id="how-it-works"
            className="landing-process"
            aria-labelledby="process-title"
            ref={processSectionRef}
          >
          <div className="landing-process__pin" ref={processPinRef}>
          <div className="landing-process__inner">
            <article className="matching-preview" aria-label="Interlink matching preview">
              <header className="matching-preview__header">
                <span className="landing-display">Interlink</span>
                <span className="matching-preview__avatar">IL</span>
              </header>

              <div className="matching-preview__viewport">
                <div className="matching-preview__scene is-active">
                  <div className="matching-preview__section">
                    <h3 className="landing-display">Set your week</h3>
                    <p>Mark the windows when meeting is actually possible.</p>
                    <div className="matching-week" aria-hidden="true">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
                        <span key={`${day}-${index}`} className={index % 2 === 0 ? "is-open" : ""}>
                          {day}
                        </span>
                      ))}
                    </div>
                    <p className="matching-preview__caption">Four open windows this week</p>
                  </div>
                </div>

                <div className="matching-preview__scene">
                  <div className="matching-preview__section">
                    <h3 className="landing-display">Name your interests</h3>
                    <p>Classes, hobbies, places, and the pace you prefer.</p>
                    <div className="matching-tags">
                      {landingInterests.slice(0, 6).map((interest, index) => (
                        <span key={interest} className={index === 4 ? "is-selected" : ""}>
                          {interest}
                        </span>
                      ))}
                    </div>
                    <div className="matching-interest-orbit" aria-hidden="true">
                      <span>Robotics</span>
                      <span>Film</span>
                      <span>Climbing</span>
                    </div>
                  </div>
                </div>

                <div className="matching-preview__scene">
                  <div className="matching-preview__section matching-preview__section--overlap">
                    <h3 className="landing-display">See the overlap</h3>
                    <p>See why you match before you send a request.</p>
                    <div className="matching-preview__venn" aria-hidden="true">
                      <span />
                      <span />
                    </div>
                    <div className="matching-overlap-result">
                      <strong className="landing-display">3 shared windows</strong>
                      <span>Robotics · Film · Coffee walks</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <div className="landing-process__story">
              <h2 id="process-title" className="landing-display">
                A match starts with overlap.
              </h2>
              <ol className="matching-steps">
                <span className="matching-steps__progress" aria-hidden="true" />
                {matchingSteps.map((step, index) => (
                  <li key={step.title} className={index === 0 ? "is-active" : ""}>
                    <span className="matching-steps__rail" aria-hidden="true" />
                    <div>
                      <h3 className="landing-display">{step.title}</h3>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          </div>
          </section>

          <section className="landing-interests" aria-labelledby="interests-title">
            <p id="interests-title">Start with something you already care about.</p>
            <div className="landing-interests__track" aria-hidden="true">
              {[...landingInterests, ...landingInterests].map((interest, index) => (
                <span
                  key={`${interest}-${index}`}
                  className={interest === "Robotics" ? "is-selected" : ""}
                >
                  {interest}
                </span>
              ))}
            </div>
            <div className="landing-compatibility">
              <h2 className="landing-display">Compatibility you can understand.</h2>
              <p>
                Interlink shows the shared time, interests, and context behind
                every recommendation.
              </p>
            </div>
          </section>
        </div>

        <section className="landing-promise" aria-labelledby="promise-title">
          <h2 id="promise-title" className="landing-display landing-promise__title">
            Interlink&apos;s Promise
          </h2>
          <div className="landing-promise__stage">
            <article className="landing-promise__note landing-promise__note--left">
              <h3 className="landing-display">Context Before Connection</h3>
              <p>
                Matching should begin with more than a name. Interlink starts
                with the schedule, interests, and pace you choose to share, so
                each introduction arrives with a clear reason behind it.
              </p>
            </article>
            <img
              src="/assets/interlink-promise-orbit.png"
              alt=""
              className="landing-promise__art"
              aria-hidden="true"
            />
            <article className="landing-promise__note landing-promise__note--top">
              <h3 className="landing-display">See Why You Match</h3>
              <p>
                Shared windows and common interests stay visible from the
                start. You can understand where compatibility comes from
                before deciding whether to reach out.
              </p>
            </article>
            <article className="landing-promise__note landing-promise__note--bottom">
              <h3 className="landing-display">From Match to Meetup</h3>
              <p>
                A promising connection should not stay abstract. Turn shared
                availability into a real study session, coffee walk, or campus
                plan.
              </p>
            </article>
          </div>

          <div className="landing-final-cta">
            <h2 className="landing-display">Someone&apos;s week overlaps with yours.</h2>
            <Link to="/signup" className="landing-button landing-button--amber">
              Find them
              <ArrowRight aria-hidden="true" />
            </Link>
            <nav aria-label="Footer" className="landing-footer-links">
              <a href="#privacy-note">Privacy</a>
              <a href="#terms-note">Terms</a>
              <Link to="/login">Log in</Link>
            </nav>
            <p id="privacy-note" className="landing-legal-note">
              Your profile and schedule stay focused on helping you make a match.
              <span id="terms-note"> Use Interlink with care and respect.</span>
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="member-dashboard">
      <section className="member-hero" aria-labelledby="member-title">
        <img
          src="/assets/interlink-campus-dusk.png"
          alt="A softly blurred campus at sunset"
          className="member-hero__image"
        />
        <div className="member-hero__veil" aria-hidden="true" />
        <div className="member-hero__inner">
          <div className="member-hero__copy">
            <p className="member-eyebrow">Welcome back, {displayName}</p>
            <h1 id="member-title" className="landing-display">
              Make room for a new connection.
            </h1>
            <p>
              Your best matches begin where availability, interests, and the
              kind of company you want all meet.
            </p>
            <div className="member-hero__actions">
              <Link to="/find-friends" className="landing-button landing-button--ink">
                See your matches
                <ArrowRight aria-hidden="true" />
              </Link>
              <Link to="/schedule" className="member-secondary-link">
                Update availability
              </Link>
            </div>
          </div>

          <aside className="member-signal" aria-label="Your matching signal">
            <p>Your matching signal</p>
            <div className="member-signal__numbers">
              <div>
                <strong className="landing-display">{hobbiesCount}</strong>
                <span>hobby {hobbiesCount === 1 ? "tag" : "tags"}</span>
              </div>
              <div>
                <strong className="landing-display">{classesCount}</strong>
                <span>course {classesCount === 1 ? "connection" : "connections"}</span>
              </div>
            </div>
            <div className="member-signal__overlap" aria-hidden="true">
              <span />
              <span />
            </div>
            <Link to="/profile">
              Tune your profile
              <ArrowRight aria-hidden="true" />
            </Link>
          </aside>
        </div>
      </section>

      <section className="member-paths" aria-labelledby="member-paths-title">
        <header className="member-section-heading">
          <p>Your next move</p>
          <h2 id="member-paths-title" className="landing-display">
            Pick up where you left off.
          </h2>
        </header>
        <div className="member-paths__list">
          {featureCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link key={card.title} to={card.to} className="member-path">
                <span className="member-path__number">0{index + 1}</span>
                <span className="member-path__icon"><Icon aria-hidden="true" /></span>
                <span className="member-path__body">
                  <strong className="landing-display">{card.title}</strong>
                  <span>{card.description}</span>
                </span>
                <ArrowRight className="member-path__arrow" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="member-overlap" aria-labelledby="member-overlap-title">
        <div className="member-overlap__art" aria-hidden="true">
          <span />
          <span />
        </div>
        <div className="member-overlap__copy">
          <p>Connection starts with context</p>
          <h2 id="member-overlap-title" className="landing-display">
            Someone&apos;s week overlaps with yours.
          </h2>
          <p>
            Keep your profile honest, keep your free time current, and let the
            reason behind each recommendation stay visible.
          </p>
          <Link to="/find-friends" className="landing-button landing-button--amber">
            Find them
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="member-footer">
        <p className="landing-display">Interlink</p>
        <nav aria-label="Quick actions">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.to}>{action.label}</Link>
          ))}
        </nav>
      </footer>
    </div>
  );
};

export default DashboardPage;
