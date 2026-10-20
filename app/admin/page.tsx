import type { Metadata } from "next";
import Link from "next/link";
import type { ThemeStatus } from "@/lib/generated/prisma/client";
import { sessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { thumbnailUrl, type Author } from "@/lib/themes";
import { approveTheme, deleteTheme, rejectTheme } from "./actions";
import ConfirmButton from "./ConfirmButton";
import Stats from "./Stats";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

const TABS: ThemeStatus[] = ["PENDING", "APPROVED", "REJECTED"];

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    // proxy.ts already blocks non-admins; checked again here in case the matcher ever changes.
    const user = await sessionUser();
    if (!user || !isAdmin(user.id)) return <p>403 Forbidden</p>;

    const requested = (await searchParams).status?.toUpperCase();
    const status = TABS.find(tab => tab === requested) ?? "PENDING";

    const [themes, counts] = await Promise.all([
        prisma.theme.findMany({
            where: { status },
            include: { _count: { select: { likes: true } } },
            orderBy: { id: "desc" }
        }),
        prisma.theme.groupBy({ by: ["status"], _count: { _all: true } })
    ]);
    const count = (s: ThemeStatus) => counts.find(c => c.status === s)?._count._all ?? 0;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold">Admin</h1>

            <Stats />

            <h2 className="pt-4 text-xl font-semibold">Moderation</h2>

            <nav className="flex gap-2">
                {TABS.map(tab => (
                    <Link
                        key={tab}
                        href={`/admin?status=${tab}`}
                        className={`rounded-md px-3 py-1.5 text-sm ${tab === status ? "bg-brand-purple" : "bg-zinc-800 hover:bg-zinc-700"}`}
                    >
                        {tab} ({count(tab)})
                    </Link>
                ))}
            </nav>

            {!themes.length && <p className="text-zinc-400">Nothing here.</p>}

            <ul className="space-y-4">
                {themes.map(theme => {
                    const authors = theme.authors as unknown as Author[];
                    return (
                        <li key={theme.id} className="flex gap-4 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                            {/* eslint-disable-next-line @next/next/no-img-element -- uploads are added at runtime */}
                            <img src={thumbnailUrl(theme.thumbnail)} alt="" className="aspect-video w-48 shrink-0 rounded object-cover" />
                            <div className="min-w-0 flex-1 space-y-1">
                                <p className="font-medium">
                                    #{theme.id} {theme.name}{" "}
                                    <span className="text-xs text-zinc-500">{theme.type}{theme.version && ` · v${theme.version}`}</span>
                                </p>
                                <p className="line-clamp-2 text-sm text-zinc-400">{theme.description}</p>
                                <p className="text-xs text-zinc-500">
                                    by {authors.map(a => `${a.discord_name} (${a.discord_snowflake})`).join(", ")} ·{" "}
                                    {theme.releaseDate.toISOString().slice(0, 10)} · ♥ {theme._count.likes} · ⬇ {theme.downloads}
                                </p>
                                <a href={`/uploads/themes/${theme.contentFile}`} target="_blank" className="text-sm text-brand-purple-light hover:underline">
                                    View CSS
                                </a>
                            </div>
                            <form className="flex shrink-0 flex-col gap-2">
                                <input type="hidden" name="id" value={theme.id} />
                                {status !== "APPROVED" && (
                                    <button formAction={approveTheme} className="rounded-md bg-emerald-700 px-3 py-1 text-sm hover:bg-emerald-600">
                                        Approve
                                    </button>
                                )}
                                {status !== "REJECTED" && (
                                    <button formAction={rejectTheme} className="rounded-md bg-amber-700 px-3 py-1 text-sm hover:bg-amber-600">
                                        Reject
                                    </button>
                                )}
                                <ConfirmButton formAction={deleteTheme} message={`Delete "${theme.name}" permanently?`} className="rounded-md bg-red-800 px-3 py-1 text-sm hover:bg-red-700">
                                    Delete
                                </ConfirmButton>
                            </form>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
