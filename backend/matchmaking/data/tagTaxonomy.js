const categories = {
  academic: ["computer-science", "engineering", "design", "business", "biology", "chemistry", "physics", "mathematics", "psychology", "sociology", "history", "literature", "economics", "political-science", "environmental-science", "data-science", "artificial-intelligence", "robotics", "cybersecurity", "entrepreneurship"],
  hobby: ["gaming", "board-games", "chess", "reading", "writing", "photography", "filmmaking", "painting", "drawing", "pottery", "knitting", "cooking", "baking", "coffee", "tea", "gardening", "hiking", "camping", "cycling", "running", "swimming", "climbing", "yoga", "dance", "theater", "music", "guitar", "piano", "singing", "podcasts"],
  community: ["volunteering", "mentoring", "student-government", "cultural-clubs", "faith-community", "lgbtq-community", "international-students", "first-generation-students", "accessibility", "sustainability", "social-impact", "campus-events", "study-groups", "hackathons", "career-networking", "language-exchange", "book-club", "debate", "public-speaking", "peer-support"],
  social: ["study-buddy", "project-partner", "new-friends", "casual-hangout", "coffee-chat", "meal-buddy", "workout-partner", "gaming-group", "creative-collaboration", "professional-networking", "accountability-partner", "campus-exploration", "event-companion", "language-practice", "outdoor-adventures", "quiet-company", "group-study", "research-collaboration", "startup-team", "music-jam"],
  topic: ["web-development", "mobile-development", "product-design", "user-research", "machine-learning", "cloud-computing", "open-source", "fintech", "health-tech", "climate-tech", "space", "astronomy", "neuroscience", "philosophy", "ethics", "education", "journalism", "fashion", "architecture", "urban-planning", "sports", "basketball", "soccer", "tennis", "baseball", "formula-one", "anime", "comics", "science-fiction", "fantasy"],
};

const aliases = {
  ai: "artificial-intelligence", ml: "machine-learning", cs: "computer-science",
  videogames: "gaming", "video-games": "gaming", gym: "workout-partner",
  ux: "user-research", ui: "product-design", "coffee chats": "coffee-chat",
};

const canonicalTags = Object.entries(categories).flatMap(([category, slugs]) =>
  slugs.map((slug) => ({ id: slug, slug, label: slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" "), category, active: true }))
);

module.exports = { categories, aliases, canonicalTags };
