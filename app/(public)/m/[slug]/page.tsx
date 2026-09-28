import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicMenu } from "@/lib/repo";
import { MenuClient } from "./menu-client";
import { getLocale } from "@/lib/i18n-server";
import { restaurantName, restaurantTagline, tr } from "@/lib/i18n";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const menu = await getPublicMenu(slug);
  if (menu === "not_found" || menu === "inactive") return { title: tr(locale, "Menu unavailable", "المنيو غير متاح") };
  return {
    title: tr(locale, `${restaurantName(menu.restaurant, locale)} Menu`, `منيو ${menu.restaurant.name_ar}`),
    description:
      restaurantTagline(menu.restaurant, locale) ??
      tr(locale, `Explore the menu and order from ${restaurantName(menu.restaurant, locale)} on WhatsApp.`, `اطلب من ${menu.restaurant.name_ar} عبر واتساب — تصفح المنيو وأرسل طلبك في دقيقة.`),
  };
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const menu = await getPublicMenu(slug);

  if (menu === "not_found") notFound();

  if (menu === "inactive") {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <span className="text-4xl">🍽️</span>
          <h1 className="text-xl font-extrabold">{tr(locale, "This restaurant is currently unavailable", "هذا المطعم غير متاح حاليًا")}</h1>
          <p className="text-sm text-inkmuted">{tr(locale, "Please try again later.", "يرجى المحاولة لاحقًا.")}</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <MenuClient menu={menu} />
      <footer className="pb-28 pt-2 text-center text-[11px] text-inkmuted">
        <Link href="/" className="underline decoration-dotted underline-offset-4">
          {tr(locale, "Digital menu by ScanMenu", "منيو رقمي بواسطة سكان منيو")}
        </Link>
      </footer>
    </>
  );
}
