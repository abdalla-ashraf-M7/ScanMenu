"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import {
  ExternalLink,
  Loader2,
  Plus,
  Power,
  Search,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import type { AdminRestaurantRow } from "@/lib/types";
import { createRestaurantAction, toggleRestaurantAction } from "./actions";
import { CopyBtn } from "@/components/copy-btn";
import { useLocale } from "@/components/locale-provider";
import { restaurantName, tr } from "@/lib/i18n";

export function AdminClient({ rows }: { rows: AdminRestaurantRow[] }) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name_ar.toLowerCase().includes(q) || (r.name_en ?? "").toLowerCase().includes(q) || r.slug.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const activeCount = rows.filter((r) => r.is_active).length;
  const totalItems = rows.reduce((n, r) => n + (r.items_count ?? 0), 0);

  return (
    <>
      <section className="grid grid-cols-3 gap-3">
        <Stat icon={<Store className="size-5" aria-hidden />} value={rows.length} label={tr(locale, "Restaurants", "مطعم")} />
        <Stat
          icon={<Power className="size-5" aria-hidden />}
          value={activeCount}
          label={tr(locale, "Active", "نشط")}
        />
        <Stat
          icon={<UtensilsCrossed className="size-5" aria-hidden />}
          value={totalItems}
          label={tr(locale, "Menu items", "صنف")}
        />
      </section>

      <CreateForm />

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 start-4 size-4 -translate-y-1/2 text-inkmuted" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr(locale, "Search by name or link…", "ابحث بالاسم أو الرابط…")}
          aria-label={tr(locale, "Search restaurants", "بحث في المطاعم")}
          className="w-full rounded-xl border border-line bg-surface px-11 py-3 text-sm outline-none focus:border-brand"
        />
      </div>

      <section className="flex flex-col gap-2.5">
        {filtered.map((r) => (
          <Row key={r.id} r={r} />
        ))}
        {rows.length > 0 && filtered.length === 0 && (
          <p className="rounded-xl bg-surface p-8 text-center text-sm text-inkmuted">
            {tr(locale, `No results for “${query}”`, `لا نتائج مطابقة لـ «${query}»`)}
          </p>
        )}
        {rows.length === 0 && (
          <p className="rounded-xl bg-surface p-10 text-center text-sm text-inkmuted">
            {tr(locale, "No restaurants yet. Create the first account above.", "لا توجد مطاعم بعد — أنشئ أول حساب من النموذج أعلاه.")}
          </p>
        )}
      </section>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-line bg-surface p-3.5">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brandsoft text-brand">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-xl font-extrabold leading-none">{value}</span>
        <span className="mt-1 block truncate text-[11px] font-semibold text-inkmuted">{label}</span>
      </span>
    </div>
  );
}

function Row({ r }: { r: AdminRestaurantRow }) {
  const { locale } = useLocale();
  const [active, setActive] = useState(r.is_active);
  const [pending, startTransition] = useTransition();

  return (
    <article
      className={`rounded-2xl border bg-surface p-3.5 shadow-sm transition-opacity ${
        active ? "border-line" : "border-dashed border-line opacity-70"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-40">
          <h2 className={`truncate font-extrabold ${active ? "" : "line-through decoration-inkmuted/50"}`}>
            {restaurantName(r, locale)}
          </h2>
          <a
            href={`/m/${r.slug}`}
            target="_blank"
            rel="noopener"
            dir="ltr"
            className="mt-0.5 inline-block max-w-full truncate text-left text-xs text-brand hover:underline"
          >
            /m/{r.slug} ↗
          </a>
        </div>

        <span className="rounded-full bg-brandsoft px-2.5 py-1 text-[11px] font-bold text-brand">
          {r.items_count ?? 0} {tr(locale, "items", "صنف")}
        </span>
        <span className="hidden rounded-full bg-black/[.04] px-2.5 py-1 text-[11px] font-semibold text-inkmuted sm:inline">
          {new Date(r.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={active}
          disabled={pending}
          onClick={() => {
            const next = !active;
            if (!next && !confirm(tr(locale, `Deactivate “${restaurantName(r, locale)}”? Its menu will be unavailable.`, `إيقاف «${r.name_ar}»؟ سيختفي المنيو للعملاء فورًا.`))) return;
            setActive(next);
            startTransition(async () => {
              await toggleRestaurantAction(r.slug, next);
            });
          }}
          className={`press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
            active ? "bg-wa/10 text-wastrong" : "bg-black/5 text-inkmuted"
          }`}
        >
          {pending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Power className="size-3.5" aria-hidden />
          )}
          {active ? tr(locale, "Active", "نشط") : tr(locale, "Paused", "موقوف")}
        </button>

        <div className="ms-auto flex items-center gap-1.5">
          <CopyBtn value={`/m/${r.slug}`} label={tr(locale, "Copy link", "نسخ الرابط")} className="!px-2.5 !py-1.5 !text-xs" />
          <Link
            href={`/m/${r.slug}`}
            target="_blank"
            aria-label={tr(locale, `Open ${restaurantName(r, locale)} menu`, `فتح منيو ${r.name_ar}`)}
            title={tr(locale, `Open ${restaurantName(r, locale)} menu`, `فتح منيو ${r.name_ar}`)}
            className="press grid size-9 place-items-center rounded-lg border border-line text-brand hover:bg-brandsoft"
          >
            <ExternalLink className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CreateForm() {
  const { locale } = useLocale();
  const [state, action, pending] = useActionState(createRestaurantAction, null);

  return (
    <form action={action} className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 text-base font-extrabold sm:text-lg">
        <Plus className="size-5 text-brand" aria-hidden />
        {tr(locale, "Create restaurant & owner account", "إنشاء مطعم + حساب صاحبه")}
      </h2>

      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        <In label={tr(locale, "Arabic restaurant name", "اسم المطعم بالعربية")} name="name_ar" required placeholder="مطعم النور" />
        <In label={tr(locale, "English restaurant name", "اسم المطعم بالإنجليزية")} name="name_en" dir="ltr" placeholder="Al Nour Kitchen" />
        <In label={tr(locale, "Menu link (slug)", "الرابط (slug)")} name="slug" required dir="ltr" placeholder="al-nour" />
        <In label={tr(locale, "WhatsApp (international, no +)", "واتساب (دولي بدون +)")} name="whatsapp_number" required dir="ltr" placeholder="201001234567" />
        <In label={tr(locale, "Owner email", "بريد المالك")} name="email" type="email" required dir="ltr" placeholder="owner@mail.com" />
        <In label={tr(locale, "Temporary password", "كلمة مرور مؤقتة")} name="password" type="password" required dir="ltr" placeholder={tr(locale, "6+ characters", "6+ أحرف")} />
      </div>

      {state?.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
          {state.error}
        </p>
      )}
      {state?.okMessage && (
        <p role="status" className="mt-3 rounded-lg bg-wa/10 px-3 py-2 text-sm font-semibold text-wastrong">
          {state.okMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="press mt-3 flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-bold text-white shadow-md hover:bg-brandstrong disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {tr(locale, "Create account", "إنشاء الحساب")}
      </button>
    </form>
  );
}

function In({
  label,
  name,
  type = "text",
  required,
  placeholder,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  dir?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        dir={dir}
        className={`w-full rounded-xl border border-line bg-paper px-4 py-2.5 outline-none focus:border-brand ${dir === "ltr" ? "text-left" : ""}`}
      />
    </label>
  );
}
