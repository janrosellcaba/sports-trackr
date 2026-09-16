"use client";

import { useEffect } from "react";
import { getTodayLocalDateISO, todayCookieHeader } from "@/lib/calculations";

function msUntilNextLocalMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime() + 250;
}

export function TodayCookie() {
  useEffect(() => {
    function write() {
      document.cookie = todayCookieHeader(getTodayLocalDateISO());
    }
    write();
    const onFocus = () => write();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    let midnightTimer = window.setTimeout(function onMidnight() {
      const previous = getTodayLocalDateISO(new Date(Date.now() - 1000));
      write();
      const next = getTodayLocalDateISO();
      if (next !== previous) window.location.reload();
      midnightTimer = window.setTimeout(onMidnight, msUntilNextLocalMidnight());
    }, msUntilNextLocalMidnight());
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      window.clearTimeout(midnightTimer);
    };
  }, []);
  return null;
}
