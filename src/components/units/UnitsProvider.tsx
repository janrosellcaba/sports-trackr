"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { updateDistanceUnit, updateMassUnit } from "@/app/actions/account";
import {
  DEFAULT_DISTANCE_UNIT,
  DEFAULT_MASS_UNIT,
  resolveDistanceUnit,
  resolveMassUnit,
  type DistanceUnit,
  type MassUnit,
} from "@/lib/units";

type UnitsContextValue = {
  massUnit: MassUnit;
  distanceUnit: DistanceUnit;
  setMassUnit: (unit: MassUnit) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  saveError: string | null;
};

const UnitsContext = createContext<UnitsContextValue | null>(null);

export function UnitsProvider({
  children,
  massUnit,
  distanceUnit,
}: {
  children: React.ReactNode;
  massUnit?: string | null;
  distanceUnit?: string | null;
}) {
  const [mass, setMass] = useState<MassUnit>(resolveMassUnit(massUnit));
  const [distance, setDistance] = useState<DistanceUnit>(
    resolveDistanceUnit(distanceUnit),
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const setMassUnit = useCallback((unit: MassUnit) => {
    const resolved = resolveMassUnit(unit);
    setMass(resolved);
    void updateMassUnit(resolved).then(
      () => setSaveError(null),
      (error: unknown) =>
        setSaveError(
          error instanceof Error ? error.message : "Could not save units.",
        ),
    );
  }, []);

  const setDistanceUnit = useCallback((unit: DistanceUnit) => {
    const resolved = resolveDistanceUnit(unit);
    setDistance(resolved);
    void updateDistanceUnit(resolved).then(
      () => setSaveError(null),
      (error: unknown) =>
        setSaveError(
          error instanceof Error ? error.message : "Could not save units.",
        ),
    );
  }, []);

  const value = useMemo(
    () => ({
      massUnit: mass,
      distanceUnit: distance,
      setMassUnit,
      setDistanceUnit,
      saveError,
    }),
    [distance, mass, saveError, setDistanceUnit, setMassUnit],
  );

  return <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>;
}

const FALLBACK_UNITS: UnitsContextValue = {
  massUnit: DEFAULT_MASS_UNIT,
  distanceUnit: DEFAULT_DISTANCE_UNIT,
  setMassUnit: () => undefined,
  setDistanceUnit: () => undefined,
  saveError: null,
};

export function useUnits(): UnitsContextValue {
  return useContext(UnitsContext) ?? FALLBACK_UNITS;
}
