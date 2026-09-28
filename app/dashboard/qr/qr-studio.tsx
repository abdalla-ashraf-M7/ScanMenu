"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { CopyBtn } from "@/components/copy-btn";
import { useLocale } from "@/components/locale-provider";
import { tr } from "@/lib/i18n";

export function QrStudio({
  slug,
  name,
  logoUrl,
}: {
  slug: string;
  name: string;
  logoUrl: string | null;
}) {
  const { locale } = useLocale();
  const [qrData, setQrData] = useState<string | null>(null);

  // Generate QR from the absolute URL. window access happens inside the
  // async callback chain — SSR-safe and lint-clean.
  useEffect(() => {
    let alive = true;
    const url = `${window.location.origin}/m/${slug}`;
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#291B14", light: "#FFFFFF" },
    })
      .then((d) => {
        if (alive) setQrData(d);
      })
      .catch(() => {
        if (alive) setQrData(null);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  function absolute(path: string): string {
    if (typeof window === "undefined") return path;
    return `${window.location.origin}${path}`;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
      {/* Controls + preview */}
      <section className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm">
        <div>
          <p className="text-sm font-bold">{tr(locale, "Menu link", "رابط المنيو")}</p>
          <p dir="ltr" className="mt-1 truncate rounded-lg bg-paper px-3 py-2 text-left text-sm text-brand">
            /m/{slug}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={qrData ?? "#"}
            download={`${slug}-qr.png`}
            aria-disabled={!qrData}
            className={`press inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md ${
              qrData ? "bg-brand hover:bg-brandstrong" : "pointer-events-none opacity-50"
            }`}
          >
            <Download className="size-4" aria-hidden />
            {tr(locale, "Download PNG", "تحميل PNG")}
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!qrData}
            className="press inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold hover:bg-brandsoft disabled:opacity-50"
          >
            <Printer className="size-4 text-brand" aria-hidden />
            {tr(locale, "Print A4 card", "طباعة بطاقة A4")}
          </button>
          <CopyBtn value={absolute(`/m/${slug}`)} label={tr(locale, "Copy menu link", "نسخ رابط المنيو")} />
          <CopyBtn value={absolute(`/s/${slug}`)} label={tr(locale, "Copy share link", "نسخ رابط الإنستجرام")} />
        </div>

        <div className="mx-auto mt-2 rounded-2xl border border-line bg-white p-4 shadow-sm">
          {qrData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrData} alt={tr(locale, `QR code for ${name}`, `كود QR لمنيو ${name}`)} className="size-52" />
          ) : (
            <div className="grid size-52 place-items-center text-sm text-inkmuted">{tr(locale, "Generating QR code…", "جارٍ توليد الكود…")}</div>
          )}
        </div>

        <p className="rounded-xl bg-brandsoft px-4 py-3 text-[13px] leading-relaxed text-inkmuted">
          {tr(locale, "Print tip: use a QR code at least 4 × 4 cm, place it flat on the table, and scan it with a phone before printing a batch.", "💡 نصيحة الطباعة: اطبع الكود بحجم لا يقل عن ٤×٤ سم على الملصق، وثبّته في مكان مستوٍ على الطاولة. جرّب المسح بكاميرا هاتف قبل توزيع البطاقات.")}
        </p>
      </section>

      {/* A4 print card — hidden on screen, visible in print */}
      <div className="hidden lg:block">
        <p className="mb-2 text-center text-xs font-semibold text-inkmuted">{tr(locale, "Print preview", "معاينة بطاقة الطباعة")}</p>
        <PrintCardPreview qrData={qrData} name={name} logoUrl={logoUrl} slug={slug} />
      </div>

      {/* Real print target */}
      <div className="print-card" aria-hidden>
        <CardInner qrData={qrData} name={name} logoUrl={logoUrl} />
      </div>
    </div>
  );
}

function isDemoSrc(src: string): boolean {
  return src.startsWith("/__demo-file") || src.startsWith("data:");
}

function CardInner({
  qrData,
  name,
  logoUrl,
}: {
  qrData: string | null;
  name: string;
  logoUrl: string | null;
}) {
  const { locale } = useLocale();
  return (
    <div className="text-center">
      {logoUrl ? (
        isDemoSrc(logoUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="mx-auto mb-4 size-24 rounded-2xl object-cover" />
        ) : (
          <Image src={logoUrl} alt="" width={96} height={96} className="mx-auto mb-4 size-24 rounded-2xl object-cover" unoptimized />
        )
      ) : null}
      <h1 className="text-4xl font-extrabold text-[#291B14]">{name}</h1>
      <p className="mt-2 text-xl font-bold text-[#C2410C]">{tr(locale, "Scan to explore the menu & order", "امسح الكود واطلب من المنيو")} 🟢</p>
      <div className="my-8 flex justify-center">
        {qrData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrData} alt="" className="size-[400px]" />
        ) : (
          <div className="size-[400px] rounded-xl border border-dashed border-gray-300" />
        )}
      </div>
      <p className="text-lg font-semibold text-[#7A6A5E]">
        {tr(locale, "Point your camera at the code. Orders open in WhatsApp.", "وجّه كاميرا الهاتف نحو الكود — الطلب يوصلك على واتساب مباشرة")}
      </p>
    </div>
  );
}

/** On-screen miniature of the print card */
function PrintCardPreview({
  qrData,
  name,
  logoUrl,
  slug,
}: {
  qrData: string | null;
  name: string;
  logoUrl: string | null;
  slug: string;
}) {
  const { locale } = useLocale();
  return (
    <div className="aspect-[210/297] w-72 overflow-hidden rounded-xl border border-line bg-white p-6 text-center shadow-md">
      {logoUrl ? (
        isDemoSrc(logoUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="mx-auto size-12 rounded-lg object-cover" />
        ) : (
          <Image src={logoUrl} alt="" width={48} height={48} className="mx-auto size-12 rounded-lg object-cover" unoptimized />
        )
      ) : null}
      <h2 className="mt-2 text-lg font-extrabold text-[#291B14]">{name}</h2>
      <p className="mt-1 text-[11px] font-bold text-[#C2410C]">{tr(locale, "Scan & order", "امسح الكود واطلب")} 🟢</p>
      <div className="my-3 flex justify-center">
        {qrData ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrData} alt="" className="size-40" />
        ) : (
          <div className="size-40 rounded border border-dashed border-gray-300" />
        )}
      </div>
      <p className="text-[10px] font-semibold text-[#7A6A5E]">{tr(locale, "Point your phone camera at the code", "وجّه كاميرا هاتفك نحو الكود")}</p>
      <p dir="ltr" className="mt-3 text-[9px] text-gray-400">/m/{slug}</p>
    </div>
  );
}
