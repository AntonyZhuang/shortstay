#!/bin/zsh
# Usage: zsh tests/run.sh [dist-dir]
# Copies the page into a temporary folder, adds the test scripts, and runs them in headless Chrome
# with throwaway profiles (no access to your normal Chrome data). Prints one line per test case.
# Each pass loads the page once with a different starting storage state (see shortstay-regression.pre.js):
# fresh (empty), legacy (older save format), corrupt / garbage / again / nobackup / nostorage (storage problems),
# biglog (a save whose activity log is one entry short of the cap),
# narrow (the page inside a 390px-wide iframe; the inner page reports back with postMessage),
# prefs (saved Compact layout and Rent sort in the separate view-preferences key),
# empty (an empty-mode save with no listings, by a viewer who has already dismissed the first-use tips),
# nullentries (a save with non-object messages/events, a reminder for B06 and a listing ID containing a quote),
# migrate (a save from before team decisions 1 and 2: N/A on required payment checks, Live viewing = Verified).
# Every pass uses a 1280x900 window.
set -euo pipefail
HERE=${0:A:h}
DIST=${1:-$HERE/../dist}
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
CHROME=${CHROME_BIN:-"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"}
[[ -x "$CHROME" ]] || { print -u2 "Chrome not found. Set CHROME_BIN to the Chrome executable."; exit 1; }
PASSES=(fresh legacy corrupt garbage again nobackup nostorage biglog narrow prefs empty nullentries migrate)
mkdir -p "$WORK/page"
cp "$DIST/app.js" "$DIST/styles.css" "$HERE/shortstay-regression.test.js" "$HERE/shortstay-regression.pre.js" "$WORK/page/"
sed 's#<script src="app.js" defer></script>#<script src="shortstay-regression.pre.js"></script><script src="app.js" defer></script><script src="shortstay-regression.test.js" defer></script>#' "$DIST/index.html" > "$WORK/page/index.html"
DOMS=()
for pass in $PASSES; do
  query=""; [[ $pass != fresh ]] && query="?$pass"
  "$CHROME" --headless=new --disable-gpu --no-first-run --window-size=1280,900 --user-data-dir="$WORK/profile-$pass" \
    --virtual-time-budget=4000 --dump-dom "file://$WORK/page/index.html$query" 2>/dev/null > "$WORK/dom-$pass.html"
  DOMS+=("$WORK/dom-$pass.html")
done
/usr/bin/python3 -I - $DOMS <<'EOF'
import sys, re, json, html
rows = []
for path in sys.argv[1:]:
    dom = open(path, encoding='utf-8').read()
    m = re.search(r'<pre id="qa-results">(.*?)</pre>', dom, re.S)
    rows += json.loads(html.unescape(m.group(1))) if m else [{'id': 'ERR', 'title': f'No results from {path.rsplit("/",1)[-1]}', 'pass': False}]
for r in rows: print(f"{'PASS' if r['pass'] else 'FAIL'}  {r['id']}  {r['title']}" + ('' if r['pass'] else f"\n        {r.get('detail','')}"))
print(f"\n{sum(r['pass'] for r in rows)}/{len(rows)} passed")
raise SystemExit(0 if rows and all(r['pass'] for r in rows) else 1)
EOF
