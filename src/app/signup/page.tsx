import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { SignupForm } from "./SignupForm";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r: slug } = await searchParams;

  if (!slug) notFound();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select(
      "id, slug, name, background_color, background_image_url, stamps_required, reward_text, welcome_offer_text, logo_url"
    )
    .eq("slug", slug)
    .single();

  if (!restaurant) notFound();

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
      />

      {restaurant.welcome_offer_text && (
        <p className="max-w-md text-center text-sm text-zinc-600 dark:text-zinc-400">
          🎁 {restaurant.welcome_offer_text}
        </p>
      )}

      <SignupForm restaurantId={restaurant.id} restaurantSlug={restaurant.slug} />
    </div>
  );
}
