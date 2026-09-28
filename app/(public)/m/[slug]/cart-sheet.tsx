"use client";

import { useEffect, useRef, useState } from "react";
import { X, Trash2, ShoppingBag, Bike, Store, MessageCircle } from "lucide-react";
import type { Restaurant } from "@/lib/types";
import { buildOrderMessage, buildWaLink, priceFmt } from "@/lib/wa";
import { useCart } from "./cart-context";
import { itemName, tr } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

type Stage = "form" | "sent";

export function CartSheet({
  restaurant,
  onClose,
}: {
  restaurant: Restaurant;
  onClose: () => void;
}) {
  const { detailed, total, dispatch } = useCart();
  const { locale } = useLocale();
  const [stage, setStage] = useState<Stage>("form");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    restaurant.delivery_enabled ? "delivery" : "pickup"
  );
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [waHref, setWaHref] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // This sheet is client-only (loaded via dynamic ssr:false), so reading
  // localStorage in a lazy initializer is hydration-safe and lint-clean.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`sm-cust-${restaurant.slug}`);
      if (raw) {
        const saved = JSON.parse(raw) as { name?: string; address?: string };
        queueMicrotask(() => {
          if (saved.name) setName(saved.name);
          if (saved.address) setAddress(saved.address);
        });
      }
    } catch {
      /* ignore */
    }
    nameRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = tr(locale, "Please enter your name", "اكتب اسمك من فضلك");
    if (fulfillment === "delivery" && address.trim().length < 5)
      errs.address = tr(locale, "Please enter your full delivery address", "اكتب عنوان التوصيل بالتفصيل");
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      localStorage.setItem(
        `sm-cust-${restaurant.slug}`,
        JSON.stringify({ name: name.trim(), address: address.trim() })
      );
    } catch {
      /* ignore */
    }

    const msg = buildOrderMessage({
      restaurant,
      locale,
      lines: detailed.map((x) => ({ name: itemName(x.item, locale), qty: x.qty, price: Number(x.item.price) })),
      customerName: name,
      fulfillment,
      address,
      note,
    });
    const href = `https://${buildWaLink(restaurant.whatsapp_number, msg)}`;
    setWaHref(href);
    window.open(href, "_blank", "noopener");
    setStage("sent");
    dispatch({ type: "clear" });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={tr(locale, "Order cart", "سلة الطلب")}
      onClick={onClose}
    >
      <div
        className="sheet-enter max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-paper safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        {stage === "sent" ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-wa/10 text-3xl">✅</div>
            <h2 className="text-xl font-extrabold">{tr(locale, "Your order is ready", "تم تجهيز رسالة طلبك")}</h2>
            <p className="text-sm leading-relaxed text-inkmuted">
              {tr(locale, "If WhatsApp did not open, use the button below and tap Send in WhatsApp.", "لو واتساب مفتحش تلقائيًا، اضغط الزر تحت ثم اضغط «إرسال» في واتساب.")}
            </p>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener"
                className="press mt-1 w-full rounded-xl bg-wa px-5 py-3.5 font-bold text-white shadow-md hover:bg-wastrong"
              >
                <span className="inline-flex items-center justify-center gap-2"><MessageCircle className="size-5" aria-hidden />{tr(locale, "Open WhatsApp", "فتح واتساب")}</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="press w-full rounded-xl border border-line bg-surface px-5 py-3 font-semibold hover:bg-brandsoft"
            >
              {tr(locale, "Back to menu", "رجوع للمنيو")}
            </button>
          </div>
        ) : (
          <>
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-5 py-3.5">
              <h2 className="flex items-center gap-2 text-lg font-extrabold">
                <ShoppingBag className="size-5 text-brand" aria-hidden />
                {tr(locale, "Your order", "سلة الطلب")} ({detailed.reduce((n, x) => n + x.qty, 0)})
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={tr(locale, "Close cart", "إغلاق السلة")}
                className="press grid size-10 place-items-center rounded-full hover:bg-brandsoft"
              >
                <X className="size-5" />
              </button>
            </header>

            <div className="flex flex-col gap-3 p-4">
              {detailed.map(({ item, qty }) => (
                <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{itemName(item, locale)}</p>
                    <p className="text-sm font-extrabold text-brand">
                      {priceFmt(qty * Number(item.price), restaurant.currency_symbol, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-brandsoft p-1">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "dec", id: item.id })}
                      className="press grid size-9 place-items-center rounded-full bg-white shadow-sm"
                      aria-label={tr(locale, `Remove one ${itemName(item, locale)}`, `أنقص ${itemName(item, locale)}`)}
                    >
                      −
                    </button>
                    <span className="min-w-7 text-center font-extrabold">{qty}</span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "add", id: item.id })}
                      className="press grid size-9 place-items-center rounded-full bg-brand text-white hover:bg-brandstrong"
                      aria-label={tr(locale, `Add one ${itemName(item, locale)}`, `زود ${itemName(item, locale)}`)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "remove", id: item.id })}
                    aria-label={tr(locale, `Remove ${itemName(item, locale)}`, `حذف ${itemName(item, locale)}`)}
                    className="press grid size-9 place-items-center rounded-full text-danger hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}

              <form onSubmit={submit} className="mt-1 flex flex-col gap-4 rounded-2xl bg-surface p-4" noValidate>
                <fieldset>
                  <legend className="mb-2 text-sm font-bold">{tr(locale, "How would you like your order?", "نوع الطلب")}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {restaurant.delivery_enabled && (
                      <button
                        type="button"
                        onClick={() => setFulfillment("delivery")}
                        className={`press rounded-xl border px-4 py-2.5 font-semibold ${
                          fulfillment === "delivery"
                            ? "border-brand bg-brandsoft text-brand"
                            : "border-line"
                        }`}
                        aria-pressed={fulfillment === "delivery"}
                      >
                        <span className="inline-flex items-center gap-1.5"><Bike className="size-4" aria-hidden />{tr(locale, "Delivery", "توصيل")}</span>
                      </button>
                    )}
                    {restaurant.pickup_enabled && (
                      <button
                        type="button"
                        onClick={() => setFulfillment("pickup")}
                        className={`press rounded-xl border px-4 py-2.5 font-semibold ${
                          fulfillment === "pickup"
                            ? "border-brand bg-brandsoft text-brand"
                            : "border-line"
                        }`}
                        aria-pressed={fulfillment === "pickup"}
                      >
                        <span className="inline-flex items-center gap-1.5"><Store className="size-4" aria-hidden />{tr(locale, "Pickup", "استلام من المحل")}</span>
                      </button>
                    )}
                  </div>
                </fieldset>

                <Field label={tr(locale, "Your name", "الاسم")} error={errors.name}>
                  <input
                    ref={nameRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={tr(locale, "e.g. Alex Morgan", "مثال: محمد أحمد")}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand"
                  />
                </Field>

                {fulfillment === "delivery" && (
                  <Field label={tr(locale, "Delivery address", "عنوان التوصيل")} error={errors.address}>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={2}
                      placeholder={tr(locale, "Street, building, floor and landmark…", "الشارع، رقم العمارة، الدور، علامة مميزة…")}
                      className="w-full resize-none rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand"
                    />
                  </Field>
                )}

                <Field label={tr(locale, "Notes (optional)", "ملاحظات (اختياري)")}>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={tr(locale, "No onions, extra sauce…", "بدون بصل، صوص زيادة…")}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-3 outline-none focus:border-brand"
                  />
                </Field>

                <div className="flex items-center justify-between border-t border-dashed border-line pt-4">
                  <span className="font-bold">{tr(locale, "Total", "الإجمالي")}</span>
                  <span className="text-xl font-extrabold text-brand">
                    {priceFmt(total, restaurant.currency_symbol, locale)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="press w-full rounded-xl bg-wa px-5 py-4 text-lg font-extrabold text-white shadow-md hover:bg-wastrong"
                >
                  <span className="inline-flex items-center justify-center gap-2"><MessageCircle className="size-5" aria-hidden />{tr(locale, "Continue to WhatsApp", "إرسال الطلب على واتساب")}</span>
                </button>
                <p className="-mt-2 text-center text-xs text-inkmuted">
                  {tr(locale, "Pay cash on delivery or pickup. Confirm your order in WhatsApp.", "الدفع كاش عند الاستلام — هتأكد المطعم من طلبك في واتساب")}
                </p>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs font-semibold text-danger">{error}</span>}
    </label>
  );
}
