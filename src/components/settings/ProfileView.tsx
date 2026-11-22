"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/actions/account";
import {
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  MAX_NOTES_LENGTH,
  SEX_OPTIONS,
  type Profile,
} from "@/lib/profile";
import { CARD_CLS, INPUT_CLS, LABEL_CLS, PRIMARY_BTN, chipClass } from "@/lib/ui";

type Draft = {
  heightCm: string;
  sex: string;
  birthYear: string;
  goal: string;
  experience: string;
  profileNotes: string;
};

function toDraft(profile: Profile): Draft {
  return {
    heightCm: profile.heightCm?.toString() ?? "",
    sex: profile.sex ?? "",
    birthYear: profile.birthYear?.toString() ?? "",
    goal: profile.goal ?? "",
    experience: profile.experience ?? "",
    profileNotes: profile.profileNotes ?? "",
  };
}

const SEX_LABEL: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export function ProfileView({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile));
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage(null);
  }

  /** Tapping the active option again clears it (everything is optional). */
  function toggle(key: "sex" | "goal" | "experience", value: string) {
    set(key, draft[key] === value ? "" : value);
  }

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updateProfile(draft);
        if (result.error) {
          setError(result.error);
          return;
        }
        setMessage("Saved.");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        All optional. Only what you fill in is added to the AI prompt from the Log
        page, so the coach can tailor its advice. Nothing is shared anywhere else.
      </p>

      <section className={`${CARD_CLS} space-y-5 p-4`}>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-2">
            <span className={LABEL_CLS}>Height (cm)</span>
            <input
              type="number"
              inputMode="numeric"
              min={100}
              max={250}
              value={draft.heightCm}
              onChange={(event) => set("heightCm", event.target.value)}
              placeholder="—"
              className={INPUT_CLS}
            />
          </label>
          <label className="space-y-2">
            <span className={LABEL_CLS}>Birth year</span>
            <input
              type="number"
              inputMode="numeric"
              value={draft.birthYear}
              onChange={(event) => set("birthYear", event.target.value)}
              placeholder="—"
              className={INPUT_CLS}
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className={LABEL_CLS}>Sex</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Sex">
            {SEX_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={draft.sex === option}
                onClick={() => toggle("sex", option)}
                className={`${chipClass(draft.sex === option)} w-full py-3`}
              >
                {SEX_LABEL[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className={LABEL_CLS}>Main goal</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Main goal">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={draft.goal === option.key}
                onClick={() => toggle("goal", option.key)}
                className={chipClass(draft.goal === option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className={LABEL_CLS}>Training experience</p>
          <div className="grid gap-2" role="group" aria-label="Training experience">
            {EXPERIENCE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                aria-pressed={draft.experience === option.key}
                onClick={() => toggle("experience", option.key)}
                className={`${chipClass(draft.experience === option.key)} w-full text-left`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-2">
          <span className={LABEL_CLS}>Notes for the coach</span>
          <textarea
            value={draft.profileNotes}
            onChange={(event) => set("profileNotes", event.target.value)}
            maxLength={MAX_NOTES_LENGTH}
            rows={3}
            placeholder="Injuries, limits, schedule, anything useful…"
            className={INPUT_CLS}
          />
          <span className="block text-right text-[11px] text-muted">
            {draft.profileNotes.length}/{MAX_NOTES_LENGTH}
          </span>
        </label>
      </section>

      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-sm font-medium text-brand-text">
          {message}
        </p>
      ) : null}

      <button
        type="button"
        disabled={pending}
        onClick={save}
        className={`${PRIMARY_BTN} w-full bg-brand`}
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
    </div>
  );
}
