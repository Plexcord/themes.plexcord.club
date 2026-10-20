import { Check, LogIn } from "lucide-react";
import * as motion from "motion/react-client";
import { sessionUser } from "@/lib/auth";
import { fadeUp } from "../fade";
import MotionProvider from "../MotionProvider";
import SubmitForm from "./SubmitForm";

export const dynamic = "force-dynamic";

const card = "rounded-2xl border border-zinc-800 bg-zinc-900/50";

const EXAMPLE = `/**
 * @name My Theme
 * @description What it changes
 * @version 1.0.0
 * @source https://github.com/you/my-theme
 * @invite yourInviteCode
 * @type theme
 * @tags dark, minimal
 */`;

const RULES = [
    "Only @name and @description are required",
    "Use @type snippet for small tweaks",
    "CSS up to 2 MB, thumbnail up to 5 MB",
    "16:9 thumbnails look best (shown at 1280×720)",
    "A moderator reviews every submission"
];

export default async function SubmitPage() {
    const user = await sessionUser();

    return (
        <MotionProvider>
            <div className="grid gap-8 lg:grid-cols-3">
                <motion.section {...fadeUp()} className={`p-6 sm:p-8 lg:col-span-2 ${card}`}>
                    <h1 className="text-3xl font-extrabold tracking-tight">Submit a theme</h1>
                    <p className="mt-2 text-zinc-400">Share a theme or snippet with everyone using Plexcord.</p>

                    <div className="mt-8">
                        {user ? (
                            <SubmitForm />
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
                                <p className="text-zinc-300">Log in with Discord so your submission is credited to you.</p>
                                <a
                                    href="/login?next=/submit"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-purple px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-purple/85"
                                >
                                    <LogIn className="size-4" aria-hidden /> Log in with Discord
                                </a>
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.aside {...fadeUp(0.1)} className="space-y-6">
                    <section className={`p-5 ${card}`} aria-labelledby="format-heading">
                        <h2 id="format-heading" className="font-semibold">Header format</h2>
                        <p className="mt-1 text-sm text-zinc-400">Start your CSS with this comment. The details are read from it.</p>
                        <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-300">
                            <code>{EXAMPLE}</code>
                        </pre>
                    </section>

                    <section className={`p-5 ${card}`} aria-labelledby="rules-heading">
                        <h2 id="rules-heading" className="font-semibold">Good to know</h2>
                        <ul className="mt-3 space-y-2.5 text-sm text-zinc-300">
                            {RULES.map(rule => (
                                <li key={rule} className="flex gap-2.5">
                                    <Check className="mt-0.5 size-4 shrink-0 text-brand-purple-light" aria-hidden /> {rule}
                                </li>
                            ))}
                        </ul>
                    </section>
                </motion.aside>
            </div>
        </MotionProvider>
    );
}
