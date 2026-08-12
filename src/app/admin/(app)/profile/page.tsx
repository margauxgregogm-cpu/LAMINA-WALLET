import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase-server";
import { adminInputClass, adminButtonClass } from "@/components/admin/adminFormClasses";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { updateOwnAdminPassword } from "./actions";

export default async function AdminProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; passwordChanged?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { error, passwordChanged } = await searchParams;

  const supabase = await createClient("admin");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-8 md:py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Profil</h1>
        <p className="text-zinc-400">Votre compte administrateur.</p>
      </div>

      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-400">Identifiant / email de connexion</h2>
        <p className="text-lg font-medium text-zinc-100">{user?.email ?? "—"}</p>
      </div>

      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-900 p-6">
        <h2 className="mb-4 text-sm font-semibold text-zinc-400">Changer mon mot de passe</h2>

        {passwordChanged && (
          <p className="mb-4 rounded-lg bg-emerald-950 px-3 py-2 text-sm text-emerald-300">
            Mot de passe modifié.
          </p>
        )}
        {error && <p className="mb-4 rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}

        <PasswordChangeForm
          action={updateOwnAdminPassword}
          variant="admin"
          inputClassName={adminInputClass}
          buttonClassName={adminButtonClass}
        />
      </div>

      <p className="w-full max-w-2xl text-sm text-zinc-500">
        Pour vous déconnecter, utilisez le bouton &quot;Déconnexion&quot; dans le menu.
      </p>
    </div>
  );
}
