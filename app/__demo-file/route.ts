import { NextResponse } from "next/server";
import { demoReadImage } from "@/lib/demo/store";

/**
 * DEV/DEMO ONLY: serves images uploaded in demo mode (stored as data URLs
 * in server memory). Production mode uses Supabase Storage public URLs and
 * never hits this route.
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path");
  if (!path) return new NextResponse("missing path", { status: 400 });
  const dataUrl = demoReadImage(path);
  if (!dataUrl) return new NextResponse("not found", { status: 404 });

  const [meta, b64] = dataUrl.split(",");
  const mime = meta.match(/data:(.*?);base64/)?.[1] ?? "image/jpeg";
  const bytes = Buffer.from(b64, "base64");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
