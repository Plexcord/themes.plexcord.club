import { prisma } from "@/lib/prisma";

const fmt = (n: number) => n.toLocaleString("en-US");
const time = (d: Date) => d.toISOString().slice(5, 16).replace("T", " ");

type Activity = { at: Date; text: string };

/** Admin overview. "Today" is the current UTC day. */
export default async function Stats() {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const since = { gte: today };

    const [
        downloads, downloadsToday, likes, likesToday, users, usersToday, pluginUsers, pluginToday,
        statuses, submittedToday, topThemes, recentLikes, recentThemes, recentUsers
    ] = await Promise.all([
        prisma.theme.aggregate({ _sum: { downloads: true } }),
        prisma.dailyDownload.findUnique({ where: { day: today } }),
        prisma.like.count(),
        prisma.like.count({ where: { createdAt: since } }),
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: since } }),
        // users holding a ThemeLibrary token = connected the plugin and haven't revoked it
        prisma.user.count({ where: { tokens: { some: {} } } }),
        prisma.apiToken.count({ where: { createdAt: since } }),
        prisma.theme.groupBy({ by: ["status"], _count: { _all: true } }),
        prisma.theme.count({ where: { createdAt: since } }),
        prisma.theme.findMany({
            where: { status: "APPROVED" },
            orderBy: { downloads: "desc" },
            take: 5,
            select: { id: true, name: true, downloads: true, _count: { select: { likes: true } } }
        }),
        prisma.likeEvent.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { user: true, theme: { select: { name: true } } } }),
        prisma.theme.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { submitter: true } }),
        prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10 })
    ]);

    const statusCount = (s: string) => statuses.find(row => row.status === s)?._count._all ?? 0;

    const activity: Activity[] = [
        ...recentLikes.map(l => ({
            at: l.createdAt,
            text: l.liked ? `♥ ${l.user.username} liked ${l.theme.name}` : `♡ ${l.user.username} removed their like from ${l.theme.name}`
        })),
        ...recentThemes.map(t => ({ at: t.createdAt, text: `＋ ${t.submitter?.username ?? "import"} submitted ${t.name} (${t.status.toLowerCase()})` })),
        ...recentUsers.map(u => ({ at: u.createdAt, text: `● ${u.username} signed up` }))
    ]
        .sort((a, b) => b.at.getTime() - a.at.getTime())
        .slice(0, 12);

    const tiles = [
        ["Downloads", downloads._sum.downloads ?? 0, downloadsToday?.count ?? 0, "today"],
        ["Likes", likes, likesToday, "today"],
        ["Plugin users", pluginUsers, pluginToday, "connected today"],
        ["Users", users, usersToday, "today"],
        ["Approved themes", statusCount("APPROVED"), submittedToday, "submitted today"],
        ["Pending review", statusCount("PENDING"), null, ""]
    ] as const;

    return (
        <section className="space-y-6" aria-labelledby="stats-heading">
            <h2 id="stats-heading" className="sr-only">Statistics</h2>

            <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {tiles.map(([label, total, todayValue, todayLabel]) => (
                    <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                        <dt className="text-xs text-zinc-500">{label}</dt>
                        <dd className="mt-1 text-2xl font-bold tabular-nums">{fmt(total)}</dd>
                        {todayValue !== null && (
                            <dd className={`mt-1 text-xs tabular-nums ${todayValue ? "text-emerald-400" : "text-zinc-600"}`}>
                                +{fmt(todayValue)} {todayLabel}
                            </dd>
                        )}
                    </div>
                ))}
            </dl>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <h3 className="mb-3 font-semibold">Top themes</h3>
                    <ol className="space-y-2 text-sm">
                        {topThemes.map((t, i) => (
                            <li key={t.id} className="flex items-center gap-3">
                                <span className="w-4 text-zinc-500 tabular-nums">{i + 1}</span>
                                <a href={`/theme/${t.id}`} className="min-w-0 flex-1 truncate hover:underline">{t.name}</a>
                                <span className="text-zinc-400 tabular-nums">⬇ {fmt(t.downloads)}</span>
                                <span className="w-14 text-right text-zinc-400 tabular-nums">♥ {fmt(t._count.likes)}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                    <h3 className="mb-3 font-semibold">Recent activity <span className="text-xs font-normal text-zinc-500">(UTC)</span></h3>
                    {activity.length ? (
                        <ul className="space-y-2 text-sm">
                            {activity.map((a, i) => (
                                <li key={i} className="flex gap-3">
                                    <time dateTime={a.at.toISOString()} className="shrink-0 text-zinc-500 tabular-nums">{time(a.at)}</time>
                                    <span className="min-w-0 truncate">{a.text}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-zinc-500">Nothing yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}
