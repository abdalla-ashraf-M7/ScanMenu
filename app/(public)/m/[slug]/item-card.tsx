"use client";

import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { priceFmt } from "@/lib/wa";
import { useCart } from "./cart-context";
import { itemDescription, itemName, tr } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { MenuPhoto } from "@/components/menu-photo";

export function ItemCard({ item, symbol }: { item: MenuItem; symbol: string }) {
  const { locale } = useLocale();
  const name = itemName(item, locale);
  const description = itemDescription(item, locale);
  const { lines, dispatch } = useCart();
  const qty = lines[item.id] ?? 0;
  const disabled = item.is_sold_out;

  return (
    <article
      className={`flex gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[0_1px_2px_rgb(41_27_20/0.05)] ${
        disabled ? "opacity-60" : ""
      }`}
      aria-label={name}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brandsoft sm:size-24">
        {item.image_url ? (
          <MenuPhoto src={item.image_url} className={`size-full object-cover ${disabled ? "grayscale" : ""}`} />
        ) : (
          <div className="grid size-full place-items-center text-brand">
            <UtensilsCrossed className="size-7" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5">
        <div>
          <h3 className="font-bold leading-snug">{name}</h3>
          {description && (
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-inkmuted">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="shrink-0 text-[15px] font-extrabold text-brand">
            {priceFmt(Number(item.price), symbol, locale)}
          </span>

          {disabled ? (
            <span className="rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-inkmuted">
              {tr(locale, "Sold out today", "غير متوفر اليوم")}
            </span>
          ) : qty > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-brandsoft p-1">
              <button
                type="button"
                onClick={() => dispatch({ type: "dec", id: item.id })}
                className="press grid size-9 place-items-center rounded-full bg-white text-brand shadow-sm"
                aria-label={tr(locale, `Remove one ${name}`, `أنقص ${name}`)}
              >
                <Minus className="size-4" />
              </button>
              <span className="min-w-7 text-center font-extrabold">{qty}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "add", id: item.id })}
                className="press grid size-9 place-items-center rounded-full bg-brand text-white shadow-sm hover:bg-brandstrong"
                aria-label={tr(locale, `Add one ${name}`, `زود ${name}`)}
              >
                <Plus className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => dispatch({ type: "add", id: item.id })}
              className="press flex items-center gap-1.5 rounded-full bg-brand px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-brandstrong"
              aria-label={tr(locale, `Add ${name} to cart`, `أضف ${name} للسلة`)}
            >
              <Plus className="size-4" aria-hidden />
              {tr(locale, "Add", "أضف")}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
