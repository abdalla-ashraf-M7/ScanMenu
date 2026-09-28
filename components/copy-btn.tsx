"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLocale } from "./locale-provider";
import { tr } from "@/lib/i18n";

export function CopyBtn({
  value,
  label,
  className,
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const { locale } = useLocale();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className={`press inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold hover:bg-brandsoft ${className ?? ""}`}
    >
      {copied ? <Check className="size-4 text-wastrong" /> : <Copy className="size-4 text-brand" />}
      {copied ? tr(locale, "Copied ✓", "تم النسخ ✓") : label ?? tr(locale, "Copy link", "نسخ الرابط")}
    </button>
  );
}
