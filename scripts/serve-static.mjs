#!/usr/bin/env node
/**
 * The reference static server for `out/`.
 *
 * This is the single definition of what a host has to do to serve this site
 * correctly. `deploy/Caddyfile` and `deploy/nginx.conf` implement the same
 * rules for real deployments; this implementation is the one the Playwright
 * suite runs against, so the rules are executable and tested rather than
 * described in a comment somewhere.
 *
 * Four things a naive static server gets wrong here:
 *
 *  1. **Clean URLs.** The site links to `/about`, the export contains
 *     `about.html`. Without an `.html` fallback every internal link 404s.
 *  2. **404 status.** `404.html` has to come back with status 404, not 200,
 *     or crawlers index a not-found page.
 *  3. **Extensionless images.** Next writes the seven generated OG cards as
 *     `…/opengraph-image` with no extension. Guessed by extension they are
 *     `application/octet-stream`, which is exactly what production serves
 *     today and what some scrapers refuse.
 *  4. **Range requests.** The case-study video is 2.6 MB; without
 *     `Accept-Ranges` a viewer cannot seek.
 *
 * Usage: node scripts/serve-static.mjs [--port 4173] [--dir out]
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const PORT = Number(flag("port", process.env.PORT ?? 4173));
const ROOT = path.resolve(flag("dir", "out"));

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".pdf": "application/pdf",
};

/**
 * Security headers. A static site with no user input and no cookies has a
 * small attack surface, but these are free and two of them (nosniff,
 * frame-ancestors) genuinely matter.
 *
 * On CSP: `script-src` keeps 'unsafe-inline' because Next's static export
 * emits the RSC payload and the pre-paint theme script as inline <script>
 * blocks whose contents change every build — hashing them would mean
 * regenerating this list on each build. Allowing inline script while still
 * pinning every *origin* to 'self' blocks the realistic attack (a foreign
 * script being injected or a dependency phoning home) and is a large
 * improvement over shipping no CSP at all, which is where the site is today.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "media-src 'self'",
  "connect-src 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = {
  "Content-Security-Policy": CSP,
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
};

/** Content-hashed by the build, so it can never go stale at a given URL. */
const IMMUTABLE = "public, max-age=31536000, immutable";
/** Stable filenames whose bytes could change — cache, but revalidate daily. */
const MEDIA = "public, max-age=86400";
/** HTML must revalidate or a deploy does not reach anyone holding a copy. */
const DOCUMENT = "public, max-age=0, must-revalidate";

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext) return MIME[ext] ?? "application/octet-stream";
  // Extensionless: the generated OG cards. Sniff rather than assume, so a
  // future extensionless artifact of another type is not mislabelled.
  const head = Buffer.alloc(8);
  const fd = fs.openSync(filePath, "r");
  try {
    fs.readSync(fd, head, 0, 8, 0);
  } finally {
    fs.closeSync(fd);
  }
  if (
    head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";
  return "application/octet-stream";
}

function cacheControl(urlPath, type) {
  if (urlPath.startsWith("/_next/static/")) return IMMUTABLE;
  if (type.startsWith("text/html")) return DOCUMENT;
  if (type.startsWith("image/") || type.startsWith("video/")) return MEDIA;
  if (type.startsWith("font/")) return IMMUTABLE;
  return DOCUMENT;
}

/** Resolve a URL path to a file inside ROOT, or null. Never escapes ROOT. */
function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const candidates = clean.endsWith("/")
    ? [`${clean}index.html`]
    : [clean, `${clean}.html`, `${clean}/index.html`];

  for (const candidate of candidates) {
    const full = path.join(ROOT, candidate);
    // Path traversal guard: the resolved path must stay under ROOT.
    if (full !== ROOT && !full.startsWith(ROOT + path.sep)) continue;
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return full;
  }
  return null;
}

function send(res, status, headers, body) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  if (body) res.end(body);
  else res.end();
}

const server = http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { Allow: "GET, HEAD" }, "Method Not Allowed");
  }

  const filePath = resolve(req.url);

  if (!filePath) {
    const notFound = path.join(ROOT, "404.html");
    const body = fs.existsSync(notFound)
      ? fs.readFileSync(notFound)
      : "Not Found";
    return send(
      res,
      404,
      {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
      req.method === "HEAD" ? undefined : body,
    );
  }

  const stat = fs.statSync(filePath);
  const type = contentType(filePath);
  const base = {
    "Content-Type": type,
    "Cache-Control": cacheControl(req.url, type),
    "Last-Modified": stat.mtime.toUTCString(),
    "Accept-Ranges": "bytes",
  };

  // Range support — without it the case-study video cannot be seeked.
  const range = req.headers.range;
  const match = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (match) {
    const size = stat.size;
    let start = match[1] === "" ? undefined : Number(match[1]);
    let end = match[2] === "" ? undefined : Number(match[2]);
    if (start === undefined) {
      // suffix range: last N bytes
      start = end === undefined ? 0 : Math.max(0, size - end);
      end = size - 1;
    } else if (end === undefined) {
      end = size - 1;
    }
    if (start > end || start >= size) {
      return send(res, 416, { "Content-Range": `bytes */${size}` }, "");
    }
    res.writeHead(206, {
      ...SECURITY_HEADERS,
      ...base,
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Content-Length": end - start + 1,
    });
    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(filePath, { start, end }).pipe(res);
  }

  res.writeHead(200, {
    ...SECURITY_HEADERS,
    ...base,
    "Content-Length": stat.size,
  });
  if (req.method === "HEAD") return res.end();
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  console.log(
    `serving ${path.relative(process.cwd(), ROOT)} on http://localhost:${PORT}`,
  );
});
