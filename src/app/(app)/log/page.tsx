import type { Metadata } from "next";
import { getLogState } from "@/app/actions/data";
import { LogView } from "@/components/log/LogView";

export const metadata: Metadata = { title: "Log" };

export default async function LogPage() {
  const state = await getLogState();
  return (
    <LogView
      today={state.today}
      gymSessions={state.gymSessions}
      sports={state.sports}
      supplements={state.supplements}
      muscles={state.muscles}
    />
  );
}
