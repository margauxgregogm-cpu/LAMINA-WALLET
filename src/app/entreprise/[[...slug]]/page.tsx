import { redirect } from "next/navigation";

// "Entreprise" is the new user-facing name (the product now targets any
// business, not just restaurants) but the underlying routes/pages are still
// under /restaurant — this keeps a single implementation instead of
// duplicating every page under two paths. A middleware rewrite would be
// transparent (URL stays /entreprise/...), but rewriting to a route outside
// the original matcher 404s in this Next.js/Turbopack dev setup, so a plain
// redirect is used instead.
export default async function EntrepriseRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const search = await searchParams;

  const path = `/restaurant${slug && slug.length > 0 ? `/${slug.join("/")}` : ""}`;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string") query.set(key, value);
  }
  const queryString = query.toString();

  redirect(queryString ? `${path}?${queryString}` : path);
}
