# Self-hosting shaostassen.com

The site is a static export — `output: 'export'`, no server runtime, no
middleware, no route handlers. Publishing it is copying a directory. This
document is what has to be true of the server for that directory to serve
correctly, and how to cut over without downtime.

## Before you start: what this does and does not save

Self-hosting saves **$0/yr** on its own. Vercel Hobby is already free, and
AWS's only role today is DNS (~$6/yr for the Route 53 hosted zone) and the
registrar (~$14/yr for the domain). Moving the files to your own box does
not touch either.

| | today | self-hosted |
|---|---|---|
| hosting | Vercel, $0 | your server |
| DNS | Route 53, ~$6/yr | still needs DNS |
| domain | ~$14/yr | ~$14/yr |
| TLS | automatic | you own renewal |
| deploys | push to main | `pnpm deploy` |
| CDN | global | one machine |

If the goal is purely **domain-only cost**, moving DNS to Cloudflare (free)
and staying on Vercel gets there with none of the work below. Self-host
because you want the control, not because it is cheaper.

What you do gain, beyond control: the OG cards get served as `image/png`.
Vercel serves them `application/octet-stream` today, because Next writes them
without a file extension and there is no `vercel.json` to override the type.
The configs here fix that.

## What the server has to do

Four rules. They are not optional — each one is a way the site breaks that
does not show up until it is live. `scripts/serve-static.mjs` is the
reference implementation, `tests/hosting.spec.ts` is the executable
specification, and both `deploy/Caddyfile` and `deploy/nginx.conf` implement
the same thing.

1. **Clean URLs.** The site links to `/about`; the export contains
   `about.html`. Without an `.html` fallback, every internal link 404s.
2. **Real 404 status.** `404.html` must return 404, not 200, or crawlers
   index a not-found page as real content.
3. **Explicit type for the OG cards.** The seven generated cards live at
   `/opengraph-image` and `/projects/*/opengraph-image` with no extension.
   Typed by extension they are `application/octet-stream`.
4. **Range requests.** The Super Gold Hunters video is 2.6 MB; without
   `Accept-Ranges: bytes` a viewer cannot seek.

Plus cache policy: `/_next/static/*` is content-hashed and immutable; HTML
must revalidate or a deploy never reaches a warm cache.

You can see all of it locally:

```sh
pnpm build
pnpm preview          # serves out/ with exactly the production ruleset
```

## Setup

### 1. Put the files somewhere

```sh
sudo mkdir -p /srv/shaostassen.com
sudo chown "$USER" /srv/shaostassen.com
```

### 2. Install a web server

**Caddy is recommended** — it obtains and renews Let's Encrypt certificates
on its own, which is the largest thing Vercel was doing for free.

```sh
# Debian/Ubuntu — see https://caddyserver.com/docs/install for other systems
sudo apt install -y caddy
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile   # syntax check
sudo systemctl reload caddy
```

**nginx** if you already run it. It does not do certificates itself:

```sh
sudo cp deploy/nginx.conf /etc/nginx/sites-available/shaostassen.com
sudo ln -s /etc/nginx/sites-available/shaostassen.com /etc/nginx/sites-enabled/
sudo nginx -t                                       # syntax check
sudo certbot --nginx -d shaostassen.com -d www.shaostassen.com
sudo systemctl reload nginx
```

### 3. Make the box reachable

Pick based on what the machine is.

**Home machine behind NAT — use a Cloudflare Tunnel.** No ports opened, no
static IP needed, works behind CGNAT, and your home IP is never published.
This is the right answer for a residential connection, where forwarding
80/443 also tends to violate the ISP's terms.

```sh
cloudflared tunnel login
cloudflared tunnel create shaostassen
cloudflared tunnel route dns shaostassen shaostassen.com
# point the tunnel at the local server, then:
sudo cloudflared service install
```

With a tunnel, Cloudflare terminates TLS at its edge, so Caddy can serve
plain HTTP on localhost and you can drop the `Strict-Transport-Security`
line from the Caddyfile (Cloudflare sets it).

**VPS with a public IP** — open 80/443 and point DNS straight at it.

**Home machine with port forwarding** — possible, but you are publishing
your home IP, you need DDNS if the IP is dynamic, and CGNAT breaks it
entirely. Prefer the tunnel.

### 4. Configure deploys

```sh
cp .env.deploy.example .env.deploy   # gitignored
```

```sh
DEPLOY_HOST=shao@your-server
DEPLOY_PATH=/srv/shaostassen.com
DEPLOY_PORT=22
```

Then:

```sh
pnpm deploy --dry-run   # show what would change, transfer nothing
pnpm deploy             # full gate, rsync, then verify the live site
```

`pnpm deploy` runs the whole `validate` gate first, refuses to publish if the
cloud-sync duplicate files are present in `out/`, rsyncs with `--delete` so
removed pages actually disappear, and then curls the live host to check the
home page, a clean URL, a case study, the 404 status, and the OG card's
content type. It exits non-zero if any of those are wrong.

## Cutting over from Vercel

Do it in this order so there is no window where the domain points at a box
that is not serving yet.

1. **Deploy first, verify by IP or a temporary hostname.** Do not touch DNS
   until `curl` against the server returns the right thing. Point
   `DEPLOY_VERIFY_URL` at the temporary host so `pnpm deploy` checks the
   right place:
   ```sh
   DEPLOY_VERIFY_URL=https://box.example.net pnpm deploy
   ```
2. **Lower the DNS TTL** on the apex and `www` records to 300s and wait for
   the old TTL to expire. This is what makes step 4 reversible in minutes
   rather than hours.
3. **Switch the records** to the server (or create the tunnel route).
4. **Verify against the real domain**, then raise the TTL back.
5. **Leave the Vercel project in place** for a week. It costs nothing and it
   is the rollback.

Rollback is step 3 in reverse: point the records back at Vercel
(`76.76.21.21` apex, the project's CNAME for `www`). Because the site is a
static export with no state anywhere, there is nothing to migrate back — the
two hosts serve identical bytes.

## What you take on

- **Certificate renewal.** Caddy handles it; with nginx, confirm the certbot
  timer is enabled (`systemctl list-timers | grep certbot`). A silently
  failed renewal takes the whole site down 90 days later.
- **Uptime and patching.** No one else is watching the box.
- **Bandwidth.** The export is ~22 MB, most of it photos, plus the 2.6 MB
  video.
- **CI no longer deploys.** `.github/workflows/ci.yml` is a signal, not a
  deploy step. `pnpm deploy` is now the only thing that publishes, and it
  runs from your machine. If you want push-to-deploy back, the same rsync
  can move into CI behind an SSH deploy key.

## Keeping the configs honest

`scripts/serve-static.mjs` and the two configs in `deploy/` say the same
thing three times, which is three chances to drift. The suite tests the
first one. After changing any of them, run:

```sh
pnpm build && PLAYWRIGHT_NO_BUILD=1 pnpm exec playwright test tests/hosting.spec.ts
```

and syntax-check the real config on the server (`caddy validate` /
`nginx -t`). Those two commands are the only place the Caddy and nginx files
are verified — they are not exercised by the local suite, because neither
binary is installed on this machine.
