import { ArrowRight, Download, Heart, Puzzle, Upload } from "lucide-react";
import * as motion from "motion/react-client";
import Link from "next/link";
import { sessionUser } from "@/lib/auth";
import { INSTALL_URL } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { thumbnailSrc, type Author } from "@/lib/themes";
import { fadeUp, spring } from "./fade";
import MotionProvider from "./MotionProvider";
import ThemeImage from "./ThemeImage";

export const dynamic = "force-dynamic";

type Theme = Awaited<ReturnType<typeof loadThemes>>[number];

function loadThemes(q: string) {
    return prisma.theme.findMany({
        where: {
            status: "APPROVED",
            ...(q && { OR: [{ name: { contains: q } }, { description: { contains: q } }] })
        },
        include: { _count: { select: { likes: true } } }
    });
}

const authorNames = (theme: Theme) =>
    (theme.authors as unknown as Author[]).map(a => a.discord_name || a.github_name).filter(Boolean).join(", ");
const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact" }).format(n);
const updatedAt = (theme: Theme) => (theme.lastUpdated ?? theme.releaseDate).getTime();

export default async function HomePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const q = (await searchParams).q?.trim().slice(0, 100) ?? "";
    const [themes, user] = await Promise.all([loadThemes(q), sessionUser()]);

    const recent = [...themes].sort((a, b) => updatedAt(b) - updatedAt(a));
    const totalDownloads = themes.reduce((sum, t) => sum + t.downloads, 0);
    const featured = [...themes].sort((a, b) => b._count.likes - a._count.likes || b.downloads - a.downloads).slice(0, 4);

    return (
        <MotionProvider>
            {!q && (
                <section className="grid items-center gap-12 pb-20 pt-8 lg:grid-cols-2">
                    <motion.div {...fadeUp()}>
                        <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300">
                            <span aria-hidden className="size-1.5 rounded-full bg-emerald-400" />
                            {themes.length} themes · {compact(totalDownloads)} downloads
                        </p>
                        <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
                            Discord Themes{" "}
                            <span className="text-brand-purple-light">&amp; Snippets</span>
                        </h1>
                        <p className="mt-5 max-w-md text-lg leading-relaxed text-zinc-400">
                            Community-made themes and snippets for Plexcord, from small tweaks to full makeovers. Every one is reviewed before it goes live.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a href={user ? "/submit" : "/login"} className="group inline-flex transition-[scale] duration-150 ease-out">
                                <span className="inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2)] transition-colors duration-150 group-hover:bg-brand-purple/85">
                                    {user ? <Upload className="size-4" aria-hidden /> : null}
                                    {user ? "Submit a theme" : "Connect via Discord"}
                                    <ArrowRight className="size-4 transition-transform duration-200 ease-out-strong group-hover:translate-x-0.5" aria-hidden />
                                </span>
                            </a>
                            <a
                                href={INSTALL_URL}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-zinc-100 transition-[background-color,border-color,scale] duration-150 ease-out hover:border-white/20 hover:bg-white/10"
                            >
                                <Puzzle className="size-4" aria-hidden /> Get Extension
                            </a>
                        </div>
                    </motion.div>

                    {featured.length > 0 && (
                        <ul className="grid grid-cols-2 gap-4" aria-label="Featured themes">
                            {featured.map((theme, i) => (
                                <motion.li key={theme.id} {...fadeUp(0.1 + i * 0.06)}>
                                    <Link
                                        href={`/theme/${theme.id}`}
                                        className="relative block aspect-video overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-lg shadow-black/40 transition-[translate,border-color,box-shadow] duration-300 ease-out-strong hover:border-white/25 hover:shadow-brand-purple/30 motion-safe:hover:-translate-y-1"
                                    >
                                        <ThemeImage src={thumbnailSrc(theme.thumbnail)} alt={theme.name} />
                                        <div className="absolute inset-x-0 bottom-0 bg-zinc-950/80 px-3 py-2">
                                            <p className="truncate text-sm font-semibold text-white">{theme.name}</p>
                                            <p className="truncate text-xs text-zinc-300">{authorNames(theme)}</p>
                                        </div>
                                    </Link>
                                </motion.li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            <section>
                <motion.h2 {...fadeUp(q ? 0 : 0.25)} className="mb-6 text-2xl font-bold">
                    {q ? <>Results for “{q}” <span className="text-zinc-500">({themes.length})</span></> : "Recently Updated"}
                </motion.h2>

                {recent.length ? (
                    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {recent.map((theme, i) => <ThemeCard key={theme.id} theme={theme} delay={(i % 3) * 0.06} />)}
                    </ul>
                ) : (
                    <p className="text-zinc-400">
                        {q ? <>No themes match “{q}”. <Link href="/" className="text-brand-purple-light hover:underline">Show all</Link></> : "No themes yet."}
                    </p>
                )}
            </section>
        </MotionProvider>
    );
}

function ThemeCard({ theme, delay }: { theme: Theme; delay: number }) {
    const isSnippet = theme.type === "snippet";
    const authors = authorNames(theme);

    return (
        <motion.li
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            whileHover={{ scale: 1.02 }}
            transition={{ ...spring, delay }}
            className="relative flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 backdrop-blur transition-shadow hover:shadow-xl hover:shadow-black/40"
        >
            <div className="relative aspect-video">
                <ThemeImage src={thumbnailSrc(theme.thumbnail)} alt={theme.name} />
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold">
                        {/* stretched link: the whole card opens the detail page, the Download button stays separate */}
                        <Link href={`/theme/${theme.id}`} className="after:absolute after:inset-0 focus:outline-none focus-visible:after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-brand-purple">
                            {theme.name}
                        </Link>
                    </h3>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${isSnippet ? "bg-brand-red/15 text-brand-red-light" : "bg-brand-purple/15 text-brand-purple-light"}`}>
                        {isSnippet ? "Snippet" : "Theme"}
                    </span>
                </div>
                <p className="line-clamp-2 text-sm text-zinc-400">{theme.description}</p>
                {authors && <p className="truncate text-xs text-zinc-500">by {authors}</p>}
                <div className="mt-auto flex items-center justify-between pt-3 text-sm text-zinc-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Heart className="size-4" aria-hidden /><span className="sr-only">Likes:</span>{theme._count.likes}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Download className="size-4" aria-hidden /><span className="sr-only">Downloads:</span>{theme.downloads}
                        </span>
                    </div>
                    <a
                        href={`/api/download/${theme.id}`}
                        className="relative z-10 flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 font-medium text-zinc-100 transition-colors hover:bg-brand-purple"
                    >
                        <Download className="size-4" aria-hidden /> Download
                    </a>
                </div>
            </div>
        </motion.li>
    );
}
