"use client";

import { useTransition } from "react";
import { deleteCardioActivity } from "@/app/actions/activities";
import type {
  CardioActivityPayload,
  CardioType,
  IntensityLevel,
} from "@/types/trackr";
import { CARD_CLS, LABEL_CLS } from "@/lib/ui";

const TYPE_LABELS: Record<CardioType, string> = {
  PADEL: "Padel",
  TENNIS: "Tennis",
  RUNNING: "Running",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
};

const INTENSITY_LABELS: Record<IntensityLevel, string> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
};

type RecentActivitiesProps = {
  activities: CardioActivityPayload[];
};

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const [isPending, startTransition] = useTransition();

  if (activities.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className={LABEL_CLS}>Recent activities</h2>
      <ul className="space-y-2">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className={`${CARD_CLS} flex items-center justify-between gap-3 px-4 py-3`}
          >
            <div>
              <p className="text-sm font-bold text-ink">
                {TYPE_LABELS[activity.type]} · {activity.durationMinutes}m
              </p>
              <p className="text-xs text-muted">
                {INTENSITY_LABELS[activity.intensity]}
                {activity.notes ? ` · ${activity.notes}` : ""}
              </p>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await deleteCardioActivity(activity.id);
                })
              }
              className="rounded-md px-2 py-1 text-xs font-semibold text-muted hover:text-danger disabled:opacity-50"
            >
              Del
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
