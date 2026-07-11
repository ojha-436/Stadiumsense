/** Canonical Firestore collection paths — referenced instead of string literals
 * so a rename is a one-line change and typos become compile errors. */
export const COLLECTIONS = {
  users: "users",
  fanProfiles: "fanProfiles",
  matches: "matches",
  matchContent: (matchId: string) => `matches/${matchId}/content`,
  stalls: "stalls",
  orders: "orders",
  amenities: "amenities",
  zones: "zones",
  gates: "gates",
  transitLines: "transitLines",
  incidents: "incidents",
  opsBriefs: "opsBriefs",
  accessRequests: "accessRequests",
  posts: "posts",
  polls: "polls",
  pollVotes: (pollId: string) => `polls/${pollId}/votes`,
} as const;
