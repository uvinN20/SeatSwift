import { useSyncExternalStore } from "react";

export const useMediaQuery = (query: string): boolean =>
  useSyncExternalStore(
    (notify) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", notify);
      return () => mql.removeEventListener("change", notify);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
