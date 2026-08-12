import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { SubmitButton } from "@/components/SubmitButton";
import { adminInputClass, adminSecondaryButtonClass } from "@/components/admin/adminFormClasses";
import { updateAdminIdentifier } from "./actions";

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; identifierUpdated?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { error, identifierUpdated } = await searchParams;

  const { data: admins } = await supabaseAdmin
    .from("admins")
    .select("id, user_id, login_identifier")
    .order("login_identifier");

  // Only used for display (the admin panel manages a handful of admin
  // accounts) -- the email itself is never editable here, it stays exactly
  // what it was before identifiers existed.
  const adminsWithEmail = await Promise.all(
    (admins ?? []).map(async (admin) => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(admin.user_id);
      return { ...admin, email: data?.user?.email ?? "—" };
    })
  );

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Comptes admin</h1>
        <p className="text-zinc-400">Identifiants de connexion des administrateurs.</p>
      </div>

      {identifierUpdated && (
        <p className="w-full max-w-2xl rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
          Identifiant de connexion mis à jour.
        </p>
      )}
      {error && (
        <p className="w-full max-w-2xl rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      <div className="w-full max-w-2xl space-y-4">
        {adminsWithEmail.map((admin) => (
          <div key={admin.id} className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <p className="mb-3 text-sm text-zinc-500">{admin.email}</p>
            <form action={updateAdminIdentifier} className="flex gap-2">
              <input type="hidden" name="id" value={admin.id} />
              <input
                name="loginIdentifier"
                defaultValue={admin.login_identifier ?? ""}
                required
                className={adminInputClass}
              />
              <SubmitButton pendingChildren="..." className={adminSecondaryButtonClass}>
                Enregistrer
              </SubmitButton>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
