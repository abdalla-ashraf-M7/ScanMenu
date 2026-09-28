"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import { getOwnRestaurant, saveHours, updateRestaurantSettings } from "@/lib/repo";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

const numberSchema = z.string().regex(/^[1-9][0-9]{7,14}$/, "اكتب الرقم بصيغة دولية بدون + — مثال: 201001234567");

const profileSchema = z.object({
  name_ar: z.string().trim().min(2).max(80),
  name_en: z.string().trim().max(80).optional().or(z.literal("")),
  tagline_ar: z.string().trim().max(120).optional().or(z.literal("")),
  tagline_en: z.string().trim().max(120).optional().or(z.literal("")),
  whatsapp_number: numberSchema,
  address_ar: z.string().trim().max(200).optional().or(z.literal("")),
  address_en: z.string().trim().max(200).optional().or(z.literal("")),
  map_url: z.union([z.literal(""), z.string().url("رابط الخريطة غير صحيح")]).optional(),
  currency_symbol: z.string().trim().min(1).max(6),
  delivery_enabled: z.boolean(),
  pickup_enabled: z.boolean(),
  min_prep_minutes: z.coerce.number().int().min(5).max(240),
});

export async function saveSettingsAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData
): Promise<{ error?: string; ok?: boolean }> {
  const s = await requireOwner();
  const locale = await getLocale();

  const parsed = profileSchema.safeParse({
    name_ar: formData.get("name_ar"),
    name_en: formData.get("name_en") ?? "",
    tagline_ar: formData.get("tagline_ar") ?? "",
    tagline_en: formData.get("tagline_en") ?? "",
    whatsapp_number: String(formData.get("whatsapp_number") ?? "").replace(/[+\s-]/g, ""),
    address_ar: formData.get("address_ar") ?? "",
    address_en: formData.get("address_en") ?? "",
    map_url: formData.get("map_url") ?? "",
    currency_symbol: formData.get("currency_symbol") || "ج.م",
    delivery_enabled: formData.get("delivery_enabled") === "on",
    pickup_enabled: formData.get("pickup_enabled") === "on",
    min_prep_minutes: formData.get("min_prep_minutes"),
  });
  if (!parsed.success)
    return { error: tr(locale, "Please check the restaurant details.", parsed.error.issues[0]?.message ?? "بيانات غير صحيحة") };

  const p = parsed.data;
  await updateRestaurantSettings(s.restaurantId, {
    name_ar: p.name_ar,
    name_en: p.name_en || null,
    tagline_ar: p.tagline_ar || null,
    tagline_en: p.tagline_en || null,
    whatsapp_number: p.whatsapp_number,
    address_ar: p.address_ar || null,
    address_en: p.address_en || null,
    map_url: p.map_url || null,
    logo_url: (formData.get("logo_url") as string) || null,
    cover_image_url: (formData.get("cover_image_url") as string) || null,
    currency_symbol: p.currency_symbol,
    delivery_enabled: p.delivery_enabled,
    pickup_enabled: p.pickup_enabled,
    min_prep_minutes: p.min_prep_minutes,
  });

  const r = await getOwnRestaurant(s.restaurantId);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/settings");
  if (r) revalidatePath(`/m/${r.slug}`);
  return { ok: true };
}

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function saveHoursAction(
  payload: {
    weekday: number;
    is_closed: boolean;
    opens_at: string | null;
    closes_at: string | null;
  }[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await requireOwner();
  const locale = await getLocale();
  for (const h of payload) {
    if (!h.is_closed) {
      if (!h.opens_at || !h.closes_at || !timeRe.test(h.opens_at) || !timeRe.test(h.closes_at))
        return { ok: false, error: tr(locale, "Enter valid opening and closing times for each open day.", "أدخل أوقاتًا صحيحة لكل يوم مفتوح") };
    }
  }
  await saveHours(
    s.restaurantId,
    payload.map((h) => ({
      weekday: h.weekday,
      opens_at: h.is_closed ? null : h.opens_at,
      closes_at: h.is_closed ? null : h.closes_at,
      is_closed: h.is_closed,
    }))
  );
  const r = await getOwnRestaurant(s.restaurantId);
  revalidatePath("/dashboard/settings");
  if (r) revalidatePath(`/m/${r.slug}`);
  return { ok: true };
}
