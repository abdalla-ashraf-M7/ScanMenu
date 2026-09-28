export type Role = "owner" | "admin";

export interface Restaurant {
  id: string;
  slug: string;
  name_ar: string;
  name_en: string | null;
  tagline_ar: string | null;
  tagline_en: string | null;
  whatsapp_number: string;
  address_ar: string | null;
  address_en: string | null;
  map_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  currency_symbol: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  min_prep_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  restaurant_id: string;
  name_ar: string;
  name_en: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface MenuItem {
  id: string;
  restaurant_id: string;
  category_id: string;
  name_ar: string;
  name_en: string | null;
  description_ar: string | null;
  description_en: string | null;
  price: number;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  is_sold_out: boolean;
}

export interface OpeningHour {
  weekday: number; // 0=Saturday … 6=Friday
  opens_at: string | null; // "10:00"
  closes_at: string | null;
  is_closed: boolean;
}

export interface PublicMenu {
  restaurant: Restaurant;
  categories: Category[];
  items: MenuItem[];
  hours: OpeningHour[];
}

export interface SessionInfo {
  userId: string;
  role: Role;
  restaurantId: string | null;
}

export interface AdminRestaurantRow extends Restaurant {
  items_count?: number;
}
