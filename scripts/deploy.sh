#!/usr/bin/env bash
#
# Build, gate, and publish the static export to a self-hosted server.
#
#   pnpm deploy
#
# Configure with environment variables (put them in .env.deploy, which is
# gitignored, and this script will source it):
#
#   DEPLOY_HOST   ssh target, e.g. shao@192.168.1.20 or shao@myserver
#   DEPLOY_PATH   document root on the server, e.g. /srv/shaostassen.com
#   DEPLOY_PORT   ssh port (default 22)
#
# Flags:
#   --skip-gate   publish without re-running validate (use only when the
#                 gate has just passed; the whole point is not to ship red)
#   --dry-run     show exactly what rsync would change, transfer nothing
set -euo pipefail

cd "$(dirname "$0")/.."

[ -f .env.deploy ] && . ./.env.deploy

: "${DEPLOY_HOST:?set DEPLOY_HOST (e.g. shao@server) in .env.deploy or the environment}"
: "${DEPLOY_PATH:?set DEPLOY_PATH (e.g. /srv/shaostassen.com) in .env.deploy or the environment}"
DEPLOY_PORT="${DEPLOY_PORT:-22}"

skip_gate=false
dry_run=false
for arg in "$@"; do
  case "$arg" in
    --skip-gate) skip_gate=true ;;
    --dry-run)   dry_run=true ;;
    *) echo "unknown flag: $arg" >&2; exit 2 ;;
  esac
done

if [ "$skip_gate" = false ]; then
  echo "==> validate"
  # Builds out/ as part of the gate, so no separate build step below.
  pnpm validate
else
  echo "==> validate skipped; building only"
  pnpm build
fi

[ -d out ] || { echo "out/ missing after build" >&2; exit 1; }

# The cloud-synced working directory clones build artifacts as 'name 2.ext'.
# Shipping those would publish duplicate, stale pages.
dupes=$(find out -name "* [0-9]" -o -name "* [0-9].*" | head -5)
if [ -n "$dupes" ]; then
  echo "refusing to deploy: cloud-sync duplicates present in out/" >&2
  echo "$dupes" >&2
  echo "fix: rm -rf .next out && pnpm build" >&2
  exit 1
fi

echo "==> publishing to $DEPLOY_HOST:$DEPLOY_PATH"

rsync_flags=(
  --archive             # preserve times/permissions
  --compress
  --human-readable
  --delete              # remove files the build no longer produces
  --checksum            # content, not mtime — the sync layer rewrites mtimes
  --itemize-changes
)
[ "$dry_run" = true ] && rsync_flags+=(--dry-run)

rsync "${rsync_flags[@]}" \
  -e "ssh -p $DEPLOY_PORT" \
  out/ "$DEPLOY_HOST:$DEPLOY_PATH/"

if [ "$dry_run" = true ]; then
  echo "==> dry run only; nothing transferred"
  exit 0
fi

echo "==> verifying the live site"
# Ask the real host, not a cache, and check the things a bad deploy breaks.
fail=0
check() { # url expected_status label
  actual=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$1" || echo "000")
  if [ "$actual" = "$2" ]; then
    printf '    ok   %-46s %s\n' "$3" "$actual"
  else
    printf '    FAIL %-46s got %s, want %s\n' "$3" "$actual" "$2"; fail=1
  fi
}
base="${DEPLOY_VERIFY_URL:-https://shaostassen.com}"
check "$base/"                     200 "home"
check "$base/about"                200 "clean URL"
check "$base/projects/fast-robots" 200 "case study"
check "$base/no-such-page"         404 "404 status"

ct=$(curl -sS -o /dev/null -w "%{content_type}" --max-time 15 "$base/opengraph-image" || true)
if [ "$ct" = "image/png" ]; then
  printf '    ok   %-46s %s\n' "og card content-type" "$ct"
else
  printf '    FAIL %-46s got %s, want image/png\n' "og card content-type" "$ct"; fail=1
fi

[ "$fail" -eq 0 ] && echo "==> deployed" || { echo "==> deployed, but checks failed" >&2; exit 1; }
