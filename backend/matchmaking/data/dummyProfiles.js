const profileSeeds = [
  {
    name: "Maya Patel", major: "Computer Science", graduationYear: 2027,
    interests: ["artificial intelligence", "robotics", "startups"], hobbies: ["chess", "indoor climbing", "coffee tastings"],
    classes: ["CSE 320", "CSE 351", "AMS 310"], tags: ["artificial-intelligence", "robotics", "entrepreneurship", "chess"],
    bio: "I like building small tools that solve annoying everyday problems, especially when there is a hardware angle.",
    funFact: "I taught a thrift-store robot vacuum to deliver snacks.", favoriteSpot: "Engineering atrium",
    vibeCheck: "Curious, focused, and always happy to sketch an idea on a whiteboard.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Jordan Kim", major: "Human Computer Interaction", graduationYear: 2026,
    interests: ["product design", "user research", "accessibility"], hobbies: ["street photography", "drawing", "gallery visits"],
    classes: ["HCI 301", "DES 215", "PSY 260"], tags: ["product-design", "user-research", "accessibility", "photography"],
    bio: "I care about products that feel calm and intuitive, and I enjoy learning how people actually use what we make.",
    funFact: "I keep a photo diary of interesting signs around campus.", favoriteSpot: "Design studio",
    vibeCheck: "Observant, easygoing, and good at asking the question everyone else skipped.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Sofia Alvarez", major: "Business Analytics", graduationYear: 2028,
    interests: ["entrepreneurship", "campus events", "social impact"], hobbies: ["soccer", "podcasts", "volunteering"],
    classes: ["BUS 310", "AMS 315", "COM 202"], tags: ["entrepreneurship", "campus-events", "social-impact", "soccer"],
    bio: "I love bringing people together around a useful idea, from small campus events to community projects.",
    funFact: "I once organized a fundraiser in less than forty-eight hours.", favoriteSpot: "Student union lounge",
    vibeCheck: "Warm, organized, and usually the person making sure nobody is left out.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Ethan Brooks", major: "Data Science", graduationYear: 2027,
    interests: ["machine learning", "data visualization", "climate tech"], hobbies: ["baking", "reading", "street photography"],
    classes: ["DAT 201", "AMS 310", "CSE 351"], tags: ["machine-learning", "data-science", "climate-tech", "reading"],
    bio: "I enjoy finding the story inside a messy dataset and explaining it without making the explanation feel like homework.",
    funFact: "My sourdough starter is named after a statistics professor.", favoriteSpot: "Library quiet floor",
    vibeCheck: "Thoughtful, low-key, and happiest during a long problem-solving session.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Nia Robinson", major: "Mechanical Engineering", graduationYear: 2026,
    interests: ["robotics", "open source", "sustainability"], hobbies: ["basketball", "cycling", "3D printing"],
    classes: ["MEC 320", "ROB 205", "PHY 251"], tags: ["robotics", "open-source", "sustainability", "basketball"],
    bio: "I am usually prototyping something, fixing a bike, or looking for a smarter way to reuse materials.",
    funFact: "I designed and printed a replacement part for my residence hall dryer.", favoriteSpot: "Makerspace",
    vibeCheck: "Practical, upbeat, and always ready to turn a rough idea into a first version.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Leo Martinez", major: "English", graduationYear: 2028,
    interests: ["journalism", "education", "science fiction"], hobbies: ["writing", "theater", "book club"],
    classes: ["ENG 301", "JRN 210", "HUM 202"], tags: ["writing", "journalism", "science-fiction", "book-club"],
    bio: "I write campus stories and short fiction, and I am always looking for a thoughtful second reader.",
    funFact: "I have seen the same stage play in four different cities.", favoriteSpot: "Humanities courtyard",
    vibeCheck: "Conversational, imaginative, and likely to remember a small detail from your story.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Priya Shah", major: "Computer Engineering", graduationYear: 2027,
    interests: ["robotics", "embedded systems", "artificial intelligence"], hobbies: ["chess", "running", "piano"],
    classes: ["CSE 320", "ESE 280", "ROB 205"], tags: ["robotics", "artificial-intelligence", "engineering", "chess"],
    bio: "I like projects where software has to interact with the real world, especially autonomous systems.",
    funFact: "I can identify most piano chords by ear.", favoriteSpot: "New Computer Science lobby",
    vibeCheck: "Energetic, precise, and generous with debugging help.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Marcus Green", major: "Psychology", graduationYear: 2026,
    interests: ["user research", "education", "mental health"], hobbies: ["photography", "basketball", "podcasts"],
    classes: ["PSY 260", "PSY 310", "HCI 301"], tags: ["user-research", "education", "peer-support", "photography"],
    bio: "I am interested in how environments shape behavior and how research can make campus life more supportive.",
    funFact: "I host a tiny interview podcast with friends from different majors.", favoriteSpot: "Staller steps",
    vibeCheck: "Grounded, friendly, and genuinely interested in what motivates people.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Avery Chen", major: "Applied Mathematics", graduationYear: 2027,
    interests: ["data visualization", "climate tech", "public policy"], hobbies: ["cycling", "baking", "board games"],
    classes: ["AMS 310", "AMS 315", "DAT 201"], tags: ["data-science", "climate-tech", "political-science", "cycling"],
    bio: "I enjoy making quantitative ideas understandable and applying them to environmental and policy questions.",
    funFact: "I plan bike routes based on elevation data for fun.", favoriteSpot: "Math tower lounge",
    vibeCheck: "Calm, analytical, and always prepared with a surprisingly good snack.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Samira Hassan", major: "Biomedical Engineering", graduationYear: 2028,
    interests: ["health technology", "accessibility", "product design"], hobbies: ["drawing", "volunteering", "tennis"],
    classes: ["BME 205", "DES 215", "BIO 202"], tags: ["health-tech", "accessibility", "product-design", "volunteering"],
    bio: "I want to design health tools that people can understand and trust without needing a technical background.",
    funFact: "I make illustrated study guides for my lab group.", favoriteSpot: "Health Sciences library",
    vibeCheck: "Patient, creative, and good at making complicated topics feel approachable.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Owen Murphy", major: "Information Systems", graduationYear: 2026,
    interests: ["open source", "cybersecurity", "startups"], hobbies: ["indoor climbing", "coffee tastings", "board games"],
    classes: ["CSE 320", "ISE 305", "BUS 310"], tags: ["open-source", "cybersecurity", "entrepreneurship", "climbing"],
    bio: "I like building reliable systems, contributing small fixes upstream, and talking through early product ideas.",
    funFact: "I keep a spreadsheet rating every campus coffee machine.", favoriteSpot: "Engineering cafe",
    vibeCheck: "Direct, funny, and dependable when a project gets messy.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Chloe Williams", major: "Journalism", graduationYear: 2027,
    interests: ["journalism", "social impact", "campus events"], hobbies: ["writing", "street photography", "theater"],
    classes: ["JRN 210", "COM 202", "ENG 301"], tags: ["journalism", "social-impact", "campus-events", "writing"],
    bio: "I cover student organizations and local culture, with a particular interest in stories that rarely get attention.",
    funFact: "I have interviewed three touring musicians between classes.", favoriteSpot: "Student media office",
    vibeCheck: "Curious, lively, and never short on a good follow-up question.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Daniel Park", major: "Computer Science", graduationYear: 2028,
    interests: ["artificial intelligence", "machine learning", "education"], hobbies: ["chess", "running", "reading"],
    classes: ["CSE 351", "DAT 201", "AMS 310"], tags: ["artificial-intelligence", "machine-learning", "education", "chess"],
    bio: "I am exploring how adaptive software can help people learn difficult concepts at their own pace.",
    funFact: "I learned to solve a Rubik's cube from a library book.", favoriteSpot: "Central Reading Room",
    vibeCheck: "Quiet at first, deeply curious, and enthusiastic once the whiteboard comes out.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Amara Okafor", major: "Sociology", graduationYear: 2026,
    interests: ["social impact", "public policy", "mental health"], hobbies: ["volunteering", "book club", "soccer"],
    classes: ["SOC 310", "PSY 310", "COM 202"], tags: ["social-impact", "political-science", "peer-support", "volunteering"],
    bio: "I study community networks and enjoy projects that make services easier for students to find and use.",
    funFact: "I know every free museum day in the city.", favoriteSpot: "SAC courtyard",
    vibeCheck: "Welcoming, reflective, and excellent at connecting people with shared goals.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Ben Foster", major: "Environmental Studies", graduationYear: 2027,
    interests: ["sustainability", "climate tech", "public policy"], hobbies: ["cycling", "hiking", "photography"],
    classes: ["ENV 301", "DAT 201", "AMS 315"], tags: ["sustainability", "climate-tech", "political-science", "cycling"],
    bio: "I am interested in practical climate solutions and how better data can help communities make decisions.",
    funFact: "I have mapped more than fifty miles of local walking trails.", favoriteSpot: "Ashley Schiff preserve",
    vibeCheck: "Steady, outdoorsy, and happiest when a conversation leads to an actionable idea.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Lena Rossi", major: "Studio Art", graduationYear: 2028,
    interests: ["product design", "accessibility", "education"], hobbies: ["drawing", "gallery visits", "3D printing"],
    classes: ["DES 215", "HCI 301", "ARS 225"], tags: ["product-design", "accessibility", "education", "drawing"],
    bio: "I mix illustration and fabrication, and I care about making creative tools work for more kinds of people.",
    funFact: "I built a miniature printmaking press from scrap wood.", favoriteSpot: "Staller studio wing",
    vibeCheck: "Playful, perceptive, and always carrying at least two pens.", openTo: ["new-friends", "project-partner"],
  },
  {
    name: "Noah Thompson", major: "Physics", graduationYear: 2026,
    interests: ["robotics", "open source", "science communication"], hobbies: ["piano", "board games", "running"],
    classes: ["PHY 251", "ROB 205", "CSE 351"], tags: ["robotics", "open-source", "education", "board-games"],
    bio: "I like simulations, small electronics projects, and explaining physics without hiding behind equations.",
    funFact: "I built a weather station from spare lab components.", favoriteSpot: "Physics library",
    vibeCheck: "Dry sense of humor, collaborative, and willing to test every assumption.", openTo: ["new-friends", "study-buddy"],
  },
  {
    name: "Isabella Reed", major: "Marketing", graduationYear: 2027,
    interests: ["entrepreneurship", "campus events", "product design"], hobbies: ["theater", "coffee tastings", "volunteering"],
    classes: ["BUS 310", "COM 202", "DES 215"], tags: ["entrepreneurship", "campus-events", "product-design", "theater"],
    bio: "I enjoy shaping clear stories around new ideas and creating events where it is easy for people to participate.",
    funFact: "I can make latte art with a handheld milk frother.", favoriteSpot: "Wang Center cafe",
    vibeCheck: "Social, resourceful, and great at turning a loose plan into a real gathering.", openTo: ["new-friends", "project-partner"],
  },
];

const starts = [
  ["2025-01-13T14:00:00.000Z", "2025-01-13T16:00:00.000Z"],
  ["2025-01-15T15:00:00.000Z", "2025-01-15T17:00:00.000Z"],
  ["2025-01-17T18:00:00.000Z", "2025-01-17T20:00:00.000Z"],
];

const minuteOffset = (iso, minutes) =>
  new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();

module.exports = profileSeeds.map((profile, index) => {
  const number = index + 1;
  const offset = (index % 3) * 30;
  return {
    id: `interlink-dummy-${String(number).padStart(2, "0")}`,
    ...profile,
    email: `interlink.match.test+${String(number).padStart(3, "0")}@example.com`,
    availability: starts.map(([start, end], slotIndex) => ({
      id: `dummy-${number}-slot-${slotIndex + 1}`,
      title: "Available to meet",
      start: minuteOffset(start, offset),
      end: minuteOffset(end, offset),
      source: "matchmaking-dummy-v2",
    })),
  };
});
