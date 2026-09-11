"use client";

import { useTransition } from "react";
import {
  deleteCardioActivity,
  type CardioActivityPayload,
  type CardioType,
  type IntensityLevel,
} from "@/app/actions/activities";

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
      <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-500">
        Recent activities
      </h2>
      <ul className="space-y-2">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-900/40 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-neutral-100">
                {TYPE_LABELS[activity.type]} · {activity.durationMinutes}m
              </p>
              <p className="text-xs text-neutral-500">
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
              className="rounded-md px-2 py-1 text-xs text-neutral-500 hover:text-red-400 disabled:opacity-50"
            >
              Del
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
