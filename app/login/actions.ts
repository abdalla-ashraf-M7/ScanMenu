"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { isSupabaseConfigured } from "@/lib/config";
import { DEMO_SESSION_COOKIE } from "@/lib/auth";
import { demoLogin } from "@/lib/demo/store";
import { getLocale } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";

const schema = z.object({
  email: z.string().email("بريد غير صحيح"),
  password: z.string().min(4, "كلمة المرور قصيرة جدًا"),
  next: z.string().optional(),
});

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const locale = await getLocale();
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: (formData.get("next") as string) || undefined,
  });
  if (!parsed.success) {
    return { error: tr(locale, "Enter a valid email and password.", parsed.error.issues[0]?.message ?? "بيانات غير صحيحة") };
  }
  const { email, password, next } = parsed.data;

  if (!isSupabaseConfigured()) {
    const user = demoLogin(email, password);
    if (!user) return { error: tr(locale, "Try owner@demo.menu / demo1234", "بيانات الدخول التجريبية: owner@demo.menu / demo1234") };
    const store = await cookies();
    store.set(DEMO_SESSION_COOKIE, user.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    redirect(next && next.startsWith("/") ? next : user.role === "admin" ? "/admin" : "/dashboard");
  }

  const { supabaseServer } = await import("@/lib/supabase/server");
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: tr(locale, "Incorrect email or password.", "البريد أو كلمة المرور غير صحيحة") };

  const { data: profile } = await sb
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(
    next && next.startsWith("/")
      ? next
      : profile?.role === "admin"
        ? "/admin"
        : "/dashboard"
  );
}

export async function logoutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const { supabaseServer } = await import("@/lib/supabase/server");
    const sb = await supabaseServer();
    await sb.auth.signOut();
  }
  const store = await cookies();
  store.delete(DEMO_SESSION_COOKIE);
  redirect("/login");
}
