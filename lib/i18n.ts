import type { Category, MenuItem, Restaurant } from "./types";

export type Locale = "en" | "ar";
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "scanmenu_locale";

export function tr(locale: Locale, english: string, arabic: string): string {
  return locale === "ar" ? arabic : english;
}

export function restaurantName(restaurant: Pick<Restaurant, "name_ar" | "name_en">, locale: Locale): string {
  return (locale === "en" ? restaurant.name_en : restaurant.name_ar) || restaurant.name_ar;
}

export function restaurantTagline(restaurant: Restaurant, locale: Locale): string | null {
  return (locale === "en" ? restaurant.tagline_en : restaurant.tagline_ar) || restaurant.tagline_ar;
}

export function restaurantAddress(restaurant: Restaurant, locale: Locale): string | null {
  return (locale === "en" ? restaurant.address_en : restaurant.address_ar) || restaurant.address_ar;
}

export function categoryName(category: Category, locale: Locale): string {
  return (locale === "en" ? category.name_en : category.name_ar) || category.name_ar;
}

export function itemName(item: MenuItem, locale: Locale): string {
  return (locale === "en" ? item.name_en : item.name_ar) || item.name_ar;
}

export function itemDescription(item: MenuItem, locale: Locale): string | null {
  return (locale === "en" ? item.description_en : item.description_ar) || item.description_ar;
}
