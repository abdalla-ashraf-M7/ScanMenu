"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { adminCreateRestaurant, adminToggleRestaurant } from "@/lib/repo";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email("بريد غير صحيح"),
  password: z.string().min(6, "كلمة المرور ٦ أحرف على الأقل"),
  name_ar: z.string().trim().min(2, "اسم قصير جدًا"),
  name_en: z.string().trim().max(80).optional().or(z.literal("")),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/, "الرابط: حروف لاتينية صغيرة وأرقام وشرطات فقط (٣+ حروف)"),
  whatsapp_number: z
    .string()
    .regex(/^[1-9][0-9]{7,14}$/, "رقم دولي بدون + — مثال: 201001234567"),
});

export async function createRestaurantAction(
  _prev: Result | null,
  formData: FormData
): Promise<Result> {
  await requireAdmin();
  const locale = await getLocale();
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name_ar: formData.get("name_ar"),
    name_en: formData.get("name_en") ?? "",
    slug: String(formData.get("slug") ?? "").toLowerCase(),
    whatsapp_number: String(formData.get("whatsapp_number") ?? "").replace(/[+\s-]/g, ""),
  });
  if (!parsed.success)
    return { error: tr(locale, "Check the restaurant and account details.", parsed.error.issues[0]?.message ?? "بيانات غير صحيحة") };

  const res = await adminCreateRestaurant({ ...parsed.data, name_en: parsed.data.name_en || null });
  if (!res.ok) return { error: res.error };
  revalidatePath("/admin");
  return { okMessage: tr(locale, `Created ${parsed.data.name_en || parsed.data.name_ar} — menu /m/${res.slug}`, `تم إنشاء «${parsed.data.name_ar}» — رابط المنيو /m/${res.slug}`) };
}

export async function toggleRestaurantAction(slug: string, active: boolean): Promise<void> {
  await requireAdmin();
  await adminToggleRestaurant(slug, active);
  revalidatePath("/admin");
}

interface Result {
  error?: string;
  okMessage?: string;
}
