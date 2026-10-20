import { SearchX } from "lucide-react";
import Link from "next/link";

export default function ThemeNotFound() {
    return (
        <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/50 p-10 text-center">
            <SearchX className="mx-auto size-10 text-zinc-500" aria-hidden />
            <h1 className="mt-4 text-2xl font-bold">Theme Not Found</h1>
            <p className="mt-2 text-zinc-400">This theme doesn&apos;t exist or hasn&apos;t been approved yet.</p>
            <Link href="/" className="mt-6 inline-block rounded-lg bg-brand-purple px-4 py-2 text-sm font-medium hover:bg-brand-purple/85">
                Browse themes
            </Link>
        </div>
    );
}
