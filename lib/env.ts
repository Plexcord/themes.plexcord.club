// Target of the "Install Plexcord" / "Get Extension" buttons.
export const INSTALL_URL = "https://plexcord.club";

// Read lazily so `next build` works without production secrets present.
function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable ${name}`);
    return value;
}

export const env = {
    siteUrl: () => required("SITE_URL").replace(/\/+$/, ""),
    discordClientId: () => required("DISCORD_CLIENT_ID"),
    discordClientSecret: () => required("DISCORD_CLIENT_SECRET"),
    sessionSecret: () => {
        const secret = required("SESSION_SECRET");
        if (secret.length < 32) throw new Error("SESSION_SECRET must be at least 32 characters");
        return secret;
    }
};

export function isAdmin(discordId: string): boolean {
    return (process.env.ADMIN_DISCORD_IDS ?? "")
        .split(",")
        .map(id => id.trim())
        .filter(Boolean)
        .includes(discordId);
}
