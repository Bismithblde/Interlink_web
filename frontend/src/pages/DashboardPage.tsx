import { useRef } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";
import { useAuth } from "../context/AuthContext";
import SignedInDashboard from "../components/SignedInDashboard";
import { ArrowRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);

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
  const { isAuthenticated } = useAuth();
  const processSectionRef = useRef<HTMLElement>(null);
  const processPinRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (isAuthenticated || !processSectionRef.current || !processPinRef.current) {
        return;
      }

      const media = gsap.matchMedia();

      media.add(
        "(min-width: 901px)",
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
          const marks = gsap.utils.toArray<HTMLElement>(
            section.querySelectorAll(".matching-preview__mark i"),
          );
          const progress = section.querySelector<HTMLElement>(
            ".matching-steps__progress",
          );

          if (scenes.length < 2 || steps.length !== scenes.length || !progress) {
            return;
          }

          gsap.set(scenes, { autoAlpha: 0, yPercent: 8, scale: 0.97, zIndex: 0 });
          gsap.set(scenes[0], { autoAlpha: 1, yPercent: 0, scale: 1, zIndex: 1 });
          gsap.set(steps, { opacity: 1, color: "rgba(23, 24, 23, 0.25)" });
          gsap.set(steps[0], { color: "#171817" });
          gsap.set(dots, { backgroundColor: "#cbc7bd", scale: 0.72 });
          gsap.set(dots[0], { backgroundColor: "#171817", scale: 1 });
          gsap.set(marks, { backgroundColor: "rgba(23, 24, 23, 0.18)" });
          gsap.set(marks[0], { backgroundColor: "#171817" });
          gsap.set(progress, { scaleY: 0, transformOrigin: "top center" });

          let activeIndex = 0;
          let scrollTween: gsap.core.Tween | null = null;
          let releaseTimer: ReturnType<typeof window.setTimeout> | null = null;

          const timeline = gsap.timeline({
            defaults: { ease: "power2.inOut" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${Math.round(window.innerHeight * (scenes.length - 1))}`,
              pin,
              pinSpacing: true,
              scrub: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (!scrollTween) {
                  activeIndex = Math.round(self.progress * (scenes.length - 1));
                }
              },
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
                { color: "rgba(23, 24, 23, 0.25)", duration: transitionDuration },
                transitionStart,
              )
              .to(
                steps[index],
                { color: "#171817", duration: transitionDuration },
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
              )
              .to(
                marks[index - 1],
                {
                  backgroundColor: "rgba(23, 24, 23, 0.18)",
                  duration: transitionDuration,
                },
                transitionStart,
              )
              .to(
                marks[index],
                { backgroundColor: "#171817", duration: transitionDuration },
                transitionStart,
              );
          }

          const transitionTo = (nextIndex: number) => {
            const trigger = timeline.scrollTrigger;

            if (!trigger || nextIndex < 0 || nextIndex >= scenes.length) {
              return;
            }

            activeIndex = nextIndex;
            const targetScroll =
              trigger.start +
              (trigger.end - trigger.start) * (nextIndex / (scenes.length - 1));

            scrollTween?.kill();
            scrollTween = gsap.to(window, {
              scrollTo: { y: targetScroll, autoKill: false },
              duration: 0.9,
              ease: "power3.inOut",
              overwrite: true,
              onComplete: () => {
                releaseTimer = window.setTimeout(() => {
                  scrollTween = null;
                  releaseTimer = null;
                }, 180);
              },
            });
          };

          const handleWheel = (event: WheelEvent) => {
            const trigger = timeline.scrollTrigger;

            if (!trigger || Math.abs(event.deltaY) < 8) {
              return;
            }

            const isWithinPinnedRange =
              window.scrollY >= trigger.start - 1 && window.scrollY <= trigger.end + 1;

            if (!isWithinPinnedRange) {
              return;
            }

            if (scrollTween) {
              event.preventDefault();
              return;
            }

            const direction = event.deltaY > 0 ? 1 : -1;
            const nextIndex = activeIndex + direction;

            if (nextIndex < 0 || nextIndex >= scenes.length) {
              return;
            }

            event.preventDefault();
            transitionTo(nextIndex);
          };

          window.addEventListener("wheel", handleWheel, { passive: false });

          return () => {
            window.removeEventListener("wheel", handleWheel);
            scrollTween?.kill();
            if (releaseTimer !== null) {
              window.clearTimeout(releaseTimer);
            }
            timeline.kill();
          };
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
                <span className="matching-preview__mark" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </header>

              <div className="matching-preview__viewport">
                <div className="matching-preview__scene is-active">
                  <div className="matching-preview__section">
                    <h3 className="landing-display">Set your week</h3>
                    <p>Mark the windows when meeting is actually possible.</p>
                    <div className="matching-week" aria-hidden="true">
                      {[
                        ["M", "10–12"],
                        ["T", ""],
                        ["W", "2–5"],
                        ["T", ""],
                        ["F", "4–7"],
                        ["S", ""],
                        ["S", "11–1"],
                      ].map(([day, time], index) => (
                        <span key={`${day}-${index}`} className={time ? "is-open" : ""}>
                          <b>{day}</b>
                          <i />
                          <small>{time || "Closed"}</small>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="matching-preview__scene">
                  <div className="matching-preview__section">
                    <h3 className="landing-display">Name your interests</h3>
                    <p>Classes, hobbies, places, and the pace you prefer.</p>
                    <div className="matching-interest-index" aria-hidden="true">
                      <div className="matching-interest-index__primary">
                        <span>Robotics</span>
                        <span>Film</span>
                      </div>
                      <div className="matching-interest-index__secondary">
                        <span>Climbing</span>
                        <span>Late-night study</span>
                        <span>Live music</span>
                        <span>Coffee walks</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="matching-preview__scene">
                  <div className="matching-preview__section matching-preview__section--overlap">
                    <h3 className="landing-display">See the overlap</h3>
                    <div className="matching-venn" aria-hidden="true">
                      <span className="matching-venn__label matching-venn__label--you">You</span>
                      <span className="matching-venn__label matching-venn__label--them">Them</span>
                      <i className="matching-venn__circle matching-venn__circle--you" />
                      <i className="matching-venn__circle matching-venn__circle--them" />
                      <span className="matching-venn__tag matching-venn__tag--climbing">Climbing</span>
                      <span className="matching-venn__tag matching-venn__tag--study">Late-night study</span>
                      <span className="matching-venn__tag matching-venn__tag--robotics">Robotics</span>
                      <span className="matching-venn__tag matching-venn__tag--film">Film</span>
                      <span className="matching-venn__tag matching-venn__tag--coffee">Coffee walks</span>
                      <span className="matching-venn__tag matching-venn__tag--music">Live music</span>
                      <span className="matching-venn__tag matching-venn__tag--art">Studio art</span>
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

  return <SignedInDashboard />;
};

export default DashboardPage;
