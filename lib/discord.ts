import { env } from "./env";

const API = "https://discord.com/api/v10";
const TIMEOUT = 10_000;

export type DiscordProfile = {
    id: string;
    username: string;
    global_name: string | null;
    avatar: string | null;
    githubName: string | null;
};

export type GuildInfo = { name: string; snowflake: string; invite_link: string; avatar_hash: string | null };

export const redirectUri = () => `${env.siteUrl()}/api/user/auth`;

export function authorizeUrl(state: string): string {
    const params = new URLSearchParams({
        client_id: env.discordClientId(),
        response_type: "code",
        redirect_uri: redirectUri(),
        scope: "identify connections",
        state
    });
    return `https://discord.com/oauth2/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<string | null> {
    const res = await fetch(`${API}/oauth2/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: env.discordClientId(),
            client_secret: env.discordClientSecret(),
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri()
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT)
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
}

async function get<T>(path: string, accessToken?: string): Promise<T | null> {
    const res = await fetch(`${API}${path}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT)
    });
    return res.ok ? ((await res.json()) as T) : null;
}

export async function fetchProfile(accessToken: string): Promise<DiscordProfile | null> {
    const user = await get<Omit<DiscordProfile, "githubName">>("/users/@me", accessToken);
    if (!user) return null;
    // "connections" scope may be declined; GitHub name is optional.
    const connections = (await get<Array<{ type: string; name: string }>>("/users/@me/connections", accessToken)) ?? [];
    return {
        id: user.id,
        username: user.username,
        global_name: user.global_name,
        avatar: user.avatar,
        githubName: connections.find(c => c.type === "github")?.name ?? null
    };
}

/** Accepts an invite code or a discord.gg / discord.com/invite URL. */
export async function resolveInvite(invite: string): Promise<GuildInfo | null> {
    const code = invite.trim().match(/(?:discord(?:app)?\.(?:gg|com\/invite)\/)?([\w-]+)\/?$/)?.[1];
    if (!code) return null;
    try {
        const data = await get<{ guild?: { id: string; name: string; icon: string | null } }>(`/invites/${code}`);
        if (!data?.guild) return null;
        return {
            name: data.guild.name,
            snowflake: data.guild.id,
            invite_link: `https://discord.gg/${code}`,
            avatar_hash: data.guild.icon
        };
    } catch {
        return null;
    }
}
