import type { OpeningHour, Restaurant } from "./types";
import { restaurantName, tr, type Locale } from "./i18n";

/** Build the exact order message sent through the wa.me link. */
export interface OrderLine {
  name: string;
  qty: number;
  price: number;
}

export interface OrderDraft {
  restaurant: Pick<
    Restaurant,
    "name_ar" | "currency_symbol" | "delivery_enabled" | "pickup_enabled" | "min_prep_minutes"
  > & Pick<Restaurant, "name_en">;
  locale: Locale;
  lines: OrderLine[];
  customerName: string;
  fulfillment: "delivery" | "pickup";
  address?: string;
  note?: string;
}

export function buildOrderMessage(d: OrderDraft): string {
  const locale = d.locale;
  const cur = d.restaurant.currency_symbol;
  const L: string[] = [];
  let total = 0;

  L.push(`🍽️ ${tr(locale, "New order", "طلب جديد")} – ${restaurantName(d.restaurant, locale)}`);
  L.push("———————");
  for (const line of d.lines) {
    const lineTotal = line.qty * line.price;
    total += lineTotal;
    L.push(`${line.qty}× ${line.name} — ${priceFmt(lineTotal, cur, locale)}`);
  }
  L.push("———————");
  L.push(`${tr(locale, "Total", "الإجمالي")}: ${priceFmt(total, cur, locale)}`);
  if (d.customerName.trim()) L.push(`👤 ${tr(locale, "Name", "الاسم")}: ${d.customerName.trim()}`);
  if (d.fulfillment === "delivery" && d.address?.trim())
    L.push(`📍 ${tr(locale, "Address", "العنوان")}: ${d.address.trim()}`);
  if (d.note?.trim()) L.push(`📝 ${tr(locale, "Notes", "ملاحظات")}: ${d.note.trim()}`);
  L.push(`⏱️ ${tr(locale, "Estimated preparation", "وقت التحضير التقريبي")}: ${d.restaurant.min_prep_minutes} ${tr(locale, "minutes", "دقيقة")}`);
  L.push(`💵 ${tr(locale, "Payment: cash on delivery or pickup", "الدفع: كاش عند الاستلام")}`);

  return L.join("\n");
}

/** wa.me link. `number` must be digits-only international format (no +). */
export function buildWaLink(number: string, text: string): string {
  // wa.me rejects very long texts; keep essentials under a safe budget.
  let t = text;
  if (t.length > 1800) {
    t = t.slice(0, 1770) + "\n… (تم اختصار تفاصيل الطلب)";
  }
  return `wa.me/${number}?text=${encodeURIComponent(t)}`;
}

const WEEKDAYS_AR = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const WEEKDAYS_EN = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export function weekdayAr(weekday: number): string {
  return WEEKDAYS_AR[weekday] ?? "";
}
export function weekday(weekday: number, locale: Locale): string {
  return (locale === "ar" ? WEEKDAYS_AR : WEEKDAYS_EN)[weekday] ?? "";
}

/** Egyptian week: 0 = Saturday … 6 = Friday. */
export function todayWeekday(date = new Date()): number {
  // JS getDay(): 0=Sunday … 6=Saturday → map to Sat-based index
  return (date.getDay() + 1) % 7;
}

export interface OpenState {
  open: boolean;
  label: string;
}

export function computeOpenState(hours: OpeningHour[], now = new Date(), locale: Locale = "en"): OpenState {
  if (!hours.length) return { open: true, label: "" };
  const wd = todayWeekday(now);
  const today = hours.find((h) => h.weekday === wd);
  if (!today || today.is_closed || !today.opens_at || !today.closes_at)
    return { open: false, label: tr(locale, "Closed now", "مغلق حاليًا") };

  const mins = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = today.opens_at.split(":").map(Number);
  const [ch, cm] = today.closes_at.split(":").map(Number);
  const openM = oh * 60 + om;
  let closeM = ch * 60 + cm;
  if (closeM <= openM) closeM += 24 * 60; // crosses midnight
  const cur = mins < openM && closeM > 24 * 60 ? mins + 24 * 60 : mins;

  if (cur >= openM && cur <= closeM) return { open: true, label: tr(locale, "Open now", "مفتوح الآن") };
  return { open: false, label: tr(locale, "Closed now", "مغلق حاليًا") };
}

export function priceFmt(price: number, symbol: string, locale: Locale = "en"): string {
  const amount = Number.isInteger(price) ? String(price) : price.toFixed(2);
  return locale === "en" ? `${amount} ${symbol === "ج.م" ? "EGP" : symbol}` : `${amount}${symbol}`;
}
