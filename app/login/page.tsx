import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { QrCode } from "lucide-react";
import { getSessionInfo } from "@/lib/auth";
import { BRAND, isSupabaseConfigured } from "@/lib/config";
import { LoginForm } from "./login-form";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSessionInfo();
  const locale = await getLocale();
  if (session) redirect(session.role === "admin" ? "/admin" : "/dashboard");
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <LanguageSwitcher className="absolute end-4 top-4" />
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="grid size-14 place-items-center rounded-2xl bg-brand text-white shadow-md">
          <QrCode className="size-7" aria-hidden />
        </div>
        <h1 className="text-xl font-extrabold">{tr(locale, BRAND.nameEn, BRAND.nameAr)}</h1>
        <p className="text-sm text-inkmuted">{tr(locale, "Restaurant dashboard", "لوحة تحكم صاحب المطعم")}</p>
      </div>

      <LoginForm next={next} />

      {!isSupabaseConfigured() && (
        <p className="text-center text-[11px] text-inkmuted">
          {tr(locale, "Sample accounts are available below for a quick tour.", "أي بيانات صحيحة الشكل تعمل أيضًا — الحسابات تُنشأ داخل الذاكرة للتجربة فقط عبر لوحة المشرف.")}
        </p>
      )}
    </main>
  );
}
