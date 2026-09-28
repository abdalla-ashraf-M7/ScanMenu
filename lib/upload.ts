"use client";

import { supabaseBrowser } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/config";
import { demoUploadImage } from "@/lib/demo/store";

/** Resize an image file client-side to max width and JPEG-compress it. */
export async function fileToResizedBlob(file: File, maxW = 1200): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? file), "image/jpeg", 0.85)
  );
}

/**
 * Upload to Supabase Storage in production (path `{restaurantId}/ts.jpg`),
 * or keep a data-URL in the demo store when running without credentials.
 */
export async function uploadRestaurantImage(
  restaurantId: string,
  file: File
): Promise<{ url: string; path: string }> {
  const blob = await fileToResizedBlob(file);
  const path = `${restaurantId}/${Date.now()}.jpg`;

  if (!isSupabaseConfigured()) {
    const dataUrl = await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.readAsDataURL(blob);
    });
    const url = demoUploadImage(path, dataUrl);
    return { url, path };
  }

  const sb = supabaseBrowser();
  const { error } = await sb.storage.from("menu-images").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from("menu-images").getPublicUrl(path);
  return { url: data.publicUrl, path };
}
