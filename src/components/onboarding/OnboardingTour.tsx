"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  completeOnboarding,
  saveOnboardingLocale,
} from "@/app/actions/onboarding";
import {
  LOCALE_LABELS,
  ONBOARDING_STEPS,
  nextOnboardingStep,
  onboardingCopy,
  previousOnboardingStep,
  starterCatalogPreview,
  type OnboardingStepId,
} from "@/lib/onboarding";
import { LOCALES, type AppLocale } from "@/lib/locale";
import { CARD_CLS, GHOST_BTN, LABEL_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";

export function OnboardingTour({
  locale,
  forced,
  onLocale,
  onClose,
}: {
  locale: AppLocale;
  forced: boolean;
  onLocale: (locale: AppLocale) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<OnboardingStepId>(forced ? "language" : "welcome");
  const [lang, setLang] = useState<AppLocale>(locale);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const copy = onboardingCopy(lang);
  const preview = starterCatalogPreview(lang);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);
  const stepCount = ONBOARDING_STEPS.length;

  useEffect(() => {
    setLang(locale);
  }, [locale]);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("button, [href]")?.focus();
  }, [step]);

  function persistLocale(next: AppLocale) {
    setLang(next);
    onLocale(next);
    setError(null);
    startTransition(async () => {
      try {
        await saveOnboardingLocale(next);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save language.");
      }
    });
  }

  function finish() {
    setError(null);
    startTransition(async () => {
      try {
        await saveOnboardingLocale(lang);
        await completeOnboarding();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not finish.");
      }
    });
  }

  function goNext() {
    const next = nextOnboardingStep(step);
    if (!next) {
      finish();
      return;
    }
    if (step === "language") persistLocale(lang);
    setStep(next);
  }

  const body = stepBody(step, copy);

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`${CARD_CLS} w-full max-w-md p-5 shadow-[var(--shadow-card)]`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className={LABEL_CLS}>
              {stepIndex + 1} / {stepCount}
            </p>
            <h2 id={titleId} className="mt-1 font-display text-2xl font-bold text-ink">
              {body.title}
            </h2>
          </div>
          {forced ? null : (
            <button type="button" className={GHOST_BTN} onClick={onClose} aria-label={copy.close}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed text-muted">{body.text}</p>

        {step === "language" ? (
          <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label={copy.languageTitle}>
            {LOCALES.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={lang === item}
                className={`${chipClass(lang === item)} w-full py-3`}
                onClick={() => persistLocale(item)}
              >
                {LOCALE_LABELS[item]}
              </button>
            ))}
          </div>
        ) : null}

        {step === "done" ? (
          <div className="mt-4 space-y-3">
            <CatalogList label={copy.musclesLabel} items={preview.muscles} />
            <CatalogList label={copy.exercisesLabel} items={preview.exercises} />
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="mt-3 text-sm font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex gap-2">
          {previousOnboardingStep(step) ? (
            <button
              type="button"
              className={`${GHOST_BTN} flex-1`}
              disabled={pending}
              onClick={() => {
                const previous = previousOnboardingStep(step);
                if (previous) setStep(previous);
              }}
            >
              {copy.back}
            </button>
          ) : forced ? (
            <button
              type="button"
              className={`${GHOST_BTN} flex-1`}
              disabled={pending}
              onClick={finish}
            >
              {copy.skip}
            </button>
          ) : null}
          <button
            type="button"
            className={`${PRIMARY_BTN} flex-1 px-4 py-3 text-base`}
            disabled={pending}
            onClick={goNext}
          >
            {pending ? "…" : step === "done" ? copy.finish : copy.next}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function stepBody(
  step: OnboardingStepId,
  copy: ReturnType<typeof onboardingCopy>,
) {
  if (step === "language") {
    return { title: copy.languageTitle, text: copy.languageBody };
  }
  if (step === "welcome") {
    return { title: copy.welcomeTitle, text: copy.welcomeBody };
  }
  if (step === "home") {
    return { title: copy.homeTitle, text: copy.homeBody };
  }
  if (step === "log") {
    return { title: copy.logTitle, text: copy.logBody };
  }
  if (step === "analytics") {
    return { title: copy.analyticsTitle, text: copy.analyticsBody };
  }
  return {
    title: copy.doneTitle,
    text: copy.doneBody,
  };
}

function CatalogList({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <p className={`${LABEL_CLS} mb-2`}>{label}</p>
      <p className="text-sm text-ink">{items.join(" · ")}</p>
    </div>
  );
}
