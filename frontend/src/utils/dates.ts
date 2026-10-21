const TZ = "Asia/Colombo";

/** Today as YYYY-MM-DD in the business timezone (matches the server's rules). */
export const todayISO = (): string =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

export const addDaysISO = (iso: string, days: number): string => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
};

export const formatLongDate = (iso: string): string => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

/** True when the trip's departure is still in the future (business timezone). */
export const isUpcoming = (travelDate: string, departureTime: string): boolean => {
  const now = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date()); // "YYYY-MM-DD HH:mm"
  return `${travelDate} ${departureTime.slice(0, 5)}` > now;
};

/** The server repeats this rule at booking submission; this helper is for UI only. */
export const isBookable = (travelDate: string, departureTime: string, now = Date.now()): boolean => {
  const departure = new Date(`${travelDate}T${departureTime}+05:30`).getTime();
  return Number.isFinite(departure) && departure >= now + 60 * 60 * 1000;
};
