import { randomBytes } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");
export type UploadKind = "themes" | "thumbnails";

// basename() everywhere: stored names never contain directories, so this blocks traversal.
const uploadPath = (kind: UploadKind, file: string) => path.join(UPLOAD_ROOT, kind, path.basename(file));

const slug = (name: string) =>
    name.normalize("NFKD").replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 48) || "theme";

export async function saveUpload(kind: UploadKind, name: string, ext: string, data: Buffer | string): Promise<string> {
    await mkdir(path.join(UPLOAD_ROOT, kind), { recursive: true });
    const file = `${slug(name)}_${randomBytes(6).toString("hex")}.${ext}`;
    await writeFile(uploadPath(kind, file), data);
    return file;
}

export async function readUpload(kind: UploadKind, file: string): Promise<Buffer | null> {
    try {
        return await readFile(uploadPath(kind, file));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
        console.error(`Missing upload: ${kind}/${file}`);
        return null;
    }
}

export async function removeUpload(kind: UploadKind, file: string | null): Promise<void> {
    if (!file) return;
    await unlink(uploadPath(kind, file)).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") console.error(`Failed to delete ${kind}/${file}`, error);
    });
}

/** Converts any supported image (png/jpg/gif/webp/avif, animated too) to a ≤1280x720 WebP. Throws on invalid input. */
export function toWebp(input: Buffer): Promise<Buffer> {
    return sharp(input, { animated: true, limitInputPixels: 40_000_000 })
        .rotate()
        .resize({ width: 1280, height: 720, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
}
