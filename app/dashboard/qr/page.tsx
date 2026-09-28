import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { getOwnRestaurant } from "@/lib/repo";
import { QrStudio } from "./qr-studio";
import { getLocale } from "@/lib/i18n-server";
import { restaurantName, tr } from "@/lib/i18n";

export const metadata: Metadata = { title: "QR cards" };
export const dynamic = "force-dynamic";

export default async function QrPage() {
  const session = await requireOwner();
  const locale = await getLocale();
  const restaurant = await getOwnRestaurant(session.restaurantId);
  if (!restaurant) return <p className="py-20 text-center text-inkmuted">{tr(locale, "No linked restaurant.", "لا يوجد مطعم مرتبط.")}</p>;

  return (
    <main className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">{tr(locale, "Table QR cards", "كود QR للطاولات")}</h1>
      <QrStudio
        slug={restaurant.slug}
        name={restaurantName(restaurant, locale)}
        logoUrl={restaurant.logo_url}
      />
    </main>
  );
}
