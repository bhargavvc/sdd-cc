#!/usr/bin/env bash
##############################################################################
# sync-upstream.sh
#
# Syncs the sdd-cc fork with upstream gsd-build/sdd,
# then runs the rebrand script.
#
# USAGE:  bash scripts/sync-upstream.sh
##############################################################################

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=== SDD-CC Upstream Sync ==="
echo ""

# Step 1: Fetch upstream
echo "[1/5] Fetching upstream..."
git fetch upstream
echo "  Done."

# Step 2: Update upstream-sync branch
echo ""
echo "[2/5] Updating upstream-sync branch..."
git checkout upstream-sync
git merge upstream/main --no-edit
echo "  Done."

# Step 3: Merge into main
echo ""
echo "[3/5] Merging upstream-sync into main..."
git checkout main
git merge -X theirs upstream-sync --no-edit
echo "  Done."

# Step 4: Run rebrand
echo ""
echo "[4/5] Running rebrand..."
bash scripts/rebrand-sdd-to-sdd.sh
echo "  Done."

# Step 5: Summary
echo ""
echo "[5/5] Summary"
echo ""
echo "  Upstream version: $(git log upstream/main --oneline -1)"
echo "  Local version:    $(cat package.json | grep '"version"' | head -1)"
echo ""
echo "  Next steps:"
echo "  1. Review:   git diff --stat"
echo "  2. Test:     node bin/install.js --cursor --local"
echo "  3. Commit:   git add -A && git commit -m 'sync: upstream vX.Y.Z + rebrand'"
echo "  4. Push:     git push origin main upstream-sync"
echo "  5. Publish:  npm publish --access public"
