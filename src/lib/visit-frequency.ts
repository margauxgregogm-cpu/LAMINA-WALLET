// Classifies how often a client comes back, from their visit timestamps
// (oldest first). Businesses use this to gauge loyalty at a glance instead
// of doing the math themselves from a raw visit list.
export type VisitFrequency = {
  label: string;
  detail: string;
};

export function computeVisitFrequency(visitDates: Date[]): VisitFrequency {
  if (visitDates.length === 0) {
    return { label: "Aucune visite", detail: "Ce client n'est pas encore venu." };
  }
  if (visitDates.length === 1) {
    return { label: "Nouveau client", detail: "Une seule visite pour l'instant." };
  }

  const sorted = [...visitDates].sort((a, b) => a.getTime() - b.getTime());
  const spanMs = sorted[sorted.length - 1].getTime() - sorted[0].getTime();
  const spanDays = spanMs / (1000 * 60 * 60 * 24);
  const gaps = sorted.length - 1;
  const avgDaysBetweenVisits = spanDays / gaps;

  if (avgDaysBetweenVisits <= 10) {
    return {
      label: "Très fréquent",
      detail: `Environ tous les ${Math.round(avgDaysBetweenVisits)} jours en moyenne.`,
    };
  }
  if (avgDaysBetweenVisits <= 20) {
    return {
      label: "Plusieurs fois par mois",
      detail: `Environ tous les ${Math.round(avgDaysBetweenVisits)} jours en moyenne.`,
    };
  }
  if (avgDaysBetweenVisits <= 45) {
    return {
      label: "Environ une fois par mois",
      detail: `Environ tous les ${Math.round(avgDaysBetweenVisits)} jours en moyenne.`,
    };
  }
  const avgMonthsBetweenVisits = avgDaysBetweenVisits / 30;
  return {
    label: "Occasionnel",
    detail: `Environ tous les ${Math.round(avgMonthsBetweenVisits)} mois en moyenne.`,
  };
}
