// Push notification plans and the quota-period arithmetic behind them.
// Pure functions, no I/O -- safe to import from both server and client
// components (the entreprise page renders quota labels, the admin form
// renders the plan picker).

export type PushPlanId = "option1" | "option2" | "option3" | "option4";

export type PushPlan = {
  id: PushPlanId;
  label: string;
  limit: number;
  period: "month" | "quarter";
  description: string;
};

export const PUSH_PLANS: Record<PushPlanId, PushPlan> = {
  option1: {
    id: "option1",
    label: "Option 1",
    limit: 1,
    period: "quarter",
    description: "1 notification par trimestre",
  },
  option2: {
    id: "option2",
    label: "Option 2",
    limit: 3,
    period: "month",
    description: "3 notifications par mois",
  },
  option3: {
    id: "option3",
    label: "Option 3",
    limit: 15,
    period: "month",
    description: "15 notifications par mois",
  },
  option4: {
    id: "option4",
    label: "Option 4 — Personnalisée",
    // Placeholder only: unlike the other plans, option4 has no fixed limit
    // here. The real number is set per restaurant by an admin and stored on
    // restaurants.push_custom_limit; getPushQuotaStatus (push-quota.ts)
    // resolves it into a plan object with this limit/description replaced,
    // and every caller uses that resolved plan, never this one directly.
    limit: 0,
    period: "month",
    description: "Quota personnalisé défini par l'administrateur",
  },
};

export const PUSH_PLAN_LIST: PushPlan[] = [
  PUSH_PLANS.option1,
  PUSH_PLANS.option2,
  PUSH_PLANS.option3,
  PUSH_PLANS.option4,
];

export function getPushPlan(planId: string | null | undefined): PushPlan | null {
  if (!planId) return null;
  return PUSH_PLANS[planId as PushPlanId] ?? null;
}

// Message length ceiling. APNs alert bodies get truncated well before this on
// a lock screen, and Wallet's own change message is short too -- 178 keeps a
// sent message fully readable everywhere rather than silently cut.
export const PUSH_MESSAGE_MAX_LENGTH = 178;

// Quota windows follow the calendar in Europe/Paris, the same timezone the
// once-per-day stamp rule uses -- otherwise a send just before midnight on the
// 1st would be charged to the wrong month for a French business.
const TIME_ZONE = "Europe/Paris";

function parisParts(date: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day") };
}

// Opaque-but-readable key stored on each sent notification, e.g. "2026-M08"
// or "2026-Q3". Usage for the current window is a count of rows carrying the
// current key, which is what makes renewal automatic: when the calendar rolls
// over the key changes, the count starts from zero again, and nobody has to
// reset a counter.
export function currentPeriodKey(plan: PushPlan, now: Date = new Date()): string {
  const { year, month } = parisParts(now);
  if (plan.period === "quarter") {
    return `${year}-Q${Math.floor((month - 1) / 3) + 1}`;
  }
  return `${year}-M${String(month).padStart(2, "0")}`;
}

// First day of the next quota window -- shown to the restaurant as "you can
// send again from ...".
export function nextRenewalDate(plan: PushPlan, now: Date = new Date()): Date {
  const { year, month } = parisParts(now);
  if (plan.period === "quarter") {
    const quarter = Math.floor((month - 1) / 3) + 1;
    return quarter === 4 ? new Date(year + 1, 0, 1) : new Date(year, quarter * 3, 1);
  }
  return month === 12 ? new Date(year + 1, 0, 1) : new Date(year, month, 1);
}

export function formatRenewalDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function describePeriod(plan: PushPlan): string {
  return plan.period === "quarter" ? "ce trimestre" : "ce mois-ci";
}
