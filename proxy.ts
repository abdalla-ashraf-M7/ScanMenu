import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, SUPABASE_URL } from "./lib/config";

/**
 * Next.js 16 uses `proxy.ts` (successor of middleware.ts).
 * Guards /dashboard/* and /admin/* — full role checks run server-side in pages.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    const sid = request.cookies.get("sm_demo_session")?.value;
    if (!sid) return redirectLogin(request);
    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const sb = createServerClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return redirectLogin(request);
  return response;
}

function redirectLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
