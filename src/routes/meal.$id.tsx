import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { getMealById } from "@/lib/meals";

export const Route = createFileRoute("/meal/$id")({
  head: ({ params }) => {
    const meal = getMealById(params.id);
    return {
      meta: [
        { title: meal ? `${meal.name} — Picky` : "Meal — Picky" },
        {
          name: "description",
          content: meal
            ? `${meal.name} from ${meal.restaurant} — curated by Picky.`
            : "Picky lunch details.",
        },
      ],
    };
  },
  loader: ({ params }) => {
    const meal = getMealById(params.id);
    if (!meal) throw notFound();
    return { meal };
  },
  component: MealDetail,
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      Meal not found.
      <Link to="/lunches" className="ml-2 text-primary underline">Back</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      Something went wrong.
      <Link to="/lunches" className="ml-2 text-primary underline">Back</Link>
    </div>
  ),
});

function MealDetail() {
  const { meal } = Route.useLoaderData();
  return (
    <div className="min-h-screen w-full bg-[oklch(0.94_0.005_30)] py-0 md:py-10">
      <div className="mx-auto w-full max-w-[420px] md:rounded-[3rem] md:border md:border-black/5 md:shadow-[0_30px_80px_-20px_oklch(0.2_0.02_20/0.25)] overflow-hidden bg-background relative">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img src={meal.image} alt={meal.name} className="h-full w-full object-cover" />
          <Link
            to="/lunches"
            className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-card/90 backdrop-blur shadow-soft text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
        <main className="px-6 py-6">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {meal.slot}
          </div>
          <h1 className="font-display text-[28px] leading-tight tracking-tight mt-1">
            {meal.name}
          </h1>
          <div className="text-[13px] text-muted-foreground mt-1">
            from {meal.restaurant}
          </div>

          <div className="mt-6 grid grid-cols-4 gap-3 rounded-3xl bg-card p-5 shadow-card border border-black/[0.03] text-center">
            <Stat label="kcal" value={meal.kcal} accent />
            <Stat label="protein" value={`${meal.protein}g`} />
            <Stat label="carbs" value={`${meal.carbs}g`} />
            <Stat label="fat" value={`${meal.fat}g`} />
          </div>

          <Link
            to="/lunches"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-[14px] font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_oklch(0.62_0.245_27/0.55)]"
          >
            Back to today's lunch
          </Link>
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div>
      <div className={`font-display text-[20px] leading-none ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
      <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
