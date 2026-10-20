import { Download, ExternalLink, User } from "lucide-react";
import * as motion from "motion/react-client";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sessionUser } from "@/lib/auth";
import { safeDecode } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { readUpload } from "@/lib/storage";
import { findApprovedTheme, thumbnailSrc, type Author } from "@/lib/themes";
import { fadeUp } from "../../fade";
import MotionProvider from "../../MotionProvider";
import ThemeImage from "../../ThemeImage";
import CopyButton from "./CopyButton";
import LikeButton from "./LikeButton";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Theme · Plexcord Themes" };

const card = "rounded-2xl border border-zinc-800 bg-zinc-900/50";
const formatDate = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function ThemePage({ params }: { params: Promise<{ id: string }> }) {
    const theme = await findApprovedTheme(safeDecode((await params).id));
    if (!theme) notFound();

    const [css, user] = await Promise.all([readUpload("themes", theme.contentFile), sessionUser()]);
    const liked = user
        ? (await prisma.like.findUnique({ where: { userId_themeId: { userId: user.id, themeId: theme.id } } })) !== null
        : false;

    const authors = theme.authors as unknown as Author[];
    const tags = [theme.type, ...(theme.tags as unknown as string[])];
    const isGithub = theme.source?.startsWith("https://github.com/") ?? false;
    const stats = [
        ["Downloads", theme.downloads.toLocaleString("en-US")],
        ["Likes", theme._count.likes.toLocaleString("en-US")],
        ["Created", formatDate(theme.releaseDate)],
        ["Version", theme.version ?? "—"]
    ] as const;

    return (
        <MotionProvider>
            <div className="grid gap-8 lg:grid-cols-3">
                <div className="min-w-0 space-y-8 lg:col-span-2">
                    <motion.header {...fadeUp()}>
                        <h1 className="text-4xl font-extrabold tracking-tight">{theme.name}</h1>
                        <p className="mt-3 text-lg text-zinc-400">{theme.description}</p>
                        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
                            {tags.map(tag => (
                                <li key={tag} className="rounded-md bg-brand-purple/15 px-2.5 py-1 text-xs font-medium text-brand-purple-light">{tag}</li>
                            ))}
                        </ul>
                    </motion.header>

                    <motion.div {...fadeUp(0.1)} className={`relative aspect-video overflow-hidden ${card}`}>
                        <ThemeImage src={thumbnailSrc(theme.thumbnail)} alt={`${theme.name} preview`} />
                    </motion.div>

                    <motion.section {...fadeUp(0.2)} className={card} aria-labelledby="source-heading">
                        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
                            <h2 id="source-heading" className="font-semibold">Source Code</h2>
                            {css && <CopyButton targetId="theme-css" />}
                        </div>
                        {css ? (
                            <pre className="max-h-[32rem] overflow-auto p-5 text-sm leading-relaxed text-zinc-300">
                                <code id="theme-css">{css.toString("utf8")}</code>
                            </pre>
                        ) : (
                            <p className="p-5 text-sm text-zinc-500">Source is not available.</p>
                        )}
                    </motion.section>
                </div>

                <aside className="space-y-6 self-start lg:sticky lg:top-24">
                    <motion.div {...fadeUp(0.1)} className={`space-y-3 p-5 ${card}`}>
                        <a
                            href={`/api/download/${theme.id}`}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-purple px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-purple/85"
                        >
                            <Download className="size-5" aria-hidden /> Download Theme
                        </a>
                        {theme.source && (
                            <a
                                href={theme.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
                            >
                                {isGithub ? <GithubIcon className="size-4" /> : <ExternalLink className="size-4" aria-hidden />}
                                {isGithub ? "View on GitHub" : "View Source"}
                            </a>
                        )}
                        <LikeButton themeId={theme.id} liked={liked} loggedIn={user !== null} />
                    </motion.div>

                    <motion.section {...fadeUp(0.2)} className={`p-5 ${card}`} aria-labelledby="stats-heading">
                        <h2 id="stats-heading" className="mb-4 font-semibold">Statistics</h2>
                        <dl className="grid grid-cols-2 gap-3">
                            {stats.map(([label, value]) => (
                                <div key={label} className="rounded-xl bg-zinc-800/50 p-3">
                                    <dt className="text-xs text-zinc-500">{label}</dt>
                                    <dd className="mt-1 truncate font-semibold">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </motion.section>

                    <motion.section {...fadeUp(0.3)} className={`p-5 ${card}`} aria-labelledby="authors-heading">
                        <h2 id="authors-heading" className="mb-4 font-semibold">{authors.length > 1 ? "Contributors" : "Author"}</h2>
                        <ul className="space-y-4">
                            {authors.map((author, i) => (
                                <li key={author.discord_snowflake ?? i}>
                                    <p className="font-medium">{author.discord_name || author.github_name || "Unknown"}</p>
                                    {author.discord_snowflake && <p className="text-xs text-zinc-500">ID: {author.discord_snowflake}</p>}
                                    <div className="mt-2 flex gap-2">
                                        {author.discord_snowflake && (
                                            <a
                                                href={`https://discord.com/users/${author.discord_snowflake}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                                            >
                                                <User className="size-3.5" aria-hidden /> View Profile
                                            </a>
                                        )}
                                        {author.github_name && (
                                            <a
                                                href={`https://github.com/${encodeURIComponent(author.github_name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
                                            >
                                                <GithubIcon className="size-3.5" /> GitHub
                                            </a>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </motion.section>
                </aside>
            </div>
        </MotionProvider>
    );
}

// lucide dropped brand icons; GitHub mark (octicon)
function GithubIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
    );
}
