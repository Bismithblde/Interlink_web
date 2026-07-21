import { type CSSProperties, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { setLandingScrollLocked } from "../utils/landingScrollLock";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const calendarSlots = [
  { day: 0, label: "10:30 AM to 12 PM", top: 8, height: 18 },
  { day: 2, label: "2 PM to 4:30 PM", top: 43, height: 27 },
  { day: 4, label: "4 PM to 6 PM", top: 66, height: 21 },
  { day: 6, label: "11 AM to 1 PM", top: 16, height: 21 },
] as const;

const LandingProcessDemo = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const blocks = gsap.utils.toArray<HTMLElement>(
        section.querySelectorAll(".scroll-calendar__slot"),
      );
      const captionWords = gsap.utils.toArray<HTMLElement>(
        section.querySelectorAll(".calendar-sequence__word"),
      );

      if (blocks.length === 0 || captionWords.length === 0) {
        return;
      }

      const calendar = section.querySelector<HTMLElement>(".scroll-calendar");

      if (!calendar) {
        return;
      }

      gsap.set(blocks, {
        autoAlpha: 1,
        clipPath: "inset(100% 0 0 0)",
        y: 8,
      });
      gsap.set(captionWords, {
        autoAlpha: 0,
        yPercent: 120,
      });

      let scrollLocked = false;
      const unlockScroll = () => {
        if (!scrollLocked) {
          return;
        }

        scrollLocked = false;
        setLandingScrollLocked(false);
      };

      const timeline = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
        onComplete: unlockScroll,
      });

      timeline.to(blocks, {
        clipPath: "inset(0% 0 0 0)",
        y: 0,
        duration: 0.62,
        stagger: 0.38,
      });
      timeline.to(
        captionWords,
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.55,
          stagger: 0.18,
        },
        ">-0.02",
      );

      const entranceTrigger = ScrollTrigger.create({
        trigger: calendar,
        start: "center center",
        once: true,
        onEnter: () => {
          const calendarRect = calendar.getBoundingClientRect();
          const centeredScrollY =
            window.scrollY +
            calendarRect.top +
            calendarRect.height / 2 -
            window.innerHeight / 2;

          scrollLocked = true;
          setLandingScrollLocked(true, centeredScrollY);
          timeline.play(0);
        },
      });

      return () => {
        entranceTrigger.kill();
        timeline.kill();
        unlockScroll();
      };
    },
    { scope: sectionRef },
  );

  return (
    <div className="calendar-scroll-chapter" ref={sectionRef}>
      <div className="calendar-scroll-chapter__stage">
        <div className="calendar-sequence">
          <div
            className="scroll-calendar"
            role="img"
            aria-label="A weekly calendar filling with four available time blocks when it enters view"
          >
            <div className="scroll-calendar__days" aria-hidden="true">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="scroll-calendar__body">
              <div className="scroll-calendar__times" aria-hidden="true">
                <span>10am</span>
                <span>12pm</span>
                <span>2pm</span>
                <span>4pm</span>
                <span>6pm</span>
              </div>

              <div className="scroll-calendar__grid" aria-hidden="true">
                {Array.from({ length: 7 }, (_, day) => (
                  <div className="scroll-calendar__day" key={day}>
                    {calendarSlots.map((slot) =>
                      slot.day === day ? (
                        <span
                          key={slot.label}
                          className="scroll-calendar__slot"
                          style={{
                            "--slot-top": `${slot.top}%`,
                            "--slot-height": `${slot.height}%`,
                          } as CSSProperties}
                        >
                          {slot.label}
                        </span>
                      ) : null,
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="calendar-sequence__caption" aria-label="Set your time">
            {["set", "your", "time"].map((word) => (
              <span className="calendar-sequence__word-clip" aria-hidden="true" key={word}>
                <span className="calendar-sequence__word">{word}</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingProcessDemo;
