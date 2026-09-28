import Link from "next/link";
import { LogOut, QrCode } from "lucide-react";
import { BRAND } from "@/lib/config";
import type { SessionInfo } from "@/lib/types";
import { logoutAction } from "@/app/login/actions";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { LanguageSwitcher } from "./language-switcher";

/**
 * Shared app header for owner dashboard AND platform admin.
 * Mobile-first: nav becomes a scrollable chip row under the brand row.
 */
export async function AppHeader({ session }: { session: SessionInfo }) {
  const locale = await getLocale();
  const isAdmin = session.role === "admin";

  return (
    <header className="sticky top-0 z-40 -mx-4 mb-5 border-b border-line bg-paper/95 px-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3 py-3">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex min-w-0 items-center gap-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-sm">
            <QrCode className="size-5" aria-hidden />
          </span>
          <span className="truncate font-extrabold">{tr(locale, BRAND.nameEn, BRAND.nameAr)}</span>
        </Link>

        <div className="ms-auto flex items-center gap-1.5">
          <LanguageSwitcher />
        <form action={logoutAction}>
          <button
            type="submit"
            className="press flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-danger hover:bg-red-50"
          >
            <LogOut className="size-4" aria-hidden />
            {tr(locale, "Log out", "خروج")}
          </button>
        </form>
        </div>
      </div>

      <nav
        aria-label={tr(locale, "Dashboard navigation", "أدوات لوحة التحكم")}
        className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 text-sm font-bold"
      >
        {isAdmin ? (
          <Link href="/admin" className="press shrink-0 rounded-lg px-3 py-2 hover:bg-brandsoft">
            {tr(locale, "Restaurants", "المطاعم")}
          </Link>
        ) : (
          <>
            <Link href="/dashboard" className="press shrink-0 rounded-lg px-3 py-2 hover:bg-brandsoft">
              {tr(locale, "Overview", "الرئيسية")}
            </Link>
            <Link href="/dashboard/menu" className="press shrink-0 rounded-lg px-3 py-2 hover:bg-brandsoft">
              {tr(locale, "Menu", "المنيو")}
            </Link>
            <Link href="/dashboard/settings" className="press shrink-0 rounded-lg px-3 py-2 hover:bg-brandsoft">
              {tr(locale, "Settings", "الإعدادات")}
            </Link>
            <Link href="/dashboard/qr" className="press shrink-0 rounded-lg px-3 py-2 hover:bg-brandsoft">
              {tr(locale, "QR cards", "كود QR")}
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
