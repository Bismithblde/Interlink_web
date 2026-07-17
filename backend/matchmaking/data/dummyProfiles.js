const archetypes = [
  {
    label: "AI builders",
    major: "Computer Science",
    interests: ["artificial intelligence", "robotics", "startups"],
    hobbies: ["chess", "coffee", "indoor climbing"],
    classes: ["CSE 320", "CSE 351", "AMS 310"],
    bio: "Builds small AI tools, enjoys robotics projects, and likes focused coffee study sessions.",
    favoriteSpot: "Engineering atrium",
    tags: ["artificial-intelligence", "robotics", "entrepreneurship", "chess"],
  },
  {
    label: "Design researchers",
    major: "Human Computer Interaction",
    interests: ["product design", "user research", "accessibility"],
    hobbies: ["photography", "drawing", "gallery visits"],
    classes: ["HCI 301", "DES 215", "PSY 260"],
    bio: "Studies inclusive product design and enjoys turning interview notes into practical prototypes.",
    favoriteSpot: "Design studio",
    tags: ["product-design", "user-research", "photography", "drawing"],
  },
  {
    label: "Campus organizers",
    major: "Business Analytics",
    interests: ["entrepreneurship", "campus events", "social impact"],
    hobbies: ["podcasts", "soccer", "volunteering"],
    classes: ["BUS 310", "AMS 315", "COM 202"],
    bio: "Organizes campus events, experiments with startup ideas, and volunteers on community projects.",
    favoriteSpot: "Student union lounge",
    tags: ["entrepreneurship", "campus-events", "social-impact", "volunteering"],
  },
  {
    label: "Data storytellers",
    major: "Data Science",
    interests: ["machine learning", "data visualization", "climate tech"],
    hobbies: ["baking", "street photography", "reading"],
    classes: ["DAT 201", "AMS 310", "CSE 351"],
    bio: "Explores machine learning and visual explanations, with a soft spot for climate datasets.",
    favoriteSpot: "Library quiet floor",
    tags: ["machine-learning", "data-science", "climate-tech", "photography"],
  },
  {
    label: "Active makers",
    major: "Mechanical Engineering",
    interests: ["robotics", "open source", "sustainability"],
    hobbies: ["basketball", "cycling", "3D printing"],
    classes: ["MEC 320", "ROB 205", "PHY 251"],
    bio: "Prototypes small robots, contributes to maker projects, and is usually up for an active break.",
    favoriteSpot: "Makerspace",
    tags: ["robotics", "open-source", "basketball", "cycling"],
  },
  {
    label: "Creative writers",
    major: "English",
    interests: ["journalism", "education", "science fiction"],
    hobbies: ["writing", "theater", "book club"],
    classes: ["ENG 301", "JRN 210", "HUM 202"],
    bio: "Writes campus stories, reads science fiction, and enjoys collaborative editing sessions.",
    favoriteSpot: "Humanities courtyard",
    tags: ["writing", "journalism", "science-fiction", "book-club"],
  },
];

const starts = [
  ["2025-01-13T14:00:00.000Z", "2025-01-13T16:00:00.000Z"],
  ["2025-01-15T15:00:00.000Z", "2025-01-15T17:00:00.000Z"],
  ["2025-01-17T18:00:00.000Z", "2025-01-17T20:00:00.000Z"],
];

const minuteOffset = (iso, minutes) =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

const dummyProfiles = Array.from({ length: 18 }, (_, index) => {
  const number = index + 1;
  const archetype = archetypes[index % archetypes.length];
  const variant = Math.floor(index / archetypes.length);
  const offset = variant * 30;

  return {
    id: `interlink-dummy-${String(number).padStart(2, "0")}`,
    name: `[TEST] Profile ${String(number).padStart(2, "0")} - ${archetype.label}`,
    email: `interlink.match.test+${String(number).padStart(3, "0")}@example.com`,
    major: archetype.major,
    graduationYear: 2026 + (index % 3),
    interests: archetype.interests,
    hobbies: archetype.hobbies,
    classes: archetype.classes,
    tags: archetype.tags,
    bio: archetype.bio,
    funFact: `Synthetic matchmaking fixture ${number}; safe to delete.`,
    favoriteSpot: archetype.favoriteSpot,
    vibeCheck: `Deterministic test archetype: ${archetype.label}`,
    openTo: ["new-friends", index % 2 ? "study-buddy" : "project-partner"],
    availability: starts.map(([start, end], slotIndex) => ({
      id: `dummy-${number}-slot-${slotIndex + 1}`,
      title: "Synthetic test availability",
      start: minuteOffset(start, offset),
      end: minuteOffset(end, offset),
      source: "matchmaking-dummy-v2",
    })),
  };
});

module.exports = dummyProfiles;
