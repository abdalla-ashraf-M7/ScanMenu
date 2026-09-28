import { requireSession } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pb-16">
      <AppHeader session={session} />
      {children}
    </div>
  );
}
