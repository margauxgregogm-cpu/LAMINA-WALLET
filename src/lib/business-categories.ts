// Curated starting list covering the examples given (ongles, restaurant,
// fleuriste...) plus common adjacent business types. Stored as free text on
// restaurants.category, not a DB enum, so adding more later is just editing
// this list — no migration needed.
export const BUSINESS_CATEGORIES = [
  "Restaurant",
  "Fast-food",
  "Café",
  "Boulangerie",
  "Coiffeur",
  "Barbier",
  "Institut de beauté",
  "Ongles",
  "Fleuriste",
  "Boutique",
  "Salle de sport",
  "Autre",
] as const;
