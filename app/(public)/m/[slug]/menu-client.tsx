"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, MapPin, ShoppingBag, MessageCircle } from "lucide-react";
import type { OpeningHour, PublicMenu } from "@/lib/types";
import { computeOpenState, priceFmt, weekday } from "@/lib/wa";
import { categoryName, restaurantAddress, restaurantName, restaurantTagline, tr } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CartProvider, useCart } from "./cart-context";
import { ItemCard } from "./item-card";

const CartSheetWrapper = dynamic(
  () => import("./cart-sheet").then((m) => m.CartSheet),
  { ssr: false }
);

export function MenuClient({ menu }: { menu: PublicMenu }) {
  const { locale } = useLocale();
  const { restaurant, categories, items, hours } = menu;
  const activeCats = categories.filter((c) => c.is_active);
  const itemsByCat = useMemo(() => {
    const m = new Map<string, typeof items>();
    for (const c of activeCats) {
      m.set(
        c.id,
        items.filter((i) => i.category_id === c.id && i.is_active)
      );
    }
    return m;
  }, [activeCats, items]);

  const visibleSections = activeCats.filter((c) => (itemsByCat.get(c.id)?.length ?? 0) > 0);

  const [openLabel, setOpenLabel] = useState(() => computeOpenState(hours, new Date(), locale).label);
  useEffect(() => {
    const tick = () => setOpenLabel(computeOpenState(hours, new Date(), locale).label);
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [hours, locale]);

  const [activeTab, setActiveTab] = useState(visibleSections[0]?.id ?? "");
  useEffect(() => {
    if (!visibleSections.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveTab(e.target.getAttribute("data-cat") ?? "");
        }
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 }
    );
    for (const id of visibleSections.map((s) => s.id)) {
      const el = document.getElementById(`sec-${id}`);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [visibleSections]);

  function jumpTo(id: string) {
    document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <CartProvider slug={restaurant.slug} items={items}>
      {/* Header */}
      <header className="relative overflow-hidden">
        <LanguageSwitcher className="absolute end-4 top-4 z-10" />
        {restaurant.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.cover_image_url}
            alt=""
            className="h-40 w-full object-cover sm:h-52"
          />
        ) : (
          <div className="h-28 bg-gradient-to-b from-brandsoft to-paper sm:h-36" aria-hidden />
        )}

        <div className="mx-auto -mt-10 max-w-md px-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgb(41_27_20/0.08)]">
            <div className="flex items-start gap-3">
              {restaurant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={restaurant.logo_url}
                  alt=""
                  className="size-14 rounded-xl object-cover"
                />
              ) : (
                <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-brand text-2xl font-extrabold text-white">
                  {restaurantName(restaurant, locale).slice(0, 1)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-extrabold leading-tight">
                  {restaurantName(restaurant, locale)}
                </h1>
                {restaurantTagline(restaurant, locale) && (
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-inkmuted">
                    {restaurantTagline(restaurant, locale)}
                  </p>
                )}
                <span
                  className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    computeOpenState(hours, new Date(), locale).open ? "bg-wa/10 text-wastrong" : "bg-black/5 text-inkmuted"
                  }`}
                >
                  <Clock className="size-3.5" aria-hidden />
                  {openLabel}
                </span>
              </div>
            </div>

            {(restaurantAddress(restaurant, locale) || restaurant.map_url) && (
              <div className="mt-3 flex items-center gap-1.5 border-t border-dashed border-line pt-3 text-[13px] text-inkmuted">
                <MapPin className="size-4 shrink-0 text-brand" aria-hidden />
                {restaurant.map_url ? (
                  <a
                    href={restaurant.map_url}
                    target="_blank"
                    rel="noopener"
                    className="underline decoration-dotted underline-offset-4 hover:text-brand"
                  >
                    {restaurantAddress(restaurant, locale) ?? tr(locale, "View on map", "الموقع على الخريطة")}
                  </a>
                ) : (
                  <span>{restaurantAddress(restaurant, locale)}</span>
                )}
              </div>
            )}

            <details className="group mt-2">
              <summary className="cursor-pointer list-none text-[13px] font-bold text-brand">
                {tr(locale, "Opening hours", "مواعيد العمل")} ▾
              </summary>
              <HoursList hours={hours} />
            </details>
          </div>
        </div>
      </header>

      {/* Category tabs */}
      <nav
        aria-label={tr(locale, "Menu categories", "أقسام المنيو")}
        className="sticky top-0 z-30 mt-4 border-b border-line bg-paper/95 backdrop-blur no-scrollbar overflow-x-auto"
      >
        <div className="mx-auto flex max-w-md gap-2 px-4 py-2.5">
          {visibleSections.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => jumpTo(c.id)}
              aria-current={activeTab === c.id}
              className={`press shrink-0 rounded-full px-4 py-2 text-sm font-bold ${
                activeTab === c.id ? "bg-brand text-white shadow-md" : "bg-surface text-ink hover:bg-brandsoft"
              }`}
            >
              {categoryName(c, locale)}
            </button>
          ))}
        </div>
      </nav>

      {/* Sections */}
      <main className="mx-auto max-w-md px-4 pb-32 pt-4">
        {visibleSections.length === 0 ? (
          <p className="py-20 text-center text-inkmuted">{tr(locale, "No menu items yet", "لا توجد أصناف منشورة حاليًا")}</p>
        ) : (
          visibleSections.map((c) => (
            <section key={c.id} id={`sec-${c.id}`} data-cat={c.id} className="scroll-mt-24 pt-2">
              <h2 className="mb-3 mt-4 text-lg font-extrabold">{categoryName(c, locale)}</h2>
              <div className="flex flex-col gap-3">
                {(itemsByCat.get(c.id) ?? []).map((it) => (
                  <ItemCard key={it.id} item={it} symbol={restaurant.currency_symbol} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <CartBar symbol={restaurant.currency_symbol} restaurant={restaurant} />
    </CartProvider>
  );
}

function HoursList({ hours }: { hours: OpeningHour[] }) {
  const { locale } = useLocale();
  const todayIdx = (new Date().getDay() + 1) % 7;
  return (
    <ul className="mt-2 space-y-1 rounded-xl bg-surface p-3 text-[13px]">
      {[...hours]
        .sort((a, b) => a.weekday - b.weekday)
        .map((h) => (
          <li
            key={h.weekday}
            className={`flex justify-between rounded-lg px-2 py-1 ${
              h.weekday === todayIdx ? "bg-brandsoft font-bold" : ""
            }`}
          >
            <span>{weekday(h.weekday, locale)}</span>
            <span className="text-inkmuted">
              {h.is_closed || !h.opens_at || !h.closes_at
                ? tr(locale, "Closed", "مغلق")
                : `${h.opens_at} — ${h.closes_at}`}
            </span>
          </li>
        ))}
    </ul>
  );
}

function CartBar({ symbol, restaurant }: { symbol: string; restaurant: PublicMenu["restaurant"] }) {
  const { locale } = useLocale();
  const { count, total } = useCart();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [glow, setGlow] = useState(false);
  const prevCount = useRef(0);

  // Pulse once when the FIRST item lands in the cart — teaches the tap target.
  useEffect(() => {
    if (prevCount.current === 0 && count > 0) {
      setGlow(true);
      const t = setTimeout(() => setGlow(false), 1600);
      prevCount.current = count;
      return () => clearTimeout(t);
    }
    prevCount.current = count;
  }, [count]);

  return (
    <>
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-200 ${
          count > 0 ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="safe-bottom mx-auto max-w-md px-4 pt-2">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            aria-label={tr(locale, `Checkout — ${count} items, total ${priceFmt(total, symbol, locale)}`, `إتمام الطلب — ${count} صنف، الإجمالي ${priceFmt(total, symbol, locale)}`)}
            className={`press flex w-full items-center justify-between gap-2 rounded-2xl px-5 py-4 text-white shadow-[0_10px_30px_rgb(34_164_85/0.35)] hover:bg-wastrong ${
              glow ? "animate-pulse ring-4 ring-wa/50" : ""
            } bg-wa`}
          >
            <span className="relative flex shrink-0 items-center gap-2 font-extrabold">
              <ShoppingBag className="size-5" aria-hidden />
              <span className="absolute -top-3 -end-3 grid size-6 place-items-center rounded-full bg-white text-xs font-extrabold text-wastrong shadow">
                {count}
              </span>
              {tr(locale, "Your cart", "سلتك")}
            </span>
            <span className="text-right leading-tight">
              <span className="block text-lg font-extrabold">{priceFmt(total, symbol, locale)}</span>
              <span className="flex items-center justify-end gap-1 text-[11px] font-bold opacity-90"><MessageCircle className="size-3" aria-hidden />{tr(locale, "Checkout on WhatsApp", "إتمام الطلب عبر واتساب")}</span>
            </span>
          </button>
        </div>
      </div>

      {sheetOpen && <CartSheetWrapper restaurant={restaurant} onClose={() => setSheetOpen(false)} />}
    </>
  );
}
