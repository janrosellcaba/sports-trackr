export const INPUT_CLS =
  "w-full rounded-xl border border-line bg-paper px-4 py-3 text-base text-ink transition-colors duration-150 placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10";

export const PRIMARY_BTN =
  "rounded-2xl py-4 text-lg font-bold text-white transition-all duration-150 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60 select-none";

export const INK_BTN =
  "rounded-xl bg-ink px-5 py-3 font-semibold text-paper transition-all duration-150 ease-out hover:-translate-y-0.5 hover:bg-ink/90 hover:shadow-md active:translate-y-0 select-none";

export const CARD_CLS = "rounded-2xl border border-line bg-paper shadow-sm";

export const LABEL_CLS =
  "text-xs font-bold uppercase tracking-wider text-muted";

export const CHIP_INACTIVE =
  "rounded-xl bg-chip px-4 py-2.5 text-sm font-bold text-muted transition-colors duration-150 select-none hover:bg-chip-hover";

export const CHIP_ACTIVE =
  "rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition-colors duration-150 select-none";

export function chipClass(active: boolean): string {
  return active ? CHIP_ACTIVE : CHIP_INACTIVE;
}
