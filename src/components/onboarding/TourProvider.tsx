"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { parseAppLocale, type AppLocale } from "@/lib/locale";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";

type TourContextValue = {
  openTour: () => void;
};

const TourContext = createContext<TourContextValue>({
  openTour: () => {},
});

export function useTour() {
  return useContext(TourContext);
}

export function TourProvider({
  locale,
  forced,
  children,
}: {
  locale: string;
  forced: boolean;
  children: ReactNode;
}) {
  const initial = parseAppLocale(locale);
  const [open, setOpen] = useState(forced);
  const [dismissed, setDismissed] = useState(false);
  const [lang, setLang] = useState<AppLocale>(initial);

  useEffect(() => {
    setLang(parseAppLocale(locale));
  }, [locale]);

  useEffect(() => {
    if (forced && !dismissed) setOpen(true);
  }, [forced, dismissed]);

  const openTour = useCallback(() => {
    setDismissed(false);
    setOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setDismissed(true);
    setOpen(false);
  }, []);

  const value = useMemo(() => ({ openTour }), [openTour]);

  return (
    <TourContext.Provider value={value}>
      {children}
      {open ? (
        <OnboardingTour
          locale={lang}
          forced={forced && !dismissed}
          onLocale={setLang}
          onClose={closeTour}
        />
      ) : null}
    </TourContext.Provider>
  );
}
