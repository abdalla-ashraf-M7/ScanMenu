/**
 * DEMO MODE store — used when Supabase env vars are absent so the whole
 * app is testable immediately (`pnpm dev`) with zero accounts.
 * Data lives in server memory and resets on restart. Production mode
 * never touches this module.
 */
import type {
  AdminRestaurantRow,
  Category,
  MenuItem,
  OpeningHour,
  PublicMenu,
  Restaurant,
} from "../types";

interface DemoUser {
  id: string;
  email: string;
  password: string;
  role: "owner" | "admin";
  restaurantId: string | null;
}

interface DemoDB {
  restaurants: Restaurant[];
  categories: Category[];
  items: MenuItem[];
  hours: OpeningHour[];
  users: DemoUser[];
}

const RID = "11111111-1111-1111-1111-111111111111";
const uid = (s: string) => `demo-${s}`;

function seed(): DemoDB {
  return {
    restaurants: [
      {
        id: RID,
        slug: "al-amal",
        name_ar: "مطعم الأمل",
        name_en: "Al Amal Kitchen",
        tagline_ar: "أكل بيتي على أصوله — فراخ و مشويات و فطير",
        tagline_en: "Egyptian comfort food, made with heart",
        whatsapp_number: "201001234567",
        address_ar: "شارع الجمهورية، أمام محطة السبيل",
        address_en: "El Gomhoreya Street, opposite El Sabeel Station",
        map_url: "https://maps.google.com/?q=30.0444,31.2357",
        logo_url: null,
        cover_image_url: null,
        currency_symbol: "ج.م",
        delivery_enabled: true,
        pickup_enabled: true,
        min_prep_minutes: 25,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    ],
    categories: [
      { id: uid("cat1"), restaurant_id: RID, name_ar: "المشويات", name_en: "Grill", sort_order: 0, is_active: true },
      { id: uid("cat2"), restaurant_id: RID, name_ar: "الفطير والمخبوزات", name_en: "Pastries & Bread", sort_order: 1, is_active: true },
      { id: uid("cat3"), restaurant_id: RID, name_ar: "الأطباق الرئيسية", name_en: "Main Dishes", sort_order: 2, is_active: true },
      { id: uid("cat4"), restaurant_id: RID, name_ar: "المشروبات", name_en: "Drinks", sort_order: 3, is_active: true },
    ],
    items: [
      { id: uid("i1"), restaurant_id: RID, category_id: uid("cat1"), name_ar: "نصف فرخة مشوية", name_en: "Half Grilled Chicken", description_ar: "مع رز وبطاطس وصوص خاص", description_en: "With rice, potatoes and house sauce", price: 120, image_url: "/demo-food-grid.png#chicken", sort_order: 0, is_active: true, is_sold_out: false },
      { id: uid("i2"), restaurant_id: RID, category_id: uid("cat1"), name_ar: "فرخة كاملة مشوية", name_en: "Whole Grilled Chicken", description_ar: "تكفي ٣ أفراد — مع رز وسلطة", description_en: "Serves three, with rice and salad", price: 220, image_url: null, sort_order: 1, is_active: true, is_sold_out: false },
      { id: uid("i3"), restaurant_id: RID, category_id: uid("cat1"), name_ar: "كفتة مشوية", name_en: "Charcoal-Grilled Kofta", description_ar: "٨ قطع كفتة بلدي على الفحم", description_en: "Eight seasoned kofta skewers", price: 95, image_url: "/demo-food-grid.png#kofta", sort_order: 2, is_active: true, is_sold_out: false },
      { id: uid("i4"), restaurant_id: RID, category_id: uid("cat1"), name_ar: "ورق عناب مشوي", name_en: "Grilled Stuffed Vine Leaves", description_ar: "حبة كبيرة محشية ومشوية على الجريل", description_en: "A generous portion, finished on the grill", price: 35, image_url: null, sort_order: 3, is_active: true, is_sold_out: true },
      { id: uid("i5"), restaurant_id: RID, category_id: uid("cat2"), name_ar: "فطير مشلتت", name_en: "Feteer Meshaltet", description_ar: "فطير بلدي بالسمنة البلدية — حبة كبيرة", description_en: "Flaky Egyptian pastry with traditional ghee", price: 45, image_url: "/demo-food-grid.png#feteer", sort_order: 0, is_active: true, is_sold_out: false },
      { id: uid("i6"), restaurant_id: RID, category_id: uid("cat2"), name_ar: "فطير بالجبنة", name_en: "Cheese Feteer", description_ar: "عيش شامي محشو جبنة بيضاء", description_en: "Warm pastry filled with white cheese", price: 55, image_url: null, sort_order: 1, is_active: true, is_sold_out: false },
      { id: uid("i7"), restaurant_id: RID, category_id: uid("cat2"), name_ar: "حواوشي بلدي", name_en: "Egyptian Hawawshi", description_ar: "لحم مفروم متبل بالبصل والبهارات", description_en: "Spiced minced beef baked in bread", price: 60, image_url: null, sort_order: 2, is_active: true, is_sold_out: false },
      { id: uid("i8"), restaurant_id: RID, category_id: uid("cat3"), name_ar: "صينية بطاطس بالفراخ", name_en: "Chicken & Potato Tray", description_ar: "صينية كبيرة تكفي ٤ أفراد", description_en: "A family-sized oven-baked favorite", price: 180, image_url: null, sort_order: 0, is_active: true, is_sold_out: false },
      { id: uid("i9"), restaurant_id: RID, category_id: uid("cat3"), name_ar: "محشي كرنب", name_en: "Stuffed Cabbage Rolls", description_ar: "طبق كبير محشي كرنب بصوص الطماطم", description_en: "Rice-stuffed cabbage in tomato sauce", price: 75, image_url: null, sort_order: 1, is_active: true, is_sold_out: false },
      { id: uid("i10"), restaurant_id: RID, category_id: uid("cat3"), name_ar: "ملوخية بالفراخ", name_en: "Molokhia with Chicken", description_ar: "طبق ملوخية بلدي + رز أبيض", description_en: "Classic green soup with chicken and rice", price: 85, image_url: null, sort_order: 2, is_active: true, is_sold_out: false },
      { id: uid("i11"), restaurant_id: RID, category_id: uid("cat4"), name_ar: "عصير قصب طازج", name_en: "Fresh Sugarcane Juice", description_ar: "كوب كبير مثلج", description_en: "Chilled, freshly pressed", price: 25, image_url: null, sort_order: 0, is_active: true, is_sold_out: false },
      { id: uid("i12"), restaurant_id: RID, category_id: uid("cat4"), name_ar: "ليمون بالنعناع", name_en: "Mint Lemonade", description_ar: "إبريق يكفي ٣ كوبايات", description_en: "A refreshing pitcher for three", price: 40, image_url: "/demo-food-grid.png#lemonade", sort_order: 1, is_active: true, is_sold_out: false },
    ],
    hours: [
      { weekday: 0, opens_at: "10:00", closes_at: "23:30", is_closed: false },
      { weekday: 1, opens_at: "10:00", closes_at: "23:30", is_closed: false },
      { weekday: 2, opens_at: "10:00", closes_at: "23:30", is_closed: false },
      { weekday: 3, opens_at: "10:00", closes_at: "23:30", is_closed: false },
      { weekday: 4, opens_at: "10:00", closes_at: "23:30", is_closed: false },
      { weekday: 5, opens_at: "10:00", closes_at: "23:30", is_closed: false },
      { weekday: 6, opens_at: "13:00", closes_at: "23:30", is_closed: false },
    ],
    users: [
      { id: uid("owner"), email: "owner@demo.menu", password: "demo1234", role: "owner", restaurantId: RID },
      { id: uid("admin"), email: "admin@demo.menu", password: "demo1234", role: "admin", restaurantId: null },
    ],
  };
}

// Survive dev hot reloads
const g = globalThis as unknown as { __scanmenu_demo?: DemoDB };
export function demoDb(): DemoDB {
  if (!g.__scanmenu_demo) g.__scanmenu_demo = seed();
  return g.__scanmenu_demo;
}

/* ── reads ── */
export function demoGetPublicMenu(slug: string): PublicMenu | null {
  const db = demoDb();
  const r = db.restaurants.find((x) => x.slug === slug);
  if (!r) return null;
  return {
    restaurant: r,
    categories: db.categories.filter((c) => c.restaurant_id === r.id).sort((a, b) => a.sort_order - b.sort_order),
    items: db.items.filter((i) => i.restaurant_id === r.id).sort((a, b) => a.sort_order - b.sort_order),
    hours: db.hours.slice(0, 7).sort((a, b) => a.weekday - b.weekday),
  };
}

/* ── auth ── */
export function demoLogin(email: string, password: string): DemoUser | null {
  const db = demoDb();
  const u = db.users.find(
    (x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password
  );
  return u ?? null;
}

export function demoSessionFor(userId: string): DemoUser | null {
  return demoDb().users.find((u) => u.id === userId) ?? null;
}

/* ── menu mutations ── */
export function demoCreateCategory(name_ar: string, name_en: string | null): Category {
  const db = demoDb();
  const maxSort = Math.max(-1, ...db.categories.map((c) => c.sort_order));
  const c: Category = { id: uid(`c${Date.now()}`), restaurant_id: RID, name_ar, name_en, sort_order: maxSort + 1, is_active: true };
  db.categories.push(c);
  return c;
}
export function demoUpdateCategory(id: string, patch: Partial<Category>): void {
  Object.assign(demoDb().categories.find((c) => c.id === id) ?? {}, patch);
}
export function demoDeleteCategory(id: string): void {
  const db = demoDb();
  db.categories = db.categories.filter((c) => c.id !== id);
  db.items = db.items.filter((i) => i.category_id !== id);
}
export function demoCreateItem(input: Omit<MenuItem, "id">): MenuItem {
  const db = demoDb();
  const it: MenuItem = { ...input, id: uid(`i${Date.now()}`) };
  if (it.sort_order === Number.MAX_SAFE_INTEGER) {
    it.sort_order = Math.max(-1, ...db.items.filter((x) => x.category_id === it.category_id).map((x) => x.sort_order)) + 1;
  }
  db.items.push(it);
  return it;
}
export function demoUpdateItem(id: string, patch: Partial<MenuItem>): void {
  Object.assign(demoDb().items.find((i) => i.id === id) ?? {}, patch);
}
export function demoDeleteItem(id: string): void {
  const db = demoDb();
  db.items = db.items.filter((i) => i.id !== id);
}

/* ── settings mutations ── */
export function demoGetRestaurantById(id: string): Restaurant | null {
  return demoDb().restaurants.find((r) => r.id === id) ?? null;
}
export function demoUpdateRestaurant(patch: Partial<Restaurant>): void {
  Object.assign(demoDb().restaurants[0], patch);
}
export function demoSetHours(hours: OpeningHour[]): void {
  demoDb().hours = [...hours].sort((a, b) => a.weekday - b.weekday);
}
export function demoUploadImage(path: string, dataUrl: string): string {
  const g2 = globalThis as unknown as { __scanmenu_files?: Map<string, string> };
  if (!g2.__scanmenu_files) g2.__scanmenu_files = new Map();
  g2.__scanmenu_files.set(path, dataUrl);
  return `/__demo-file?path=${encodeURIComponent(path)}`;
}
export function demoReadImage(path: string): string | undefined {
  const g2 = globalThis as unknown as { __scanmenu_files?: Map<string, string> };
  return g2.__scanmenu_files?.get(path);
}

/* ── admin ── */
export function demoAdminList(): AdminRestaurantRow[] {
  const db = demoDb();
  return db.restaurants.map((r) => ({
    ...r,
    items_count: db.items.filter((i) => i.restaurant_id === r.id).length,
  }));
}
export function demoAdminToggle(slug: string, active: boolean): void {
  const r = demoDb().restaurants.find((x) => x.slug === slug);
  if (r) r.is_active = active;
}
export function demoAdminCreate(input: {
  email: string;
  password: string;
  name_ar: string;
  name_en: string | null;
  slug: string;
  whatsapp_number: string;
}): { ok: true; slug: string } | { ok: false; error: string } {
  const db = demoDb();
  if (db.restaurants.some((r) => r.slug === input.slug)) return { ok: false, error: "الرابط مستخدم بالفعل" };
  if (db.users.some((u) => u.email.toLowerCase() === input.email.toLowerCase()))
    return { ok: false, error: "البريد مستخدم بالفعل" };
  const rid = uid(`r${Date.now()}`);
  db.restaurants.push({
    id: rid,
    slug: input.slug,
    name_ar: input.name_ar,
    name_en: input.name_en,
    tagline_ar: null,
    tagline_en: null,
    whatsapp_number: input.whatsapp_number,
    address_ar: null,
    address_en: null,
    map_url: null,
    logo_url: null,
    cover_image_url: null,
    currency_symbol: "ج.م",
    delivery_enabled: true,
    pickup_enabled: true,
    min_prep_minutes: 20,
    is_active: true,
    created_at: new Date().toISOString(),
  });
  db.users.push({ id: uid(`u${Date.now()}`), email: input.email, password: input.password, role: "owner", restaurantId: rid });
  for (let d = 0; d < 7; d++)
    db.hours.push({ weekday: d, opens_at: "10:00", closes_at: "23:00", is_closed: false });
  return { ok: true, slug: input.slug };
}
