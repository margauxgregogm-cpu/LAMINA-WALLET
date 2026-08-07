import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { buildGoogleWalletSaveUrl, isGoogleWalletConfigured } from "@/lib/google-wallet";

export default async function SignupSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  if (!id) notFound();

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id, first_name, stamps, restaurant_id")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("name, color_theme, stamps_required, reward_text, logo_url")
    .eq("id", client.restaurant_id)
    .single();

  if (!restaurant) notFound();

  const qrDataUrl = await QRCode.toDataURL(client.id, {
    width: 240,
    margin: 1,
  });

  const googleWalletUrl = isGoogleWalletConfigured()
    ? buildGoogleWalletSaveUrl({
        restaurantId: client.restaurant_id,
        restaurantName: restaurant.name,
        colorTheme: restaurant.color_theme,
        stampsRequired: restaurant.stamps_required,
        rewardText: restaurant.reward_text,
        clientId: client.id,
        clientName: client.first_name,
        stamps: client.stamps,
        logoUrl: restaurant.logo_url,
      })
    : null;

  return (
    <div className="flex flex-1 flex-col items-center gap-8 bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Bienvenue, {client.first_name} !</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Votre carte de fidélité est prête.
        </p>
      </div>

      <LoyaltyCard
        restaurantName={restaurant.name}
        logoInitials={restaurant.name.slice(0, 2).toUpperCase()}
        logoUrl={restaurant.logo_url}
        stampsEarned={client.stamps}
        stampsRequired={restaurant.stamps_required}
        rewardText={restaurant.reward_text}
        memberName={client.first_name}
        colorTheme={restaurant.color_theme}
      />

      <div className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR code de fidélité" width={200} height={200} />
        <p className="text-xs text-zinc-500">Présentez ce QR code à chaque visite</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
        <button
          disabled
          className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white opacity-50 dark:bg-white dark:text-zinc-900"
          title="Bientôt disponible"
        >
          Ajouter à Apple Wallet
        </button>
        {googleWalletUrl ? (
          <a
            href={googleWalletUrl}
            className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            Ajouter à Google Wallet
          </a>
        ) : (
          <button
            disabled
            className="flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white opacity-50 dark:bg-white dark:text-zinc-900"
            title="Bientôt disponible"
          >
            Ajouter à Google Wallet
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-400">
        {googleWalletUrl
          ? "L'ajout à Apple Wallet arrive dans une prochaine étape."
          : "L'ajout à Apple Wallet / Google Wallet arrive dans une prochaine étape."}
      </p>
    </div>
  );
}
