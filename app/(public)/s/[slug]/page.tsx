import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Clock, MapPin, MessageCircle, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { getPublicMenu } from "@/lib/repo";
import { getLocale } from "@/lib/i18n-server";
import { restaurantAddress, restaurantName, restaurantTagline, tr } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const menu = await getPublicMenu(slug);
  if (menu === "not_found" || menu === "inactive") return { title: tr(locale, "Menu unavailable", "المنيو غير متاح") };
  return {
    title: `${restaurantName(menu.restaurant, locale)} — ${tr(locale, "Order on WhatsApp", "اطلب عبر واتساب")}`,
    description: restaurantTagline(menu.restaurant, locale) ?? undefined,
  };
}

/** Instagram-bio landing: logo, name, one big CTA into the menu. */
export default async function SharePage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const menu = await getPublicMenu(slug);
  if (menu === "not_found") notFound();

  if (menu === "inactive")
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <h1 className="text-xl font-extrabold">{tr(locale, "This restaurant is currently unavailable", "هذا المطعم غير متاح حاليًا")}</h1>
      </main>
    );

  const r = menu.restaurant;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-6 text-center">
      <LanguageSwitcher className="absolute end-4 top-4" />
      {r.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={r.logo_url} alt="" className="size-24 rounded-3xl object-cover shadow-md" />
      ) : (
        <div className="grid size-24 place-items-center rounded-3xl bg-brand text-white shadow-md">
          <UtensilsCrossed className="size-10" aria-hidden />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-extrabold">{restaurantName(r, locale)}</h1>
        {restaurantTagline(r, locale) && <p className="mt-1 text-sm text-inkmuted">{restaurantTagline(r, locale)}</p>}
      </div>

      {(restaurantAddress(r, locale) || r.map_url) && (
        <p className="flex items-center gap-1.5 text-[13px] text-inkmuted">
          <MapPin className="size-4 text-brand" aria-hidden />
          {restaurantAddress(r, locale)}
        </p>
      )}

      <Link
        href={`/m/${r.slug}`}
        className="press mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-4 text-lg font-extrabold text-white shadow-lg hover:bg-brandstrong"
      >
        <MessageCircle className="size-5" aria-hidden />
        {tr(locale, "Explore menu & order", "افتح المنيو واطلب")} 🟢
      </Link>

      <p className="flex items-center gap-1.5 text-xs text-inkmuted">
        <Clock className="size-3.5" aria-hidden />
        {tr(locale, "Your order opens directly in WhatsApp", "الطلب يصل المطعم على واتساب مباشرة")}
      </p>
    </main>
  );
}
