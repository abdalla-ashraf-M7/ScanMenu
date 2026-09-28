import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/config";
import { adminListRestaurants } from "@/lib/repo";
import { AdminClient } from "./admin-client";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

export const metadata: Metadata = { title: "Restaurants" };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const locale = await getLocale();
  const restaurants = await adminListRestaurants();

  return (
    <main className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">{tr(locale, "Restaurants", "المطاعم المسجلة")}</h1>
        {!isSupabaseConfigured() && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-warn">
            {tr(locale, "Demo mode", "وضع تجريبي")}
          </span>
        )}
      </div>
      <AdminClient rows={restaurants} />
    </main>
  );
}
