export const LANDING_SCROLL_LOCK_EVENT = "interlink:landing-scroll-lock";
export const LANDING_SCROLL_UNLOCK_EVENT = "interlink:landing-scroll-unlock";

type LandingScrollLockDetail = {
  targetY?: number;
};

export const setLandingScrollLocked = (locked: boolean, targetY?: number) => {
  window.dispatchEvent(
    new CustomEvent<LandingScrollLockDetail>(
      locked ? LANDING_SCROLL_LOCK_EVENT : LANDING_SCROLL_UNLOCK_EVENT,
      { detail: { targetY } },
    ),
  );
};
