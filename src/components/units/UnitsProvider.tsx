"use client";

import {
  DEFAULT_DISTANCE_UNIT,
  DEFAULT_MASS_UNIT,
  type DistanceUnit,
  type MassUnit,
} from "@/lib/units";

export function useUnits(): {
  massUnit: MassUnit;
  distanceUnit: DistanceUnit;
} {
  return {
    massUnit: DEFAULT_MASS_UNIT,
    distanceUnit: DEFAULT_DISTANCE_UNIT,
  };
}
