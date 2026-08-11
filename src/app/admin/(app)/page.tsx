import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LiveAdminUpdates } from "./LiveAdminUpdates";

const NO_CATEGORY = "Sans catégorie";

export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { q, category } = await searchParams;

  const { data: allRestaurants } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, stamps_required, category, user_id, logo_url")
    .order("name", { ascending: true });

  const { data: allClients } = await supabaseAdmin.from("clients").select("restaurant_id");

  // The login email lives in Supabase Auth (restaurants.user_id -> auth
  // user), not on the restaurants table itself -- one listUsers() call and
  // a lookup map avoids an N+1 admin.getUserById() per restaurant.
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const emailByUserId = new Map(userList?.users.map((u) => [u.id, u.email]) ?? []);

  const clientCountByRestaurant = new Map<string, number>();
  for (const client of allClients ?? []) {
    clientCountByRestaurant.set(
      client.restaurant_id,
      (clientCountByRestaurant.get(client.restaurant_id) ?? 0) + 1
    );
  }

  const categories = Array.from(
    new Set((allRestaurants ?? []).map((r) => r.category).filter((c): c is string => !!c))
  ).sort((a, b) => a.localeCompare(b));

  const search = (q ?? "").trim().toLowerCase();
  const filtered = (allRestaurants ?? []).filter((r) => {
    if (search && !r.name.toLowerCase().includes(search)) return false;
    if (category && (r.category ?? NO_CATEGORY) !== category) return false;
    return true;
  });

  const grouped = new Map<string, typeof filtered>();
  for (const r of filtered) {
    const key = r.category ?? NO_CATEGORY;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  const groupNames = Array.from(grouped.keys()).sort((a, b) => {
    if (a === NO_CATEGORY) return 1;
    if (b === NO_CATEGORY) return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-1 flex-col items-center gap-8 px-4 py-8 md:py-12">
      <LiveAdminUpdates />

      <div className="w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Entreprises</h1>
          <Link
            href="/admin/restaurants/new"
            className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 shadow-sm transition-colors hover:bg-amber-400"
          >
            + Nouvelle entreprise
          </Link>
        </div>

        <form method="GET" className="mb-6 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Rechercher une entreprise..."
            className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NO_CATEGORY}>{NO_CATEGORY}</option>
          </select>
          <button
            type="submit"
            className="shrink-0 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-white/5"
          >
            Filtrer
          </button>
        </form>

        <div className="flex flex-col gap-6">
          {groupNames.map((groupName) => (
            <div key={groupName}>
              <h3 className="mb-2 text-sm font-semibold text-zinc-400">{groupName}</h3>
              <div className="flex flex-col gap-2">
                {grouped.get(groupName)!.map((r) => (
                  <Link
                    key={r.id}
                    href={`/admin/restaurants/${r.id}`}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 transition-colors hover:border-white/20"
                  >
                    <div className="flex items-center gap-3">
                      {r.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.logo_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-medium text-zinc-400">
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-zinc-100">{r.name}</div>
                        {r.user_id && emailByUserId.get(r.user_id) && (
                          <div className="text-sm text-zinc-400">{emailByUserId.get(r.user_id)}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-zinc-400">
                      <div>{clientCountByRestaurant.get(r.id) ?? 0} personne(s)</div>
                      <div>{r.stamps_required} tampons</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-zinc-400">Aucune entreprise ne correspond.</p>
          )}
        </div>
      </div>
    </div>
  );
}
