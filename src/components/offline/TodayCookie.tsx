"use client";

import { useEffect } from "react";
import {
  getTodayLocalDateISO,
  shouldReloadForToday,
  todayCookieHeader,
  todayFromCookieString,
} from "@/lib/calculations";

const RELOAD_GUARD = "trackr_today_reload";

function msUntilNextLocalMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 250;
}

function publishDeviceToday(): string {
  const local = getTodayLocalDateISO();
  if (todayFromCookieString(document.cookie) !== local) {
    document.cookie = todayCookieHeader(local);
  }
  return local;
}

function reloadIfStale(serverToday: string, deviceToday: string) {
  if (!shouldReloadForToday(serverToday, deviceToday)) {
    sessionStorage.removeItem(RELOAD_GUARD);
    return;
  }
  if (sessionStorage.getItem(RELOAD_GUARD) === deviceToday) return;
  sessionStorage.setItem(RELOAD_GUARD, deviceToday);
  window.location.replace(window.location.href);
}

export function TodayCookie({ serverToday }: { serverToday: string }) {
  useEffect(() => {
    function sync() {
      reloadIfStale(serverToday, publishDeviceToday());
    }

    sync();
    const onFocus = () => sync();
    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    let midnightTimer = window.setTimeout(function onMidnight() {
      sync();
      midnightTimer = window.setTimeout(onMidnight, msUntilNextLocalMidnight());
    }, msUntilNextLocalMidnight());
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.clearTimeout(midnightTimer);
    };
  }, [serverToday]);

  return null;
}
