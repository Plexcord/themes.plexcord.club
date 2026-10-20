import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { User } from "./generated/prisma/client";
import { prisma } from "./prisma";
import { readSession, SESSION_COOKIE } from "./session";

const MAX_TOKENS_PER_USER = 10;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Creates a new UNIQUE_USER_TOKEN; keeps only the newest few per user. */
export async function issueToken(userId: string): Promise<string> {
    const token = randomBytes(32).toString("hex");
    await prisma.apiToken.create({ data: { userId, tokenHash: hashToken(token) } });

    const stale = await prisma.apiToken.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: MAX_TOKENS_PER_USER,
        select: { id: true }
    });
    if (stale.length) await prisma.apiToken.deleteMany({ where: { id: { in: stale.map(t => t.id) } } });

    return token;
}

export function bearerToken(req: Request): string | null {
    const token = req.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    // The ThemeLibrary plugin sends "Bearer undefined" when the user never logged in.
    return token && token !== "undefined" && token !== "null" ? token : null;
}

export async function userFromToken(token: string): Promise<User | null> {
    const row = await prisma.apiToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
    return row?.user ?? null;
}

export async function sessionUser(): Promise<User | null> {
    const session = readSession((await cookies()).get(SESSION_COOKIE)?.value);
    return session ? prisma.user.findUnique({ where: { id: session.uid } }) : null;
}

/** Bearer token (client mod) first, website session cookie otherwise. */
export async function requestUser(req: Request): Promise<User | null> {
    const token = bearerToken(req);
    return token ? userFromToken(token) : sessionUser();
}
