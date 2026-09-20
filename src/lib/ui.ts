export const INPUT_CLS =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export const SELECT_CLS = `${INPUT_CLS} bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`;

export const PRIMARY_BTN =
  "rounded-2xl py-4 text-lg font-bold text-[color:var(--accent-fg)] transition-all duration-150 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-[0_0_24px_var(--accent-glow)] motion-safe:active:translate-y-0 disabled:pointer-events-none disabled:opacity-60 select-none";

export const SECONDARY_BTN =
  "flex h-12 w-full items-center justify-center rounded-xl bg-chip text-sm font-bold text-ink transition-all duration-150 hover:bg-chip-hover motion-safe:hover:scale-[1.01] motion-safe:active:scale-[0.98] disabled:opacity-50";

export const GHOST_BTN =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-muted transition-all duration-150 ease-out hover:bg-chip hover:text-ink motion-safe:hover:scale-[1.04] motion-safe:active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

export const DANGER_BTN =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-danger transition-all duration-150 ease-out hover:bg-danger-soft motion-safe:hover:scale-[1.04] motion-safe:active:scale-[0.97] disabled:opacity-50 disabled:hover:scale-100";

export const TAP_ROW =
  "rounded-lg px-1 transition-colors duration-150 hover:bg-chip/60";

export const CARD_CLS = "rounded-2xl border border-line bg-paper shadow-sm";

export const PAGE_TITLE = "text-xl font-semibold tracking-tight text-ink";

export const LABEL_CLS = "text-xs font-medium text-muted";

export const CHIP_INACTIVE =
  "rounded-xl bg-chip px-4 py-2.5 text-sm font-bold text-muted transition-all duration-150 select-none hover:bg-chip-hover motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98]";

export const CHIP_ACTIVE =
  "rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-[color:var(--accent-fg)] transition-all duration-150 select-none motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.98]";

export function chipClass(active: boolean): string {
  return active ? CHIP_ACTIVE : CHIP_INACTIVE;
}
