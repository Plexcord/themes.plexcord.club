import path from "node:path";
import type { NextRequest } from "next/server";
import { readUpload, type UploadKind } from "@/lib/storage";

// `next start` only serves files that were in public/ at build time; this serves later uploads.
// Nginx (deploy/hestia) proxies everything, so this route serves all uploads in production.
const TYPES: Record<string, string> = {
    ".css": "text/css; charset=utf-8",
    ".webp": "image/webp",
    ".png": "image/png"
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
    const [kind, file, ...rest] = (await params).path;
    const type = file && TYPES[path.extname(file)];
    if ((kind !== "themes" && kind !== "thumbnails") || !file || rest.length || !type || file !== path.basename(file)) {
        return new Response("Not found", { status: 404 });
    }

    const data = await readUpload(kind satisfies UploadKind, file);
    if (!data) return new Response("Not found", { status: 404 });

    return new Response(new Uint8Array(data), {
        headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" }
    });
}
