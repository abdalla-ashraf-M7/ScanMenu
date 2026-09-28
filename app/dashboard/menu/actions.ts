"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOwner } from "@/lib/auth";
import {
  createCategory,
  createItem,
  deleteCategory,
  deleteItem,
  getOwnRestaurant,
  updateCategory,
  updateItem,
} from "@/lib/repo";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

async function refresh(slug: string | null) {
  revalidatePath("/dashboard/menu");
  if (slug) revalidatePath(`/m/${slug}`);
}

function slugFrom(restaurantId: string) {
  return getOwnRestaurant(restaurantId).then((r) => r?.slug ?? null);
}

const nameSchema = z.string().trim().min(2, "الاسم قصير جدًا").max(60);

export async function createCategoryAction(formData: FormData): Promise<void> {
  const s = await requireOwner();
  const parsed = nameSchema.safeParse(formData.get("name_ar"));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "اسم غير صالح");
  await createCategory(s.restaurantId, parsed.data, String(formData.get("name_en") ?? "").trim() || null);
  await refresh(await slugFrom(s.restaurantId));
}

export async function renameCategoryAction(id: string, formData: FormData): Promise<void> {
  await requireOwner();
  const parsed = nameSchema.safeParse(formData.get("name_ar"));
  if (!parsed.success) throw new Error("اسم غير صالح");
  await updateCategory(id, { name_ar: parsed.data, name_en: String(formData.get("name_en") ?? "").trim() || null });
  await refresh(await slugFrom((await requireOwner()).restaurantId));
}

export async function toggleCategoryAction(id: string, active: boolean): Promise<void> {
  await requireOwner();
  await updateCategory(id, { is_active: active });
  await refresh(await slugFrom((await requireOwner()).restaurantId));
}

export async function moveCategoryAction(
  entries: { id: string; sort_order: number }[]
): Promise<void> {
  await requireOwner();
  for (const e of entries) await updateCategory(e.id, { sort_order: e.sort_order });
  await refresh(await slugFrom((await requireOwner()).restaurantId));
}

export async function deleteCategoryAction(id: string): Promise<void> {
  await requireOwner();
  await deleteCategory(id);
  await refresh(await slugFrom((await requireOwner()).restaurantId));
}

/* ── items ── */

const priceSchema = z.coerce.number().positive("السعر لازم يكون أكبر من صفر").max(1_000_000);

export interface ItemPayload {
  id?: string;
  category_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
}

export async function saveItemAction(payload: ItemPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await requireOwner();
  const locale = await getLocale();
  const name = nameSchema.safeParse(payload.name_ar);
  const price = priceSchema.safeParse(payload.price);
  if (!name.success) return { ok: false, error: tr(locale, "Enter an Arabic item name of at least 2 characters.", name.error.issues[0]?.message ?? "اسم غير صالح") };
  if (!price.success) return { ok: false, error: tr(locale, "Enter a valid price above zero.", price.error.issues[0]?.message ?? "سعر غير صالح") };

  const common = {
    category_id: payload.category_id,
    name_ar: name.data,
    name_en: payload.name_en?.trim() || null,
    description_ar: payload.description_ar?.trim() || null,
    description_en: payload.description_en?.trim() || null,
    price: price.data,
    image_url: payload.image_url,
    is_active: payload.is_active,
  };

  if (payload.id) await updateItem(payload.id, common);
  else
    await createItem({
      ...common,
      restaurant_id: s.restaurantId,
      sort_order: Number.MAX_SAFE_INTEGER, // appended; UI sorts by order then creation
      is_sold_out: false,
    });

  await refresh(await slugFrom(s.restaurantId));
  return { ok: true };
}

export async function toggleItemFieldAction(
  id: string,
  field: "is_active" | "is_sold_out",
  value: boolean
): Promise<void> {
  await requireOwner();
  await updateItem(id, { [field]: value });
  await refresh(await slugFrom((await requireOwner()).restaurantId));
}

export async function moveItemAction(entries: { id: string; sort_order: number }[]): Promise<void> {
  await requireOwner();
  for (const e of entries) await updateItem(e.id, { sort_order: e.sort_order });
  await refresh(await slugFrom((await requireOwner()).restaurantId));
}

export async function deleteItemAction(id: string): Promise<void> {
  await requireOwner();
  await deleteItem(id);
  await refresh(await slugFrom((await requireOwner()).restaurantId));
}
