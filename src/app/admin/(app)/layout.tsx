import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Route group (app) covers every authenticated /admin/** page --
// /admin/login lives outside it, so this is the one safe place to own the
// auth redirect (the parent admin/layout.tsx wraps login too).
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="flex min-h-screen w-full bg-zinc-950 text-zinc-100">
      <AdminSidebar />
      <main className="min-h-screen flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
