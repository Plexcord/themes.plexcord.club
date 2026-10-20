"use client";

import { AlertTriangle, CheckCircle2, FileCode2, ImagePlus, Loader2, X, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { parseMeta, type ThemeMeta } from "@/lib/meta";

const MAX_CSS = 2 * 1024 * 1024;
const MAX_IMAGE = 5 * 1024 * 1024;

const size = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

function toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/** Click or drop a file: the invisible input covers the whole zone, so native drag & drop just works. */
function DropZone(props: { icon: LucideIcon; title: string; hint: string; accept: string; onFile: (file: File) => void; children?: ReactNode }) {
    const Icon = props.icon;
    return (
        <div className="relative rounded-xl border border-dashed border-zinc-700 bg-zinc-950/40 transition-colors hover:border-brand-purple/60 hover:bg-zinc-950/70 has-[input:focus-visible]:border-brand-purple has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-purple/30">
            <input
                type="file"
                accept={props.accept}
                aria-label={props.title}
                className="absolute inset-0 size-full cursor-pointer opacity-0"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    e.target.value = ""; // allow picking the same file again
                    if (file) props.onFile(file);
                }}
            />
            {props.children ?? (
                <div className="pointer-events-none flex flex-col items-center gap-2 px-6 py-10 text-center">
                    <Icon className="size-8 text-zinc-500" aria-hidden />
                    <p className="text-sm font-medium text-zinc-200">{props.title}</p>
                    <p className="text-xs text-zinc-500">{props.hint}</p>
                </div>
            )}
        </div>
    );
}

function FileRow({ icon: Icon, name, bytes, onRemove }: { icon: LucideIcon; name: string; bytes: number; onRemove: () => void }) {
    return (
        <div className="pointer-events-none relative z-10 flex items-center gap-3 p-4">
            <Icon className="size-5 shrink-0 text-brand-purple-light" aria-hidden />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-zinc-500">{size(bytes)} · click or drop to replace</p>
            </div>
            <button type="button" onClick={onRemove} className="pointer-events-auto rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100" aria-label={`Remove ${name}`}>
                <X className="size-4" aria-hidden />
            </button>
        </div>
    );
}

export default function SubmitForm() {
    const [css, setCss] = useState<{ file: File; meta: ThemeMeta } | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [submitted, setSubmitted] = useState<string | null>(null);

    useEffect(() => {
        if (!image) return setPreview(null);
        const url = URL.createObjectURL(image);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [image]);

    async function pickCss(file: File) {
        setError(null);
        if (file.size > MAX_CSS) return setError(`${file.name} is ${size(file.size)}. The limit is 2 MB.`);
        setCss({ file, meta: parseMeta(await file.text()) });
    }

    function pickImage(file: File) {
        setError(null);
        if (!file.type.startsWith("image/")) return setError(`${file.name} is not an image.`);
        if (file.size > MAX_IMAGE) return setError(`${file.name} is ${size(file.size)}. The limit is 5 MB.`);
        setImage(file);
    }

    function reset() {
        setCss(null);
        setImage(null);
        setError(null);
        setSubmitted(null);
    }

    const missing = css ? (["name", "description"] as const).filter(key => !css.meta[key]) : [];

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!css || missing.length) return;
        setBusy(true);
        setError(null);
        try {
            const res = await fetch("/api/submit/theme", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: await toBase64(css.file), thumbnail: image ? await toBase64(image) : undefined })
            });
            const data = (await res.json()) as { message?: string };
            if (res.ok) setSubmitted(css.meta.name ?? css.file.name);
            else setError(data.message ?? `Upload failed (${res.status})`);
        } catch {
            setError("Upload failed. Check your connection and try again.");
        } finally {
            setBusy(false);
        }
    }

    if (submitted) {
        return (
            <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                <CheckCircle2 className="mx-auto size-10 text-emerald-400" aria-hidden />
                <p className="mt-3 text-lg font-semibold">“{submitted}” was submitted</p>
                <p className="mt-1 text-sm text-zinc-400">It will show up on the site once a moderator approves it.</p>
                <button onClick={reset} className="mt-6 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/10">
                    Submit another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-3">
                <DropZone icon={FileCode2} title="Theme CSS" hint="Drop a .css file here or click to browse (max 2 MB)" accept=".css,text/css" onFile={pickCss}>
                    {css && <FileRow icon={FileCode2} name={css.file.name} bytes={css.file.size} onRemove={() => setCss(null)} />}
                </DropZone>

                {css && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Read from the header</p>
                        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
                            {([
                                ["Name", css.meta.name],
                                ["Description", css.meta.description],
                                ["Version", css.meta.version],
                                ["Type", css.meta.type],
                                ["Tags", css.meta.tags.join(", ")]
                            ] as const).map(([label, value]) => (
                                <div key={label} className="contents">
                                    <dt className="text-zinc-500">{label}</dt>
                                    <dd className={value ? "text-zinc-200" : "text-zinc-600"}>{value || "—"}</dd>
                                </div>
                            ))}
                        </dl>
                        {missing.length > 0 && (
                            <p className="mt-4 flex gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-300">
                                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                                Add {missing.map(key => `@${key}`).join(" and ")} to the header comment at the top of the file.
                            </p>
                        )}
                    </div>
                )}
            </div>

            <DropZone icon={ImagePlus} title="Thumbnail (optional)" hint="PNG, JPG, GIF or WebP, 16:9 looks best (max 5 MB)" accept="image/*" onFile={pickImage}>
                {image && preview && (
                    <div className="pointer-events-none relative z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
                        <img src={preview} alt="Thumbnail preview" className="aspect-video w-full rounded-t-xl object-cover" />
                        <FileRow icon={ImagePlus} name={image.name} bytes={image.size} onRemove={() => setImage(null)} />
                    </div>
                )}
            </DropZone>

            {error && (
                <p role="alert" className="flex gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
                </p>
            )}

            <button
                disabled={!css || missing.length > 0 || busy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-purple px-5 py-3 font-semibold text-white transition-colors hover:bg-brand-purple/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
                {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {busy ? "Uploading…" : "Submit for review"}
            </button>
        </form>
    );
}
