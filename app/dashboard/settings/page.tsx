import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { getOwnRestaurant, listHours } from "@/lib/repo";
import { SettingsForm } from "./settings-form";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

export const metadata: Metadata = { title: "Restaurant settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await requireOwner();
  const locale = await getLocale();
  const [restaurant, hours] = await Promise.all([
    getOwnRestaurant(session.restaurantId),
    listHours(session.restaurantId),
  ]);

  if (!restaurant) return <p className="py-20 text-center text-inkmuted">{tr(locale, "No linked restaurant.", "لا يوجد مطعم مرتبط.")}</p>;

  return (
    <main className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">{tr(locale, "Restaurant settings", "إعدادات المطعم")}</h1>
      <SettingsForm restaurant={restaurant} hours={hours} />
    </main>
  );
}
