import "server-only";
import { isSupabaseConfigured } from "./config";
import type {
  AdminRestaurantRow,
  Category,
  MenuItem,
  OpeningHour,
  PublicMenu,
  Restaurant,
} from "./types";

/* ============================================================
   Public reads
   ============================================================ */

export async function getPublicMenu(slug: string): Promise<PublicMenu | "not_found" | "inactive"> {
  if (!isSupabaseConfigured()) {
    const m = (await import("./demo/store")).demoGetPublicMenu(slug);
    if (!m) return "not_found";
    return m.restaurant.is_active ? m : "inactive";
  }

  const { supabaseServer } = await import("./supabase/server");
  const sb = await supabaseServer();

  const { data: restaurant } = await sb
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Restaurant>();
  if (!restaurant) return "not_found";
  if (!restaurant.is_active) return "inactive";

  const [cats, items, hours] = await Promise.all([
    sb.from("categories").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
    sb.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order"),
    sb.from("opening_hours").select("*").eq("restaurant_id", restaurant.id).order("weekday"),
  ]);

  return {
    restaurant,
    categories: (cats.data ?? []) as Category[],
    items: (items.data ?? []) as MenuItem[],
    hours: ((hours.data ?? []) as { weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean }[]).map((h) => ({
      weekday: h.weekday,
      opens_at: h.opens_at ? String(h.opens_at).slice(0, 5) : null,
      closes_at: h.closes_at ? String(h.closes_at).slice(0, 5) : null,
      is_closed: h.is_closed,
    })),
  };
}

/* ============================================================
   Owner dashboard — menu management
   ============================================================ */

export async function listOwnerMenu(restaurantId: string): Promise<{
  categories: Category[];
  items: MenuItem[];
}> {
  if (!isSupabaseConfigured()) {
    const db = (await import("./demo/store")).demoDb();
    return {
      categories: db.categories.filter((c) => c.restaurant_id === restaurantId)
        .sort((a, b) => a.sort_order - b.sort_order),
      items: db.items.filter((i) => i.restaurant_id === restaurantId)
        .sort((a, b) => a.sort_order - b.sort_order),
    };
  }

  const { supabaseServer } = await import("./supabase/server");
  const sb = await supabaseServer();
  const [cats, items] = await Promise.all([
    sb.from("categories").select("*").eq("restaurant_id", restaurantId).order("sort_order"),
    sb.from("menu_items").select("*").eq("restaurant_id", restaurantId).order("sort_order"),
  ]);
  return { categories: cats.data ?? [], items: items.data ?? [] };
}

export async function createCategory(restaurantId: string, name_ar: string, name_en: string | null): Promise<Category | null> {
  if (!isSupabaseConfigured())
    return (await import("./demo/store")).demoCreateCategory(name_ar, name_en);
  const { supabaseServer } = await import("./supabase/server");
  const sb = await supabaseServer();
  const { data: last } = await sb
    .from("categories")
    .select("sort_order")
    .eq("restaurant_id", restaurantId)
    .order("sort_order", { ascending: false })
    .limit(1);
  const nextSort = (last?.[0]?.sort_order ?? -1) + 1;
  const { data } = await sb
    .from("categories")
    .insert({ restaurant_id: restaurantId, name_ar, name_en, sort_order: nextSort })
    .select()
    .single();
  return data;
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "name_ar" | "name_en" | "is_active" | "sort_order">>
): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoUpdateCategory(id, patch);
    return;
  }
  const sb = await (await import("./supabase/server")).supabaseServer();
  await sb.from("categories").update(patch).eq("id", id);
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoDeleteCategory(id);
    return;
  }
  const sb = await (await import("./supabase/server")).supabaseServer();
  await sb.from("categories").delete().eq("id", id);
}

export type NewItemInput = Omit<MenuItem, "id">;

export async function createItem(input: NewItemInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoCreateItem(input);
    return;
  }
  const { supabaseServer } = await import("./supabase/server");
  const sb = await supabaseServer();
  const { data: last } = await sb
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", input.category_id)
    .order("sort_order", { ascending: false })
    .limit(1);
  await sb.from("menu_items").insert({
    ...input,
    sort_order: input.sort_order === Number.MAX_SAFE_INTEGER ? (last?.[0]?.sort_order ?? -1) + 1 : input.sort_order,
  });
}

export async function updateItem(id: string, patch: Partial<Omit<MenuItem, "id">>): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoUpdateItem(id, patch);
    return;
  }
  const sb = await (await import("./supabase/server")).supabaseServer();
  await sb.from("menu_items").update(patch).eq("id", id);
}

export async function deleteItem(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoDeleteItem(id);
    return;
  }
  const sb = await (await import("./supabase/server")).supabaseServer();
  await sb.from("menu_items").delete().eq("id", id);
}

/* ============================================================
   Owner dashboard — settings
   ============================================================ */

export async function getOwnRestaurant(restaurantId: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured())
    return (await import("./demo/store")).demoGetRestaurantById(restaurantId);
  const sb = await (await import("./supabase/server")).supabaseServer();
  const { data } = await sb
    .from("restaurants")
    .select("*")
    .eq("id", restaurantId)
    .maybeSingle<Restaurant>();
  return data;
}

export async function listHours(restaurantId: string): Promise<OpeningHour[]> {
  if (!isSupabaseConfigured()) {
    const db = (await import("./demo/store")).demoDb();
    return db.hours.slice(0, 7).sort((a, b) => a.weekday - b.weekday);
  }
  const sb = await (await import("./supabase/server")).supabaseServer();
  const { data } = await sb
    .from("opening_hours")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("weekday");
  return ((data ?? []) as { weekday: number; opens_at: string | null; closes_at: string | null; is_closed: boolean }[]).map((h) => ({
    weekday: h.weekday,
    opens_at: h.opens_at ? String(h.opens_at).slice(0, 5) : null,
    closes_at: h.closes_at ? String(h.closes_at).slice(0, 5) : null,
    is_closed: h.is_closed,
  }));
}

export async function updateRestaurantSettings(
  restaurantId: string,
  patch: Partial<Omit<Restaurant, "id" | "slug" | "created_at">>
): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoUpdateRestaurant(patch);
    return;
  }
  const sb = await (await import("./supabase/server")).supabaseServer();
  await sb.from("restaurants").update(patch).eq("id", restaurantId);
}

export async function saveHours(restaurantId: string, hours: OpeningHour[]): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoSetHours(hours.slice(0, 7));
    return;
  }

  const sb = await (await import("./supabase/server")).supabaseServer();
  // Replace-all is simplest and safe at this scale.
  await sb.from("opening_hours").delete().eq("restaurant_id", restaurantId);
  if (hours.length) {
    await sb.from("opening_hours").insert(hours.map((h) => ({ ...h, restaurant_id: restaurantId })));
  }
}

/* ============================================================
   Platform admin
   ============================================================ */

export async function adminListRestaurants(): Promise<AdminRestaurantRow[]> {
  if (!isSupabaseConfigured()) return (await import("./demo/store")).demoAdminList();

  const { supabaseAdmin } = await import("./supabase/admin");
  const admin = supabaseAdmin();
  const [rests, items] = await Promise.all([
    admin.from("restaurants").select("*").order("created_at", { ascending: false }),
    admin.from("menu_items").select("restaurant_id"),
  ]);
  const counts = new Map<string, number>();
  for (const it of items.data ?? [])
    counts.set(it.restaurant_id, (counts.get(it.restaurant_id) ?? 0) + 1);
  return (rests.data ?? []).map((r) => ({ ...r, items_count: counts.get(r.id) ?? 0 }));
}

export async function adminToggleRestaurant(slug: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    (await import("./demo/store")).demoAdminToggle(slug, active);
    return;
  }
  const { supabaseAdmin } = await import("./supabase/admin");
  await supabaseAdmin().from("restaurants").update({ is_active: active }).eq("slug", slug);
}

export interface CreateRestaurantInput {
  email: string;
  password: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  whatsapp_number: string;
}

export async function adminCreateRestaurant(
  input: CreateRestaurantInput
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured())
    return (await import("./demo/store")).demoAdminCreate(input);

  const { supabaseAdmin } = await import("./supabase/admin");
  const admin = supabaseAdmin();

  const { data: auth, error: authErr } = await admin.auth.admin.createUser({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    email_confirm: true,
  });
  if (authErr || !auth.user) return { ok: false, error: authErr?.message ?? "تعذر إنشاء المستخدم" };

  const { data: rest, error: restErr } = await admin
    .from("restaurants")
    .insert({ name_ar: input.name_ar, name_en: input.name_en, slug: input.slug, whatsapp_number: input.whatsapp_number })
    .select()
    .single();
  if (restErr || !rest) return { ok: false, error: restErr?.message ?? "تعذر إنشاء المطعم" };

  const { error: profErr } = await admin
    .from("profiles")
    .insert({ id: auth.user.id, role: "owner", restaurant_id: rest.id });
  if (profErr) return { ok: false, error: profErr.message };

  await admin.from("opening_hours").insert(
    Array.from({ length: 7 }, (_, d) => ({
      restaurant_id: rest.id,
      weekday: d,
      opens_at: "10:00",
      closes_at: "23:00",
      is_closed: false,
    }))
  );

  return { ok: true, slug: rest.slug };
}
