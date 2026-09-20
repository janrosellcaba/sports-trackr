export default function Loading() {
  return (
    <div className="mx-auto max-w-md space-y-4 px-5 pt-8">
      <div className="h-8 w-32 animate-pulse rounded-lg bg-chip/80" />
      <div className="h-28 animate-pulse rounded-[1.35rem] bg-chip/70" />
      <div className="h-52 animate-pulse rounded-[1.35rem] bg-chip/60" />
    </div>
  );
}
