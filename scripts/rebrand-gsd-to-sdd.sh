#!/usr/bin/env bash
##############################################################################
# rebrand-gsd-to-sdd.sh (for sdd-cc repo)
#
# Converts all G.S.D references to S.D.D in the IDE installer package.
# IDEMPOTENT — safe to re-run. Excludes itself from modification.
#
# USAGE:  bash scripts/rebrand-gsd-to-sdd.sh
# RUN AFTER:  git merge upstream-sync  (into main)
##############################################################################

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# Build literal strings via hex to avoid self-modification by sed
OLD_LC=$(printf '\x67\x73\x64')       # g-s-d
OLD_UC=$(printf '\x47\x53\x44')       # G-S-D
NEW_LC="sdd"
NEW_UC="SDD"

# The old framework directory name (hex-encoded to avoid self-match)
OLD_DIR=$(printf '\x67\x65\x74\x2d\x73\x68\x69\x74\x2d\x64\x6f\x6e\x65')  # get-shit-done
NEW_DIR="sdd"

# Old branding phrases (hex-encoded)
OLD_BRAND1=$(printf '\x47\x65\x74\x20\x53\x68\x69\x74\x20\x44\x6f\x6e\x65')  # Get Shit Done
OLD_BRAND2=$(printf '\x47\x65\x74\x20\x53\x74\x75\x66\x66\x20\x44\x6f\x6e\x65') # Get Stuff Done
NEW_BRAND="Spec-Driven Development"

SELF_NAME="rebrand-$(echo "${OLD_LC}")-to-${NEW_LC}.sh"

echo "=== ${NEW_UC}-CC Rebrand Script ==="
echo "Working in: $REPO_ROOT"

# ─── STEP 1: Rename directories ─────────────────────────────────────────────
echo ""
echo "[1/5] Renaming directories..."

# Rename get-shit-done/ → sdd/
if [ -d "${OLD_DIR}" ] && [ ! -d "${NEW_DIR}" ]; then
  echo "  ${OLD_DIR}/ -> ${NEW_DIR}/"
  mv "${OLD_DIR}" "${NEW_DIR}"
fi

# Rename commands/gsd/ → commands/sdd/
if [ -d "commands/${OLD_LC}" ] && [ ! -d "commands/${NEW_LC}" ]; then
  echo "  commands/${OLD_LC}/ -> commands/${NEW_LC}/"
  mv "commands/${OLD_LC}" "commands/${NEW_LC}"
fi

# Rename internal get-shit-done/commands/gsd/ if it exists
if [ -d "${NEW_DIR}/commands/${OLD_LC}" ] && [ ! -d "${NEW_DIR}/commands/${NEW_LC}" ]; then
  echo "  ${NEW_DIR}/commands/${OLD_LC}/ -> ${NEW_DIR}/commands/${NEW_LC}/"
  mv "${NEW_DIR}/commands/${OLD_LC}" "${NEW_DIR}/commands/${NEW_LC}"
fi

echo "  Done."

# ─── STEP 2: Rename files ───────────────────────────────────────────────────
echo ""
echo "[2/5] Renaming files..."

find . -not -path './.git/*' -not -path './node_modules/*' \
  -not -name "$SELF_NAME" \
  \( -name "*${OLD_LC}*" -o -name "*${OLD_UC}*" -o -name "*${OLD_DIR}*" \) \
  -type f 2>/dev/null | sort -r | while read -r path; do
  dir=$(dirname "$path")
  base=$(basename "$path")
  newbase=$(echo "$base" | sed "s/${OLD_DIR}/${NEW_DIR}/g; s/${OLD_LC}/${NEW_LC}/g; s/${OLD_UC}/${NEW_UC}/g")
  [ "$base" = "$newbase" ] && continue
  echo "  $path -> $dir/$newbase"
  mv "$path" "$dir/$newbase"
done

echo "  Done."

# ─── STEP 3: Replace content in all files ───────────────────────────────────
echo ""
echo "[3/5] Finding files with content to replace..."

grep -rl --include="*.md" --include="*.js" --include="*.cjs" \
  --include="*.json" --include="*.sh" --include="*.yml" --include="*.yaml" \
  -E "${OLD_LC}|${OLD_UC}|${OLD_DIR}" . 2>/dev/null \
  | grep -v '\.git/' | grep -v 'node_modules/' \
  | grep -v "$SELF_NAME" \
  | grep -v 'package-lock.json' \
  > /tmp/${NEW_LC}-cc-rebrand-files.txt || true

FCOUNT=$(wc -l < /tmp/${NEW_LC}-cc-rebrand-files.txt)
echo "  Found $FCOUNT files."

echo "  Replacing..."
while IFS= read -r file; do
  [ -z "$file" ] && continue

  # Branding phrases first (longest match first)
  sed -i \
    -e "s/${OLD_BRAND1}/${NEW_BRAND}/g" \
    -e "s/${OLD_BRAND2}/${NEW_BRAND}/g" \
    "$file"

  # Directory name: get-shit-done → sdd
  sed -i \
    -e "s/${OLD_DIR}-cc/@bhargavvc\/${NEW_LC}-cc/g" \
    -e "s/${OLD_DIR}/${NEW_DIR}/g" \
    "$file"

  # Targeted patterns
  sed -i \
    -e "s/${OLD_LC}:/${NEW_LC}:/g" \
    -e "s/${OLD_LC}-/${NEW_LC}-/g" \
    -e "s/_${OLD_LC}/_${NEW_LC}/g" \
    -e "s/${OLD_LC}_/${NEW_LC}_/g" \
    -e "s/\/${OLD_LC}\//\/${NEW_LC}\//g" \
    -e "s/\.${OLD_LC}\//\.${NEW_LC}\//g" \
    -e "s/\.${OLD_LC}\"/.${NEW_LC}\"/g" \
    -e "s/\.${OLD_LC}'/.${NEW_LC}'/g" \
    -e "s/\"${OLD_LC}\"/\"${NEW_LC}\"/g" \
    -e "s/'${OLD_LC}'/'${NEW_LC}'/g" \
    -e "s/@${OLD_LC}\//@${NEW_LC}\//g" \
    -e "s/${OLD_UC}_/${NEW_UC}_/g" \
    -e "s/\"${OLD_UC}\"/\"${NEW_UC}\"/g" \
    -e "s/'${OLD_UC}'/'${NEW_UC}'/g" \
    "$file"

  # Variable syntax: {{GSD_ARGS}} → {{SDD_ARGS}}
  sed -i \
    -e "s/{{${OLD_UC}_ARGS}}/{{${NEW_UC}_ARGS}}/g" \
    -e "s/{{${OLD_UC}_/{{${NEW_UC}_/g" \
    "$file"

  # Catch-all: remaining standalone instances
  sed -i \
    -e "s/\b${OLD_LC}\b/${NEW_LC}/g" \
    -e "s/\b${OLD_UC}\b/${NEW_UC}/g" \
    "$file"

  # Restore @gsd-build (upstream npm scope — must stay)
  if grep -q "${NEW_LC}-build" "$file" 2>/dev/null; then
    sed -i \
      -e "s/@${NEW_LC}-build/@${OLD_LC}-build/g" \
      -e "s/${NEW_LC}-build\//${OLD_LC}-build\//g" \
      "$file"
  fi

done < /tmp/${NEW_LC}-cc-rebrand-files.txt

rm -f /tmp/${NEW_LC}-cc-rebrand-files.txt
echo "  Done."

# ─── STEP 4: Fix package.json ───────────────────────────────────────────────
echo ""
echo "[4/5] Updating package.json..."

if [ -f "package.json" ]; then
  # Fix package name and bin
  sed -i \
    -e 's/"name": *"[^"]*"/"name": "@bhargavvc\/sdd-cc"/' \
    -e 's/"sdd-cc-cc"/"sdd-cc"/' \
    -e "s/\"${OLD_DIR}-cc\"/\"${NEW_LC}-cc\"/g" \
    package.json

  # Fix bin entry: the key might already be partially renamed
  # Ensure bin is exactly: "sdd-cc": "bin/install.js"
  node -e "
    const pkg = require('./package.json');
    const fs = require('fs');
    pkg.name = '@bhargavvc/sdd-cc';
    pkg.bin = { 'sdd-cc': 'bin/install.js' };
    pkg.description = pkg.description
      .replace(/Get Shit Done/gi, 'Spec-Driven Development')
      .replace(/GSD/g, 'SDD')
      .replace(/gsd/g, 'sdd');
    pkg.repository = { type: 'git', url: 'git+https://github.com/bhargavvc/sdd-cc.git' };
    pkg.homepage = 'https://github.com/bhargavvc/sdd-cc';
    pkg.bugs = { url: 'https://github.com/bhargavvc/sdd-cc/issues' };
    pkg.publishConfig = { access: 'public' };
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
  "
  echo "  package.json updated."
fi

echo "  Done."

# ─── STEP 5: Verify ─────────────────────────────────────────────────────────
echo ""
echo "[5/5] Verifying..."

STALE_COUNT=0

echo "  Checking for stale references..."
# Check markdown and source files for remaining gsd (excluding @gsd-build and this script)
STALE=$(grep -rn "${OLD_LC}\|${OLD_DIR}" \
  --include="*.md" --include="*.js" --include="*.cjs" \
  . 2>/dev/null \
  | grep -v '\.git/' | grep -v 'node_modules/' \
  | grep -v "$SELF_NAME" \
  | grep -v "@${OLD_LC}-build" \
  | grep -v "REBRAND" \
  | head -20 || true)

if [ -n "$STALE" ]; then
  echo "  WARNING: Stale references found:"
  echo "$STALE"
  STALE_COUNT=$(echo "$STALE" | wc -l)
else
  echo "  No stale references found."
fi

echo ""
echo "=== Rebrand complete ==="
echo "  Stale references: $STALE_COUNT"
echo ""
echo "  Next steps:"
echo "  1. Review changes: git diff --stat"
echo "  2. Test installer:  node bin/install.js --cursor --local"
echo "  3. Commit:          git add -A && git commit -m 'rebrand: GSD → SDD'"
echo "  4. Publish:         npm publish --access public"
