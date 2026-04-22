#!/usr/bin/env bash
set -euo pipefail

# Generate README.md with top 25 @depup packages by monthly downloads
# Usage: ./generate.sh

TOP_N=25
TODAY=$(date +%Y-%m-%d)

echo "Fetching @depup package list..."
PACKAGES=$(npm search @depup --json 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
for p in sorted(data, key=lambda x: x['name']):
    if p['name'].startswith('@depup/'):
        print(p['name'].split('/')[1])
")

TOTAL_PKGS=$(echo "$PACKAGES" | wc -l | tr -d ' ')
echo "Found $TOTAL_PKGS packages"

# Collect stats for each package
declare -a ROWS=()
TOTAL_W=0
TOTAL_M=0
TOTAL_Y=0
CURRENT=0
BEHIND=0

for pkg in $PACKAGES; do
  echo "  Fetching stats for @depup/$pkg..."
  w=$(curl -sf "https://api.npmjs.org/downloads/point/last-week/@depup/$pkg" | python3 -c "import json,sys; print(json.load(sys.stdin).get('downloads',0))" 2>/dev/null || echo 0)
  m=$(curl -sf "https://api.npmjs.org/downloads/point/last-month/@depup/$pkg" | python3 -c "import json,sys; print(json.load(sys.stdin).get('downloads',0))" 2>/dev/null || echo 0)
  y=$(curl -sf "https://api.npmjs.org/downloads/point/last-year/@depup/$pkg" | python3 -c "import json,sys; print(json.load(sys.stdin).get('downloads',0))" 2>/dev/null || echo 0)
  ver=$(npm view "@depup/$pkg" version 2>/dev/null || echo "unknown")
  upstream=$(npm view "$pkg" version 2>/dev/null || echo "unknown")

  # Determine status by comparing base version (strip -depup.N suffix)
  base=$(echo "$ver" | sed 's/-depup\..*//')
  if [ "$base" = "$upstream" ]; then
    status="Current"
    CURRENT=$((CURRENT + 1))
  else
    status="Behind"
    BEHIND=$((BEHIND + 1))
  fi

  TOTAL_W=$((TOTAL_W + w))
  TOTAL_M=$((TOTAL_M + m))
  TOTAL_Y=$((TOTAL_Y + y))

  # Format zeros as --
  w_fmt=$( [ "$w" -eq 0 ] && echo "--" || echo "$w" )
  m_fmt=$( [ "$m" -eq 0 ] && echo "--" || echo "$m" )
  y_fmt=$( [ "$y" -eq 0 ] && echo "--" || echo "$y" )

  ROWS+=("$m|$pkg|$w_fmt|$m_fmt|$y_fmt|$ver|$upstream|$status")
done

# Sort by monthly downloads descending, take top N
IFS=$'\n' SORTED=($(printf '%s\n' "${ROWS[@]}" | sort -t'|' -k1 -nr | head -n "$TOP_N"))
unset IFS

# Format totals with commas
fmt_total_w=$(printf "%'d" "$TOTAL_W")
fmt_total_m=$(printf "%'d" "$TOTAL_M")
fmt_total_y=$(printf "%'d" "$TOTAL_Y")

SHOWING=${#SORTED[@]}
if [ "$TOTAL_PKGS" -gt "$TOP_N" ]; then
  HEADING="Top $TOP_N Packages by Monthly Downloads"
else
  HEADING="All Packages by Monthly Downloads"
fi

# Generate README
cat > README.md <<EOF
# @depup npm Stats

Download statistics for packages published under the \`@depup\` scope.

Last updated: $TODAY

## $HEADING

| # | Package | Weekly | Monthly | Yearly | @depup Version | Upstream Version | Status |
|---|---------|-------:|--------:|-------:|----------------|------------------|--------|
EOF

rank=1
for row in "${SORTED[@]}"; do
  IFS='|' read -r _sort pkg w m y ver upstream status <<< "$row"
  echo "| $rank | [@depup/$pkg](https://www.npmjs.com/package/@depup/$pkg) | $w | $m | $y | $ver | $upstream | $status |" >> README.md
  rank=$((rank + 1))
done

cat >> README.md <<EOF

## Summary

| Metric | Value |
|--------|------:|
| Total packages published | $TOTAL_PKGS |
| Packages shown above | $SHOWING |
| Total weekly downloads | $fmt_total_w |
| Total monthly downloads | $fmt_total_m |
| Total yearly downloads | $fmt_total_y |
| Packages current with upstream | $CURRENT |
| Packages behind upstream | $BEHIND |

## Notes

- Stats sourced from the [npm registry API](https://api.npmjs.org/)
- "Current" means the @depup base version matches the upstream latest
- "Behind" means upstream has released a newer version
- \`--\` indicates no data available from npm API for that period
- Table shows top $TOP_N packages when more than $TOP_N are published; summary covers all packages
EOF

echo ""
echo "Generated README.md with $SHOWING packages (of $TOTAL_PKGS total)"
