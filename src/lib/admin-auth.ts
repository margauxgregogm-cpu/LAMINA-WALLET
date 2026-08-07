import "server-only";
import { createClient } from "@/lib/supabase-server";

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient("admin");
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  let authedUser = user;
  if (!authedUser && error) {
    // See the matching comment in restaurant-auth.ts: a transient failure
    // reaching Supabase's Auth server shouldn't be treated as a logout.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    authedUser = session?.user ?? null;
  }

  if (!authedUser?.email) return false;
  return getAdminEmails().includes(authedUser.email.toLowerCase());
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new Error("Accès refusé");
}
