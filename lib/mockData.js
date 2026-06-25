// ── GIGGROUND MOBILE — SEED / MOCK DATA ───────────────────────────────────────
// Populates every screen so the app is fully demoable with no backend.

export const DEMO_WORKER = {
  id: "u_rahul",
  name: "Rahul Kumar",
  email: "rahul@test.com",
  type: "user",
  city: "Chennai",
  area: "Velachery",
  bio: "Available for local gigs around Chennai. Reliable, punctual.",
  skills: "General help, Moving, Event setup",
  phone: "+91 98xxxxxx21",
  rating: 4.8,
  gigsDone: 12,
  earned: 14200,
  kyc_status: "unverified",
  socials: { linkedin: "", instagram: "", portfolio: "" },
};

export const DEMO_BUSINESS = {
  id: "b_biryani",
  name: "Bombay Biryani House",
  email: "biryani@test.com",
  type: "business",
  city: "Chennai",
  area: "T Nagar",
  bizCategory: "Food & Restaurant",
  bio: "Popular biryani spot. We hire event & kitchen help regularly.",
  rating: 4.6,
  gigsDone: 34,
  kyc_status: "verified",
};

export const SEED_USERS = [DEMO_WORKER, DEMO_BUSINESS];

// pay: amount + unit ("hr" | "day" | "fixed")
export const SEED_GIGS = [
  { id: "g1", title: "Event Staff", who: "Bombay Biryani House", initials: "BB", area: "T Nagar", payAmount: 600, payUnit: "hr", type: "ONE TIME", gigSubType: "quick", urgent: false, hrs: "5 hrs", timing: "Today", category: "Hospitality", openings: 3, postedAgo: "12m", desc: "Help manage crowd flow at our Eid special event. Be friendly, show up on time. No experience needed." },
  { id: "g2", title: "Photo Assistant", who: "Studio K", initials: "SK", area: "Nungambakkam", payAmount: 900, payUnit: "hr", type: "ONE TIME", gigSubType: "quick", urgent: false, hrs: "4 hrs", timing: "This week", category: "Media", openings: 1, postedAgo: "40m", desc: "Assist lead photographer at a bridal shoot. Carry gear, manage lighting stands, keep set tidy." },
  { id: "g3", title: "Delivery Rider", who: "Quick Logistics", initials: "QL", area: "Guindy", payAmount: 450, payUnit: "hr", type: "FLEXIBLE", gigSubType: "shift", urgent: false, hrs: "Flexible", timing: "Flexible", category: "Logistics", openings: 5, postedAgo: "1h", desc: "Two-wheeler deliveries within 5km. Own bike + license required. Flexible hours, paid per shift." },
  { id: "g4", title: "Salon Assistant", who: "Glam Studio", initials: "GS", area: "Velachery", payAmount: 550, payUnit: "hr", type: "FLEXIBLE", gigSubType: "shift", urgent: false, hrs: "6 hrs", timing: "This week", category: "Beauty", openings: 2, postedAgo: "2h", desc: "Front-desk + assist stylists on weekends. Friendly attitude, basic English/Tamil." },
  { id: "g5", title: "DJ Setup Crew", who: "The Vinyl Room", initials: "VR", area: "Nungambakkam", payAmount: 800, payUnit: "hr", type: "ONE TIME", gigSubType: "quick", urgent: true, hrs: "6 hrs", timing: "Today", category: "Events", openings: 3, postedAgo: "20m", desc: "Load in/out and set up sound gear for Saturday night. Some lifting involved. Tonight 8pm–2am." },
  { id: "g6", title: "Catering Server", who: "Bombay Biryani House", initials: "BB", area: "T Nagar", payAmount: 500, payUnit: "hr", type: "ONE TIME", gigSubType: "quick", urgent: false, hrs: "5 hrs", timing: "This week", category: "Hospitality", openings: 4, postedAgo: "3h", desc: "Serve at a private function. Black formals provided. Must be presentable and quick on feet." },
  { id: "g7", title: "Warehouse Loader", who: "Quick Logistics", initials: "QL", area: "Ambattur", payAmount: 700, payUnit: "day", type: "ONE TIME", gigSubType: "quick", urgent: true, hrs: "8 hrs", timing: "Today", category: "Logistics", openings: 6, postedAgo: "35m", desc: "One-day loading job at the depot. Heavy lifting. High pay — worth the travel for the right people." },
  { id: "g8", title: "Promoter", who: "Glam Studio", initials: "GS", area: "Adyar", payAmount: 600, payUnit: "hr", type: "ONE TIME", gigSubType: "quick", urgent: false, hrs: "4 hrs", timing: "This week", category: "Marketing", openings: 2, postedAgo: "5h", desc: "Hand out flyers and talk up our new salon offers at a mall kiosk. Outgoing personality a must." },
  { id: "g9", title: "Kitchen Helper", who: "Bombay Biryani House", initials: "BB", area: "T Nagar", payAmount: 550, payUnit: "hr", type: "FLEXIBLE", gigSubType: "shift", urgent: false, hrs: "6 hrs", timing: "Flexible", category: "Hospitality", openings: 2, postedAgo: "6h", desc: "Prep + dishwashing during dinner rush. Recurring evening shifts, paid hourly." },
  { id: "g10", title: "Event Photographer", who: "Studio K", initials: "SK", area: "Nungambakkam", payAmount: 1200, payUnit: "hr", type: "ONE TIME", gigSubType: "quick", urgent: true, hrs: "3 hrs", timing: "Today", category: "Media", openings: 1, postedAgo: "15m", desc: "Cover a corporate event. Bring your own DSLR. Premium pay for an experienced shooter." },
  { id: "g11", title: "Moving Help", who: "Self · Priya S", initials: "PS", area: "Adyar", payAmount: 1500, payUnit: "fixed", type: "ONE TIME", gigSubType: "quick", urgent: false, hrs: "3 hrs", timing: "This week", category: "General", openings: 2, postedAgo: "8h", desc: "Need 2 people to help shift furniture to a 2nd-floor flat. Lump sum for the job." },
  { id: "g12", title: "Cashier (Weekend)", who: "Glam Studio", initials: "GS", area: "Velachery", payAmount: 600, payUnit: "day", type: "FLEXIBLE", gigSubType: "shift", urgent: false, hrs: "Weekend", timing: "This week", category: "Retail", openings: 1, postedAgo: "1d", desc: "Handle billing on Sat & Sun. Basic counting + UPI handling. Daily pay." },
];

// Lightweight full-time / part-time job board
export const SEED_JOBS_BOARD = [
  { id: "j1", title: "Store Manager", who: "Glam Studio", initials: "GS", area: "Velachery", payAmount: 28000, payUnit: "month", jobType: "Full-time", postedAgo: "2d", desc: "Run day-to-day operations of our flagship salon. 1+ yr retail experience preferred." },
  { id: "j2", title: "Delivery Executive", who: "Quick Logistics", initials: "QL", area: "Guindy", payAmount: 18000, payUnit: "month", jobType: "Full-time", postedAgo: "3d", desc: "Daily routes across south Chennai. Bike + license. Fuel allowance included." },
  { id: "j3", title: "Weekend Barista", who: "The Vinyl Room", initials: "VR", area: "Nungambakkam", payAmount: 12000, payUnit: "month", jobType: "Part-time", postedAgo: "4d", desc: "Sat–Sun coffee + counter. Training provided. Great for students." },
  { id: "j4", title: "Social Media Intern", who: "Studio K", initials: "SK", area: "Nungambakkam", payAmount: 10000, payUnit: "month", jobType: "Part-time", postedAgo: "5d", desc: "Shoot reels, post content, reply to DMs. 4 hrs/day, flexible." },
];

export const SEED_POSTS = [
  { id: "p1", type: "errand", title: "Need someone to pick up medicines", body: "Anyone near Velachery who can grab a prescription from Apollo and drop it? Will pay for travel + a tip.", area: "Velachery", authorName: "Meena Kumari", initials: "MK", authorType: "user", votes: 6, postedAgo: "8m", comments: [{ id: "c1", who: "Kiran Babu", body: "I'm nearby, can do it in an hour.", ago: "5m" }] },
  { id: "p2", type: "info", title: "New EB office timings", body: "The electricity board office in T Nagar now opens at 9am, not 10. Saved me a wait today.", area: "T Nagar", authorName: "Arjun Nair", initials: "AN", authorType: "user", votes: 14, postedAgo: "30m", comments: [] },
  { id: "p3", type: "alert", title: "Water cut tomorrow — Anna Nagar", body: "Metro water supply will be off 6am–2pm tomorrow for pipeline work. Store water tonight.", area: "Anna Nagar", authorName: "Lakshmi Priya", initials: "LP", authorType: "user", votes: 22, postedAgo: "1h", comments: [{ id: "c2", who: "Suresh Babu", body: "Thanks for the heads up!", ago: "40m" }] },
  { id: "p4", type: "rental", title: "Spacious 2BHK — Anna Nagar West", body: "Well-maintained apartment in a calm residential street. Close to metro and daily market. 24hr water supply, power backup, covered parking. Ideal for a small family or working couple.", area: "Anna Nagar", authorName: "Suresh Kumar", initials: "SK", authorType: "user", rent: 18000, rentalType: "Apartment", bedrooms: 2, bathrooms: 1, floor: "3rd floor", furnished: "Semi-furnished", availableFrom: "July 2026", amenities: ["24hr water", "Power backup", "Parking", "Lift", "CCTV"], photos: [], photoCount: 0, heroColor: "#2d3a5e", coords: { lat: 13.0891, lng: 80.2104 }, verified: true, ownerPhone: "+91 98xxxxxx11", votes: 8, postedAgo: "1h", comments: [] },
  { id: "p5", type: "rental", title: "Furnished room with attached bath — Adyar", body: "Clean furnished room in a quiet building. Meals optional. Working professionals only. 5 min from bus stop and supermarket.", area: "Adyar", authorName: "Divya Rajan", initials: "DR", authorType: "user", rent: 8500, rentalType: "PG", bedrooms: 1, bathrooms: 1, floor: "1st floor", furnished: "Fully furnished", availableFrom: "Immediate", amenities: ["WiFi", "AC", "Meals optional", "Laundry"], photos: [], photoCount: 0, heroColor: "#1C1E26", coords: { lat: 13.0063, lng: 80.2574 }, verified: false, ownerPhone: "+91 99xxxxxx45", votes: 5, postedAgo: "4h", comments: [] },
  { id: "p9", type: "rental", title: "3BHK Premium flat — near Adyar beach", body: "Top-floor flat in a gated community, sea view from the terrace. Fully furnished with modular kitchen and AC in all rooms. 24hr security, gym on site.", area: "Adyar", authorName: "Ramesh Venkat", initials: "RV", authorType: "user", rent: 32000, rentalType: "Apartment", bedrooms: 3, bathrooms: 2, floor: "Top floor", furnished: "Fully furnished", availableFrom: "August 2026", amenities: ["AC", "Modular kitchen", "Parking", "24hr security", "Gym", "Sea view"], photos: [], photoCount: 0, heroColor: "#4338CA", coords: { lat: 13.0080, lng: 80.2620 }, verified: true, ownerPhone: "+91 94xxxxxx77", votes: 12, postedAgo: "30m", comments: [] },
  { id: "p10", type: "rental", title: "1BHK near Velachery metro — immediate", body: "Compact and clean 1BHK, 5 min walk to the metro. Great for a single professional. Power backup and secure building.", area: "Velachery", authorName: "Kavitha S", initials: "KS", authorType: "user", rent: 11500, rentalType: "Apartment", bedrooms: 1, bathrooms: 1, floor: "2nd floor", furnished: "Semi-furnished", availableFrom: "Immediate", amenities: ["Power backup", "24hr water", "CCTV", "Parking"], photos: [], photoCount: 0, heroColor: "#374151", coords: { lat: 12.9815, lng: 80.2180 }, verified: false, ownerPhone: "+91 97xxxxxx22", votes: 4, postedAgo: "6h", comments: [] },
  { id: "p6", type: "errand", title: "Help assembling a wardrobe", body: "Bought a flat-pack wardrobe, need a hand putting it together this weekend. 2 hrs max.", area: "Mylapore", authorName: "Karthik M", initials: "KM", authorType: "user", votes: 2, postedAgo: "5h", comments: [] },
  { id: "p7", type: "info", title: "Good cheap printer shop", body: "The shop opposite Guindy station does ₹1/page B&W and they're fast. Bookmarking for everyone.", area: "Guindy", authorName: "Priya S", initials: "PS", authorType: "user", votes: 9, postedAgo: "7h", comments: [] },
  { id: "p8", type: "alert", title: "Road closed near Adyar signal", body: "Drainage work, one lane shut. Add 15 min to your commute or take the bypass.", area: "Adyar", authorName: "Rahul Kumar", initials: "RK", authorType: "user", votes: 11, postedAgo: "9h", comments: [] },
];

// Worker's own applications (drives dashboard + status tracker)
export const SEED_APPLICATIONS = [
  { id: "a1", gigId: "g1", gigTitle: "Event Staff", who: "Bombay Biryani House", initials: "BB", area: "T Nagar", payAmount: 600, payUnit: "hr", hrs: "5 hrs", status: "confirmed", appliedAgo: "2h" },
  { id: "a2", gigId: "g3", gigTitle: "Delivery Rider", who: "Quick Logistics", initials: "QL", area: "Guindy", payAmount: 450, payUnit: "hr", hrs: "Flexible", status: "applied", appliedAgo: "1d" },
  { id: "a3", gigId: "g6", gigTitle: "Catering Server", who: "Bombay Biryani House", initials: "BB", area: "T Nagar", payAmount: 500, payUnit: "hr", hrs: "5 hrs", status: "done", appliedAgo: "3d" },
];

export const SEED_CHATS = [
  { id: "ch1", name: "Bombay Biryani House", initials: "BB", gigId: "g1", gigTitle: "Event Staff", bookingScoped: true, unread: 1, messages: [
    { id: "m1", fromMe: false, body: "Hi Rahul! We've confirmed you for the Event Staff gig tonight. 7pm sharp at the T Nagar branch.", time: "5:10 PM" },
    { id: "m2", fromMe: true, body: "Great, thank you! I'll be there by 6:50.", time: "5:12 PM" },
    { id: "m3", fromMe: false, body: "Perfect. Ask for Imran at the counter. Wear something formal if you can.", time: "5:14 PM" },
  ] },
  { id: "ch2", name: "Studio K", initials: "SK", gigId: "g2", gigTitle: "Photo Assistant", bookingScoped: true, unread: 0, messages: [
    { id: "m4", fromMe: false, body: "Hi! Are you free Saturday morning for the bridal shoot?", time: "Tue" },
    { id: "m5", fromMe: true, body: "Yes I am — what time should I reach?", time: "Tue" },
  ] },
];

export const SEED_NOTIFICATIONS = [
  { id: "n1", type: "accepted", title: "You're confirmed!", body: "Bombay Biryani House accepted you for Event Staff.", postedAgo: "2h", read: false },
  { id: "n2", type: "message", title: "New message", body: "Studio K: Are you free Saturday morning?", postedAgo: "1d", read: false },
  { id: "n3", type: "gig", title: "New gig near you", body: "Event Photographer · ₹1,200/hr in Nungambakkam.", postedAgo: "1d", read: true },
  { id: "n4", type: "applied", title: "Application sent", body: "You applied to Delivery Rider at Quick Logistics.", postedAgo: "1d", read: true },
  { id: "n5", type: "review", title: "You got a 5★ review", body: "Bombay Biryani House rated your Catering Server gig.", postedAgo: "3d", read: true },
  { id: "n6", type: "community", title: "Reply on your post", body: "Someone commented on your Anna Nagar water-cut alert.", postedAgo: "4d", read: true },
];
