"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  const [manualOpen, setManualOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [lang, setLang] = useState<AppLocale>(initial);
  const [seenLocale, setSeenLocale] = useState(locale);
  const open = manualOpen || (forced && !dismissed);

  // Follow the saved locale when it changes, without an effect.
  if (locale !== seenLocale) {
    setSeenLocale(locale);
    setLang(parseAppLocale(locale));
  }

  const openTour = useCallback(() => {
    setDismissed(false);
    setManualOpen(true);
  }, []);

  const closeTour = useCallback(() => {
    setDismissed(true);
    setManualOpen(false);
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
