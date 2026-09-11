"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { exportMyData } from "@/app/actions/analytics";

export function ExportDataButton() {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    startTransition(async () => {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `trackr-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isPending}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-neutral-850 bg-neutral-950 text-sm font-medium text-neutral-200 transition hover:border-lime-400/30 hover:text-lime-300 disabled:opacity-60"
    >
      <Download className="h-4 w-4" />
      {isPending ? "Preparing export…" : "Export All My Data (JSON)"}
    </button>
  );
}
