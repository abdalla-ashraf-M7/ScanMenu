"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { OpeningHour, Restaurant } from "@/lib/types";
import { weekday } from "@/lib/wa";
import { tr } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";
import { uploadRestaurantImage } from "@/lib/upload";
import { saveHoursAction, saveSettingsAction } from "./actions";

export function SettingsForm({
  restaurant,
  hours,
}: {
  restaurant: Restaurant;
  hours: OpeningHour[];
}) {
  const { locale } = useLocale();
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  const [logoUrl, setLogoUrl] = useState(restaurant.logo_url);
  const [coverUrl, setCoverUrl] = useState(restaurant.cover_image_url);

  return (
    <>
      <form action={action} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <h2 className="text-lg font-extrabold">{tr(locale, "Restaurant details", "بيانات المطعم")}</h2>

        {/* images */}
        <div className="grid gap-3 sm:grid-cols-2">
          <ImageField
            label={tr(locale, "Logo (square)", "الشعار (مربع)")}
            restaurantId={restaurant.id}
            url={logoUrl}
            onChange={setLogoUrl}
          />
          <ImageField
            label={tr(locale, "Cover image", "صورة الغلاف")}
            restaurantId={restaurant.id}
            url={coverUrl}
            wide
            onChange={setCoverUrl}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tr(locale, "Arabic restaurant name *", "اسم المطعم بالعربية *")}>
            <input name="name_ar" defaultValue={restaurant.name_ar} required minLength={2} className={inputCls} />
          </Field>
          <Field label={tr(locale, "English restaurant name", "اسم المطعم بالإنجليزية")}>
            <input name="name_en" dir="ltr" defaultValue={restaurant.name_en ?? ""} maxLength={80} className={inputCls} />
          </Field>
          <Field label={tr(locale, "Arabic tagline", "جملة تعريفية بالعربية")}>
            <input name="tagline_ar" defaultValue={restaurant.tagline_ar ?? ""} maxLength={120} placeholder="أكل بيتي على أصوله" className={inputCls} />
          </Field>
          <Field label={tr(locale, "English tagline", "جملة تعريفية بالإنجليزية")}>
            <input name="tagline_en" dir="ltr" defaultValue={restaurant.tagline_en ?? ""} maxLength={120} placeholder="Food made with heart" className={inputCls} />
          </Field>
        </div>

        <Field label={tr(locale, "WhatsApp number for orders *", "رقم واتساب لاستلام الطلبات *")} hint={tr(locale, "International format without +, e.g. 201001234567", "بالصيغة الدولية بدون + — مثال: 201001234567")}>
          <input
            name="whatsapp_number"
            defaultValue={restaurant.whatsapp_number}
            required
            dir="ltr"
            inputMode="numeric"
            pattern="[0-9+\s-]+"
            className={`${inputCls} text-left`}
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={tr(locale, "Arabic address", "العنوان بالعربية")}>
            <input name="address_ar" defaultValue={restaurant.address_ar ?? ""} maxLength={200} className={inputCls} />
          </Field>
          <Field label={tr(locale, "English address", "العنوان بالإنجليزية")}>
            <input name="address_en" dir="ltr" defaultValue={restaurant.address_en ?? ""} maxLength={200} className={inputCls} />
          </Field>
          <Field label={tr(locale, "Map link", "رابط الموقع على الخريطة")}>
            <input name="map_url" defaultValue={restaurant.map_url ?? ""} dir="ltr" placeholder="https://maps.google.com/…" className={`${inputCls} text-left`} />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={tr(locale, "Currency symbol", "رمز العملة")}>
            <input name="currency_symbol" defaultValue={restaurant.currency_symbol} maxLength={6} className={inputCls} />
          </Field>
          <Field label={tr(locale, "Preparation time (minutes)", "أقل وقت تحضير (دقائق)")}>
            <input name="min_prep_minutes" type="number" min={5} max={240} defaultValue={restaurant.min_prep_minutes} className={inputCls} />
          </Field>
          <div className="flex items-end gap-4 pb-1.5">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="delivery_enabled" defaultChecked={restaurant.delivery_enabled} className="size-4 accent-[#C2410C]" />
              {tr(locale, "Delivery", "توصيل")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="pickup_enabled" defaultChecked={restaurant.pickup_enabled} className="size-4 accent-[#C2410C]" />
              {tr(locale, "Pickup", "استلام")}
            </label>
          </div>
        </div>

        <input type="hidden" name="logo_url" value={logoUrl ?? ""} />
        <input type="hidden" name="cover_image_url" value={coverUrl ?? ""} />

        {state?.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">{state.error}</p>
        )}
        {state?.ok && (
          <p role="status" className="rounded-lg bg-wa/10 px-3 py-2 text-sm font-semibold text-wastrong">
            {tr(locale, "Saved. Your menu has been updated.", "تم الحفظ ✅ — التغييرات ظاهرة في المنيو فورًا")}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="press flex w-fit items-center gap-2 rounded-xl bg-brand px-6 py-3 font-bold text-white shadow-md hover:bg-brandstrong disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {tr(locale, "Save settings", "حفظ الإعدادات")}
        </button>
      </form>

      <HoursEditor initial={hours} />
    </>
  );
}

/* ── hours ── */

function HoursEditor({ initial }: { initial: OpeningHour[] }) {
  const { locale } = useLocale();
  const [rows, setRows] = useState<OpeningHour[]>(
    Array.from({ length: 7 }, (_, d) =>
      initial.find((h) => h.weekday === d) ?? { weekday: d, opens_at: "10:00", closes_at: "23:00", is_closed: false }
    )
  );
  const [msg, setMsg] = useState<{ ok?: boolean; error?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function patch(d: number, p: Partial<OpeningHour>) {
    setRows((rs) => rs.map((r) => (r.weekday === d ? { ...r, ...p } : r)));
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="mb-3 text-lg font-extrabold">{tr(locale, "Opening hours", "مواعيد العمل")}</h2>
      <div className="flex flex-col gap-2">
        {[...rows]
          .sort((a, b) => a.weekday - b.weekday)
          .map((h) => (
            <div key={h.weekday} className="flex flex-wrap items-center gap-2 rounded-xl bg-paper px-3 py-2">
              <span className="w-24 text-sm font-bold">{weekday(h.weekday, locale)}</span>
              <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-inkmuted">
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => patch(h.weekday, { is_closed: e.target.checked })}
                  className="size-4 accent-[#C2410C]"
                />
                {tr(locale, "Closed", "مغلق")}
              </label>
              {!h.is_closed && (
                <span className="flex flex-wrap items-center gap-1.5">
                  <input
                    type="time"
                    value={h.opens_at ?? ""}
                    onChange={(e) => patch(h.weekday, { opens_at: e.target.value })}
                    aria-label={tr(locale, `Opens on ${weekday(h.weekday, locale)}`, `من — ${weekday(h.weekday, locale)}`)}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
                  />
                  <span className="text-inkmuted">←</span>
                  <input
                    type="time"
                    value={h.closes_at ?? ""}
                    onChange={(e) => patch(h.weekday, { closes_at: e.target.value })}
                    aria-label={tr(locale, `Closes on ${weekday(h.weekday, locale)}`, `إلى — ${weekday(h.weekday, locale)}`)}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-sm outline-none focus:border-brand"
                  />
                </span>
              )}
            </div>
          ))}
      </div>

      {msg?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">{msg.error}</p>
      )}
      {msg?.ok && (
        <p role="status" className="mt-3 rounded-lg bg-wa/10 px-3 py-2 text-sm font-semibold text-wastrong">{tr(locale, "Hours saved ✓", "تم حفظ المواعيد ✅")}</p>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await saveHoursAction(rows);
            setMsg(res);
          })
        }
        className="press mt-4 rounded-xl bg-brand px-6 py-3 font-bold text-white shadow-md hover:bg-brandstrong disabled:opacity-60"
      >
        {pending ? tr(locale, "Saving…", "جارٍ الحفظ…") : tr(locale, "Save hours", "حفظ المواعيد")}
      </button>
    </div>
  );
}

/* ── shared ── */

const inputCls =
  "w-full rounded-xl border border-line bg-paper px-4 py-2.5 outline-none focus:border-brand";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-inkmuted">{hint}</span>}
    </label>
  );
}

function ImageField({
  label,
  restaurantId,
  url,
  onChange,
  wide,
}: {
  label: string;
  restaurantId: string;
  url: string | null;
  onChange: (u: string | null) => void;
  wide?: boolean;
}) {
  const { locale } = useLocale();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setErr(false);
    try {
      const { url: u } = await uploadRestaurantImage(restaurantId, f);
      onChange(u);
    } catch {
      setErr(true);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <div className={`relative overflow-hidden rounded-xl border border-dashed border-line ${wide ? "h-28" : "h-28"} bg-paper`}>
        {uploading ? (
          <div className="grid size-full place-items-center">
            <Loader2 className="size-6 animate-spin text-brand" aria-hidden />
          </div>
        ) : url ? (
          isDemoSrc(url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <Image src={url} alt="" fill sizes="240px" className="object-cover" unoptimized />
          )
        ) : (
          <label className="press grid size-full cursor-pointer place-items-center text-sm font-bold text-brand hover:bg-brandsoft">
            {tr(locale, "Upload image", "رفع صورة")}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        )}
        {url && !uploading && (
          <label className="absolute bottom-2 start-2 cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-brand shadow hover:bg-white">
            {tr(locale, "Change", "تغيير")}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        )}
      </div>
      {err && <span className="mt-1 block text-xs text-danger">{tr(locale, "Upload failed. Please try again.", "فشل الرفع — جرّب مرة أخرى")}</span>}
    </div>
  );
}

function isDemoSrc(src: string): boolean {
  return src.startsWith("/__demo-file") || src.startsWith("data:");
}
