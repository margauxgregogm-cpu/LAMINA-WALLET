import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

// Route group (app) covers every authenticated /admin/** page --
// /admin/login lives outside it, so this is the one safe place to own the
// auth redirect (the parent admin/layout.tsx wraps login too).
export default async function AdminAppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    // Column below md so AdminSidebar's mobile top bar spans the full width
    // above the content; a row from md up so the desktop sidebar sits beside
    // it. Without flex-col the mobile bar became a narrow column next to the
    // page instead of a header.
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
