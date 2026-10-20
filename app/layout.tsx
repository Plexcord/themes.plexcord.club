import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { sessionUser } from "@/lib/auth";
import { INSTALL_URL, isAdmin } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
    title: "Plexcord Themes",
    description: "Themes and snippets for Plexcord"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const user = await sessionUser();

    return (
        <html lang="en">
            <body className="min-h-screen">
                <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur">
                    <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6">
                        <Link href="/" className="shrink-0 font-semibold">
                            Plexcord <span className="text-brand-purple-light">Themes</span>
                        </Link>

                        <form action="/" role="search" className="relative min-w-0 max-w-md flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" aria-hidden />
                            <input
                                type="search"
                                name="q"
                                placeholder="Search themes and snippets..."
                                aria-label="Search themes and snippets"
                                className="w-full rounded-lg border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-3 text-sm placeholder:text-zinc-500 focus:border-brand-purple focus:outline-none"
                            />
                        </form>

                        <div className="ml-auto flex shrink-0 items-center gap-4 text-sm text-zinc-400">
                            <a href={INSTALL_URL} className="hidden hover:text-zinc-100 md:inline">Install Plexcord</a>
                            {user && <Link href="/submit" className="hidden hover:text-zinc-100 sm:inline">Submit</Link>}
                            {user && isAdmin(user.id) && <Link href="/admin" className="hover:text-zinc-100">Admin</Link>}
                            {user ? (
                                <form action="/logout" method="post">
                                    <button className="hover:text-zinc-100">Log out</button>
                                </form>
                            ) : (
                                <a href="/login" className="rounded-lg bg-brand-purple px-3 py-2 font-medium text-white hover:bg-brand-purple/85">
                                    Log in<span className="hidden sm:inline"> with Discord</span>
                                </a>
                            )}
                        </div>
                    </nav>
                </header>
                <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
            </body>
        </html>
    );
}
