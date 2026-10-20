"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const buttonClass = "flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors";

export default function LikeButton({ themeId, liked: initialLiked, loggedIn }: { themeId: number; liked: boolean; loggedIn: boolean }) {
    const router = useRouter();
    const [liked, setLiked] = useState(initialLiked);
    const [busy, setBusy] = useState(false);

    if (!loggedIn) {
        return (
            <a href={`/login?next=/theme/${themeId}`} className={`${buttonClass} border-zinc-700 text-zinc-200 hover:bg-zinc-800`}>
                <Heart className="size-4" aria-hidden /> Log in to like
            </a>
        );
    }

    async function toggle() {
        setBusy(true);
        try {
            const res = await fetch(`/api/likes/${liked ? "remove" : "add"}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ themeId })
            });
            // 409 = already in that state (e.g. changed in another tab)
            if (res.ok || res.status === 409) {
                setLiked(!liked);
                router.refresh(); // updates the like count in the stats card
            }
        } finally {
            setBusy(false);
        }
    }

    return (
        <button
            onClick={toggle}
            disabled={busy}
            aria-pressed={liked}
            className={`${buttonClass} disabled:opacity-60 ${liked ? "border-pink-500/50 bg-pink-500/10 text-pink-300 hover:bg-pink-500/20" : "border-zinc-700 text-zinc-200 hover:bg-zinc-800"}`}
        >
            <Heart className={`size-4 ${liked ? "fill-current" : ""}`} aria-hidden /> {liked ? "Liked" : "Like Theme"}
        </button>
    );
}
