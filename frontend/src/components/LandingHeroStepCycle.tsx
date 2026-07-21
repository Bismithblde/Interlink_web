import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const heroSteps = [
  "make your profile",
  "set your week",
  "name your interests",
  "meet your match",
] as const;

const transitionDuration = 980;
const reducedTransitionDuration = 460;
const cycleDuration = 3600;

const renderLetters = (text: string) =>
  Array.from(text).map((letter, index) => (
    <span
      key={`${letter}-${index}`}
      className="landing-hero-step__letter"
      style={{ "--letter-index": index } as CSSProperties}
    >
      {letter === " " ? "\u00a0" : letter}
    </span>
  ));

const LandingHeroStepCycle = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const measureRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const activeIndexRef = useRef(0);
  const animationTimerRef = useRef<number | null>(null);

  const resizeBubble = useCallback((index: number) => {
    const bubble = bubbleRef.current;
    const measure = measureRefs.current[index];

    if (!bubble || !measure) {
      return;
    }

    const horizontalPadding = 44;
    bubble.style.setProperty(
      "--hero-step-width",
      `${Math.ceil(measure.getBoundingClientRect().width + horizontalPadding)}px`,
    );
  }, []);

  useLayoutEffect(() => {
    resizeBubble(0);

    const refreshMeasurements = () => resizeBubble(activeIndexRef.current);
    window.addEventListener("resize", refreshMeasurements);
    void document.fonts?.ready.then(refreshMeasurements);

    return () => window.removeEventListener("resize", refreshMeasurements);
  }, [resizeBubble]);

  useEffect(() => {
    const scheduledFrames: number[] = [];

    const advance = () => {
      const nextIndex = (activeIndexRef.current + 1) % heroSteps.length;

      setIncomingIndex(nextIndex);
      resizeBubble(nextIndex);

      const firstFrame = window.requestAnimationFrame(() => {
        const secondFrame = window.requestAnimationFrame(() => setIsAnimating(true));
        scheduledFrames.push(secondFrame);
      });
      scheduledFrames.push(firstFrame);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      animationTimerRef.current = window.setTimeout(() => {
        activeIndexRef.current = nextIndex;
        setCurrentIndex(nextIndex);
        setIncomingIndex(null);
        setIsAnimating(false);
        animationTimerRef.current = null;
      }, reduceMotion ? reducedTransitionDuration : transitionDuration);
    };

    const interval = window.setInterval(advance, cycleDuration);

    return () => {
      window.clearInterval(interval);
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
      scheduledFrames.forEach((frame) => window.cancelAnimationFrame(frame));
    };
  }, [resizeBubble]);

  return (
    <div className={`landing-hero-step${isAnimating ? " is-animating" : ""}`}>
      <span className="landing-hero-step__number" aria-hidden="true">
        <span className="landing-hero-step__number-clip">
          <span
            key={`step-number-${currentIndex}`}
            className="landing-hero-step__number-text landing-hero-step__number-text--current"
          >
            step {currentIndex + 1}
          </span>
          {incomingIndex !== null ? (
            <span
              key={`step-number-${incomingIndex}`}
              className="landing-hero-step__number-text landing-hero-step__number-text--incoming"
            >
              step {incomingIndex + 1}
            </span>
          ) : null}
        </span>
      </span>

      <div
        ref={bubbleRef}
        className="landing-hero-step__bubble"
      >
        <span className="landing-hero-step__clip" aria-hidden="true">
          <span
            key={`phrase-${currentIndex}`}
            className="landing-hero-step__text landing-hero-step__text--current"
          >
            {renderLetters(heroSteps[currentIndex])}
          </span>
          {incomingIndex !== null ? (
            <span
              key={`phrase-${incomingIndex}`}
              className="landing-hero-step__text landing-hero-step__text--incoming"
            >
              {renderLetters(heroSteps[incomingIndex])}
            </span>
          ) : null}
        </span>
      </div>

      <span className="landing-hero-step__announcement" aria-live="polite">
        Step {currentIndex + 1}: {heroSteps[currentIndex]}
      </span>

      <span className="landing-hero-step__measures" aria-hidden="true">
        {heroSteps.map((step, index) => (
          <span
            key={step}
            ref={(node) => {
              measureRefs.current[index] = node;
            }}
          >
            {step}
          </span>
        ))}
      </span>
    </div>
  );
};

export default LandingHeroStepCycle;
