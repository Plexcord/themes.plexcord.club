import { NextResponse, type NextRequest } from "next/server";
import { requestUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** { status, likes: [{ themeId, likes, hasLiked? }] } — hasLiked only when the caller is authenticated. */
export async function GET(req: NextRequest) {
    const user = await requestUser(req);
    const [themes, liked] = await Promise.all([
        prisma.theme.findMany({ where: { status: "APPROVED" }, select: { id: true, _count: { select: { likes: true } } } }),
        user ? prisma.like.findMany({ where: { userId: user.id }, select: { themeId: true } }) : []
    ]);
    const likedIds = new Set(liked.map(like => like.themeId));

    return NextResponse.json(
        {
            status: 200,
            likes: themes.map(theme => ({
                themeId: theme.id,
                likes: theme._count.likes,
                ...(user && { hasLiked: likedIds.has(theme.id) })
            }))
        },
        { headers: { "Cache-Control": "no-store" } }
    );
}
