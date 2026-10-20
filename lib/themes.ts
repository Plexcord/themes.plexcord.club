import type { Prisma } from "./generated/prisma/client";
import { env } from "./env";
import { prisma } from "./prisma";
import { readUpload } from "./storage";

export type Author = {
    discord_snowflake: string | null;
    discord_name: string | null;
    github_name: string | null;
};

/** Field names and order are what the ThemeLibrary plugin expects; don't rename or reorder. */
export type ApiTheme = {
    id: number;
    name: string;
    type: "theme" | "snippet";
    description: string;
    author: Author | Author[];
    tags: string[];
    thumbnail_url: string;
    release_date: string;
    last_updated?: string;
    guild: { name: string | null; snowflake: string | null; invite_link: string | null; avatar_hash: string | null } | null;
    content: string;
    source: string | null;
    likes: number;
    downloads: number;
    version?: string;
    requiresThemeAttributes?: boolean;
};

export const withLikes = { _count: { select: { likes: true } } } satisfies Prisma.ThemeInclude;
export type ThemeWithLikes = Prisma.ThemeGetPayload<{ include: typeof withLikes }>;

const INT_MAX = 2_147_483_647;

/** Parses a positive INT id; null for anything else. */
export function parseThemeId(value: unknown): number | null {
    const id = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
    return typeof id === "number" && Number.isInteger(id) && id > 0 && id <= INT_MAX ? id : null;
}

/** Looks up an approved theme by numeric id, falling back to its name. */
export function findApprovedTheme(key: string) {
    const id = parseThemeId(key);
    return prisma.theme.findFirst({
        where: { status: "APPROVED", ...(id !== null ? { id } : { name: key }) },
        include: withLikes
    });
}

/** Relative src for the website; null when the theme has no thumbnail. */
export const thumbnailSrc = (file: string | null) => (file ? `/uploads/thumbnails/${file}` : null);

export function thumbnailUrl(file: string | null): string {
    return `${env.siteUrl()}${file ? `/uploads/thumbnails/${file}` : "/thumbnail-placeholder.svg"}`;
}

/** Returns null when the CSS file is missing on disk, so one broken theme can't break the list. */
export async function toApiTheme(theme: ThemeWithLikes): Promise<ApiTheme | null> {
    const css = await readUpload("themes", theme.contentFile);
    if (!css) return null;

    const authors = theme.authors as unknown as Author[];
    const hasGuild = theme.guildName !== null || theme.guildSnowflake !== null;

    return {
        id: theme.id,
        name: theme.name,
        type: theme.type,
        description: theme.description,
        author: authors.length === 1 ? authors[0]! : authors,
        tags: theme.tags as unknown as string[],
        thumbnail_url: thumbnailUrl(theme.thumbnail),
        release_date: theme.releaseDate.toISOString(),
        ...(theme.lastUpdated && { last_updated: theme.lastUpdated.toISOString() }),
        guild: hasGuild
            ? {
                name: theme.guildName,
                snowflake: theme.guildSnowflake,
                invite_link: theme.guildInvite,
                avatar_hash: theme.guildAvatarHash
            }
            : null,
        content: css.toString("base64"),
        source: theme.source,
        likes: theme._count.likes,
        downloads: theme.downloads,
        ...(theme.version && { version: theme.version }),
        ...(theme.requiresThemeAttributes && { requiresThemeAttributes: true })
    };
}
