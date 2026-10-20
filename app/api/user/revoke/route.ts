import { NextResponse, type NextRequest } from "next/server";
import { bearerToken, userFromToken } from "@/lib/auth";
import { jsonError, readJsonObject } from "@/lib/http";
import { prisma } from "@/lib/prisma";

/** DELETE with Bearer token (body { userId } optional, as sent by ThemeLibrary). Revokes every token of that user. */
export async function DELETE(req: NextRequest) {
    const body = await readJsonObject(req);
    const token = bearerToken(req) ?? (typeof body?.token === "string" ? body.token : null);
    const user = token ? await userFromToken(token) : null;
    if (!user) return jsonError(401, "No user found with those credentials");

    if (body?.userId !== undefined && String(body.userId) !== user.id) {
        return jsonError(403, "Token does not belong to this user");
    }

    await prisma.apiToken.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ status: 200, message: "Successfully revoked access" });
}
