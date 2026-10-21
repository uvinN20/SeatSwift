export type TimeBand = "morning" | "afternoon" | "evening" | "night";

export interface Filters {
  bands: TimeBand[];
  fare: [number, number];
  hideSoldOut: boolean;
}

export const BANDS: { key: TimeBand; label: string; hint: string }[] = [
  { key: "morning", label: "Morning", hint: "05:00-11:59" },
  { key: "afternoon", label: "Afternoon", hint: "12:00-16:59" },
  { key: "evening", label: "Evening", hint: "17:00-20:59" },
  { key: "night", label: "Night", hint: "21:00-04:59" },
];
