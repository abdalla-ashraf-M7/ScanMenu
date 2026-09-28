"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "./actions";
import { isSupabaseConfigured } from "@/lib/config";
import { useLocale } from "@/components/locale-provider";
import { tr } from "@/lib/i18n";

export function LoginForm({ next }: { next?: string }) {
  const { locale } = useLocale();
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <form action={action} className="flex w-full flex-col gap-3">
      <input type="hidden" name="next" value={next ?? ""} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">{tr(locale, "Email address", "البريد الإلكتروني")}</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-left outline-none focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold">{tr(locale, "Password", "كلمة المرور")}</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          dir="ltr"
          className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-left outline-none focus:border-brand"
        />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="press mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3.5 font-bold text-white shadow-md hover:bg-brandstrong disabled:opacity-60"
      >
        <LogIn className="size-5" aria-hidden />
        {pending ? tr(locale, "Signing in…", "جارٍ الدخول…") : tr(locale, "Sign in", "دخول")}
      </button>

      {!isSupabaseConfigured() && (
        <p className="rounded-xl border border-dashed border-warn/50 bg-amber-50 px-4 py-2.5 text-center text-xs leading-relaxed text-inkmuted">
          {tr(locale, "Demo accounts:", "وضع تجريبي — جرّب:")}
          <br />
          <span dir="ltr">owner@demo.menu / demo1234</span> ({tr(locale, "owner", "صاحب مطعم")})
          <br />
          <span dir="ltr">admin@demo.menu / demo1234</span> ({tr(locale, "admin", "مشرف المنصة")})
        </p>
      )}
    </form>
  );
}
