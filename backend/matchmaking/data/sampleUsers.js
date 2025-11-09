/**
 * Sample availability dataset to unblock FindFriend backend work before the
 * real database and schedule ingestion flow is ready. Each entry represents an
 * existing student on the platform along with their declared free-time slots.
 *
 * NOTE: Timestamps use ISO8601 UTC strings. Frontend consumers should convert
 * them into local time for display.
 */
const sampleUsers = [
  {
    id: "user-anna-delgado",
    name: "Anna Delgado",
    email: "anna.delgado@example.edu",
    major: "Computer Science",
    graduationYear: 2026,
    instagram: "annadelgado",
    interests: ["ai", "startups", "climbing"],
    hobbies: ["indoor climbing", "espresso tasting", "teaching workshops"],
    classes: ["CS 241", "MATH 210", "ENTR 225"],
    bio: "Peer mentor in the AI society, loves edge-case debugging sessions.",
    funFact:
      "Hosted a 24-hour campus hackathon where every team had to ship a musical Easter egg.",
    favoriteSpot: "Innovation Lab mezzanine",
    vibeCheck: "Strategist who keeps Google Calendar tabs open for fun",
    availability: [
      {
        id: "anna-mon-evening",
        title: "Evening focus block",
        start: "2025-01-13T22:30:00.000Z",
        end: "2025-01-13T23:59:00.000Z",
      },
      {
        id: "anna-wed-morning",
        title: "Morning project time",
        start: "2025-01-15T14:00:00.000Z",
        end: "2025-01-15T16:30:00.000Z",
      },
      {
        id: "anna-fri-afternoon",
        title: "Campus cafe meetup",
        start: "2025-01-17T19:00:00.000Z",
        end: "2025-01-17T21:00:00.000Z",
      },
    ],
  },
  {
    id: "user-bryce-martin",
    name: "Bryce Martin",
    email: "bryce.martin@example.edu",
    major: "Mechanical Engineering",
    graduationYear: 2025,
    instagram: "brycemartin",
    interests: ["robotics", "basketball", "bouldering"],
    hobbies: ["drone photography", "pickup basketball", "espresso experiments"],
    classes: ["MECH 320", "ROBO 205", "STAT 214"],
    bio: "Building autonomous drones and always down for a pickup game.",
    funFact:
      "Built a drone programmed to photobomb graduation photos with motivational quotes.",
    favoriteSpot: "Makerspace rooftop court",
    vibeCheck: "Tinkerer with a highlight reel for everything",
    availability: [
      {
        id: "bryce-mon-evening",
        title: "Robotics lab break",
        start: "2025-01-13T22:00:00.000Z",
        end: "2025-01-14T00:00:00.000Z",
      },
      {
        id: "bryce-wed-morning",
        title: "Gym window",
        start: "2025-01-15T13:30:00.000Z",
        end: "2025-01-15T15:00:00.000Z",
      },
      {
        id: "bryce-thu-afternoon",
        title: "Prototype testing break",
        start: "2025-01-16T20:00:00.000Z",
        end: "2025-01-16T22:00:00.000Z",
      },
    ],
  },
  {
    id: "user-camila-ng",
    name: "Camila Ng",
    email: "camila.ng@example.edu",
    major: "Data Science",
    graduationYear: 2027,
    instagram: "camila.ng",
    interests: ["machine learning", "design", "volunteering"],
    hobbies: ["illustrating zines", "street photography", "late-night baking"],
    classes: ["DATA 201", "DESN 240", "HUMA 122"],
    bio: "Data visualization enthusiast and design lab TA.",
    funFact:
      "Keeps a sketchbook of color palettes inspired by random café playlists.",
    favoriteSpot: "Studio 3B light wall",
    vibeCheck: "Creative data nerd who color-codes everything",
    availability: [
      {
        id: "camila-tue-evening",
        title: "Design lab cooldown",
        start: "2025-01-14T23:00:00.000Z",
        end: "2025-01-15T01:00:00.000Z",
      },
      {
        id: "camila-wed-morning",
        title: "Studio time",
        start: "2025-01-15T14:30:00.000Z",
        end: "2025-01-15T17:00:00.000Z",
      },
      {
        id: "camila-fri-afternoon",
        title: "Project sync",
        start: "2025-01-17T18:30:00.000Z",
        end: "2025-01-17T20:30:00.000Z",
      },
    ],
  },
  {
    id: "user-darius-ali",
    name: "Darius Ali",
    email: "darius.ali@example.edu",
    major: "Business Analytics",
    graduationYear: 2026,
    instagram: "dariusbuilds",
    interests: ["startups", "soccer", "podcasts"],
    hobbies: ["micro-saas prototyping", "midnight soccer scrimmages", "podcast editing"],
    classes: ["BUSN 310", "ANLY 205", "COMM 180"],
    bio: "Launchpad fellow researching productivity for remote founders.",
    funFact:
      "Collects vintage productivity planners and actually tries every tactic in them.",
    favoriteSpot: "Campus greenhouse study nook",
    vibeCheck: "Calm operator who always brings cold brew for the crew",
    availability: [
      {
        id: "darius-mon-late",
        title: "Late night research",
        start: "2025-01-14T00:30:00.000Z",
        end: "2025-01-14T02:00:00.000Z",
      },
      {
        id: "darius-wed-morning",
        title: "Analytics workshop",
        start: "2025-01-15T15:00:00.000Z",
        end: "2025-01-15T16:30:00.000Z",
      },
      {
        id: "darius-fri-morning",
        title: "Coffee brainstorm",
        start: "2025-01-17T14:00:00.000Z",
        end: "2025-01-17T16:00:00.000Z",
      },
    ],
  },
  {
    id: "user-erin-cho",
    name: "Erin Cho",
    email: "erin.cho@example.edu",
    major: "Human Computer Interaction",
    graduationYear: 2025,
    instagram: "erindesigns",
    interests: ["ui/ux", "mentoring", "photography"],
    hobbies: ["mentoring design juniors", "night cycling", "gallery hopping"],
    classes: ["HCI 301", "DESN 215", "PHOTO 104"],
    bio: "UX researcher focusing on inclusive design for productivity tools.",
    funFact:
      "Designs custom moodboard postcards for teammates before big critiques.",
    favoriteSpot: "Adaptive Design studio critique wall",
    vibeCheck: "Quiet hype person who makes retros feel like art shows",
    availability: [
      {
        id: "erin-mon-evening",
        title: "UX critique prep",
        start: "2025-01-13T21:30:00.000Z",
        end: "2025-01-13T23:30:00.000Z",
      },
      {
        id: "erin-wed-morning",
        title: "Studio critiques",
        start: "2025-01-15T14:00:00.000Z",
        end: "2025-01-15T16:00:00.000Z",
      },
      {
        id: "erin-thu-afternoon",
        title: "Mentor hours",
        start: "2025-01-16T19:30:00.000Z",
        end: "2025-01-16T21:00:00.000Z",
      },
    ],
  },
];

module.exports = sampleUsers;

