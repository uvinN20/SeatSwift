const photos: Record<string, { name: string; alt: string }> = {
  colombo: { name: "destination-colombo", alt: "Colombo waterfront and skyline" },
  anuradhapura: { name: "destination-anuradhapura", alt: "The white Ruwanwelisaya stupa in Anuradhapura" },
  badulla: { name: "destination-badulla", alt: "Dunhinda Falls in the green hills near Badulla" },
  ella: { name: "destination-ella", alt: "Nine Arch Bridge surrounded by the hills of Ella" },
  galle: { name: "destination-galle", alt: "Galle Fort lighthouse framed by palm trees" },
  jaffna: { name: "destination-jaffna", alt: "The ornate entrance of Nallur Kandaswamy temple in Jaffna" },
  kandy: { name: "destination-kandy", alt: "Temple of the Tooth in Kandy" },
  matara: { name: "destination-matara", alt: "The pedestrian bridge to Paravi Duwa off Matara's coast" },
  "nuwara eliya": { name: "destination-nuwara-eliya", alt: "A misty panorama over Nuwara Eliya" },
  trincomalee: { name: "destination-trincomalee", alt: "The Shiva statue at Koneswaram Temple in Trincomalee" },
};

export function destinationPhoto(destination: string) {
  const key = destination.trim().toLowerCase().replace(/[\s-]+/g, " ");
  // Unknown destinations use the existing illustrated placeholder, never another city's photo.
  return photos[key] ?? { name: "destination-placeholder", alt: `Explore ${destination}` };
}
