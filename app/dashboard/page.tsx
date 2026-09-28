import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, QrCode, Settings, ExternalLink } from "lucide-react";
import { requireOwner } from "@/lib/auth";
import { getOwnRestaurant, listHours, listOwnerMenu } from "@/lib/repo";
import { computeOpenState } from "@/lib/wa";
import { CopyBtn } from "@/components/copy-btn";
import { getLocale } from "@/lib/i18n-server";
import { restaurantName, tr } from "@/lib/i18n";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const session = await requireOwner();
  const locale = await getLocale();
  const [restaurant, menu] = await Promise.all([
    getOwnRestaurant(session.restaurantId),
    listOwnerMenu(session.restaurantId),
  ]);

  if (!restaurant) {
    return <p className="py-20 text-center text-inkmuted">{tr(locale, "No restaurant is linked to this account.", "لا يوجد مطعم مرتبط بهذا الحساب.")}</p>;
  }

  const hours = await listHours(restaurant.id);
  const state = computeOpenState(hours, new Date(), locale);

  const activeItems = menu.items.filter((i) => i.is_active).length;
  const soldOut = menu.items.filter((i) => i.is_sold_out).length;

  return (
    <main className="flex flex-col gap-5">
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">{restaurantName(restaurant, locale)}</h1>
            <p className="mt-0.5 text-sm text-inkmuted" dir="ltr">
              /m/{restaurant.slug}
            </p>
          </div>
          <span
            className={`rounded-full px-3.5 py-1.5 text-sm font-bold ${
              state.open ? "bg-wa/10 text-wastrong" : "bg-black/5 text-inkmuted"
            }`}
          >
            {state.label || "—"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CopyBtn value={`/m/${restaurant.slug}`} label={tr(locale, "Copy menu link", "نسخ رابط المنيو")} />
          <Link
            href={`/m/${restaurant.slug}`}
            target="_blank"
            className="press inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-brandsoft"
          >
            <ExternalLink className="size-4 text-brand" aria-hidden />
            {tr(locale, "Open menu", "فتح المنيو")}
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={tr(locale, "Live categories", "قسم منشور")} value={menu.categories.filter((c) => c.is_active).length} />
        <StatCard label={tr(locale, "Live items", "صنف منشور")} value={activeItems} />
        <StatCard label={tr(locale, "Sold out today", "غير متوفر اليوم")} value={soldOut} warn={soldOut > 0} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickCard
          href="/dashboard/menu"
          icon={<BookOpenText className="size-6 text-brand" aria-hidden />}
          title={tr(locale, "Manage menu", "إدارة المنيو")}
          desc={tr(locale, "Add dishes, adjust prices and set availability.", "أضف أصنافًا، عدّل الأسعار، حدّد ما هو متاح اليوم.")}
        />
        <QuickCard
          href="/dashboard/qr"
          icon={<QrCode className="size-6 text-brand" aria-hidden />}
          title={tr(locale, "Table QR cards", "كود QR للطاولات")}
          desc={tr(locale, "Download and print a scannable menu card.", "حمّل الكود واطبعه وضعه على الطاولات.")}
        />
        <QuickCard
          href="/dashboard/settings"
          icon={<Settings className="size-6 text-brand" aria-hidden />}
          title={tr(locale, "Restaurant settings", "إعدادات المطعم")}
          desc={tr(locale, "WhatsApp number, hours, branding and details.", "رقم واتساب، مواعيد العمل، الشعار والأغلفة.")}
        />
      </section>
    </main>
  );
}

function StatCard({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 text-center">
      <p className={`text-3xl font-extrabold ${warn ? "text-warn" : "text-brand"}`}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-inkmuted">{label}</p>
    </div>
  );
}

function QuickCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="press rounded-2xl border border-line bg-surface p-4 hover:border-brand hover:bg-brandsoft/40"
    >
      {icon}
      <h2 className="mt-2 font-extrabold">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-inkmuted">{desc}</p>
    </Link>
  );
}
