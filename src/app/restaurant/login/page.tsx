import { RestaurantLoginForm } from "./LoginForm";

export default async function RestaurantLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return <RestaurantLoginForm error={error} />;
}
