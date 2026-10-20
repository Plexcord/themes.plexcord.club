"use server";

import { revalidatePath } from "next/cache";
import { sessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { removeUpload } from "@/lib/storage";
import { parseThemeId } from "@/lib/themes";

// Server actions are public POST endpoints: every action re-checks admin rights itself.
async function adminThemeId(form: FormData): Promise<number> {
    const user = await sessionUser();
    if (!user || !isAdmin(user.id)) throw new Error("Forbidden");
    const id = parseThemeId(form.get("id"));
    if (id === null) throw new Error("Invalid theme id");
    return id;
}

export async function approveTheme(form: FormData) {
    const id = await adminThemeId(form);
    await prisma.theme.update({ where: { id }, data: { status: "APPROVED", releaseDate: new Date() } });
    revalidatePath("/admin");
}

export async function rejectTheme(form: FormData) {
    const id = await adminThemeId(form);
    await prisma.theme.update({ where: { id }, data: { status: "REJECTED" } });
    revalidatePath("/admin");
}

export async function deleteTheme(form: FormData) {
    const id = await adminThemeId(form);
    const theme = await prisma.theme.delete({ where: { id } });
    await Promise.all([removeUpload("themes", theme.contentFile), removeUpload("thumbnails", theme.thumbnail)]);
    revalidatePath("/admin");
}
