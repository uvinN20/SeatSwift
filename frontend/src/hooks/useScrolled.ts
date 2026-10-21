import { useSyncExternalStore } from "react";

const subscribe = (notify: () => void) => {
  window.addEventListener("scroll", notify, { passive: true });
  return () => window.removeEventListener("scroll", notify);
};

export const useScrolled = (threshold = 8): boolean =>
  useSyncExternalStore(subscribe, () => window.scrollY > threshold, () => false);
