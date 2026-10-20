import { NextResponse, type NextRequest } from "next/server";
import { issueToken } from "@/lib/auth";
import { exchangeCode, fetchProfile } from "@/lib/discord";
import { env } from "@/lib/env";
import { jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { cookieOptions, createSession, OAUTH_STATE_COOKIE, SESSION_COOKIE } from "@/lib/session";

/**
 * Discord OAuth2 redirect target.
 * - Client mod (OAuth2AuthorizeModal, no `state`): returns { token } as JSON.
 * - Website (/login, with `state`): sets the session cookie and redirects.
 */
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    if (!code) return jsonError(400, "Missing code");

    let next = "/";
    if (state !== null) {
        const saved = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
        if (!saved) return jsonError(400, "Login cookie missing: start the login again in this browser, with cookies allowed");
        const [expected, savedNext] = saved.split("|");
        if (expected !== state) return jsonError(400, "Invalid OAuth state: the login was started again in another tab");
        next = decodeURIComponent(savedNext ?? "/");
    }

    const accessToken = await exchangeCode(code);
    if (!accessToken) return jsonError(401, "Invalid or expired code");

    const profile = await fetchProfile(accessToken);
    if (!profile) return jsonError(502, "Could not fetch the Discord user");

    const fields = {
        username: profile.username,
        globalName: profile.global_name,
        avatar: profile.avatar,
        githubName: profile.githubName
    };
    await prisma.user.upsert({ where: { id: profile.id }, create: { id: profile.id, ...fields }, update: fields });

    if (state === null) {
        const token = await issueToken(profile.id);
        return NextResponse.json({ status: 200, token }, { headers: { "Cache-Control": "no-store" } });
    }

    const res = NextResponse.redirect(new URL(next, env.siteUrl()));
    res.cookies.set(SESSION_COOKIE, createSession(profile.id), cookieOptions());
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
}
