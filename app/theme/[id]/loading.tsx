// shortcut: this Suspense boundary makes a missing theme stream the 404 card with HTTP 200 (+ noindex); delete this file if real 404 status codes matter.
const block ="animate-pulse rounded-2xl bg-zinc-800/60";

export default function Loading() {
    return (
        <div className="grid gap-8 lg:grid-cols-3" aria-busy="true" aria-label="Loading theme">
            <div className="space-y-8 lg:col-span-2">
                <div className="space-y-3">
                    <div className={`h-10 w-1/2 ${block}`} />
                    <div className={`h-5 w-3/4 ${block}`} />
                </div>
                <div className={`aspect-video ${block}`} />
                <div className={`h-64 ${block}`} />
            </div>
            <div className="space-y-6">
                <div className={`h-40 ${block}`} />
                <div className={`h-44 ${block}`} />
                <div className={`h-28 ${block}`} />
            </div>
        </div>
    );
}
