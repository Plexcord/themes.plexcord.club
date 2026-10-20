import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/env";
import { readSession, SESSION_COOKIE } from "@/lib/session";

export const config = {
    matcher: ["/api/:path*", "/themes", "/admin", "/admin/:path*"]
};

// Client mods call the API from discord.com, so CORS must be open.
const CORS_HEADERS: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Max-Age": "86400"
};

// Routes that need a logged-in user. Handlers verify the token itself; this only rejects requests with no credentials.
const AUTH_ROUTES = ["/api/submit/", "/api/likes/add", "/api/likes/remove", "/api/user/revoke"];

function withCors(res: NextResponse): NextResponse {
    for (const [key, value] of Object.entries(CORS_HEADERS)) res.headers.set(key, value);
    return res;
}

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const session = readSession(req.cookies.get(SESSION_COOKIE)?.value);

    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        if (!session) return new NextResponse("401 Unauthorized", { status: 401 });
        if (!isAdmin(session.uid)) return new NextResponse("403 Forbidden", { status: 403 });
        return NextResponse.next();
    }

    if (req.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: CORS_HEADERS });

    if (AUTH_ROUTES.some(route => pathname.startsWith(route))) { 
        const hasBearer = /^Bearer\s+(?!undefined$|null$)\S+/i.test(req.headers.get("authorization") ?? "");
        if (!hasBearer && !session) {
            return withCors(NextResponse.json({ status: 401, message: "Given token is not authorized" }, { status: 401 }));
        }
    }

    return withCors(NextResponse.next());
}
