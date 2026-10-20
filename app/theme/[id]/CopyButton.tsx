"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

// Reads the code from the DOM instead of a prop so the CSS isn't sent to the client twice.
export default function CopyButton({ targetId }: { targetId: string }) {
    const [copied, setCopied] = useState(false);

    async function copy() {
        await navigator.clipboard.writeText(document.getElementById(targetId)?.textContent ?? "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <button
            onClick={copy}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
            {copied ? <Check className="size-3.5 text-emerald-400" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            <span aria-live="polite">{copied ? "Copied!" : "Copy Code"}</span>
        </button>
    );
}
