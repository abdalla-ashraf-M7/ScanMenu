"use client";

import { Languages } from "lucide-react";
import { useLocale } from "./locale-provider";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, changeLocale, changing } = useLocale();
  const next = locale === "en" ? "ar" : "en";
  return (
    <button
      type="button"
      onClick={() => void changeLocale(next)}
      disabled={changing}
      lang={next}
      aria-label={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
      className={`press inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-surface/95 px-3 py-1.5 text-xs font-extrabold text-ink shadow-sm backdrop-blur hover:border-brand hover:text-brand disabled:opacity-50 ${className}`}
    >
      <Languages className="size-4" aria-hidden />
      {locale === "en" ? "العربية" : "English"}
    </button>
  );
}
