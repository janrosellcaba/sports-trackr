"use client";

import { useTransition } from "react";
import { exportMyData } from "@/app/actions/analytics";
import { useOfflineStatus } from "@/components/offline/OfflineProvider";
import { buildExportCsv } from "@/lib/export-data";
import { CARD_CLS, LABEL_CLS, PRIMARY_BTN } from "@/lib/ui";

export function DataView() {
  const { online, pending, cacheKeys, lastSyncAt, syncNow } = useOfflineStatus();
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
      if (format === "json") {
        download(
          `trackr-export-${stamp}.json`,
          JSON.stringify(data, null, 2),
          "application/json",
        );
        return;
      }
      download(
        `trackr-export-${stamp}.csv`,
        buildExportCsv(data),
        "text/csv;charset=utf-8",
      );
    });
  }

  return (
    <section className={`${CARD_CLS} space-y-3 p-4`}>
      <p className={LABEL_CLS}>Export</p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleExport("json")}
        className={`${PRIMARY_BTN} w-full bg-brand py-3 text-base hover:bg-brand-dark`}
      >
        Export All Data (JSON)
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleExport("csv")}
        className="w-full rounded-2xl border border-line bg-chip py-3 text-base font-bold text-ink"
      >
        Export All Data (CSV)
      </button>
      <div className="rounded-xl bg-cream/80 px-3 py-3 text-sm text-muted">
        <p>
          Status:{" "}
          <span className="font-semibold text-ink">
            {online ? "Online" : "Offline"}
          </span>
        </p>
        <p>Local cache keys: {cacheKeys}</p>
        <p>Pending sync: {pending}</p>
        <p>
          Last sync:{" "}
          {lastSyncAt ? new Date(lastSyncAt).toLocaleString() : "Never"}
        </p>
        <button
          type="button"
          onClick={() => void syncNow()}
          className="mt-2 text-xs font-bold text-brand"
        >
          Sync now
        </button>
      </div>
    </section>
  );
}
