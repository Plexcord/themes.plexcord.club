import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeUrl } from "@/lib/discord";
import { cookieOptions, OAUTH_STATE_COOKIE } from "@/lib/session";

/** Website login: /login?next=/admin */
export function GET(req: NextRequest) {
    const requested = req.nextUrl.searchParams.get("next") ?? "/";
    // Only same-site paths, never "//evil.com"
    const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";
    const state = randomBytes(16).toString("hex");

    const res = NextResponse.redirect(authorizeUrl(state));
    res.cookies.set(OAUTH_STATE_COOKIE, `${state}|${encodeURIComponent(next)}`, cookieOptions(600));
    return res;
}
