import { NextResponse } from "next/server";

export const PUBLIC_CACHE = "public, max-age=1200";

// Error bodies use the shape the ThemeLibrary plugin expects: { status, message }
export function jsonError(status: number, message: string) {
    return NextResponse.json({ status, message }, { status, headers: { "Cache-Control": "no-store" } });
}

export const unauthorized = () => jsonError(401, "Given token is not authorized");
export const themeNotFound = (key: string) => jsonError(404, `Couldn't find the theme with the id '${key}'`);

export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
    try {
        const body: unknown = await req.json();
        return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
    } catch {
        return null;
    }
}

export function safeDecode(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

/** Accepts plain base64 or a data: URL. Returns null for anything that isn't base64. */
export function decodeBase64(input: string): Buffer | null {
    const data = input.replace(/^data:[^,]*,/, "").replace(/\s+/g, "");
    if (!data || !/^[A-Za-z0-9+/_-]+={0,2}$/.test(data)) return null;
    const buf = Buffer.from(data, "base64");
    return buf.length ? buf : null;
}

export function attachment(filename: string): string {
    const ascii = filename.replace(/[^\x20-\x7e]|["\\]/g, "_");
    return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
