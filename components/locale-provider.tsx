"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/actions/locale";
import type { Locale } from "@/lib/i18n";

const LocaleContext = createContext<{ locale: Locale; changeLocale: (next: Locale) => Promise<void>; changing: boolean } | null>(null);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  async function changeLocale(next: Locale) {
    if (next === locale || changing) return;
    setChanging(true);
    try {
      await setLocaleAction(next);
      document.documentElement.lang = next;
      document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
      router.refresh();
    } finally {
      setChanging(false);
    }
  }

  return <LocaleContext.Provider value={{ locale, changeLocale, changing }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider is missing");
  return context;
}
