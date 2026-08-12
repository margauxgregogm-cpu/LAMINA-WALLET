import { redirect } from "next/navigation";
import { getAuthenticatedRestaurant } from "@/lib/restaurant-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPushQuotaStatus } from "@/lib/push-quota";
import { describePeriod, formatRenewalDate } from "@/lib/push-plans";
import { Panel } from "@/components/restaurant/Panel";
import { PushNotificationForm } from "@/components/restaurant/PushNotificationForm";
import { sendPushNotification } from "./actions";

function formatSentAt(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} — ${d.toLocaleTimeString(
    "fr-FR",
    { hour: "2-digit", minute: "2-digit" }
  )}`;
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const restaurant = await getAuthenticatedRestaurant();
  if (!restaurant) {
    redirect("/restaurant/login?error=Aucun%20restaurant%20associé%20à%20ce%20compte");
  }

  const { error, sent } = await searchParams;
  const status = await getPushQuotaStatus(restaurant.id);

  // History is always shown, even when the option is off: disabling the
  // feature must never hide or delete what was already sent.
  const { data: history } = await supabaseAdmin
    .from("push_notifications")
    .select("id, message, status, created_at, recipients_count")
    .eq("restaurant_id", restaurant.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4 md:px-6 md:py-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">Notifications Push</h1>
        <p className="text-sm opacity-60">
          Envoyez un message personnalisé aux clients de votre établissement.
        </p>
      </div>

      {sent && (
        <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Notification envoyée.
        </p>
      )}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {!status.enabled || !status.plan ? (
        <Panel>
          <h2 className="mb-2 text-sm font-bold">Fonctionnalité non activée</h2>
          <p className="text-sm opacity-70">
            Les notifications push ne sont pas activées pour votre établissement. Contactez
            l&apos;administrateur pour souscrire à une option.
          </p>
        </Panel>
      ) : (
        <>
          <Panel>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm opacity-60">Notifications disponibles</div>
                <div className="text-3xl font-bold tracking-tight">
                  {status.remaining} / {status.limit}
                </div>
                <div className="text-sm opacity-60">restantes {describePeriod(status.plan)}</div>
              </div>
              <div className="text-right text-sm">
                <div className="font-semibold">{status.plan.label}</div>
                <div className="opacity-60">{status.plan.description}</div>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-[var(--theme-accent,#059669)]"
                style={{ width: `${(status.remaining / status.limit) * 100}%` }}
              />
            </div>

            {status.renewalDate && (
              <p className="mt-3 text-sm opacity-60">
                Renouvellement du quota : {formatRenewalDate(status.renewalDate)}
              </p>
            )}
          </Panel>

          <Panel>
            {status.remaining <= 0 && (
              <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-semibold">
                  Vous avez utilisé toutes les notifications disponibles dans votre forfait.
                </p>
                {status.renewalDate && (
                  <p className="mt-1">
                    Vous pourrez de nouveau envoyer des notifications à partir du{" "}
                    {formatRenewalDate(status.renewalDate)}.
                  </p>
                )}
              </div>
            )}

            <PushNotificationForm action={sendPushNotification} canSend={status.canSend} />
          </Panel>
        </>
      )}

      <Panel title="Derniers envois">
        {history && history.length > 0 ? (
          <div className="flex flex-col">
            {history.map((n) => (
              <div key={n.id} className="border-t border-black/5 py-3 first:border-t-0 first:pt-0">
                <div className="text-xs opacity-50">{formatSentAt(n.created_at)}</div>
                <p className="mt-0.5">« {n.message} »</p>
                <div className="mt-0.5 text-xs opacity-60">
                  {n.status === "sent" ? "Envoyée" : n.status}
                  {n.recipients_count > 0 ? ` · ${n.recipients_count} appareil(s)` : ""}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm opacity-60">Aucune notification envoyée pour le moment.</p>
        )}
      </Panel>
    </div>
  );
}
