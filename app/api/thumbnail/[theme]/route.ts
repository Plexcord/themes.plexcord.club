import type { NextRequest } from "next/server";
import { PUBLIC_CACHE, safeDecode, themeNotFound } from "@/lib/http";
import { readUpload } from "@/lib/storage";
import { findApprovedTheme } from "@/lib/themes";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ theme: string }> }) {
    const key = safeDecode((await params).theme);
    const theme = await findApprovedTheme(key);
    const image = theme?.thumbnail ? await readUpload("thumbnails", theme.thumbnail) : null;
    if (!theme?.thumbnail || !image) return themeNotFound(key);

    return new Response(new Uint8Array(image), {
        headers: {
            "Content-Type": theme.thumbnail.endsWith(".png") ? "image/png" : "image/webp",
            "Content-Disposition": "inline",
            "Cache-Control": PUBLIC_CACHE
        }
    });
}
