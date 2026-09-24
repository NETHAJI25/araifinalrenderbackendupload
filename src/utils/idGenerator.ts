const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(n: number): string {
  return Array.from({ length: n }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join("");
}

/**
 * Generates a Team ID like: IA26-7F4K9
 * NOTE: In production this must be server-generated to avoid collisions.
 */
export function generateTeamId(): string {
  return `IA26-${randomChars(5)}`;
}

/**
 * Generates a Submission ID like: IA26-SUB-8H4K21
 */
export function generateSubmissionId(): string {
  return `IA26-SUB-${randomChars(6)}`;
}
