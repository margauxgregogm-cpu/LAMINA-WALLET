import "server-only";
import { createClient } from "@/lib/supabase-server";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;
  return getAdminEmails().includes(user.email.toLowerCase());
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Accès refusé");
}
