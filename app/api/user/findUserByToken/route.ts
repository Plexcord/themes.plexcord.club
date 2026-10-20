import { NextResponse, type NextRequest } from "next/server";
import { bearerToken, userFromToken } from "@/lib/auth";
import { jsonError, readJsonObject } from "@/lib/http";

/** The ThemeLibrary plugin calls this with GET + Bearer; POST with { token } in the body is also accepted. */
async function handler(req: NextRequest) {
    let token = bearerToken(req);
    if (!token && req.method === "POST") {
        const body = await readJsonObject(req);
        token = typeof body?.token === "string" ? body.token : null;
    }

    const user = token ? await userFromToken(token) : null;
    if (!user) return jsonError(401, "No user found with those credentials");

    return NextResponse.json(
        {
            status: 200,
            user: {
                id: user.id,
                username: user.username,
                global_name: user.globalName,
                avatar: user.avatar,
                github_name: user.githubName
            }
        },
        { headers: { "Cache-Control": "no-store" } }
    );
}

export { handler as GET, handler as POST };
