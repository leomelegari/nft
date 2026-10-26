#!/usr/bin/env bash
# Converts a source PNG/JPG to a width-capped WebP.
# Figma exports artwork at ~1254px; the largest on-screen box is 450px, so a
# 900px source covers 2x displays with room to spare.
#
# Usage: scripts/optimize-images.sh <src> <dest.webp> [max-width] [quality]
set -euo pipefail

src="$1"
dest="$2"
max_width="${3:-900}"
quality="${4:-82}"

tmp="$(mktemp -t kurio-img).png"
cp "$src" "$tmp"
sips --resampleWidth "$max_width" "$tmp" --out "$tmp" >/dev/null
cwebp -quiet -q "$quality" "$tmp" -o "$dest"
rm -f "$tmp"

printf '%s  %sK -> %sK\n' "$(basename "$dest")" \
  "$(( $(wc -c <"$src") / 1024 ))" "$(( $(wc -c <"$dest") / 1024 ))"
