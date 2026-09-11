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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-paper text-sm font-bold text-ink shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60"
    >
      <Download className="h-4 w-4" />
      {isPending ? "Preparing export…" : "Export All My Data (JSON)"}
    </button>
  );
}
