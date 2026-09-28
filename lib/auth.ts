import "server-only";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isSupabaseConfigured } from "./config";
import type { SessionInfo } from "./types";
import { demoSessionFor } from "./demo/store";

export const DEMO_SESSION_COOKIE = "sm_demo_session";

/** Resolve the current session (real Supabase or demo cookie). */
export async function getSessionInfo(): Promise<SessionInfo | null> {
  if (!isSupabaseConfigured()) {
    const store = await cookies();
    const userId = store.get(DEMO_SESSION_COOKIE)?.value;
    if (!userId) return null;
    const u = demoSessionFor(userId);
    if (!u) return null;
    return { userId: u.id, role: u.role, restaurantId: u.restaurantId };
  }

  const { supabaseServer } = await import("./supabase/server");
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;

  const { data: profile } = await sb
    .from("profiles")
    .select("role, restaurant_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return {
    userId: user.id,
    role: profile.role === "admin" ? "admin" : "owner",
    restaurantId: profile.restaurant_id ?? null,
  };
}

export async function requireSession(): Promise<SessionInfo> {
  const s = await getSessionInfo();
  if (!s) redirect("/login");
  return s;
}

export async function requireOwner(): Promise<SessionInfo & { restaurantId: string }> {
  const s = await requireSession();
  if (s.role !== "owner" || !s.restaurantId) redirect(s.role === "admin" ? "/admin" : "/login");
  return s as SessionInfo & { restaurantId: string };
}

export async function requireAdmin(): Promise<SessionInfo> {
  const s = await requireSession();
  if (s.role !== "admin") redirect("/dashboard");
  return s;
}
