import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";

// Website login cookie: base64url({ uid, exp }).hmac — no DB lookup needed in proxy.ts.
export const SESSION_COOKIE = "pc_session";
export const OAUTH_STATE_COOKIE = "pc_oauth_state";
const MAX_AGE = 60 * 60 * 24 * 7;

type Session = { uid: string; exp: number };

const sign = (data: string) => createHmac("sha256", env.sessionSecret()).update(data).digest("base64url");

export function createSession(uid: string): string {
    const session: Session = { uid, exp: Math.floor(Date.now() / 1000) + MAX_AGE };
    const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
    return `${payload}.${sign(payload)}`;
}

export function readSession(value: string | undefined): Session | null {
    const parts = value?.split(".") ?? [];
    const [payload, sig] = parts;
    if (parts.length !== 2 || !payload || !sig) return null;

    const expected = Buffer.from(sign(payload));
    const given = Buffer.from(sig);
    if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

    try {
        const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Session>;
        if (typeof session.uid !== "string" || typeof session.exp !== "number") return null;
        return session.exp > Date.now() / 1000 ? { uid: session.uid, exp: session.exp } : null;
    } catch {
        return null;
    }
}

export const cookieOptions = (maxAge = MAX_AGE) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge
});
