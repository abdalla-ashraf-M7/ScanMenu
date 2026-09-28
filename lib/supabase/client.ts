"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL } from "../config";

export function supabaseBrowser() {
  return createBrowserClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
