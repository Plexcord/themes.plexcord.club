export type ThemeMeta = {
    name?: string;
    description?: string;
    version?: string;
    source?: string;
    invite?: string;
    type: "theme" | "snippet";
    tags: string[];
};

/**
 * Reads the BetterDiscord-style header Discord themes start with:
 *
 *   /**
 *    * @name My Theme
 *    * @description Does things
 *    * @version 1.0.0
 *    * @source https://github.com/...
 *    * @invite abc123
 *    * @type snippet          (optional, default "theme")
 *    * @tags dark, minimal    (optional, comma separated)
 *    *\/
 */
export function parseMeta(css: string): ThemeMeta {
    const block = css.match(/^﻿?\s*\/\*\*([\s\S]*?)\*\//)?.[1] ?? "";
    const fields: Record<string, string> = {};
    for (const line of block.split(/\r?\n/)) {
        const match = line.match(/^\s*\*?\s*@(\w+)\s+(.+?)\s*$/);
        if (match?.[1] && match[2] && !(match[1] in fields)) fields[match[1]] = match[2];
    }

    const tags = (fields.tags ?? "")
        .split(",")
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag && tag.length <= 32);

    return {
        name: fields.name,
        description: fields.description,
        version: fields.version?.slice(0, 32),
        source: fields.source,
        invite: fields.invite,
        type: fields.type?.toLowerCase() === "snippet" ? "snippet" : "theme",
        tags: [...new Set(tags)].slice(0, 10)
    };
}
