// Vercel's serverless functions run in UTC, so comparing dates with
// toDateString() (local-timezone) resets "Aujourd'hui"/"Hier" at UTC
// midnight instead of Paris midnight -- a visit at 01:51 Paris time (23:51
// UTC the day before) was showing as "Hier" instead of "Aujourd'hui".
// Compare calendar days as seen in Europe/Paris instead. Mirrors
// isSameCalendarDay in src/app/restaurant/scan/actions.ts.
const PARIS_DAY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function formatRelativeDate(iso: string | null): string {
  if (!iso) return "Jamais";

  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor(
    (Date.parse(PARIS_DAY_FORMAT.format(today)) - Date.parse(PARIS_DAY_FORMAT.format(date))) /
      86_400_000
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays > 1) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR");
}
