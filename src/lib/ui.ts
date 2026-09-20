export const INPUT_CLS =
  "w-full rounded-xl border border-line bg-chip px-4 py-3 text-base text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors duration-150 placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export const SELECT_CLS = `${INPUT_CLS} bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`;

export const PRIMARY_BTN =
  "rounded-2xl py-4 text-lg font-bold text-[color:var(--accent-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_10px_28px_var(--accent-glow)] transition-all duration-150 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.34),0_0_28px_var(--accent-glow)] motion-safe:active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 select-none";

export const SECONDARY_BTN =
  "flex h-12 w-full items-center justify-center rounded-xl border border-line/80 bg-chip text-sm font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-150 hover:bg-chip-hover motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.98] disabled:opacity-50";

export const GHOST_BTN =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-muted transition-all duration-150 ease-out hover:bg-chip hover:text-ink motion-safe:hover:scale-[1.04] motion-safe:active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

export const DANGER_BTN =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-danger transition-all duration-150 ease-out hover:bg-danger-soft motion-safe:hover:scale-[1.04] motion-safe:active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

export const TAP_ROW =
  "rounded-lg px-1 transition-colors duration-150 hover:bg-chip/60";

export const CARD_CLS = "card-lux rounded-[1.35rem]";

export const PAGE_TITLE =
  "font-display text-[1.75rem] font-extrabold tracking-tight text-ink";

export const LABEL_CLS =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted";

export const SEGMENT_TRACK =
  "grid gap-1 rounded-2xl bg-chip/80 p-1 ring-1 ring-line/70";

export function segmentItemClass(active: boolean): string {
  return `flex min-h-11 items-center justify-center rounded-xl px-2 text-sm font-semibold transition-all duration-150 select-none ${
    active
      ? "bg-paper text-ink shadow-[var(--shadow-segment)]"
      : "text-muted hover:bg-paper/55 hover:text-ink motion-safe:hover:scale-[1.03]"
  }`;
}

export const CHIP_INACTIVE =
  "rounded-xl bg-chip px-4 py-2.5 text-sm font-bold text-muted transition-all duration-150 select-none hover:bg-chip-hover motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98]";

export const CHIP_ACTIVE =
  "rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-[color:var(--accent-fg)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] transition-all duration-150 select-none motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98]";

export function chipClass(active: boolean): string {
  return active ? CHIP_ACTIVE : CHIP_INACTIVE;
}
