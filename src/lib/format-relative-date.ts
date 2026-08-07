export function formatRelativeDate(iso: string | null): string {
  if (!iso) return "Jamais";

  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor(
    (new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) /
      86_400_000
  );

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays > 1) return `Il y a ${diffDays} jours`;
  return date.toLocaleDateString("fr-FR");
}
