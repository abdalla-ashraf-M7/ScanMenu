import Link from "next/link";
import { BRAND, isSupabaseConfigured } from "@/lib/config";
import { QrCode, MessageCircle, LayoutDashboard } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export default async function Home() {
  const locale = await getLocale();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
      <LanguageSwitcher className="absolute end-4 top-4" />
      <div className="flex flex-col items-center gap-3">
        <div className="grid size-16 place-items-center rounded-2xl bg-brand text-white shadow-lg">
          <QrCode className="size-8" aria-hidden />
        </div>
        <h1 className="text-3xl font-extrabold">{tr(locale, BRAND.nameEn, BRAND.nameAr)}</h1>
        <p className="text-inkmuted">{tr(locale, BRAND.taglineEn, BRAND.taglineAr)}</p>
      </div>

      {!isSupabaseConfigured() && (
        <p className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-warn">
          {tr(locale, "Explore the sample restaurant in demo mode", "الوضع التجريبي (Demo) — البيانات تجريبية وتُعاد عند إعادة التشغيل")}
        </p>
      )}

      <nav className="flex w-full flex-col gap-3" aria-label={tr(locale, "Quick links", "روابط سريعة")}>
        <Link
          href="/m/al-amal"
          className="press flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-semibold text-white shadow-md hover:bg-brandstrong"
        >
          <MessageCircle className="size-5" aria-hidden />
          {tr(locale, "Explore Al Amal Kitchen menu", "تجربة منيو مطعم الأمل")}
        </Link>
        <Link
          href="/login"
          className="press flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3.5 font-semibold hover:bg-brandsoft"
        >
          <LayoutDashboard className="size-5 text-brand" aria-hidden />
          {tr(locale, "Restaurant owner sign in", "دخول أصحاب المطاعم")}
        </Link>
      </nav>

      <p className="text-xs text-inkmuted">
        {BRAND.nameEn} © {new Date().getFullYear()}
      </p>
    </main>
  );
}
