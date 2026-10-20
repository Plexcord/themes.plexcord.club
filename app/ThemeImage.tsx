"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

/** Fills a `relative` parent; falls back to a placeholder when there is no image or it fails to load. */
export default function ThemeImage({ src, alt }: { src: string | null; alt: string }) {
    const [broken, setBroken] = useState(false);

    if (!src || broken) {
        return (
            <div role="img" aria-label={`${alt} (no preview)`} className="flex size-full items-center justify-center bg-zinc-800 text-zinc-600">
                <ImageOff className="size-8" aria-hidden />
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
            onError={() => setBroken(true)}
        />
    );
}
