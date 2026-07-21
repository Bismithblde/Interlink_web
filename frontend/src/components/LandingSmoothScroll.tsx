import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import {
  LANDING_SCROLL_LOCK_EVENT,
  LANDING_SCROLL_UNLOCK_EVENT,
} from "../utils/landingScrollLock";

gsap.registerPlugin(ScrollTrigger);

const LandingSmoothScroll = () => {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let lenis: Lenis | null = null;
    let previousOverflow = root.style.overflow;
    let scrollLocked = false;
    const updateScrollTriggers = () => ScrollTrigger.update();
    let animationFrame = 0;

    const lockScroll = (event: Event) => {
      if (scrollLocked) {
        return;
      }

      scrollLocked = true;
      previousOverflow = root.style.overflow;
      const targetY = (event as CustomEvent<{ targetY?: number }>).detail
        ?.targetY;

      if (typeof targetY === "number") {
        if (lenis) {
          lenis.scrollTo(targetY, { force: true, immediate: true });
        } else {
          const previousScrollBehavior = root.style.scrollBehavior;
          root.style.scrollBehavior = "auto";
          window.scrollTo(0, targetY);
          root.style.scrollBehavior = previousScrollBehavior;
        }
      }

      root.style.overflow = "hidden";
      lenis?.stop();
    };

    const unlockScroll = () => {
      if (!scrollLocked) {
        return;
      }

      scrollLocked = false;
      root.style.overflow = previousOverflow;
      lenis?.start();
      window.requestAnimationFrame(() => ScrollTrigger.refresh());
    };

    const animate = (time: number) => {
      lenis?.raf(time);
      animationFrame = window.requestAnimationFrame(animate);
    };

    window.addEventListener(LANDING_SCROLL_LOCK_EVENT, lockScroll);
    window.addEventListener(LANDING_SCROLL_UNLOCK_EVENT, unlockScroll);

    if (!reducedMotion) {
      lenis = new Lenis({
        anchors: true,
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
      });

      lenis.on("scroll", updateScrollTriggers);
      animationFrame = window.requestAnimationFrame(animate);
      ScrollTrigger.refresh();
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener(LANDING_SCROLL_LOCK_EVENT, lockScroll);
      window.removeEventListener(LANDING_SCROLL_UNLOCK_EVENT, unlockScroll);
      root.style.overflow = previousOverflow;
      lenis?.off("scroll", updateScrollTriggers);
      lenis?.destroy();
      ScrollTrigger.refresh();
    };
  }, []);

  return null;
};

export default LandingSmoothScroll;
