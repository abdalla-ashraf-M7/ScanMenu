import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

export default async function NotFound() {
  const locale = await getLocale();
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="text-4xl">🔍</span>
        <h1 className="text-xl font-extrabold">{tr(locale, "Page not found", "الصفحة غير موجودة")}</h1>
        <p className="text-sm text-inkmuted">{tr(locale, "Check the link or return to the homepage.", "تأكد من الرابط أو ارجع للصفحة الرئيسية.")}</p>
        <Link
          href="/"
          className="press mt-2 rounded-xl bg-brand px-5 py-2.5 font-bold text-white hover:bg-brandstrong"
        >
          {tr(locale, "Home", "الرئيسية")}
        </Link>
      </div>
    </main>
  );
}
