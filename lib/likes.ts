import { NextResponse, type NextRequest } from "next/server";
import { requestUser } from "./auth";
import { jsonError, readJsonObject, themeNotFound, unauthorized } from "./http";
import { isUniqueViolation, prisma } from "./prisma";
import { parseThemeId } from "./themes";

/** Shared handler for POST /api/likes/add and /api/likes/remove. Body: { themeId: number } */
export function likeRoute(action: "add" | "remove") {
    return async (req: NextRequest) => {
        const user = await requestUser(req);
        if (!user) return unauthorized();

        const themeId = parseThemeId((await readJsonObject(req))?.themeId);
        if (themeId === null) return jsonError(400, "Invalid themeId");

        const theme = await prisma.theme.findFirst({ where: { id: themeId, status: "APPROVED" }, select: { id: true } });
        if (!theme) return themeNotFound(String(themeId));

        const event = { data: { userId: user.id, themeId, liked: action === "add" } };
        if (action === "add") {
            try {
                // same transaction: a duplicate like (P2002) logs no event
                await prisma.$transaction([prisma.like.create({ data: { userId: user.id, themeId } }), prisma.likeEvent.create(event)]);
            } catch (error) {
                if (isUniqueViolation(error)) return jsonError(409, "Theme already liked");
                throw error;
            }
        } else {
            const removed = await prisma.$transaction(async tx => {
                const { count } = await tx.like.deleteMany({ where: { userId: user.id, themeId } });
                if (count) await tx.likeEvent.create(event);
                return count > 0;
            });
            if (!removed) return jsonError(409, "Theme is not liked");
        }

        const likes = await prisma.like.count({ where: { themeId } });
        return NextResponse.json({ status: 200, themeId, likes, hasLiked: action === "add" });
    };
}
