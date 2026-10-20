import { NextResponse } from "next/server";
import { PUBLIC_CACHE } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { toApiTheme, withLikes } from "@/lib/themes";

export const dynamic = "force-dynamic";

export async function GET() {
    const themes = await prisma.theme.findMany({
        where: { status: "APPROVED" },
        include: withLikes,
        orderBy: { releaseDate: "desc" }
    });
    const body = (await Promise.all(themes.map(toApiTheme))).filter(theme => theme !== null);
    return NextResponse.json(body, { headers: { "Cache-Control": PUBLIC_CACHE } });
}
