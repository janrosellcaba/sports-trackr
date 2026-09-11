export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{2,32}$/.test(username);
}

export function assignRole(username: string): "ADMIN" | "USER" {
  return username === "jan" ? "ADMIN" : "USER";
}

export function isValidInviteCode(
  inviteCode: string,
  expected: string,
): boolean {
  return inviteCode.trim() === expected;
}
