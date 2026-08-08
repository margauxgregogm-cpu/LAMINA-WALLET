import Link from "next/link";

const BUSINESS_TYPES = [
  "Restaurants",
  "Coiffeurs",
  "Ongles",
  "Fleuristes",
  "Boulangeries",
  "Salles de sport",
  "Instituts de beauté",
];

const STEPS = [
  {
    number: "01",
    title: "On crée votre carte",
    body: "Logo, couleurs, récompense — votre carte de fidélité numérique, prête en quelques minutes.",
  },
  {
    number: "02",
    title: "Le client l'ajoute à son Wallet",
    body: "Un QR code, deux clics, aucune application à télécharger. La carte vit dans son téléphone.",
  },
  {
    number: "03",
    title: "Chaque visite compte",
    body: "Un scan à la caisse ajoute un tampon. La récompense apparaît automatiquement sur la carte.",
  },
];

const FEATURES = [
  {
    title: "Vous récupérez ses coordonnées",
    body: "Nom, email, téléphone — captés automatiquement dès le premier passage.",
  },
  {
    title: "Toujours dans sa poche",
    body: "Pas d'appli à installer, pas de carte à oublier : Apple Wallet et Google Wallet, natifs.",
  },
  {
    title: "Fait pour tout commerce",
    body: "Restaurant, salon, institut, boutique — la même carte de fidélité s'adapte à votre activité.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-zinc-950">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <span className="text-lg font-bold tracking-tight">Lamina Fidelity</span>
        <nav className="hidden gap-6 text-sm text-zinc-600 sm:flex dark:text-zinc-400">
          <a href="#fonctionnalites" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Fonctionnalités
          </a>
          <a href="#comment-ca-marche" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            Comment ça marche
          </a>
        </nav>
      </header>

      {/* Hero — metallic gray gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-zinc-700 via-zinc-800 to-zinc-950 px-6 py-24 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.12),transparent_45%)]"
        />
        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
          <span className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium text-zinc-200 backdrop-blur">
            La carte de fidélité digitale dans le téléphone de vos clients
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Transformez chaque passage en client fidèle
          </h1>
          <p className="max-w-lg text-zinc-300">
            Carte de fidélité dans leur téléphone en 2 clics — sans appli. Vous récupérez leurs
            coordonnées dès le premier passage.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup?r=demo"
              className="rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Voir la carte de démo →
            </Link>
            <a
              href="#comment-ca-marche"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Découvrir comment ça marche
            </a>
          </div>
        </div>

        <div className="relative mt-16 flex flex-wrap justify-center gap-3">
          {BUSINESS_TYPES.map((type) => (
            <span
              key={type}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300"
            >
              {type}
            </span>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="bg-zinc-50 px-6 py-20 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl text-center">
          <span className="rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
            Comment ça marche
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">
            Simple à mettre en place. Impossible à oublier.
          </h2>
          <p className="mt-2 text-zinc-500">
            3 étapes, aucune compétence technique. Vos premiers clients fidélisés dès aujourd&apos;hui.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="inline-block rounded-lg bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                Étape {step.number}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="fonctionnalites" className="px-6 py-20">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="text-center sm:text-left">
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-zinc-500">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA — metallic gray gradient again */}
      <section className="bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900 px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-white">Prêt à fidéliser vos clients ?</h2>
        <Link
          href="/signup?r=demo"
          className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          Voir la carte de démo →
        </Link>
      </section>

      <footer className="border-t border-zinc-200 px-6 py-6 text-center text-xs text-zinc-400 dark:border-zinc-800">
        Lamina Fidelity — Cartes de fidélité numériques pour Apple Wallet et Google Wallet.
      </footer>
    </div>
  );
}
