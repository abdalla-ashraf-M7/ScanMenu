import type { Metadata } from "next";
import { requireOwner } from "@/lib/auth";
import { listOwnerMenu } from "@/lib/repo";
import { MenuManager } from "./menu-manager";

export const metadata: Metadata = { title: "Menu management" };
export const dynamic = "force-dynamic";

export default async function MenuAdminPage() {
  const session = await requireOwner();
  const { categories, items } = await listOwnerMenu(session.restaurantId);

  return (
    <main className="flex flex-col gap-4">
      <MenuManager
        restaurantId={session.restaurantId}
        categories={categories}
        items={items}
      />
    </main>
  );
}
