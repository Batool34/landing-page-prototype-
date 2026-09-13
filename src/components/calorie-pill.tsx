/** Meal calorie chip — same visual language as the old macro pills. */
export function CaloriePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-foreground">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
      {label}
    </span>
  );
}
