"use client";

import { useTransition } from "react";
import { Download } from "lucide-react";
import { exportMyData } from "@/app/actions/analytics";
import { buildExportCsv } from "@/lib/export-data";

export function ExportDataButton() {
  const [isPending, startTransition] = useTransition();

  function download(filename: string, contents: string, type: string) {
    const blob = new Blob([contents], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleExport(format: "json" | "csv") {
    startTransition(async () => {
      const data = await exportMyData();
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        download(
          `trackr-export-${stamp}.csv`,
          buildExportCsv(data),
          "text/csv;charset=utf-8",
        );
        return;
      }
      download(
        `trackr-export-${stamp}.json`,
        JSON.stringify(data, null, 2),
        "application/json",
      );
    });
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <button
        type="button"
        onClick={() => handleExport("json")}
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-paper text-sm font-bold text-ink shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {isPending ? "Preparing…" : "Export JSON"}
      </button>
      <button
        type="button"
        onClick={() => handleExport("csv")}
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-paper text-sm font-bold text-ink shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {isPending ? "Preparing…" : "Export CSV"}
      </button>
    </div>
  );
}
