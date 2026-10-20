import type { NextRequest } from "next/server";
import { safeDecode, themeNotFound } from "@/lib/http";
import { readUpload } from "@/lib/storage";
import { findApprovedTheme } from "@/lib/themes";

/** Raw CSS of a theme, by id or name. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ theme: string }> }) {
    const key = safeDecode((await params).theme);
    const theme = await findApprovedTheme(key);
    const css = theme && (await readUpload("themes", theme.contentFile));
    if (!css) return themeNotFound(key);
    return new Response(new Uint8Array(css), { headers: { "Content-Type": "text/css; charset=utf-8" } });
}
