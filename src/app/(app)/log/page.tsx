import type { Metadata } from "next";
import { requireUser } from "@/app/actions/auth";
import { getLogState } from "@/app/actions/data";
import { LogView } from "@/components/log/LogView";

export const metadata: Metadata = { title: "Log" };

export default async function LogPage() {
  const [state, user] = await Promise.all([getLogState(), requireUser()]);
  return (
    <LogView
      today={state.today}
      gymSessions={state.gymSessions}
      sports={state.sports}
      supplements={state.supplements}
      bodyWeights={state.bodyWeights}
      muscles={state.muscles}
      sportCatalog={state.sportCatalog}
      profile={{
        heightCm: user.heightCm,
        sex: user.sex,
        birthYear: user.birthYear,
        goal: user.goal,
        experience: user.experience,
        profileNotes: user.profileNotes,
      }}
    />
  );
}
