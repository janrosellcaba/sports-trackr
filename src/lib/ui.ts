export const INPUT_CLS =
  "w-full rounded-xl border border-line bg-chip px-4 py-3 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export const SELECT_CLS = `${INPUT_CLS} bg-[length:1rem] bg-[right_0.9rem_center] bg-no-repeat pr-10`;

export const PRIMARY_BTN =
  "rounded-2xl py-4 text-lg font-bold text-[color:var(--accent-fg)] transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60 select-none";

export const SECONDARY_BTN =
  "flex h-12 w-full items-center justify-center rounded-xl border border-line bg-transparent text-sm font-bold text-ink transition-colors duration-150 hover:bg-chip-hover disabled:opacity-50";

export const GHOST_BTN =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-muted transition-colors duration-150 hover:bg-chip hover:text-ink disabled:opacity-50";

export const DANGER_BTN =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-bold text-danger transition-colors duration-150 hover:bg-danger-soft disabled:opacity-50";

export const TAP_ROW =
  "rounded-lg px-1 transition-colors duration-150 hover:bg-chip/60";

export const CARD_CLS = "card-lux rounded-2xl";

export const PAGE_TITLE =
  "font-display text-[1.75rem] font-bold tracking-tight text-ink";

export const LABEL_CLS =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-muted";

export const SEGMENT_TRACK = "grid gap-1 rounded-2xl bg-chip p-1";

export function segmentItemClass(active: boolean): string {
  return `flex min-h-11 items-center justify-center rounded-xl px-2 text-sm font-semibold outline-none transition-colors duration-150 select-none focus:outline-none focus-visible:outline-none ${
    active
      ? "bg-paper text-ink"
      : "text-muted hover:bg-paper/55 hover:text-ink"
  }`;
}

export function blurOnPointerUp(event: { currentTarget: { blur: () => void } }) {
  event.currentTarget.blur();
}

export const CHIP_INACTIVE =
  "rounded-xl border border-line bg-chip px-4 py-2.5 text-sm font-bold text-muted transition-colors duration-150 select-none hover:bg-chip-hover";

export const CHIP_ACTIVE =
  "rounded-xl border border-transparent bg-brand px-4 py-2.5 text-sm font-bold text-[color:var(--accent-fg)] transition-colors duration-150 select-none";

export function chipClass(active: boolean): string {
  return active ? CHIP_ACTIVE : CHIP_INACTIVE;
}
