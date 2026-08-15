import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string; error?: string }>;
}) {
  const { r: slug, error } = await searchParams;

  if (!slug) notFound();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "id, slug, name, background_color, background_image_url, wallet_text_color, stamps_required, reward_text, welcome_offer_text, logo_url, collect_first_name, collect_last_name, collect_phone, collect_email, collect_city"
    )
    .eq("slug", slug)
    .single();

  if (!restaurant) notFound();

  // Fetched and rendered server-side (no client-side round trip), so the
  // form never flashes the wrong set of fields. Restaurants that predate
  // this feature have these columns default to true in the database, and
  // this fallback covers the same case defensively if a column is ever
  // somehow null.
  const collectFirstName = restaurant.collect_first_name ?? true;
  const collectLastName = restaurant.collect_last_name ?? true;
  const collectPhone = restaurant.collect_phone ?? true;
  const collectEmail = restaurant.collect_email ?? true;
  const collectCity = restaurant.collect_city ?? true;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <LoyaltyCard
        restaurantName={restaurant.name}
        logoInitials={restaurant.name.slice(0, 2).toUpperCase()}
        logoUrl={restaurant.logo_url}
        stampsEarned={0}
        stampsRequired={restaurant.stamps_required}
        rewardText={restaurant.reward_text}
        memberName="Vous"
        backgroundColor={restaurant.background_color}
        backgroundImageUrl={restaurant.background_image_url}
        textColor={restaurant.wallet_text_color}
      />

      {restaurant.welcome_offer_text && (
        <p className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
          🎁 {restaurant.welcome_offer_text}
        </p>
      )}

      <SignupForm
        restaurantId={restaurant.id}
        restaurantSlug={restaurant.slug}
        error={error}
        collectFirstName={collectFirstName}
        collectLastName={collectLastName}
        collectPhone={collectPhone}
        collectEmail={collectEmail}
        collectCity={collectCity}
      />
    </div>
  );
}
