"use client";

import { useState } from "react";
import { FormField } from "@/components/FormField";
import { adminInputClass } from "@/components/admin/adminFormClasses";
import { PUSH_PLAN_LIST } from "@/lib/push-plans";

// Plan picker + the extra "notifications per month" field that only option4
// needs. Split out as its own client component purely for that conditional
// field -- the rest of the options form (checkbox, submit) stays a plain
// server-rendered form in the parent page.
export function PushPlanFields({
  defaultPlanId,
  defaultCustomLimit,
}: {
  defaultPlanId: string;
  defaultCustomLimit: number | null;
}) {
  const [planId, setPlanId] = useState(defaultPlanId);

  return (
    <>
      <FormField label="Forfait attribué">
        <select
          name="pushPlan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          className={adminInputClass}
        >
          <option value="">Aucun forfait</option>
          {PUSH_PLAN_LIST.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id === "option4" ? p.label : `${p.label} — ${p.description}`}
            </option>
          ))}
        </select>
      </FormField>

      {planId === "option4" && (
        <FormField
          label="Nombre de notifications push autorisées par mois"
          hint="Nombre entier, supérieur à 0. Ce quota se renouvelle chaque mois."
        >
          <input
            type="number"
            name="pushCustomLimit"
            min={1}
            step={1}
            required
            defaultValue={defaultCustomLimit ?? ""}
            className={adminInputClass}
          />
        </FormField>
      )}
    </>
  );
}
