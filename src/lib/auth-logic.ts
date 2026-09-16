export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{2,32}$/.test(username);
}

export function isValidInviteCode(
  inviteCode: string,
  expected: string,
): boolean {
  const left = inviteCode.trim();
  const right = expected.trim();
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

export function isAdminUser(username: string): boolean {
  return normalizeUsername(username) === "jan";
}

export function confirmsUsername(
  username: string,
  confirmation: string,
): boolean {
  return normalizeUsername(confirmation) === normalizeUsername(username);
}

export function validatePassword(
  password: string,
  maxLength: number,
): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > maxLength) {
    return `Password must be ${maxLength} characters or fewer.`;
  }
  return null;
}
