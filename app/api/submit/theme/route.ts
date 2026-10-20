import { NextResponse, type NextRequest } from "next/server";
import { requestUser } from "@/lib/auth";
import { resolveInvite } from "@/lib/discord";
import { decodeBase64, jsonError, readJsonObject, unauthorized } from "@/lib/http";
import { parseMeta } from "@/lib/meta";
import { isUniqueViolation, prisma } from "@/lib/prisma";
import { removeUpload, saveUpload, toWebp } from "@/lib/storage";
import type { Author } from "@/lib/themes";

const MAX_BODY_BYTES = 10 * 1024 * 1024;
const MAX_CSS_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PENDING_PER_USER = 5;

/**
 * Body: { content: base64 CSS, thumbnail?: base64 image or data: URL }
 * Metadata (name, description, version, source, invite, type, tags) comes from the CSS header.
 */
export async function POST(req: NextRequest) {
    const user = await requestUser(req);
    if (!user) return unauthorized();

    if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return jsonError(413, "Payload too large");
    const body = await readJsonObject(req);

    const cssBytes = typeof body?.content === "string" ? decodeBase64(body.content) : null;
    if (!cssBytes || cssBytes.length > MAX_CSS_BYTES) {
        return jsonError(400, "content must be a base64 encoded CSS file (max 2 MB)");
    }
    const css = cssBytes.toString("utf8");

    const meta = parseMeta(css);
    if (!meta.name || !meta.description) {
        return jsonError(400, "The CSS must start with a /** ... */ header containing @name and @description");
    }
    if (meta.name.length > 100) return jsonError(400, "@name must be at most 100 characters");
    if (meta.description.length > 2000) return jsonError(400, "@description must be at most 2000 characters");

    let thumbnail: Buffer | null = null;
    if (body?.thumbnail !== undefined && body.thumbnail !== null && body.thumbnail !== "") {
        const image = typeof body.thumbnail === "string" ? decodeBase64(body.thumbnail) : null;
        if (!image || image.length > MAX_IMAGE_BYTES) return jsonError(400, "thumbnail must be a base64 encoded image (max 5 MB)");
        try {
            thumbnail = await toWebp(image);
        } catch {
            return jsonError(400, "thumbnail is not a supported image");
        }
    }

    const pending = await prisma.theme.count({ where: { submitterId: user.id, status: "PENDING" } });
    if (pending >= MAX_PENDING_PER_USER) return jsonError(429, `You already have ${pending} themes waiting for review`);

    if (await prisma.theme.findUnique({ where: { name: meta.name }, select: { id: true } })) {
        return jsonError(409, "A theme with this name already exists");
    }

    const guild = meta.invite ? await resolveInvite(meta.invite) : null;
    const author: Author = { discord_snowflake: user.id, discord_name: user.username, github_name: user.githubName };

    const contentFile = await saveUpload("themes", meta.name, "css", css);
    let thumbnailFile: string | null = null;
    try {
        if (thumbnail) thumbnailFile = await saveUpload("thumbnails", meta.name, "webp", thumbnail);

        const theme = await prisma.theme.create({
            data: {
                name: meta.name,
                type: meta.type,
                description: meta.description,
                version: meta.version ?? null,
                authors: [author],
                tags: meta.tags,
                thumbnail: thumbnailFile,
                contentFile,
                source: meta.source ?? null,
                guildName: guild?.name ?? null,
                guildSnowflake: guild?.snowflake ?? null,
                guildInvite: guild?.invite_link ?? null,
                guildAvatarHash: guild?.avatar_hash ?? null,
                submitterId: user.id
            },
            select: { id: true }
        });

        return NextResponse.json(
            { status: 201, message: "Theme submitted, waiting for review", id: theme.id },
            { status: 201 }
        );
    } catch (error) {
        await Promise.all([removeUpload("themes", contentFile), removeUpload("thumbnails", thumbnailFile)]);
        if (isUniqueViolation(error)) return jsonError(409, "A theme with this name already exists");
        throw error;
    }
}
