/** Answer styles a visitor can pick in the panel (client-safe; no node: imports). */
export const AUDIENCES = ["recruiter", "engineer"] as const;
export type Audience = (typeof AUDIENCES)[number];
