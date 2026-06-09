#!/usr/bin/env bash
# dry-run-validate.sh — static checks for a TinkerWithTech blog post.
# No homelab needed. Validates the MDX in src/content/blog/.
#
# Usage:
#   scripts/dry-run-validate.sh ep10
#   scripts/dry-run-validate.sh ep10-external-secrets-vault
#   scripts/dry-run-validate.sh src/content/blog/ep10-external-secrets-vault.mdx
#
# Exit code: 0 if no hard failures, 1 otherwise. Warnings never fail the build.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BLOG_DIR="$ROOT/src/content/blog"

fail=0
pass()  { printf '  \033[32m✔\033[0m %s\n' "$1"; }
err()   { printf '  \033[31m✘\033[0m %s\n' "$1"; fail=1; }
warn()  { printf '  \033[33m!\033[0m %s\n' "$1"; }
head2() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# ---- resolve the target file -------------------------------------------------
arg="${1:-}"
[ -z "$arg" ] && { echo "usage: $0 <epNN | epNN-slug | path/to.mdx>"; exit 2; }

if [ -f "$arg" ]; then
  FILE="$arg"
elif [ -f "$BLOG_DIR/$arg.mdx" ]; then
  FILE="$BLOG_DIR/$arg.mdx"
else
  FILE="$(find "$BLOG_DIR" -maxdepth 1 -name "${arg}*.mdx" 2>/dev/null | head -1)"
fi
[ -z "${FILE:-}" ] || [ ! -f "$FILE" ] && { echo "✘ No MDX found matching '$arg' in $BLOG_DIR"; exit 2; }

SLUG="$(basename "$FILE" .mdx)"
printf '\033[1m🔎 Dry-run validation — %s\033[0m\n' "$SLUG"

# ---- 1. frontmatter ----------------------------------------------------------
head2 "Frontmatter"
fm="$(awk 'NR==1&&$0=="---"{f=1;next} f&&$0=="---"{exit} f{print}' "$FILE")"
[ -z "$fm" ] && err "no frontmatter block found (--- ... ---)"

get() { printf '%s\n' "$fm" | grep -E "^$1:" | head -1 | sed -E "s/^$1:[[:space:]]*//; s/^\"//; s/\"$//"; }
for key in title date description season episode tags published; do
  printf '%s\n' "$fm" | grep -qE "^$key:" && pass "has $key" || err "missing frontmatter: $key"
done

title="$(get title)"; desc="$(get description)"; pub="$(get published)"
[ "${#title}" -le 60 ] && pass "title ${#title}/60 chars" || warn "title ${#title}/60 — truncated in search results, consider trimming"
[ "${#desc}"  -le 155 ] && pass "description ${#desc}/155 chars" || warn "description ${#desc}/155 (over recommended)"
case "$pub" in
  false) pass "published: false (draft — correct)";;
  true)  warn "published: true — this post is LIVE, validate before re-pushing";;
  *)     err "published is '$pub' (expected true/false)";;
esac

# ---- 2. required sections ----------------------------------------------------
# Section names vary by post on purpose (e.g. "The Two Models" for architecture),
# so a missing match is a warning for a human/LLM to judge, not a hard blocker.
head2 "Structure"
need_section() {
  grep -qiE "^#{2,3} .*$1" "$FILE" && pass "section: $2" || warn "no heading matched '$2' — confirm it's covered under another name"
}
# intro = prose before the first H2
first_h2_line="$(grep -nE '^## ' "$FILE" | head -1 | cut -d: -f1)"
fm_end="$(grep -nE '^---$' "$FILE" | sed -n 2p | cut -d: -f1)"
if [ -n "$first_h2_line" ] && [ -n "$fm_end" ] && [ "$((first_h2_line - fm_end))" -gt 2 ]; then
  pass "intro present before first section"
else
  warn "no intro prose between frontmatter and first heading"
fi
need_section "Prerequisite"            "Prerequisites"
need_section "Architecture"            "Architecture"
need_section "Step"                    "Step-by-Step"
grep -qiE "^#{2,3} .*(Verif|POC|Validat)" "$FILE" \
  && pass "section: Verification/POC" || warn "no Verification/POC heading — confirm the payoff is proven somewhere"

# ---- 3. code fences ----------------------------------------------------------
# Build the fence from a variable so no literal backtick lands inside $(...).
head2 "Code blocks"
TICK='`'; FENCE="${TICK}${TICK}${TICK}"
fence_total="$(grep -cE "^${FENCE}" "$FILE")"
if [ $((fence_total % 2)) -ne 0 ]; then
  err "unbalanced code fences ($fence_total fence lines — one block is unterminated)"
else
  pass "$((fence_total / 2)) code blocks, all balanced"
fi
# opening fences with no language tag. Unlabeled blocks are intentional for
# architecture diagrams (auto-detected), so this is a warning, not a failure —
# but it flags a real mistake when a bash/yaml block lost its tag.
nolang="$(awk -v fence="$FENCE" '
  index($0, fence) == 1 {
    inblk = !inblk
    if (inblk) { lang = substr($0, length(fence) + 1); gsub(/[ \t]/, "", lang); if (lang == "") c++ }
    next
  }
  END { print c + 0 }' "$FILE")"
if [ "$nolang" -eq 0 ]; then
  pass "every code block has a language tag"
else
  warn "$nolang code block(s) have no language tag — fine for architecture diagrams, but confirm none should be bash/yaml/json"
fi

# ---- 4. placeholders / leftovers --------------------------------------------
head2 "Leftovers"
ph="$(grep -nEi '\[VERIFY\]|TODO|FIXME|lorem ipsum|<slug>|epNN|XXXX|placeholder' "$FILE" || true)"
if [ -n "$ph" ]; then
  warn "unresolved markers found — resolve before publishing:"
  printf '%s\n' "$ph" | sed 's/^/      /'
else
  pass "no TODO/[VERIFY]/placeholder markers"
fi

# ---- 5. bash commands (for the model + you to eyeball) -----------------------
head2 "Shell commands in this post"
cmds="$(awk -v openf="${FENCE}bash" -v endf="$FENCE" '
  index($0, openf) == 1 { f = 1; next }
  index($0, endf) == 1 { f = 0 }
  f' "$FILE")"
n="$(printf '%s\n' "$cmds" | grep -cvE '^[[:space:]]*(#|$)')"
echo "  $n command line(s) in bash blocks. Audit these for invented flags/output:"
printf '%s\n' "$cmds" | grep -vE '^[[:space:]]*(#|$)' | sed 's/^/      $ /' | head -40
[ "$n" -gt 40 ] && echo "      … ($((n-40)) more)"

if command -v shellcheck >/dev/null 2>&1; then
  head2 "shellcheck"
  tmp="$(mktemp)"; { echo '#!/usr/bin/env bash'; printf '%s\n' "$cmds"; } > "$tmp"
  shellcheck -S warning "$tmp" && pass "shellcheck clean" || warn "shellcheck flagged issues above"
  rm -f "$tmp"
else
  warn "shellcheck not installed — skipping shell linting (brew install shellcheck)"
fi

# ---- verdict -----------------------------------------------------------------
head2 "Verdict"
if [ "$fail" -eq 0 ]; then
  printf '  \033[32mSTATIC CHECKS PASSED\033[0m — ready for the homelab [VERIFY] pass.\n'
else
  printf '  \033[31mBLOCKERS FOUND\033[0m — fix the ✘ items above before publishing.\n'
fi
exit "$fail"
