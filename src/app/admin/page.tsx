import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminHomePage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const { data: restaurants } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, stamps_required")
    .order("created_at", { ascending: false });

  const { data: allClients } = await supabaseAdmin.from("clients").select("restaurant_id");

  const clientCountByRestaurant = new Map<string, number>();
  for (const client of allClients ?? []) {
    clientCountByRestaurant.set(
      client.restaurant_id,
      (clientCountByRestaurant.get(client.restaurant_id) ?? 0) + 1
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <AdminNav />

      <div className="w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Restaurants</h2>
          <Link
            href="/admin/restaurants/new"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            + Nouveau restaurant
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {(restaurants ?? []).map((r) => (
            <Link
              key={r.id}
              href={`/admin/restaurants/${r.id}`}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-zinc-500">/signup?r={r.slug}</div>
              </div>
              <div className="text-right text-sm text-zinc-500">
                <div>{clientCountByRestaurant.get(r.id) ?? 0} personne(s)</div>
                <div>{r.stamps_required} tampons</div>
              </div>
            </Link>
          ))}
          {(!restaurants || restaurants.length === 0) && (
            <p className="text-sm text-zinc-500">Aucun restaurant pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}
