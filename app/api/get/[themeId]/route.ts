import { NextResponse, type NextRequest } from "next/server";
import { PUBLIC_CACHE, safeDecode, themeNotFound } from "@/lib/http";
import { findApprovedTheme, toApiTheme } from "@/lib/themes";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ themeId: string }> }) {
    const key = safeDecode((await params).themeId);
    const theme = await findApprovedTheme(key);
    const body = theme && (await toApiTheme(theme));
    if (!body) return themeNotFound(key);
    return NextResponse.json(body, { headers: { "Cache-Control": PUBLIC_CACHE } });
}
