import { cookies } from "next/headers";
import { TODAY_COOKIE } from "@/lib/constants";
import { getTodayLocalDateISO, isDateKey, readTodayCookie } from "@/lib/calculations";

export async function getRequestToday(): Promise<string> {
  const store = await cookies();
  const fromCookie = readTodayCookie(store.get(TODAY_COOKIE)?.value);
  if (fromCookie) return fromCookie;
  return getTodayLocalDateISO();
}

export function resolveRequestedDate(
  raw: string | undefined,
  today: string,
): string {
  if (raw && isDateKey(raw) && raw <= today) return raw;
  return today;
}
