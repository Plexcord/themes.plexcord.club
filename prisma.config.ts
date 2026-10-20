import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env itself; the CLI needs DATABASE_URL for migrate.
try {
    process.loadEnvFile();
} catch {
    // no .env file: rely on the real environment
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: { path: "prisma/migrations" },
    // optional so `prisma generate` (postinstall) works without a database; migrate fails clearly if it is missing
    datasource: { url: process.env.DATABASE_URL ?? "" }
});
