import {
  createCustomExercise,
  createCustomSupplement,
  deleteCustomExercise,
  deleteCustomSupplement,
  updateCustomExercise,
  updateCustomSupplement,
} from "@/app/actions/catalog";
import {
  createManualSession,
  addExercise,
  addSet,
  deleteExercise,
  deleteSet,
  endSession,
  getActiveSession,
  startSession,
  updateSessionTimes,
} from "@/app/actions/gym";
import { deleteCardioActivity, logCardioActivity } from "@/app/actions/activities";
import { deleteWorkoutSession } from "@/app/actions/analytics";
import { deleteSupplement, logSupplement } from "@/app/actions/supplements";
import type { MutationExecutor, MutationKind } from "@/lib/offline/queue";
import type { LogCardioActivityInput, LogSupplementInput } from "@/types/trackr";

async function ignoreMissing(task: () => Promise<unknown>): Promise<unknown> {
  try {
    return await task();
  } catch (error) {
    if (error instanceof Error && /not found/i.test(error.message)) {
      return undefined;
    }
    throw error;
  }
}

export const executeMutation: MutationExecutor = async (
  kind: MutationKind,
  payload: Record<string, unknown>,
) => {
  switch (kind) {
    case "startSession":
      try {
        return await startSession({
          id: payload.id as string | undefined,
          startTime: payload.startTime as string | undefined,
        });
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          const active = await getActiveSession();
          if (active) return active;
        }
        throw error;
      }
    case "createManualSession":
      return createManualSession({
        id: payload.id as string | undefined,
        startTime: String(payload.startTime),
        endTime: String(payload.endTime),
        notes: payload.notes as string | undefined,
      });
    case "endSession":
      return endSession(String(payload.sessionId), {
        notes: payload.notes as string | undefined,
        endTime: payload.endTime as string | undefined,
      });
    case "updateSessionTimes":
      return updateSessionTimes(String(payload.sessionId), {
        startTime: String(payload.startTime),
        endTime: (payload.endTime as string | null | undefined) ?? null,
        notes: payload.notes as string | undefined,
      });
    case "addExercise":
      return addExercise(String(payload.sessionId), String(payload.machineName), {
        id: payload.id as string | undefined,
      });
    case "addSet":
      return addSet(
        String(payload.exerciseLogId),
        Number(payload.weight),
        Number(payload.reps),
        payload.rpe == null ? undefined : Number(payload.rpe),
        { id: payload.id as string | undefined },
      );
    case "deleteSet":
      return ignoreMissing(() => deleteSet(String(payload.setId)));
    case "deleteExercise":
      return ignoreMissing(() =>
        deleteExercise(String(payload.exerciseLogId)),
      );
    case "logCardio":
      return logCardioActivity(payload as unknown as LogCardioActivityInput);
    case "deleteCardio":
      return ignoreMissing(() => deleteCardioActivity(String(payload.id)));
    case "deleteSession":
      return ignoreMissing(() => deleteWorkoutSession(String(payload.id)));
    case "logSupplement":
      return logSupplement(payload as unknown as LogSupplementInput);
    case "deleteSupplement":
      return ignoreMissing(() => deleteSupplement(String(payload.id)));
    case "createCustomExercise":
      return createCustomExercise({
        id: payload.id as string | undefined,
        name: String(payload.name),
        muscleGroup: String(payload.muscleGroup),
        defaultWeight: (payload.defaultWeight as number | null) ?? null,
        defaultReps: (payload.defaultReps as number | null) ?? null,
      });
    case "updateCustomExercise":
      return updateCustomExercise({
        id: String(payload.id),
        name: String(payload.name),
        muscleGroup: String(payload.muscleGroup),
        defaultWeight: (payload.defaultWeight as number | null) ?? null,
        defaultReps: (payload.defaultReps as number | null) ?? null,
      });
    case "deleteCustomExercise":
      return ignoreMissing(() => deleteCustomExercise(String(payload.id)));
    case "createCustomSupplement":
      return createCustomSupplement({
        id: payload.id as string | undefined,
        name: String(payload.name),
        defaultDose: String(payload.defaultDose),
        iconOrType: payload.iconOrType as string | undefined,
      });
    case "updateCustomSupplement":
      return updateCustomSupplement({
        id: String(payload.id),
        name: String(payload.name),
        defaultDose: String(payload.defaultDose),
        iconOrType: payload.iconOrType as string | undefined,
      });
    case "deleteCustomSupplement":
      return ignoreMissing(() => deleteCustomSupplement(String(payload.id)));
    default:
      throw new Error(`Unknown mutation: ${kind}`);
  }
};
