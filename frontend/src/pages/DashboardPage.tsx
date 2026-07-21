import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SignedInDashboard from "../components/SignedInDashboard";
import LandingHeroStepCycle from "../components/LandingHeroStepCycle";
import LandingProcessDemo from "../components/LandingProcessDemo";
import LandingSmoothScroll from "../components/LandingSmoothScroll";
import { ArrowRight } from "lucide-react";

const landingInterests = [
  "Film",
  "Climbing",
  "Late-night study",
  "Live music",
  "Robotics",
  "Coffee walks",
  "Studio art",
];

const DashboardPage = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return (
      <div className="interlink-landing">
        <LandingSmoothScroll />
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__snapshots" aria-hidden="true">
            <figure className="landing-snapshot landing-snapshot--week">
              <div className="landing-snapshot__week-grid">
                <span>MON</span><span>TUE</span><span>WED</span>
                <i /><i className="is-open" /><i />
                <i className="is-open" /><i className="is-open" /><i />
                <i /><i /><i className="is-open" />
              </div>
              <figcaption>your open hours</figcaption>
            </figure>
            <figure className="landing-snapshot landing-snapshot--interests">
              <div>
                <span>film</span>
                <span>climbing</span>
                <span>live music</span>
              </div>
              <figcaption>things you already love</figcaption>
            </figure>
            <figure className="landing-snapshot landing-snapshot--campus">
              <img src="/assets/interlink-campus-dusk.png" alt="" />
              <figcaption>somewhere between class and coffee</figcaption>
            </figure>
            <figure className="landing-snapshot landing-snapshot--overlap">
              <div className="landing-snapshot__overlap">
                <span>You</span>
                <span>Them</span>
                <b>THU<br />4:30</b>
              </div>
              <figcaption>a time you both have</figcaption>
            </figure>
          </div>
          <div className="landing-hero__content">
            <h1 id="landing-title" className="landing-display landing-hero__title">
              Find someone who fits your week, shares your interests, and wants
              the same kind of connection.
            </h1>
            <LandingHeroStepCycle />
            <Link to="/signup" className="landing-button landing-button--ink">
              Start matching
            </Link>
          </div>
          <a className="landing-hero__scroll-cue" href="#how-it-works">
            see how matching works
            <span aria-hidden="true" />
          </a>
        </section>

        <div className="landing-atmosphere">
          <section
            id="how-it-works"
            className="landing-process"
            aria-labelledby="process-title"
          >
            <LandingProcessDemo />
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
