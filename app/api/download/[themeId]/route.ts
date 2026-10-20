import type { NextRequest } from "next/server";
import { attachment, safeDecode, themeNotFound } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/storage";
import { findApprovedTheme } from "@/lib/themes";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ themeId: string }> }) {
    const key = safeDecode((await params).themeId);
    const theme = await findApprovedTheme(key);
    const css = theme && (await readUpload("themes", theme.contentFile));
    if (!theme || !css) return themeNotFound(key);

    const day = new Date().toISOString().slice(0, 10); // UTC day
    await Promise.all([
        prisma.theme.update({ where: { id: theme.id }, data: { downloads: { increment: 1 } } }),
        // atomic upsert: concurrent first downloads of the day can't collide
        prisma.$executeRaw`INSERT INTO DailyDownload (day, count) VALUES (${day}, 1) ON DUPLICATE KEY UPDATE count = count + 1`
    ]);

    return new Response(new Uint8Array(css), {
        headers: {
            "Content-Type": "text/css; charset=utf-8",
            "Content-Disposition": attachment(`${theme.name}.theme.css`),
            "Cache-Control": "no-store"
        }
    });
}
