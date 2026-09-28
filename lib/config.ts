export const BRAND = {
  nameAr: "سكان منيو",
  nameEn: "ScanMenu",
  taglineEn: "Your menu. Their phone. One simple order.",
  taglineAr: "منيو مطعمك على واتساب في دقيقة",
} as const;

/** True when real Supabase credentials exist → production data mode.
 *  Set NEXT_PUBLIC_DEMO_MODE=true to force the in-memory demo locally without
 *  removing stored production credentials. Demo data resets on restart. */
export function isSupabaseConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_MODE !== "true" &&
    Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );
}

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://demo.supabase.invalid";

export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
