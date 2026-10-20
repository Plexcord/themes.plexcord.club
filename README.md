# themes.plexcord.club

The theme and snippet library for [Plexcord](https://plexcord.club). Browse, preview and download community-made Discord themes, or submit your own.

**Live site:** [themes.plexcord.club](https://themes.plexcord.club)

The API is the one Plexcord's **ThemeLibrary** plugin talks to: themes, likes, submissions and Discord login.

## Features

- **Browse and search** themes and snippets, each with its own page: preview, CSS source, stats and authors.
- **Discord login**, used for submitting themes and liking them, on the website and from the client plugin.
- **Submissions with review.** Theme details are read from the CSS header. Thumbnails are converted to WebP. Nothing goes live until an admin approves it.
- **Admin panel** to approve, reject and delete themes, with download, like, user and plugin statistics and a recent activity feed.
- **Self-hosted.** Runs on one Debian server with MySQL/MariaDB. Uploads are stored on local disk, so no CDN, S3 or PM2 is needed.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Framer Motion, Prisma 7, sharp and Discord OAuth2.

## Getting started

Requirements: Node.js `^20.19 || ^22.12 || >=24`, and MySQL or MariaDB.

```bash
git clone https://github.com/Plexcord/themes.plexcord.club.git
cd themes.plexcord.club
cp .env.example .env        # fill it in, see Configuration
npm install
npm run db:migrate          # creates the tables
npm run dev                 # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Generates the Prisma client and builds for production |
| `npm start` | Production server on `127.0.0.1:8254` |
| `npm test` | Unit tests for the parsers and session checks |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Creates and applies migrations (development) |
| `npm run db:deploy` | Applies migrations (production) |

## Configuration

Copy `.env.example` to `.env`. The `.env` file is git-ignored, and no secret is hardcoded in the source.

| Variable | |
|---|---|
| `SITE_URL` | `https://themes.plexcord.club` (no trailing slash) |
| `DATABASE_URL` | `mysql://user:pass@127.0.0.1:3306/db`. URL-encode special characters in the password. |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | From the [Discord developer portal](https://discord.com/developers/applications) |
| `SESSION_SECRET` | At least 32 characters: `openssl rand -hex 32` |
| `ADMIN_DISCORD_IDS` | Comma-separated Discord user IDs that can open `/admin` |

In the Discord application, go to **OAuth2 → Redirects** and add `SITE_URL` followed by `/api/user/auth`.

## API

All responses carry `Access-Control-Allow-Origin: *`, because the client mod calls the API from `discord.com`. Errors use the shape `{ "status": number, "message": string }`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/themes`, `/themes` | – | All approved themes (`Cache-Control: public, max-age=1200`) |
| GET | `/api/get/:idOrName` | – | One theme, same shape |
| GET | `/api/:idOrName` | – | Raw CSS (`text/css`) |
| GET | `/api/thumbnail/:idOrName` | – | Thumbnail image (`image/webp`) |
| GET | `/api/download/:idOrName` | – | CSS as attachment, `downloads + 1` |
| GET | `/api/likes/get` | optional Bearer | `{ status, likes: [{ themeId, likes, hasLiked? }] }` |
| POST | `/api/likes/add` · `/api/likes/remove` | Bearer | Body `{ "themeId": number }` |
| POST | `/api/submit/theme` | Bearer or session | Body `{ "content": base64 CSS, "thumbnail"?: base64 image }`, stored as `PENDING` |
| GET | `/api/user/auth?code=…` | – | Discord OAuth2 redirect target, returns `{ token }` |
| GET/POST | `/api/user/findUserByToken` | Bearer (or body `{ token }`) | `{ status, user }` |
| DELETE | `/api/user/revoke` | Bearer | Revokes all tokens of the user |

A theme object has these fields: `id, name, type, description, author, tags, thumbnail_url, release_date, last_updated?, guild, content (base64), source, likes, downloads, version?, requiresThemeAttributes?`. When a theme has more than one author, `author` is an array.

### Theme header

The submitter's Discord account and linked GitHub account become the author. Every other field is read from the comment at the top of the CSS:

```css
/**
 * @name My Theme              (required, unique)
 * @description What it does   (required)
 * @version 1.0.0
 * @source https://github.com/me/my-theme
 * @invite abc123              (Discord invite: adds the server to the theme page)
 * @type snippet               (default: theme)
 * @tags dark, minimal
 */
```

## Admin panel

Open `/login?next=/admin` and log in with an account listed in `ADMIN_DISCORD_IDS`. Everyone else gets `401` (not logged in) or `403` (not an admin). `proxy.ts` enforces this, and every admin action checks it again.

The panel shows totals and today's numbers (UTC) for downloads, likes, users and connected plugin users. It also lists the top themes and recent activity, including likes that were later removed. Below that is the moderation queue.

## Deploying on Debian + HestiaCP

1. Create a MySQL database in HestiaCP.
2. Clone the repo into the domain's `public_html` (`/home/USER/web/themes.plexcord.club/public_html`) as that user, not root. This is safe only with the proxy template from step 5, because that template never serves files from disk.
3. Build:

   ```bash
   cp .env.example .env   # fill in
   npm ci
   npm run db:deploy
   npm run build
   ```

4. Install the systemd service. Before copying, set `User`, `Group` and the paths in the file:

   ```bash
   sudo cp deploy/plexcord-themes.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now plexcord-themes
   journalctl -u plexcord-themes -f
   ```

5. Install the HestiaCP proxy template. It sends every request to `127.0.0.1:8254`.

   ```bash
   # nginx + apache: web/nginx/   ·   nginx only (php-fpm): web/nginx/php-fpm/
   sudo cp deploy/hestia/plexcord-themes.tpl deploy/hestia/plexcord-themes.stpl /usr/local/hestia/data/templates/web/nginx/
   ```

   In HestiaCP, go to **Web → themes.plexcord.club → Advanced Options**. Set **Proxy Template** to `plexcord-themes` (on nginx-only setups, set **Web Template** instead). Then enable SSL and Let's Encrypt. The template needs nginx 1.25.1 or newer, for `http2 on;`.

To update:

```bash
git pull && npm ci && npm run db:deploy && npm run build && sudo systemctl restart plexcord-themes
```

Uploads are stored in `public/uploads/themes` (CSS) and `public/uploads/thumbnails` (WebP). Back up that folder together with the database.

## Contributing

Issues and pull requests are welcome. Before you open a PR, run `npm run typecheck` and `npm test`, and make sure `npm run build` passes.

## Credits

- Each theme belongs to its author. The theme page links to the author's profile and to the original source.
