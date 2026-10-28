// ShortStay regression suite (QA review fixes RF01–RF15, P1-1 drafts, P2-2 reasoning review, P2-1 reminders, P1-2 add/remove listing, P2-3 storage problems, P2-6 research log, P2-5 long text, P2-4 readable text, P3 batch, P2-8 verification, P2-7 last contacted / updated, R-1 Closed rule, P2-9 compact view, Next up, apply host-message change, safety checks, empty workspace and first-use tips, undo). Runs inside a copy of index.html after app.js.
// Typing is simulated by setting .value and dispatching the same 'input'/'change' events a real keystroke fires.
(() => {
  const $ = id => document.getElementById(id);
  const results = [];
  const check = (id, title, pass, detail) => results.push({id, title, pass: !!pass, detail});
  const stored = () => JSON.parse(localStorage.getItem('shortstay-cp3-demo-v1') || 'null');
  // The toast's message text without the Undo button label (older versions put plain text in the toast).
  const toastMessage = () => $('toast').querySelector('span')?.textContent ?? $('toast').textContent;
  const status = () => $('decision-status') ? $('decision-status').textContent : '(no status element)';
  const typeNote = v => { $('decision-note').value = v; $('decision-note').dispatchEvent(new Event('input', {bubbles: true})); };
  const pickChoice = v => { $('first-choice').value = v; $('first-choice').dispatchEvent(new Event('change', {bubbles: true})); };
  const reset = () => { $('demo-open').click(); $('reset-open').click(); $('reset-confirm').click(); };
  const view = v => $(v === 'all' ? 'show-all' : 'show-matches').click();
  const setNeeds = (s, e, min, max) => { $('needs-open').click(); $('need-start').value = s; $('need-end').value = e; $('budget-min').value = min; $('budget-max').value = max; $('needs-form').requestSubmit(); if ($('needs-dialog').open) $('needs-dialog').close(); };
  const edit = (id, vals) => { view('all'); document.querySelector(`[data-edit="${id}"]`).click(); for (const [k, v] of Object.entries(vals)) $('listing-' + k).value = v; $('listing-form').requestSubmit(); if ($('listing-dialog').open) $('listing-dialog').close(); };
  const ids = () => [...document.querySelectorAll('#listings article')].map(a => a.getAttribute('aria-label').split(' ')[0]);
  const ORIGINAL_NOTE = 'B05 is a provisional preference. Review permission information and complete a live viewing before committing.';
  const run = (fn) => { try { fn(); } catch (err) { results.push({id: 'ERR', title: String(err), pass: false}); } };
  const review = () => $('note-review') ? $('note-review').textContent.trim() : '';
  const keepButton = () => document.querySelector('[data-keep-note]');
  const publish = () => { const pre = document.createElement('pre'); pre.id = 'qa-results'; pre.textContent = JSON.stringify(results); document.body.appendChild(pre); };
  // Next up helpers. daysAgo gives a local datetime-local value n days before Date.now (so it follows a mocked clock).
  const nextShown = () => [...document.querySelectorAll('#next-list .next-item')].map(li => ({kind: li.querySelector('.small-label').textContent, text: li.querySelector('p').textContent, button: li.querySelector('button').textContent}));
  const nextButton = text => [...document.querySelectorAll('#next-list .next-item')].find(li => li.querySelector('p').textContent.includes(text))?.querySelector('button');
  const nextEmpty = () => document.querySelector('#next-body .next-empty')?.textContent.trim() || '';
  const daysAgo = n => { const d = new Date(Date.now() - n * 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  // Six possible entries (B11 gap, B11 checks, 2 unread, B02 and B07 waiting, reasoning for B05), so the cap of 5 applies.
  const busyNext = () => {
    reset(); view('all'); document.querySelector('[data-choose="B11"]').click();
    $('demo-open').click(); $('deliver-host').click(); $('demo-open').click(); $('deliver-reminder').click();
    edit('B02', {lastContacted: daysAgo(3)}); edit('B07', {lastContacted: daysAgo(4)});
  };
  const renderOnly = () => { $('session-code').value = 'NU' + Math.random().toString(36).slice(2, 6); $('session-code').dispatchEvent(new Event('change', {bubbles: true})); };

  // --- P2-3 load-time passes: unreadable or unavailable storage (seeded by the pre-script) ---
  const mode = location.search.slice(1);
  const banner = () => $('storage-alert') && !$('storage-alert').hidden ? $('storage-alert').textContent : '';
  const backups = () => Object.keys(localStorage).filter(k => k.startsWith('shortstay-cp3-demo-v1-backup-'));
  const leaving = () => { const e = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(e); return e.defaultPrevented; };
  const ORIGINAL = 'B05 is a provisional preference. Review permission information and complete a live viewing before committing.';
  if (['corrupt', 'garbage', 'again'].includes(mode)) {
    const seed = window.__qaSeed, id = {corrupt: 'S10', garbage: 'S13', again: 'S14'}[mode];
    run(() => {
      const keys = backups(), mainUntouched = localStorage.getItem('shortstay-cp3-demo-v1') === seed;
      const expectedKey = mode === 'again' ? 'shortstay-cp3-demo-v1-backup-earlier' : keys[0];
      check(id, `Unreadable save (${mode}): backed up exactly once, example shown, banner names the backup`, keys.length === 1 && keys[0] === expectedKey && localStorage.getItem(keys[0]) === seed && mainUntouched && $('saved-count').textContent === '12' && $('decision-note').value === ORIGINAL && /Saved data could not be read/.test(banner()) && banner().includes(expectedKey) && /could not be read; kept as backup/.test($('activity-list').textContent), `backups=${JSON.stringify(keys)} banner="${banner()}"`);
    });
    if (mode === 'corrupt') run(() => {
      document.querySelector('[data-choose="B14"]').click();
      const main = JSON.parse(localStorage.getItem('shortstay-cp3-demo-v1'));
      const stillBacked = localStorage.getItem(backups()[0]) === seed;
      check('S11', 'After the first change, the new save is written and the backup still holds the original', main.version === 1 && main.choice === 'B14' && stillBacked && !/Not saved/.test($('toast').textContent) && /could not be read/.test(main.events.map(e => e.text).join('|')), `choice=${main.choice} stillBacked=${stillBacked} toast="${$('toast').textContent}"`);
      let blob = null, name = null; const realURL = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
      URL.createObjectURL = b => { blob = b; return 'blob:qa'; }; HTMLAnchorElement.prototype.click = function () { name = this.download; };
      try { document.querySelector('[data-download-backup]').click(); } finally { URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
      document.querySelector('[data-dismiss-storage]').click();
      check('S12', 'Download backup offers the original text as JSON; Dismiss hides the banner', blob && blob.size === new Blob([seed]).size && blob.type === 'application/json' && name === 'shortstay-unreadable-backup.json' && !banner(), `size=${blob?.size} type=${blob?.type} name=${name} banner="${banner()}"`);
    });
    return publish();
  }
  if (mode === 'nobackup') {
    run(() => {
      const shown = /Changes are not being saved/.test(banner()) && /left untouched/.test(banner()) && backups().length === 0;
      document.querySelector('[data-choose="B14"]').click();
      check('S15', 'Unreadable save that cannot be backed up is never overwritten; user is told nothing is saved', shown && localStorage.getItem('shortstay-cp3-demo-v1') === window.__qaSeed && /^Not saved/.test($('toast').textContent) && leaving() && document.querySelector('[data-download-backup]'), `shown=${shown} toast="${$('toast').textContent}" main=${localStorage.getItem('shortstay-cp3-demo-v1')?.slice(0, 40)}`);
    });
    return publish();
  }
  // --- P2-5 at 390px: the outer page hosts a 390px iframe; the inner page runs these checks and posts them back ---
  const THREE_LINES = 'Deposit $500 <b>refundable</b>\nUtilities $70/month\nFull August rent required';
  const LONG_URL = 'https://example.com/' + 'a'.repeat(280);
  const noOverflow = el => el.scrollWidth <= el.clientWidth + 1;
  const longTextOf = (id, field) => document.getElementById(`text-${id}-${field}`);
  // P2-4: WCAG 2.x contrast. The background is the nearest ancestor with an opaque background colour.
  const rgb = c => c.match(/[\d.]+/g).map(Number);
  const luminance = c => { const [r, g, b] = rgb(c).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const backgroundOf = el => { for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; const a = rgb(c)[3]; if (a === undefined || a === 1) return c; } return 'rgb(255, 255, 255)'; };
  const contrast = el => { const a = luminance(getComputedStyle(el).color), b = luminance(backgroundOf(el)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); };
  const P24_TARGETS = [['#listing-visibility', 12], ['.visibility-link', 12], ['.comparison-note', 12], ['.quiet-count', 10], ['.listing-id', 10], ['.eyebrow', 10], ['.small-label', 10], ['footer p', 10]];
  const auditText = () => {
    const bad = [], seen = {};
    for (const [sel, minSize] of P24_TARGETS) for (const el of document.querySelectorAll(sel)) {
      if (!el.getClientRects().length) continue;
      const ratio = contrast(el), size = parseFloat(getComputedStyle(el).fontSize);
      seen[sel] = Math.min(seen[sel] ?? 99, ratio);
      if (ratio < 4.5 || size < minSize) bad.push(`${sel} ${ratio.toFixed(2)}:1 @${size}px`);
    }
    return {bad, seen, missing: P24_TARGETS.map(([s]) => s).filter(s => !(s in seen))};
  };
  if (mode === 'narrow') {
    window.addEventListener('message', e => { if (Array.isArray(e.data)) { results.push(...e.data); publish(); } });
    const frame = document.createElement('iframe'); frame.src = 'index.html?narrowchild'; frame.style.cssText = 'width:390px;height:844px;border:0';
    document.body.prepend(frame);
    return;
  }
  if (mode === 'narrowchild') {
    run(() => check('N04', '390px with no saved preference: Compact is the default (aria-pressed)', $('density-compact').getAttribute('aria-pressed') === 'true' && $('density-detailed').getAttribute('aria-pressed') === 'false' && $('listings').classList.contains('compact') && !!document.querySelector('.compact-row'), `compact=${$('density-compact').getAttribute('aria-pressed')}`));
    // N01–N03 test the detailed card, so they switch to Detailed first (the button does not exist in older versions).
    $('density-detailed')?.click();
    run(() => {
      reset(); $('add-listing').click();
      for (const [k, v] of Object.entries({area: 'Ditmars', borough: 'Queens', rent: 1900, start: '2026-06-01', end: '2026-08-15', terms: THREE_LINES, checks: LONG_URL})) $('listing-' + k).value = v;
      const dialog = $('listing-dialog'), action = $('listing-action');
      const dialogFits = noOverflow(dialog) && action.getBoundingClientRect().right <= innerWidth && action.tagName === 'TEXTAREA';
      $('listing-form').requestSubmit();
      const terms = longTextOf('U01', 'terms'), checks = longTextOf('U01', 'checks'), card = document.querySelector('[aria-label^="U01"]');
      check('N01', '390px: 3-line terms and a 300-character URL fit without horizontal overflow; dialog fits', innerWidth === 390 && dialogFits && terms.innerText.split('\n').length === 3 && noOverflow(terms) && noOverflow(checks) && noOverflow(card) && document.documentElement.scrollWidth <= innerWidth, `innerWidth=${innerWidth} dialogFits=${dialogFits} docW=${document.documentElement.scrollWidth} checksW=${checks.scrollWidth}/${checks.clientWidth}`);
      const more = checks.nextElementSibling; const folded = !more.hidden && checks.classList.contains('clamped');
      more.click();
      check('N02', '390px: the long URL folds behind Show more and is fully readable when expanded', folded && checks.textContent === LONG_URL && checks.scrollHeight <= checks.clientHeight + 1 && document.documentElement.scrollWidth <= innerWidth, `folded=${folded} h=${checks.scrollHeight}/${checks.clientHeight}`);
    });
    run(() => {
      reset(); document.querySelector('[data-choose="B14"]').click();
      const a = auditText();
      check('N03', '390px: key labels and notes meet 4.5:1 and the minimum font sizes', !a.bad.length && !a.missing.length, `bad=${JSON.stringify(a.bad)} missing=${JSON.stringify(a.missing)} min=${JSON.stringify(Object.fromEntries(Object.entries(a.seen).map(([k, v]) => [k, +v.toFixed(2)])))}`);
    });
    run(() => {
      reset(); $('density-compact').click(); window.scrollTo(0, 0);
      const row = id => document.querySelector(`[data-row="${id}"]`);
      const within = ['B05', 'B02'].every(id => row(id).getBoundingClientRect().bottom + scrollY <= 2 * innerHeight);
      const t05 = row('B05').textContent, t02 = row('B02').textContent;
      check('N05', '390px Compact: B05 and B02 rent, dates and contact status are visible within 2 screens; no horizontal overflow', within && /\$1,900/.test(t05) && /Dates match/.test(t05) && /Replied/.test(t05) && /\$2,000/.test(t02) && /Dates match/.test(t02) && /Waiting/.test(t02) && document.documentElement.scrollWidth <= innerWidth, `within=${within} b05Bottom=${Math.round(row('B05').getBoundingClientRect().bottom)} b02Bottom=${Math.round(row('B02').getBoundingClientRect().bottom)} vh=${innerHeight} t05="${t05}"`);
      row('B05').click();
      check('N06', '390px: expanding B05 shows the full card and still no horizontal overflow', row('B05').getAttribute('aria-expanded') === 'true' && !document.getElementById('body-B05').hidden && document.getElementById('body-B05').getClientRects().length > 0 && document.documentElement.scrollWidth <= innerWidth, `docW=${document.documentElement.scrollWidth}`);
      const nav = document.querySelector('.bottom-nav'), r = nav.getBoundingClientRect(), padding = parseFloat(getComputedStyle(document.body).paddingBottom), toastBottom = parseFloat(getComputedStyle($('toast')).bottom);
      $('demo-open').click(); $('deliver-reminder').click();
      const links = [...nav.querySelectorAll('a')].map(a => a.getAttribute('href'));
      check('N07', '390px bottom navigation: fixed at the bottom, page and toast leave room for it, Updates count follows unread', getComputedStyle(nav).position === 'fixed' && Math.abs(r.bottom - innerHeight) < 1 && padding >= r.height && toastBottom >= r.height && links.join() === '#shortlist,#inbox,#decision' && $('bottom-unread').textContent === '1' && nav.getAttribute('aria-label') === 'Quick links', `bottom=${r.bottom}/${innerHeight} h=${r.height} padding=${padding} toast=${toastBottom} unread=${$('bottom-unread').textContent}`);
    });
    run(() => {
      busyNext(); window.scrollTo(0, 0);
      const visible = () => [...document.querySelectorAll('#next-list .next-item')].filter(li => li.getClientRects().length).length;
      const more = () => document.querySelector('#next-body [data-next-more]');
      const before = {n: visible(), text: more()?.textContent, shown: !!more()?.getClientRects().length, expanded: more()?.getAttribute('aria-expanded')};
      more().click();
      const after = {n: visible(), text: more().textContent, expanded: more().getAttribute('aria-expanded'), focused: document.activeElement === more()};
      renderOnly(); const kept = visible() === 5 && more().getAttribute('aria-expanded') === 'true';
      check('NU13', '390px: Next up shows 3 of 5 entries with "Show all (5)"; expanding shows all 5, stays open across re-renders; no horizontal overflow', before.n === 3 && before.text === 'Show all (5)' && before.shown && before.expanded === 'false' && after.n === 5 && after.text === 'Show fewer' && after.expanded === 'true' && after.focused && kept && document.documentElement.scrollWidth <= innerWidth, `before=${JSON.stringify(before)} after=${JSON.stringify(after)} kept=${kept} docW=${document.documentElement.scrollWidth}`);
    });
    parent.postMessage(results, '*');
    return;
  }
  if (mode === 'biglog') {
    run(() => {
      const startLen = stored().events.length;
      ['B14', 'B13', 'B12'].forEach(id => document.querySelector(`[data-choose="${id}"]`).click());
      const s = stored();
      check('L06', 'Log cap is 2,000: oldest entries drop off and the count of dropped entries is kept and shown', startLen === 1999 && s.events.length === 2000 && s.droppedEvents === 2 && s.events[1999].text === 'seed event 3' && /2 earliest entries were dropped/.test($('activity-summary').textContent) && /latest 100 shown/.test($('activity-summary').textContent) && $('activity-list').children.length === 100, `len=${s.events.length} dropped=${s.droppedEvents} last="${s.events[1999]?.text}" summary="${$('activity-summary').textContent}"`);
      let text = null; const RealBlob = window.Blob, realURL = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
      window.Blob = function (parts, opts) { text = parts.join(''); return new RealBlob(parts, opts); }; URL.createObjectURL = () => 'blob:qa'; HTMLAnchorElement.prototype.click = function () {};
      try { $('export-session').click(); } finally { window.Blob = RealBlob; URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
      const data = JSON.parse(text);
      check('L07', 'Export of a capped log carries droppedEvents and stays oldest-first', data.droppedEvents === 3 && data.events.length === 2000 && data.events[0].text === 'seed event 4' && /Session exported/.test(data.events[1999].text), `dropped=${data.droppedEvents} first="${data.events[0].text}" last="${data.events[1999].text}"`);
    });
    return publish();
  }
  // --- Empty workspace after a refresh (?empty): the pre-script saved mode 'empty' with no listings and marked the tips as seen ---
  if (mode === 'empty') {
    const guide = () => document.querySelector('#listings .listing-empty.start');
    run(() => {
      const matches = {n: document.querySelectorAll('#listings article').length, guide: guide()?.textContent};
      view('all'); const all = {n: document.querySelectorAll('#listings article').length, guide: !!guide()?.querySelector('[data-add-first]')};
      check('EW05', 'Empty workspace after refresh: still 0 listings (no examples merged back), guide in Matches and All saved, mode stays empty', $('saved-count').textContent === '0' && $('matches-count').textContent === '0' && matches.n === 0 && /Start your shortlist/.test(matches.guide) && all.n === 0 && all.guide && $('listing-visibility').textContent.trim() === 'Showing all 0 saved. No saved listings yet.' && $('first-choice').options.length === 1 && $('workspace-tag').textContent === 'Your own workspace', `matches=${JSON.stringify(matches)} all=${JSON.stringify(all)} vis="${$('listing-visibility').textContent}"`);
    });
    run(() => check('EW06', 'Empty workspace: Updates explains that host messages go in each listing\'s notes', /You can record host messages in each listing’s notes/.test($('messages').textContent), `msgs="${$('messages').textContent}"`));
    run(() => {
      $('demo-open').click(); const r = {host: $('deliver-host').disabled, reminder: $('deliver-reminder').disabled, note: $('demo-events-note').hidden ? '' : $('demo-events-note').textContent}; $('demo-dialog').close();
      check('EW07', 'Empty workspace: both demo events are disabled and the dialog says why', r.host && r.reminder && /only work with the example listings \(B05 and B02\)/.test(r.note), `r=${JSON.stringify(r)}`);
    });
    run(() => {
      const hiddenOnLoad = $('tips').hidden && $('tips').getClientRects().length === 0;
      typeNote('DRAFT-EW08: first listing soon');
      $('tips-show').click(); const shown = {visible: !$('tips').hidden && $('tips').getClientRects().length > 0, focus: document.activeElement === $('tips-heading'), key: localStorage.getItem('shortstay-cp3-tips-seen')};
      const steps = [...$('tips').querySelectorAll('.tips-steps strong')].map(s => s.textContent).join('|');
      check('EW08', 'Tips dismissed in an earlier visit stay hidden after refresh; Show tips again brings them back (focus on the heading) and keeps the draft', hiddenOnLoad && shown.visible && shown.focus && shown.key === null && steps === 'Set your dates and rent range|Add listings you find|Pick a first choice and note why' && $('decision-note').value === 'DRAFT-EW08: first listing soon' && /Unsaved/.test(status()), `hiddenOnLoad=${hiddenOnLoad} shown=${JSON.stringify(shown)} steps=${steps}`);
    });
    run(() => {
      guide().querySelector('[data-add-first]').click();
      const opened = $('listing-dialog').open && $('listing-dialog-title').textContent === 'Add a listing';
      for (const [k, v] of Object.entries({area: 'Ridgewood', borough: 'Queens', rent: 1750, start: '2026-06-01', end: '2026-08-15'})) $('listing-' + k).value = v;
      $('listing-form').requestSubmit();
      const s = stored();
      check('EW09', 'Empty workspace: "Add your first listing" opens the add dialog; the first listing is U01 and no example listing appears', opened && s.mode === 'empty' && s.listings.map(l => l.id).join(',') === 'U01' && $('saved-count').textContent === '1' && ids().join(',') === 'U01', `ids=${s.listings.map(l => l.id)} mode=${s.mode}`);
    });
    return publish();
  }
  if (mode === 'prefs') {
    run(() => check('M12', 'A saved Compact + Rent preference is restored on load', $('density-compact').getAttribute('aria-pressed') === 'true' && $('sort-listings').value === 'rent' && ids()[0] === 'B13' && !!document.querySelector('.compact-row'), `first=${ids()[0]} sort=${$('sort-listings').value}`));
    return publish();
  }
  if (mode === 'nostorage') {
    run(() => {
      const shown = /Your changes are not being saved/.test(banner());
      document.querySelector('[data-choose="B14"]').click();
      check('S16', 'Storage disabled: page still works in memory and says changes are not saved', shown && $('saved-count').textContent === '12' && $('first-choice').value === 'B14' && /^Not saved/.test($('toast').textContent), `shown=${shown} toast="${$('toast').textContent}"`);
    });
    return publish();
  }

  // --- Team decisions 1 and 2 (?migrate): an older save with N/A on required payment checks and Live viewing = Verified ---
  if (mode === 'migrate') {
    const atLoad = JSON.parse(localStorage.getItem('shortstay-cp3-demo-v1')), find = (s, id) => s.listings.find(l => l.id === id);
    const items = () => [...document.querySelectorAll('#next-list .next-item')].map(li => ({kind: li.querySelector('.small-label').textContent, text: li.querySelector('p').textContent, tone: li.className}));
    const CONFIRM = 'B05: you marked viewing Verified earlier — confirm ‘Viewed before paying’ in Safety checks.';
    run(() => {
      const b05 = find(atLoad, 'B05'), u01 = find(atLoad, 'U01'), migrated = atLoad.events.filter(e => /^Migrated: N\/A → Not yet for required payment check/.test(e.text));
      check('MG01', 'Decision 1 migration: N/A on a required payment check loads as Not yet, is saved at once, and each is logged ("Migrated: N/A → Not yet for required payment check (B05)"); N/A on an optional check is kept', b05.safety.viewedBeforePaying === 'Not yet' && b05.safety.traceablePayment === 'Not yet' && u01.safety.traceablePayment === 'Not yet' && b05.safety.priceReasonable === 'N/A' && migrated.length === 3 && migrated.filter(e => e.text === 'Migrated: N/A → Not yet for required payment check (B05)').length === 2 && migrated.some(e => e.text === 'Migrated: N/A → Not yet for required payment check (U01)') && migrated.every(e => e.role === 'System' && e.details?.changes?.[0]?.from === 'N/A'), `b05=${JSON.stringify(b05.safety)} migrated=${JSON.stringify(migrated.map(e => e.text))}`);
    });
    run(() => {
      const b05 = find(atLoad, 'B05'), b06 = find(atLoad, 'B06'), shown = items();
      const confirm = shown.find(i => i.kind === 'Confirm');
      check('MG02', 'Decision 2 migration: verify.viewing is removed; B05 (viewing Verified, Viewed before paying Not yet) is NOT set to Done and Next up shows a caution to confirm it; U02 likewise; B06 (already Done) gets no prompt', atLoad.listings.every(l => !('viewing' in (l.verify || {}))) && b05.safety.viewedBeforePaying === 'Not yet' && b05.viewingToConfirm === true && !b06.viewingToConfirm && b06.safety.viewedBeforePaying === 'Done' && confirm?.text === CONFIRM && /caution/.test(confirm.tone) && shown.filter(i => i.kind === 'Confirm').length === 2 && shown.some(i => i.text.startsWith('U02: you marked viewing Verified earlier')) && atLoad.events.some(e => e.text === 'Migrated: Live viewing was Verified; confirm Viewed before paying (B05)'), `shown=${JSON.stringify(shown)} b05=${JSON.stringify({safety: b05.safety, flag: b05.viewingToConfirm})}`);
    });
    run(() => {
      [...document.querySelectorAll('#next-list .next-item')].find(li => li.querySelector('.small-label').textContent === 'Confirm').querySelector('button').click();
      const focus = document.activeElement.id, note = !$('viewing-confirm-note').hidden, status = $('listing-viewing-status').textContent;
      $('listing-safety-viewedBeforePaying').value = 'Done'; $('listing-form').requestSubmit();
      const s = JSON.parse(localStorage.getItem('shortstay-cp3-demo-v1')), b05 = find(s, 'B05'), ev = s.events[0];
      check('MG03', 'Review B05 from the prompt focuses Viewed before paying and shows the confirmation note; saving it Done clears the prompt, logs the confirmation, and viewing then counts as verified', focus === 'listing-safety-viewedBeforePaying' && note && status === 'Viewing: Not yet — set in Safety checks' && !b05.viewingToConfirm && b05.safety.viewedBeforePaying === 'Done' && !items().some(i => i.kind === 'Confirm' && i.text.startsWith('B05')) && (ev.details?.changes || []).some(c => c.field === 'viewing confirmation') && !/viewing/.test(document.querySelector('[aria-label^="B05"] .verify-note')?.textContent || 'viewing'), `focus=${focus} note=${note} status="${status}" b05=${JSON.stringify(b05.safety)} ev=${JSON.stringify(ev)}`);
    });
    run(() => {
      [...document.querySelectorAll('#next-list .next-item')].find(li => li.querySelector('p').textContent.startsWith('U02: you marked viewing')).querySelector('button').click();
      const open = $('listing-dialog').open && !$('viewing-confirm-note').hidden; $('listing-form').requestSubmit();
      const s = JSON.parse(localStorage.getItem('shortstay-cp3-demo-v1')), u02 = find(s, 'U02'), texts = s.events.slice(0, 2).map(e => e.text);
      check('MG04', 'Saving a flagged listing with Viewed before paying still Not yet clears the prompt but logs "U02 viewing confirmation: still Not yet" (nothing is set to Done)', open && !u02.viewingToConfirm && u02.safety.viewedBeforePaying === 'Not yet' && texts[0] === 'U02 viewing confirmation: still Not yet' && /^U02: updated viewing confirmation\.$/.test(texts[1]) && !items().some(i => i.kind === 'Confirm'), `open=${open} texts=${JSON.stringify(texts)} u02=${JSON.stringify(u02.safety)}`);
    });
    return publish();
  }
  // --- QA review fixes, P3-7 / P3-8 (?nullentries): a save with non-object entries, a reminder for B06 and a listing ID with a quote ---
  if (mode === 'nullentries') {
    run(() => {
      const s = stored(), msgs = [...document.querySelectorAll('#messages .message')];
      check('RF13', 'Save with null / number / string / array entries in messages and events: page renders without errors, only the object entries are kept', window.__qaErrors.length === 0 && $('saved-count').textContent === '13' && document.querySelectorAll('#listings article').length > 0 && msgs.length === 2 && $('message-count').textContent === '2 updates' && /^1 entr/.test($('activity-summary').textContent) && !!document.querySelector('[data-apply="host-b05"]') && !document.querySelector('[data-apply="host-b05"]').disabled, `errors=${JSON.stringify(window.__qaErrors)} saved=${$('saved-count').textContent} msgs=${msgs.length} summary="${$('activity-summary').textContent}"`);
    });
    run(() => {
      const msg = [...document.querySelectorAll('#messages .message')].find(m => /reminder about B06/.test(m.textContent));
      const edit = msg?.querySelector('[data-message-edit]'), heading = msg?.querySelector('.message-meta strong')?.textContent;
      msg.querySelector('[data-reviewed]').click();
      const logged = stored().events[0]?.text;
      check('RF14', 'Messages use their own listing: a reminder for B06 is labelled "MANUAL REMINDER · B06", opens B06 and logs "B06 reminder marked reviewed."', heading === 'MANUAL REMINDER · B06' && edit?.dataset.messageEdit === 'B06' && edit?.textContent === 'Review B06 & next action →' && logged === 'B06 reminder marked reviewed.', `heading=${heading} edit=${edit?.dataset.messageEdit} label=${edit?.textContent} logged=${logged}`);
    });
    run(() => {
      view('all'); const id = 'U9"x', card = [...document.querySelectorAll('#listings article')].find(a => a.getAttribute('aria-label').startsWith(id + ' '));
      const editBtn = card?.querySelector('[data-edit]'), chooseBtn = card?.querySelector('[data-choose]');
      const attrs = {edit: editBtn?.dataset.edit, choose: chooseBtn?.dataset.choose, stray: [...(editBtn?.attributes || [])].map(a => a.name).filter(n => !['class', 'data-edit', 'aria-label'].includes(n))};
      let threw = null;
      try { editBtn.focus(); editBtn.click(); $('listing-action').value = 'RF15 save'; $('listing-form').requestSubmit(); chooseBtn && [...document.querySelectorAll('[data-choose]')].find(b => b.dataset.choose === id).click(); } catch (e) { threw = String(e); }
      const focusOk = document.activeElement?.dataset?.choose === id;
      check('RF15', 'A listing ID with a quote is escaped in attributes (data-edit / data-choose) and in CSS selectors: edit, save and Choose for now work and focus stays on its button', attrs.edit === id && attrs.choose === id && !attrs.stray.length && !threw && stored().listings.find(l => l.id === id)?.action === 'RF15 save' && stored().choice === id && focusOk && window.__qaErrors.length === 0, `attrs=${JSON.stringify(attrs)} threw=${threw} focus=${document.activeElement?.outerHTML?.slice(0, 80)}`);
    });
    return publish();
  }

  // Second pass (?legacy): shortstay-regression.pre.js stored an older save without noteFor before app.js loaded.
  if (location.search === '?legacy') {
    run(() => check('P08', 'Older save (no noteFor) loads without a false review prompt', $('first-choice').value === 'B02' && $('decision-note').value === 'LEGACY note for B02' && !review(), `select=${$('first-choice').value} review="${review()}"`));
    run(() => {
      document.querySelector('[data-choose="B06"]').click();
      check('P09', 'Older save: a later card choice still triggers the review prompt', /written for B02/.test(review()) && /now B06/.test(review()), `review="${review()}"`);
    });
    run(() => {
      $('show-all').click(); const b02 = document.querySelector('[aria-label^="B02"]');
      check('Q08', 'Older save: reminder without a listing field still maps to B02 (Waiting, unread → strip)', b02.querySelector('.reminder-strip') && $('unread-count').textContent === '1', `strip=${!!b02.querySelector('.reminder-strip')} unread=${$('unread-count').textContent}`);
    });
    run(() => {
      const s = stored(), u = [...document.querySelectorAll('[aria-label^="U01"]')];
      $('add-listing').click(); for (const [k, v] of Object.entries({area: 'Ridgewood', borough: 'Queens', rent: 1700, start: '2026-06-01', end: '2026-08-15'})) $('listing-' + k).value = v; $('listing-form').requestSubmit();
      const after = stored().listings.map(l => l.id);
      check('A13', 'Saved user listing survives reload once (no duplicate) and the next add becomes U02', u.length === 1 && after.filter(id => id === 'U01').length === 1 && after.includes('U02') && after.length === 14, `cardsU01=${u.length} ids=${after.join(',')}`);
    });
    run(() => {
      $('show-all').click();
      const b02 = document.querySelector('[aria-label^="B02"] .verify-note')?.textContent, added = [...document.querySelectorAll('#listings article')].filter(a => /^U\d/.test(a.getAttribute('aria-label'))).map(a => a.querySelector('.verify-note')?.textContent);
      document.querySelector('[data-choose="B06"]').click(); document.querySelector('[data-choose="B02"]').click();
      const s = JSON.parse(localStorage.getItem('shortstay-cp3-demo-v1'));
      check('W10', 'Older save without verify: every listing gets Unknown ×3 on load (viewing is read from Safety, decision 2) and it is saved', b02 === 'Not yet verified: permission · fees · viewing · host' && added.length >= 1 && added.every(n => n === b02) && s.listings.length >= 13 && s.listings.every(l => l.verify && ['permission', 'fees', 'host'].every(k => l.verify[k] === 'Unknown') && !('viewing' in l.verify)), `b02="${b02}" added=${JSON.stringify(added)} n=${s.listings.length}`);
    });
    run(() => {
      $('show-all').click();
      const lines = [...document.querySelectorAll('#listings article')].map(a => [a.querySelector('.contact-since')?.textContent, a.querySelector('.updated-line')?.textContent]);
      check('K11', 'Older save without lastContacted/updatedAt shows "Not recorded" everywhere, without errors', lines.length >= 12 && lines.every(([c, u]) => c === ' · Last contact: Not recorded' && (u === 'Updated: Not recorded' || /^Updated [A-Z][a-z]{2} \d+/.test(u))) && lines.filter(([, u]) => u === 'Updated: Not recorded').length >= 12, `sample=${JSON.stringify(lines[0])} n=${lines.length}`);
    });
    run(() => check('L13', 'Older log entries without details still display', /OLD event without details/.test($('activity-list').textContent), `log="${$('activity-list').textContent.slice(0, 80)}"`));
    run(() => {
      $('show-all').click(); document.querySelector('[data-edit="U01"]').click(); $('listing-remove').click(); $('remove-confirm').click();
      $('add-listing').click(); for (const [k, v] of Object.entries({area: 'Glendale', borough: 'Queens', rent: 1600, start: '2026-06-01', end: '2026-08-15'})) $('listing-' + k).value = v; $('listing-form').requestSubmit();
      const added = stored().listings.filter(l => l.added).map(l => l.id).join(',');
      check('X08', 'Older save: after removing U01 the counter still moves forward (U02 kept, new one is U03)', added === 'U02,U03', `added=${added}`);
    });
    run(() => {
      const m = stored().messages.find(x => x.id === 'host-b05'), button = document.querySelector('[data-apply="host-b05"]');
      const lines = [...document.querySelectorAll('#listings article .safety-note')].map(p => p.textContent), all = stored().listings;
      check('SF09', 'Older save without safety: every listing gets Not yet ×5 on load (saved) and cards say "Safety: 0 of 5 done"', lines.length >= 12 && lines.every(t => t === 'Safety: 0 of 5 done') && all.length >= 13 && all.every(l => l.safety && Object.keys(l.safety).length === 5 && Object.values(l.safety).every(v => v === 'Not yet')), `lines=${lines.length} sample=${JSON.stringify(all[0].safety)}`);
      check('EW10', 'Older save without mode is treated as an example workspace', stored().mode === 'example' && $('saved-count').textContent !== '0' && $('demo-events-note').hidden && $('workspace-tag').textContent === 'Demo workspace', `mode=${stored().mode} note=${$('demo-events-note').hidden}`);
      check('HM09', 'Older save: the host-b05 message without a suggestion gets {B05, end, 08-15 → 08-13} on load, and its Apply button works', JSON.stringify(m.suggestion) === JSON.stringify({listing: 'B05', field: 'end', from: '2026-08-15', to: '2026-08-13'}) && m.reviewed === true && button && !button.disabled && button.textContent === 'Apply: checkout Aug 15 → Aug 13', `msg=${JSON.stringify(m)} button="${button?.textContent}"`);
    });
    return publish();
  }

  // --- Draft survives every action that re-renders the page ---
  const draftCase = (id, title, action) => run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000);
    const draft = `DRAFT-${id}: B13 is cheaper; compare commute.`;
    typeNote(draft); action();
    check(id, title, $('decision-note').value === draft && /Unsaved/.test(status()), `note="${$('decision-note').value}" status="${status()}"`);
  });
  draftCase('R01', 'Draft kept after card Choose for now', () => document.querySelector('[data-choose="B14"]').click());
  draftCase('R02', 'Draft kept after Update my needs', () => setNeeds('2026-06-01', '2026-08-15', 0, 2200));
  draftCase('R03', 'Draft kept after saving a listing', () => edit('B02', {action: 'Ask B02 for evidence by Friday'}));
  draftCase('R04', 'Draft kept after Deliver host message', () => { $('demo-open').click(); $('deliver-host').click(); });
  draftCase('R05', 'Draft kept after Add manual reminder', () => { $('demo-open').click(); $('deliver-reminder').click(); });
  run(() => {
    reset(); $('demo-open').click(); $('deliver-host').click();
    typeNote('DRAFT-R06'); document.querySelector('[data-reviewed="host-b05"]').click();
    check('R06', 'Draft kept after Mark reviewed', $('decision-note').value === 'DRAFT-R06', `note="${$('decision-note').value}"`);
  });
  draftCase('R07', 'Draft kept after switching views (control)', () => { view('all'); view('matches'); });

  // --- Card choice still applies, and is reflected in the dropdown, without touching the note draft ---
  run(() => {
    reset(); typeNote('DRAFT-R08'); document.querySelector('[data-choose="B14"]').click();
    const s = stored();
    check('R08', 'Card choice saves B14, dropdown follows, draft note not saved yet', s.choice === 'B14' && $('first-choice').value === 'B14' && s.note === ORIGINAL_NOTE && $('decision-note').value === 'DRAFT-R08', `stored.choice=${s.choice} select=${$('first-choice').value} stored.note=${s.note === ORIGINAL_NOTE ? 'original' : s.note}`);
  });

  // --- Pending dropdown choice survives other actions ---
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); pickChoice('B13'); edit('B08', {action: 'Tour Sat 11am'});
    check('R09', 'Unsaved dropdown choice kept after saving a listing', $('first-choice').value === 'B13' && stored().choice === 'B05' && /Unsaved/.test(status()), `select=${$('first-choice').value} stored=${stored().choice} status="${status()}"`);
  });
  run(() => {
    reset(); pickChoice('B13'); document.querySelector('[data-choose="B02"]').click();
    check('R10', 'Explicit card click overrides a pending dropdown choice', $('first-choice').value === 'B02' && stored().choice === 'B02' && !/Unsaved/.test(status()), `select=${$('first-choice').value} stored=${stored().choice} status="${status()}"`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); pickChoice('B03'); setNeeds('2026-06-01', '2026-08-15', 0, 2000);
    check('R11', 'Choice warning reflects the pending dropdown choice', /B03 is outside your needs/.test($('choice-warning').textContent), `warn="${$('choice-warning').textContent}"`);
  });

  // --- Saving, reverting, resetting, leaving ---
  run(() => {
    reset(); typeNote('Saved reasoning R12'); pickChoice('B08'); $('decision-form').requestSubmit();
    const s = stored();
    check('R12', 'Save decision persists both fields and clears the unsaved state', s.note === 'Saved reasoning R12' && s.choice === 'B08' && !/Unsaved/.test(status()), `stored=${s.choice}/${s.note} status="${status()}"`);
  });
  run(() => {
    reset(); typeNote('temporary'); typeNote(ORIGINAL_NOTE + '  ');
    check('R13', 'Reverting the text (ignoring trailing spaces) is not treated as unsaved', !/Unsaved/.test(status()), `status="${status()}"`);
  });
  run(() => {
    reset(); typeNote('DRAFT-R14'); pickChoice('B10'); reset();
    check('R14', 'Confirmed Reset discards drafts', $('decision-note').value === ORIGINAL_NOTE && $('first-choice').value === 'B05' && !/Unsaved/.test(status()), `note=${$('decision-note').value === ORIGINAL_NOTE ? 'original' : $('decision-note').value} select=${$('first-choice').value}`);
  });
  run(() => {
    reset(); const clean = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(clean);
    typeNote('DRAFT-R15'); const dirty = new Event('beforeunload', {cancelable: true}); window.dispatchEvent(dirty);
    check('R15', 'Leaving the page warns only when there are unsaved decision edits', !clean.defaultPrevented && dirty.defaultPrevented, `clean.prevented=${clean.defaultPrevented} dirty.prevented=${dirty.defaultPrevented}`);
  });

  // --- P2-2: reasoning is flagged for review when the first choice no longer matches it ---
  run(() => {
    reset();
    check('P00', 'No review prompt in the reset example (reasoning matches B05)', !review(), `review="${review()}"`);
    document.querySelector('[data-choose="B14"]').click();
    const s = stored();
    check('P01', 'Card choice B05→B14 flags the B05 reasoning for review (panel + toast)', /written for B05/.test(review()) && /now B14/.test(review()) && $('decision-note').classList.contains('needs-review') && keepButton() && s.noteFor === 'B05' && /Review your reasoning/.test($('toast').textContent), `review="${review()}" noteFor=${s.noteFor} toast="${$('toast').textContent}"`);
    keepButton().click();
    const k = stored();
    check('P02', 'Keep reasoning as is clears the prompt and records it', !review() && k.noteFor === 'B14' && k.note === ORIGINAL_NOTE && /Reasoning kept unchanged for B14/.test(k.events[0].text), `review="${review()}" noteFor=${k.noteFor} event="${k.events[0].text}"`);
  });
  run(() => {
    reset(); document.querySelector('[data-choose="B14"]').click();
    typeNote('B14 is cheapest and covers my dates.');
    const noKeepWhileEditing = !keepButton() && /written for B05/.test(review());
    $('decision-form').requestSubmit();
    const s = stored();
    check('P03', 'Editing then Save decision clears the prompt (Keep hidden while editing)', noKeepWhileEditing && !review() && s.noteFor === 'B14' && s.note === 'B14 is cheapest and covers my dates.', `noKeepWhileEditing=${noKeepWhileEditing} review="${review()}" noteFor=${s.noteFor}`);
  });
  run(() => {
    reset(); document.querySelector('[data-choose="B05"]').click();
    check('P04', 'Clearing the first choice (Undecided) also flags the reasoning', /written for B05/.test(review()) && /now Undecided/.test(review()), `review="${review()}"`);
  });
  run(() => {
    reset(); typeNote(''); $('decision-form').requestSubmit(); document.querySelector('[data-choose="B14"]').click();
    check('P05', 'No prompt when there is no saved reasoning', !review() && stored().choice === 'B14', `review="${review()}"`);
  });
  run(() => {
    reset(); pickChoice('B13');
    const prompted = /now B13/.test(review()) && !keepButton();
    $('decision-form').requestSubmit();
    check('P06', 'Unsaved dropdown change prompts review; Save decision confirms it', prompted && !review() && stored().noteFor === 'B13', `prompted=${prompted} review="${review()}"`);
  });
  run(() => {
    reset(); document.querySelector('[data-choose="B14"]').click(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); edit('B02', {action: 'x'});
    check('P07', 'Review prompt persists across other actions until resolved', /written for B05/.test(review()) && /now B14/.test(review()), `review="${review()}"`);
  });

  // --- P2-1: a waiting-reply reminder is current only while unread and the listing is still Waiting ---
  const card = id => { view('all'); return document.querySelector(`[aria-label^="${id}"]`); };
  const strip = id => card(id).querySelector('.reminder-strip');
  const history = id => card(id).querySelector('.reminder-history')?.textContent || '';
  const reminderMsg = () => [...document.querySelectorAll('#messages .message')].find(m => /MANUAL REMINDER/.test(m.textContent));
  const unread = () => $('unread-count').textContent;
  const addReminder = () => { $('demo-open').click(); $('deliver-reminder').click(); };
  run(() => {
    reset(); addReminder();
    check('Q01', 'New reminder: amber strip on B02, counted as unread', strip('B02') && !history('B02') && unread() === '1', `strip=${!!strip('B02')} unread=${unread()}`);
    document.querySelector('[data-reviewed="reminder-b02"]').click();
    check('Q02', 'Mark reviewed (still Waiting): strip becomes history, unread 0', !strip('B02') && /Reviewed\. Now Waiting/.test(history('B02')) && unread() === '0', `history="${history('B02')}" unread=${unread()}`);
  });
  run(() => {
    reset(); addReminder(); edit('B02', {contact: 'Replied'});
    const m = reminderMsg();
    check('Q03', 'Unread reminder, B02 → Replied: no strip, marked Outdated, not counted', !strip('B02') && /Now Replied/.test(history('B02')) && /Outdated · B02 is now Replied/.test(m.textContent) && m.classList.contains('reviewed') && unread() === '0' && m.querySelector('[data-reviewed]'), `history="${history('B02')}" unread=${unread()} meta="${m.querySelector('.message-meta').textContent}"`);
    edit('B02', {contact: 'Waiting'});
    check('Q04', 'Back to Waiting while still unread: reminder is current again', strip('B02') && !/Outdated/.test(reminderMsg().textContent) && unread() === '1', `strip=${!!strip('B02')} unread=${unread()}`);
    edit('B02', {contact: 'Closed'});
    check('Q05', 'Closed: history line and Outdated tag name the new status', /Now Closed/.test(history('B02')) && /B02 is now Closed/.test(reminderMsg().textContent), `history="${history('B02')}"`);
  });
  run(() => {
    reset(); addReminder(); edit('B02', {contact: 'Replied'}); $('demo-open').click(); $('deliver-host').click();
    check('Q06', 'Host message still counts while the outdated reminder does not', unread() === '1' && !/Outdated/.test([...document.querySelectorAll('#messages .message')].find(m => /HOST MESSAGE/.test(m.textContent)).textContent), `unread=${unread()}`);
  });
  run(() => {
    reset(); addReminder(); addReminder();
    check('Q07', 'Triggering the reminder twice adds only one', stored().messages.filter(m => m.kind === 'reminder').length === 1 && $('deliver-reminder').disabled, `count=${stored().messages.filter(m => m.kind === 'reminder').length}`);
  });

  // --- P1-2: users can add their own listings, with a source ---
  const openAdd = () => { $('add-listing').click(); };
  const fill = vals => { for (const [k, v] of Object.entries(vals)) $('listing-' + k).value = v; };
  const submitListing = () => { $('listing-form').requestSubmit(); const open = $('listing-dialog').open; const err = $('listing-error').textContent; const invalid = [...$('listing-form').querySelectorAll('input,select,textarea')].filter(i => !i.validity.valid).map(i => i.id); if (open) $('listing-dialog').close(); return {open, err, invalid}; };
  const ASTORIA = {area: 'Ditmars', borough: 'Queens', source: 'WeChat group', sourceDetail: 'https://example.com/post/123', rent: 1900, start: '2026-06-01', end: '2026-08-15', terms: '$400 deposit', checks: 'Permission not checked', action: 'Ask for a video tour'};
  run(() => {
    reset();
    const hasButton = !!$('add-listing'); openAdd();
    const blank = ['area', 'borough', 'source', 'sourceDetail', 'rent', 'start', 'end', 'terms', 'checks', 'action'].every(k => $('listing-' + k).value === '');
    check('A01', 'Add a listing opens an empty form in add mode', hasButton && $('listing-dialog').open && $('listing-dialog-title').textContent === 'Add a listing' && $('listing-submit').textContent === 'Add listing' && blank && $('listing-contact').value === 'Not contacted', `title=${$('listing-dialog-title').textContent} submit=${$('listing-submit').textContent} blank=${blank}`);
    $('listing-dialog').close();
  });
  run(() => {
    reset(); openAdd(); fill({...ASTORIA, area: ''}); const a = submitListing();
    openAdd(); fill({...ASTORIA, borough: ''}); const b = submitListing();
    openAdd(); fill({...ASTORIA, end: '2026-06-01'}); const c = submitListing();
    check('A02', 'Missing area / borough and bad dates are rejected; nothing is added', a.open && a.invalid.includes('listing-area') && b.open && b.invalid.includes('listing-borough') && c.open && /checkout date after/.test(c.err) && stored().listings.length === 12, `a=${JSON.stringify(a)} b=${JSON.stringify(b)} c=${JSON.stringify(c)} n=${stored().listings.length}`);
  });
  run(() => {
    reset(); view('matches'); const before = +$('matches-count').textContent;
    openAdd(); fill(ASTORIA); submitListing();
    const s = stored(), u = s.listings.find(l => l.id === 'U01');
    check('A03', 'A matching listing is added as U01 and shown in Matches', u && u.added && u.area === 'Ditmars' && u.rent === 1900 && +$('matches-count').textContent === before + 1 && $('saved-count').textContent === '13' && ids().includes('U01') && /U01 added to your saved listings/.test($('toast').textContent) && /U01 added: Ditmars, Queens \(source: WeChat group\)/.test(s.events[0].text), `before=${before} matches=${$('matches-count').textContent} toast="${$('toast').textContent}" event="${s.events[0]?.text}"`);
    const c = document.querySelector('[aria-label^="U01"]'), a = c.querySelector('.source-line a');
    check('A04', 'Card shows "Added by you" and a safe clickable source link', /Added by you/.test(c.querySelector('.card-top').textContent) && /WeChat group · https:\/\/example.com\/post\/123/.test(c.querySelector('.source-line').textContent) && a && a.getAttribute('href') === 'https://example.com/post/123' && a.target === '_blank' && /noopener/.test(a.rel), `source="${c.querySelector('.source-line').textContent}" href=${a?.getAttribute('href')}`);
    openAdd(); fill({...ASTORIA, area: 'Long Island City', rent: 2500}); submitListing();
    check('A05', 'A non-matching listing is added as U02, kept in All saved, user told where', stored().listings.some(l => l.id === 'U02') && !ids().includes('U02') && /U02 added\. Outside your needs; find it in All saved/.test($('toast').textContent) && $('saved-count').textContent === '14', `toast="${$('toast').textContent}" saved=${$('saved-count').textContent}`);
    const inDropdown = [...$('first-choice').options].some(o => o.value === 'U01');
    document.querySelector('[data-choose="U01"]').click();
    check('A06', 'Added listing is in the first-choice dropdown and can be chosen', inDropdown && stored().choice === 'U01' && $('first-choice').value === 'U01', `inDropdown=${inDropdown} choice=${stored().choice}`);
    document.querySelector('[data-edit="U01"]').click();
    const populated = $('listing-area').value === 'Ditmars' && $('listing-borough').value === 'Queens' && $('listing-source').value === 'WeChat group' && $('listing-dialog-id').textContent.includes('ADDED BY YOU') && $('listing-submit').textContent === 'Save changes';
    $('listing-sourceDetail').value = 'WeChat: NYC Summer Sublets, Oct 20'; submitListing();
    const c2 = document.querySelector('[aria-label^="U01"]');
    check('A07', 'Editing an added listing shows its fields; plain-text sources are not links', populated && stored().listings.find(l => l.id === 'U01').sourceDetail === 'WeChat: NYC Summer Sublets, Oct 20' && !c2.querySelector('.source-line a') && /updated source details/.test(stored().events[0].text), `populated=${populated} event="${stored().events[0].text}"`);
  });
  run(() => {
    reset(); openAdd(); fill({...ASTORIA, area: '<img src=x onerror="window.__xssA=1">', sourceDetail: 'javascript:window.__xssB=1'}); submitListing();
    const c = document.querySelector('[aria-label^="U01"]');
    check('A08', 'HTML in the area and javascript: in the source are shown as text, never run or linked', !window.__xssA && !window.__xssB && !c.querySelector('img') && !c.querySelector('.source-line a') && /javascript:/.test(c.querySelector('.source-line').textContent), `img=${!!c.querySelector('img')} link=${!!c.querySelector('.source-line a')}`);
  });
  run(() => {
    reset(); document.querySelector('[data-edit="B05"]').click(); $('listing-dialog').close();
    openAdd(); const leak = $('listing-area').value || $('listing-rent').value; fill(ASTORIA); $('listing-dialog').querySelector('[data-close]').click();
    const asked = $('discard-dialog').open && $('listing-dialog').open; $('discard-confirm').click();
    check('A09', 'Opening Add after editing B05 starts empty; Cancel with typed values asks first (Discard), then adds nothing', !leak && asked && !$('discard-dialog').open && !$('listing-dialog').open && stored().listings.length === 12, `leak="${leak}" asked=${asked} n=${stored()?.listings.length}`);
  });
  run(() => {
    reset(); typeNote('DRAFT-A10'); openAdd(); fill(ASTORIA); submitListing();
    check('A10', 'Adding a listing keeps an unsaved decision draft', $('decision-note').value === 'DRAFT-A10' && /Unsaved/.test(status()), `note="${$('decision-note').value}"`);
  });
  run(() => {
    reset(); edit('B06', {terms: 'x'});
    check('A11', 'Saving a built-in listing does not log phantom source changes', !/source/.test(stored().events[0].text), `event="${stored().events[0].text}"`);
  });
  run(() => {
    reset(); openAdd(); fill(ASTORIA); submitListing(); const resetText = $('reset-dialog').textContent; reset();
    check('A12', 'Reset removes added listings and says so', stored().listings.length === 12 && !stored().listings.some(l => l.added) && /Listings you added are removed/.test(resetText), `n=${stored().listings.length}`);
  });

  run(() => {
    reset(); openAdd(); fill({...ASTORIA, terms: ''}); submitListing();
    const p = [...document.querySelector('[aria-label^="U01"]').querySelectorAll('.card-detail')].find(d => /Other payments/.test(d.textContent)).querySelector('p').textContent;
    check('A14', 'Empty payment terms read "Not recorded yet." rather than blank', p === 'Not recorded yet.', `terms="${p}"`);
  });

  // --- Remove listing (user-added only, confirmed, logged) ---
  const addListing = vals => { openAdd(); fill({...ASTORIA, ...vals}); submitListing(); };
  const openEdit = id => { view('all'); document.querySelector(`[data-edit="${id}"]`).click(); };
  run(() => {
    reset(); addListing({});
    openEdit('B05'); const builtInHidden = $('listing-remove').hidden; $('listing-dialog').close();
    openEdit('U01'); const addedShown = !$('listing-remove').hidden;
    $('listing-remove').click();
    const confirmOpen = $('remove-dialog').open && /Remove U01 · Ditmars\?/.test($('remove-title').textContent) && /You can undo it for a few seconds right after removing it/.test($('remove-text').textContent);
    $('remove-dialog').querySelector('[data-close]').click();
    check('X01', 'Remove is offered only for added listings and asks for confirmation; Keep listing cancels', builtInHidden && addedShown && confirmOpen && !$('remove-dialog').open && $('listing-dialog').open && stored().listings.some(l => l.id === 'U01'), `builtInHidden=${builtInHidden} addedShown=${addedShown} confirmOpen=${confirmOpen}`);
    $('listing-remove').click(); $('remove-confirm').click();
    const s = stored(), ev = s.events.map(e => e.text);
    check('X02', 'Confirming removes it everywhere and logs it; the earlier "added" entry is kept', !s.listings.some(l => l.id === 'U01') && !document.querySelector('[aria-label^="U01"]') && ![...$('first-choice').options].some(o => o.value === 'U01') && $('saved-count').textContent === '12' && !$('listing-dialog').open && !$('remove-dialog').open && /^U01 removed\.$/.test(toastMessage()) && ev[0] === 'U01 removed: Ditmars, Queens.' && ev.some(t => /^U01 added/.test(t)), `toast="${$('toast').textContent}" events=${JSON.stringify(ev.slice(0, 2))}`);
    check('X03', 'Focus lands on + Add a listing after removal', document.activeElement === $('add-listing'), `focus=${document.activeElement.id || document.activeElement.tagName}`);
  });
  run(() => {
    reset(); addListing({}); document.querySelector('[data-choose="U01"]').click();
    openEdit('U01'); $('listing-remove').click(); const warned = /first choice will become Undecided/.test($('remove-text').textContent); $('remove-confirm').click();
    const s = stored();
    check('X04', 'Removing the current first choice warns first, then sets Undecided and flags the reasoning', warned && s.choice === '' && $('first-choice').value === '' && /Your first choice is now Undecided/.test($('toast').textContent) && /First choice changed to Undecided/.test(s.events[0].text) && /now Undecided/.test(review()), `warned=${warned} choice="${s.choice}" review="${review()}"`);
  });
  run(() => {
    reset(); addListing({}); typeNote('DRAFT-X05'); openEdit('U01'); $('listing-remove').click(); $('remove-confirm').click();
    check('X05', 'Removing a listing keeps an unsaved decision draft', $('decision-note').value === 'DRAFT-X05' && /Unsaved/.test(status()), `note="${$('decision-note').value}"`);
  });
  run(() => {
    reset(); addListing({}); addListing({area: 'Woodside'}); openEdit('U02'); $('listing-remove').click(); $('remove-confirm').click(); addListing({area: 'Elmhurst'});
    const ids2 = stored().listings.filter(l => l.added).map(l => l.id).join(',');
    check('X06', 'Removed IDs are not reused (U01, U02 → remove U02 → next is U03)', ids2 === 'U01,U03', `ids=${ids2}`);
  });
  run(() => {
    reset(); openEdit('B05'); $('remove-confirm').click(); if ($('listing-dialog').open) $('listing-dialog').close();
    check('X07', 'A built-in listing cannot be removed even if the confirm button is triggered', stored().listings.some(l => l.id === 'B05') && stored().listings.length === 12, `n=${stored().listings.length}`);
  });

  // --- P2-3 write failures during use ---
  run(() => {
    reset();
    check('S00', 'Normal load: no storage banner and no backups', !banner() && backups().length === 0, `banner="${banner()}" backups=${backups().length}`);
    const realSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function () { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
    let failToast, failBanner, storedNote, warns, editToast;
    try {
      typeNote('S01 reasoning'); $('decision-form').requestSubmit();
      failToast = $('toast').textContent; failBanner = banner(); storedNote = stored().note; warns = leaving();
      edit('B02', {action: 'S03 action'}); editToast = $('toast').textContent;
    } finally { Storage.prototype.setItem = realSet; }
    check('S01', 'Write failure: no "saved" message, a lasting warning instead, nothing written, leaving warns', /^Not saved/.test(failToast) && !/saved in this browser/.test(failToast) && /Your changes are not being saved/.test(failBanner) && storedNote === ORIGINAL && warns, `toast="${failToast}" banner="${failBanner}" storedNote=${storedNote === ORIGINAL ? 'original' : storedNote} warns=${warns}`);
    check('S02', 'Listing edits during a failure also report "Not saved"', /^Not saved/.test(editToast), `toast="${editToast}"`);
    document.querySelector('[data-choose="B14"]').click();
    const s = stored();
    check('S03', 'Once storage works again the next change saves everything and the warning clears', !banner() && /Current first choice updated|Review your reasoning/.test($('toast').textContent) && s.note === 'S01 reasoning' && s.listings.find(l => l.id === 'B02').action === 'S03 action' && !leaving(), `banner="${banner()}" note=${s.note} action=${s.listings.find(l => l.id === 'B02').action}`);
  });

  // --- P2-6: research log ---
  const latest = () => stored().events[0];
  const hasChange = (ev, field, from, to) => (ev.details?.changes || []).some(c => c.field === field && c.from === from && c.to === to);
  const captureExport = fn => {
    let text = null, name = null; const RealBlob = window.Blob, realURL = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
    window.Blob = function (parts, opts) { text = parts.join(''); return new RealBlob(parts, opts); }; URL.createObjectURL = () => 'blob:qa'; HTMLAnchorElement.prototype.click = function () { name = this.download; };
    try { fn(); } finally { window.Blob = RealBlob; URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
    return {data: text && JSON.parse(text), name};
  };
  run(() => {
    reset(); edit('B05', {end: '2026-08-13', action: 'Ask about Aug 15'});
    const ev = latest();
    check('L01', 'Listing edits log full ISO time and before/after values; the list shows them', /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(ev.time) && ev.details.listing === 'B05' && hasChange(ev, 'checkout date', '2026-08-15', '2026-08-13') && hasChange(ev, 'next action', 'Arrange viewing and review permission information.', 'Ask about Aug 15') && /checkout date: 2026-08-15 → 2026-08-13/.test($('activity-list').textContent) && /\d\d:\d\d:\d\d/.test($('activity-list').querySelector('time').textContent), `time=${ev.time} changes=${JSON.stringify(ev.details?.changes)} shown="${$('activity-list').querySelector('time')?.textContent}"`);
    setNeeds('2026-06-01', '2026-08-15', 0, 2000);
    check('L02', 'Needs changes log the old and new values (maximum rent 2200 → 2000)', hasChange(latest(), 'maximum rent', 2200, 2000) && latest().details.changes.length === 1, `changes=${JSON.stringify(latest().details?.changes)}`);
    document.querySelector('[data-choose="B14"]').click();
    check('L03', 'Card choice logs first choice B05 → B14', hasChange(latest(), 'first choice', 'B05', 'B14'), `changes=${JSON.stringify(latest().details?.changes)}`);
    typeNote('New reasoning'); $('decision-form').requestSubmit();
    check('L04', 'Save decision logs the reasoning before and after', hasChange(latest(), 'reasoning', ORIGINAL, 'New reasoning'), `changes=${JSON.stringify(latest().details?.changes)}`);
  });
  run(() => {
    reset(); for (let i = 0; i < 60; i++) document.querySelector('[data-choose="B13"]').click();
    check('L05', 'No 50-entry cap: 61 entries are kept (60 actions + reset)', stored().events.length === 61 && !stored().droppedEvents, `len=${stored().events.length}`);
  });
  run(() => {
    reset(); addListing({}); const added = latest(); openEdit('U01'); $('listing-remove').click(); $('remove-confirm').click(); const removed = latest();
    check('L08', 'Added and removed listings keep their full record in the log', added.details.listing.area === 'Ditmars' && added.details.listing.sourceDetail === 'https://example.com/post/123' && removed.details.listing.id === 'U01' && removed.details.listing.action === 'Ask for a video tour', `added=${JSON.stringify(added.details?.listing)?.slice(0, 80)}`);
  });
  run(() => {
    reset(); $('session-code').value = 'T1'; $('session-code').dispatchEvent(new Event('change'));
    const coded = stored().sessionCode === 'T1' && hasChange(latest(), 'session code', '', 'T1');
    edit('B02', {contact: 'Replied'});
    const {data, name} = captureExport(() => $('export-session').click());
    const times = data.events.map(e => e.time);
    check('L09', 'Session code is saved and logged', coded, `code=${stored().sessionCode}`);
    check('L10', 'Export: JSON with schema, code, time zone, workspace and oldest-first events ending with the export itself', data.schemaVersion === 1 && data.sessionCode === 'T1' && typeof data.timeZone === 'string' && data.workspace.listings.length === 12 && data.workspace.listings.find(l => l.id === 'B02').contact === 'Replied' && !('events' in data.workspace) && times.every((t, i) => i === 0 || t >= times[i - 1]) && /Demo reset/.test(data.events[0].text) && /Session exported/.test(data.events.at(-1).text) && /^shortstay-session-T1-\d{8}-\d{4}\.json$/.test(name) && /Session exported as/.test($('toast').textContent), `name=${name} first="${data.events[0]?.text}" last="${data.events.at(-1)?.text}"`);
  });
  run(() => {
    reset(); edit('B02', {action: 'x'}); $('demo-open').click(); $('reset-open').click();
    const before = $('reset-log-note').textContent;
    captureExport(() => $('reset-export').click());
    const after = $('reset-log-note').textContent; $('reset-confirm').click();
    const s = stored();
    check('L11', 'Reset dialog warns the log will be cleared, offers Export first, and Reset leaves a record', /\(2 entries\) will also be cleared/.test(before) && /not been exported/.test(before) && /last exported at/.test(after) && s.events.length === 1 && /Demo reset/.test(s.events[0].text) && s.events[0].details.previous.entries === 3 && s.events[0].details.previous.lastExportAt && !s.sessionCode, `before="${before}" after="${after}" first="${s.events[0].text}"`);
  });
  run(() => {
    reset(); $('session-code').value = '<b>T2</b>'; $('session-code').dispatchEvent(new Event('change'));
    const {name} = captureExport(() => $('export-session').click());
    check('L12', 'Session code is shown as text in the log and cleaned in the file name', !$('activity-list').querySelector('b') && /<b>T2<\/b>/.test($('activity-list').textContent) && /^shortstay-session-bT2b-/.test(name), `name=${name}`);
  });

  // --- P2-5: long text on cards (1280px window) ---
  run(() => {
    reset(); addListing({terms: THREE_LINES, checks: LONG_URL, action: 'Call host'});
    const card = document.querySelector('[aria-label^="U01"]'), terms = longTextOf('U01', 'terms'), checks = longTextOf('U01', 'checks'), act = longTextOf('U01', 'action');
    const lh = el => parseFloat(getComputedStyle(el).lineHeight);
    check('T01', 'Line breaks are kept (pre-line) and HTML is shown as text; 3 lines need no Show more', getComputedStyle(terms).whiteSpace === 'pre-line' && terms.innerText.split('\n').length === 3 && !card.querySelector('.card-detail b') && terms.textContent.includes('<b>refundable</b>') && terms.nextElementSibling.hidden, `whiteSpace=${getComputedStyle(terms).whiteSpace} lines=${terms.innerText.split('\n').length} moreHidden=${terms.nextElementSibling.hidden}`);
    check('T02', 'A 300-character URL wraps inside the card: no horizontal overflow anywhere', getComputedStyle(checks).overflowWrap === 'anywhere' && noOverflow(checks) && noOverflow(card) && document.documentElement.scrollWidth <= innerWidth, `checks=${checks.scrollWidth}/${checks.clientWidth} card=${card.scrollWidth}/${card.clientWidth} doc=${document.documentElement.scrollWidth}/${innerWidth}`);
    const more = checks.nextElementSibling;
    check('T03', 'Longer than 3 lines: folded to 3 lines with Show more (aria-expanded=false)', !more.hidden && more.textContent === 'Show more' && more.getAttribute('aria-expanded') === 'false' && more.getAttribute('aria-controls') === checks.id && checks.clientHeight <= lh(checks) * 3 + 2 && checks.scrollHeight > checks.clientHeight, `hidden=${more.hidden} h=${checks.clientHeight}/${checks.scrollHeight} lh=${lh(checks)}`);
    more.click();
    check('T04', 'Show more expands the full text (Show less, aria-expanded=true)', !checks.classList.contains('clamped') && checks.scrollHeight <= checks.clientHeight + 1 && more.textContent === 'Show less' && more.getAttribute('aria-expanded') === 'true' && checks.textContent === LONG_URL, `h=${checks.clientHeight}/${checks.scrollHeight} label=${more.textContent}`);
    document.querySelector('[data-choose="B14"]').click(); edit('B02', {action: 'Re-render'});
    const checks2 = longTextOf('U01', 'checks'), more2 = checks2.nextElementSibling;
    check('T05', 'Expanded state survives re-rendering (card choice and another listing edit)', checks2 !== checks && !checks2.classList.contains('clamped') && more2.getAttribute('aria-expanded') === 'true' && more2.textContent === 'Show less', `clamped=${checks2.classList.contains('clamped')} aria=${more2.getAttribute('aria-expanded')}`);
    more2.click();
    check('T06', 'Show less folds it again', checks2.classList.contains('clamped') && more2.getAttribute('aria-expanded') === 'false' && more2.textContent === 'Show more', `clamped=${checks2.classList.contains('clamped')}`);
    check('T07', 'Short text has no Show more button', act.nextElementSibling.hidden && longTextOf('B05', 'terms').nextElementSibling.hidden, `actionMoreHidden=${act.nextElementSibling.hidden}`);
  });
  run(() => {
    reset(); document.querySelector('[data-edit="B05"]').click();
    const a = $('listing-action'); const shape = a.tagName === 'TEXTAREA' && a.rows === 2 && a.maxLength === 300 && a.name === 'action';
    a.value = 'Line one\nLine two'; $('listing-form').requestSubmit();
    const p = longTextOf('B05', 'action');
    check('T08', 'My next action is a 2-row textarea (maxlength 300); its line breaks show on the card', shape && stored().listings.find(l => l.id === 'B05').action === 'Line one\nLine two' && p.innerText.split('\n').length === 2, `shape=${shape} lines=${p.innerText.split('\n').length}`);
  });
  run(() => {
    reset(); addListing({checks: LONG_URL}); longTextOf('U01', 'checks').nextElementSibling.click(); reset(); addListing({checks: LONG_URL});
    check('T09', 'Reset clears remembered expanded notes', longTextOf('U01', 'checks').classList.contains('clamped'), `clamped=${longTextOf('U01', 'checks').classList.contains('clamped')}`);
  });

  // --- P2-4: readable explanation text, and the hidden count as a way into All saved ---
  run(() => {
    reset(); document.querySelector('[data-choose="B14"]').click(); view('matches');
    const a = auditText();
    check('V01', '1280px: key labels and notes meet 4.5:1 (WCAG formula) and the minimum font sizes', !a.bad.length && !a.missing.length, `bad=${JSON.stringify(a.bad)} missing=${JSON.stringify(a.missing)} min=${JSON.stringify(Object.fromEntries(Object.entries(a.seen).map(([k, v]) => [k, +v.toFixed(2)])))}`);
  });
  run(() => {
    reset(); view('matches');
    const btn = $('listing-visibility').querySelector('[data-show-hidden]');
    const shape = btn && btn.tagName === 'BUTTON' && btn.textContent === '3 outside your needs' && btn.getAttribute('aria-label').startsWith(btn.textContent) && /^Showing 9 of 12 saved\. 3 outside your needs\.$/.test($('listing-visibility').textContent);
    btn.click();
    check('V02', 'The "3 outside your needs" button switches to All saved and moves focus there', shape && $('show-all').getAttribute('aria-pressed') === 'true' && ids().length === 12 && document.activeElement === $('show-all') && !$('listing-visibility').querySelector('button') && /^Showing all 12 saved\. 3 outside/.test($('listing-visibility').textContent), `shape=${shape} pressed=${$('show-all').getAttribute('aria-pressed')} focus=${document.activeElement.id} text="${$('listing-visibility').textContent}"`);
  });
  run(() => {
    reset(); setNeeds('2026-06-10', '2026-08-10', 0, 3000); view('matches');
    check('V03', 'When nothing is hidden there is no button, just "All match your budget and dates."', !$('listing-visibility').querySelector('button') && /All match your budget and dates\./.test($('listing-visibility').textContent) && ids().length === 12, `text="${$('listing-visibility').textContent}"`);
  });

  // --- P3 batch: wording, focus and small consistency fixes ---
  const pills = id => [...card(id).querySelectorAll('.check-pill')].map(p => p.textContent);
  run(() => {
    reset(); const sameYear = $('need-dates').textContent;
    setNeeds('2026-12-01', '2027-01-15', 0, 3000); const crossYear = $('need-dates').textContent;
    addListing({start: '2026-12-20', end: '2027-01-31'}); const cardDates = card('U01').querySelector('.date-row').textContent;
    check('Z01', 'Cross-year ranges show both years (needs bar and card); same-year ranges are unchanged', sameYear === 'Jun 1 – Aug 15, 2026' && crossYear === 'Dec 1, 2026 – Jan 15, 2027' && cardDates === 'Dec 20, 2026 – Jan 31, 2027', `same="${sameYear}" cross="${crossYear}" card="${cardDates}"`);
  });
  run(() => {
    reset(); const b07 = pills('B07'), b11 = pills('B11');
    addListing({start: '2026-06-02', end: '2026-08-13'}); const both = pills('U01');
    setNeeds('2026-12-01', '2027-01-15', 0, 3000); const none = pills('B05');
    const noOldWording = !/night date gap/.test($('listings').textContent);
    check('Z02', 'Gap pills say where: "Starts 9 nights late", "Ends 5 nights early", both together, singular "1 night", and "Doesn\'t overlap your dates"', b07.includes('Starts 9 nights late') && b11.includes('Ends 5 nights early') && both.includes('Starts 1 night late') && both.includes('Ends 2 nights early') && none.includes('Doesn’t overlap your dates') && none.length === 2 && noOldWording, `b07=${b07} b11=${b11} both=${both} none=${none}`);
  });
  run(() => {
    reset(); edit('B05', {end: '2026-08-13'}); const early = $('choice-warning').textContent;
    setNeeds('2026-12-01', '2027-01-15', 0, 3000); const apart = $('choice-warning').textContent;
    check('Z03', 'First-choice warning uses the same wording ("ends 2 nights early", "doesn\'t overlap your dates")', /B05 is outside your needs: ends 2 nights early\./.test(early) && /doesn’t overlap your dates/.test(apart) && !/night date gap/.test(early + apart), `early="${early}" apart="${apart}"`);
  });
  run(() => {
    reset(); edit('B02', {action: 'Focus test'}); const stayed = document.activeElement === document.querySelector('[data-edit="B02"]');
    view('matches'); document.querySelector('[data-edit="B05"]').click(); $('listing-rent').value = 2500; $('listing-form').requestSubmit(); const moved = document.activeElement === $('show-all');
    check('Z04', 'After saving, focus returns to that card\'s Review & update (or to All saved if the card left the view)', stayed && moved, `stayed=${stayed} moved=${moved} focus=${document.activeElement.id || document.activeElement.getAttribute('aria-label')}`);
  });
  run(() => {
    reset(); edit('B05', {end: '2026-08-13'}); view('matches');
    document.querySelector('[data-choice-show-all]').click();
    const h = document.activeElement;
    check('Z05', 'View in All saved focuses the first-choice card title (tabindex=-1)', $('show-all').getAttribute('aria-pressed') === 'true' && h.tagName === 'H3' && h.getAttribute('tabindex') === '-1' && h.closest('article').getAttribute('aria-label').startsWith('B05 '), `focus=${h.tagName} ${h.textContent}`);
  });
  run(() => {
    reset(); const b = document.querySelector('[data-choose="B05"]'), other = document.querySelector('[data-choose="B02"]');
    check('Z06', 'First-choice button reads "★ First choice · Clear" and keeps aria-label "Clear first choice"', b.textContent === '★ First choice · Clear' && b.getAttribute('aria-label') === 'Clear first choice' && other.textContent === 'Choose for now', `text="${b.textContent}" aria="${b.getAttribute('aria-label')}"`);
  });
  run(() => {
    reset(); view('all');
    check('Z07', 'No hard-coded B03 emphasis remains', !document.querySelector('.term-emphasis') && getComputedStyle(longTextOf('B03', 'terms')).color === getComputedStyle(longTextOf('B02', 'terms')).color, `emphasis=${!!document.querySelector('.term-emphasis')}`);
  });
  run(() => {
    reset(); $('demo-open').click(); $('deliver-reminder').click(); $('demo-open').click(); $('deliver-host').click();
    document.querySelector('[data-message-edit="B02"]').click(); const rem = $('listing-message-context').hidden ? '' : $('listing-message-context').textContent; $('listing-dialog').close();
    document.querySelector('[data-message-edit="B05"]').click(); const host = $('listing-message-context').hidden ? '' : $('listing-message-context').textContent; $('listing-dialog').close();
    view('all'); document.querySelector('[data-edit="B02"]').click(); const fromCard = $('listing-message-context').hidden; $('listing-dialog').close();
    check('Z08', 'Opening B02 from its reminder shows "Reminder: …" like the host message; opening from the card shows nothing', /^Reminder: At the simulated Apr 27, 2026, 21:00 checkpoint/.test(rem) && /^Host message: Correction/.test(host) && fromCard, `rem="${rem.slice(0, 60)}" host="${host.slice(0, 30)}" fromCardHidden=${fromCard}`);
  });
  run(() => {
    reset(); $('needs-open').click(); $('budget-max').value = 20001; const nativeOk = $('needs-form').checkValidity(); $('needs-form').requestSubmit();
    const blocked = $('needs-dialog').open && /at most \$20,000/.test($('needs-error').textContent) && $('need-budget').textContent === '$0 – $2,200 / month'; $('needs-dialog').close();
    setNeeds('2026-06-01', '2026-08-15', 0, 20000);
    check('Z09', 'Needs: rent above $20,000 is rejected with an on-page message (not a browser tooltip); $20,000 is accepted', nativeOk && blocked && $('need-budget').textContent === '$0 – $20,000 / month', `nativeOk=${nativeOk} blocked=${blocked} budget="${$('need-budget').textContent}"`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-edit="B02"]').click(); $('listing-rent').value = 25000; const nativeOk = $('listing-form').checkValidity(); $('listing-form').requestSubmit();
    const blocked = $('listing-dialog').open && /at most \$20,000/.test($('listing-error').textContent) && stored().listings.find(l => l.id === 'B02').rent === 2000;
    $('listing-rent').value = 20000; $('listing-form').requestSubmit();
    check('Z10', 'Listing: rent above $20,000 is rejected with an on-page message; $20,000 is accepted', nativeOk && blocked && stored().listings.find(l => l.id === 'B02').rent === 20000, `nativeOk=${nativeOk} blocked=${blocked}`);
  });
  run(() => {
    reset(); view('all');
    check('Z11', 'Summary pills say they count this view only', /^3 waiting for a reply \(this view\)$/.test($('summary-pills').children[0]?.textContent) && /^2 with a date gap \(this view\)$/.test($('summary-pills').children[1]?.textContent), `pills="${$('summary-pills').textContent}"`);
  });
  run(() => {
    reset(); const demoText = $('demo-dialog').textContent; $('demo-open').click(); $('deliver-reminder').click(); document.querySelector('[data-reviewed="reminder-b02"]').click();
    check('Z12', 'Scenario time carries a date in the demo panel, the reminder text and the card history line', /Scenario: Apr 27, 2026, 21:00\. Last contact: Apr 27, 2026, 09:00\./.test(demoText) && /simulated Apr 27, 2026, 21:00 checkpoint/.test(reminderMsg().textContent) && /Earlier reminder \(scenario Apr 27, 2026, 21:00\)/.test(history('B02')), `history="${history('B02')}"`);
  });

  // --- P2-8: matching is not verification ---
  const verifyNote = id => card(id).querySelector('.verify-note')?.textContent || '';
  const ALL_OPEN = 'Not yet verified: permission · fees · viewing · host';
  // Team decision 2: viewing has no Verification select; "viewing: Verified" is set as Safety's Viewed before paying = Done.
  const setVerify = (id, vals) => { view('all'); document.querySelector(`[data-edit="${id}"]`).click(); for (const [k, v] of Object.entries(vals)) { if (k === 'viewing') $('listing-safety-viewedBeforePaying').value = v === 'Verified' ? 'Done' : 'Not yet'; else $('listing-verify-' + k).value = v; } $('listing-form').requestSubmit(); if ($('listing-dialog').open) $('listing-dialog').close(); };
  run(() => {
    reset(); view('all');
    const notes = [...document.querySelectorAll('#listings article')].map(a => a.querySelector('.verify-note')?.textContent);
    const s = stored();
    check('W01', 'All 12 default listings show the full "Not yet verified" line and store verify = Unknown ×3 (no viewing key; decision 2)', notes.length === 12 && notes.every(n => n === ALL_OPEN) && s.listings.every(l => ['permission', 'fees', 'host'].every(k => l.verify?.[k] === 'Unknown') && !('viewing' in l.verify)), `notes=${JSON.stringify([...new Set(notes)])}`);
    const fit = card('B05').querySelectorAll('.check-pill'), bg = getComputedStyle(fit[0]).backgroundColor, fg = getComputedStyle(fit[0]).color, labels = [...fit].map(p => p.textContent);
    const miss = card('B07').querySelector('.check-pill.gap'), missBg = getComputedStyle(miss).backgroundColor;
    check('W02', 'Matching labels are neutral ("Matches your dates", "Rent in range (excl. fees)"); mismatch styling unchanged', labels[0] === 'Matches your dates' && labels[1] === 'Rent in range (excl. fees)' && bg === 'rgb(238, 241, 239)' && fg === getComputedStyle(document.body).color && missBg === 'rgb(252, 238, 238)' && !/✓ Dates fit|Within rent range/.test($('listings').textContent), `labels=${labels} bg=${bg} fg=${fg} missBg=${missBg}`);
  });
  run(() => {
    reset(); setVerify('B05', {permission: 'Verified'});
    const ev = latest();
    check('W03', 'B05 permission → Verified: drops out of the card line and the log records Unknown → Verified', verifyNote('B05') === 'Not yet verified: fees · viewing · host' && stored().listings.find(l => l.id === 'B05').verify.permission === 'Verified' && hasChange(ev, 'permission check', 'Unknown', 'Verified') && /B05: updated permission check\./.test(ev.text), `note="${verifyNote('B05')}" event="${ev.text}" changes=${JSON.stringify(ev.details?.changes)}`);
    setVerify('B05', {fees: 'Claimed'});
    const claimed = verifyNote('B05');
    setVerify('B05', {fees: 'Verified', viewing: 'Verified', host: 'Verified'});
    check('W04', '"Claimed" still counts as not verified; all four Verified shows "All four checks verified"', claimed === 'Not yet verified: fees · viewing · host' && verifyNote('B05') === 'All four checks verified' && hasChange(latest(), 'host check', 'Unknown', 'Verified'), `claimed="${claimed}" all="${verifyNote('B05')}"`);
  });
  run(() => {
    reset(); const start = $('choice-warning').textContent;
    setVerify('B05', {permission: 'Verified', fees: 'Verified'}); const two = $('choice-warning').textContent;
    setVerify('B05', {viewing: 'Verified'}); const one = $('choice-warning').textContent;
    setVerify('B05', {host: 'Verified'}); const none = $('choice-warning').textContent;
    check('W05', 'First-choice note when it fits: lists what is unverified, then disappears when all four are verified', start === 'B05 fits your needs. Not verified yet: permission, fees, viewing and host.' && two === 'B05 fits your needs. Not verified yet: viewing and host.' && one === 'B05 fits your needs. Not verified yet: host.' && none === '' && $('choice-warning').querySelector('.caution') === null, `start="${start}" two="${two}" one="${one}" none="${none}"`);
  });
  run(() => {
    reset(); setVerify('B05', {permission: 'Verified'}); edit('B05', {end: '2026-08-13'});
    const w = $('choice-warning').textContent;
    check('W06', 'Outside-needs warning also names what is unverified', /B05 is outside your needs: ends 2 nights early\. Not verified yet: fees, viewing and host\. Your saved choice and notes are kept\./.test(w), `warn="${w}"`);
  });
  run(() => {
    reset(); openAdd(); const blank = ['permission', 'fees', 'host'].every(k => $('listing-verify-' + k).value === 'Unknown') && $('listing-viewing-status').textContent === 'Viewing: Not yet — set in Safety checks';
    fill({...ASTORIA, 'verify-permission': 'Claimed'}); submitListing();
    const u = stored().listings.find(l => l.id === 'U01').verify;
    check('W07', 'Add a listing starts at Unknown ×3 plus viewing "Not yet" (read-only) and saves the chosen levels', blank && u.permission === 'Claimed' && u.fees === 'Unknown' && verifyNote('U01') === ALL_OPEN, `blank=${blank} verify=${JSON.stringify(u)}`);
  });
  run(() => {
    reset(); setVerify('B02', {viewing: 'Verified'});
    const {data} = captureExport(() => $('export-session').click());
    const b02 = data.workspace.listings.find(l => l.id === 'B02');
    check('W08', 'Export workspace includes each listing\'s verify record; viewing is exported as safety.viewedBeforePaying (decision 2)', b02.safety.viewedBeforePaying === 'Done' && !('viewing' in b02.verify) && b02.verify.permission === 'Unknown' && data.workspace.listings.every(l => l.verify), `b02=${JSON.stringify(b02.verify)}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-edit="B06"]').click();
    const labelled = ['permission', 'fees', 'host'].every(k => { const sel = $('listing-verify-' + k); return sel.tagName === 'SELECT' && document.querySelector(`label[for="listing-verify-${k}"]`) && [...sel.options].map(o => o.value).join() === 'Unknown,Claimed,Verified'; }) && !$('listing-verify-viewing') && $('listing-viewing-status').tagName === 'OUTPUT' && !!document.querySelector('label[for="listing-viewing-status"]');
    const legend = $('listing-dialog').querySelector('.verify-fields legend')?.textContent;
    $('listing-checks').value = 'Ask about the building intercom'; $('listing-form').requestSubmit();
    check('W09', 'Verification section has 3 labelled selects and a labelled read-only Live viewing (decision 2); the free-text notes field still saves', labelled && legend === 'Verification' && stored().listings.find(l => l.id === 'B06').checks === 'Ask about the building intercom' && /Ask about the building intercom/.test(card('B06').textContent), `labelled=${labelled} legend=${legend}`);
  });

  // --- P2-7 (second half): last contacted and updated time. Date.now is replaced with a fixed local time. ---
  const withClock = (local, fn) => { const real = Date.now, at = new Date(local).getTime(); Date.now = () => at; try { return fn(); } finally { Date.now = real; } };
  const contactLine = id => card(id).querySelector('.contact-line').textContent;
  const updatedLine = id => card(id).querySelector('.updated-line').textContent;
  run(() => {
    reset(); view('all');
    const lines = [...document.querySelectorAll('#listings article')].map(a => [a.querySelector('.contact-line .contact-since')?.textContent, a.querySelector('.updated-line')?.textContent]);
    check('K01', 'By default every card says "Last contact: Not recorded" and "Updated: Not recorded"', lines.length === 12 && lines.every(([c, u]) => c === ' · Last contact: Not recorded' && u === 'Updated: Not recorded') && contactLine('B02') === 'Waiting · Last contact: Not recorded', `sample=${JSON.stringify(lines[1])}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-edit="B02"]').click();
    const input = $('listing-lastContacted'), shape = input.type === 'datetime-local' && !input.required && !!document.querySelector('label[for="listing-lastContacted"]') && input.value === '';
    withClock('2026-10-27T12:00', () => $('last-contacted-now').click());
    const filled = input.value; $('listing-dialog').close();
    check('K02', 'Optional datetime-local field with a label; "Set to now" fills the current local time', shape && filled === '2026-10-27T12:00', `shape=${shape} filled=${filled}`);
  });
  run(() => {
    reset();
    const seen = withClock('2026-10-27T12:00', () => [['2026-10-25T09:00'], ['2026-10-26T11:00'], ['2026-10-27T07:00'], ['2026-10-27T11:00'], ['2026-10-27T11:30']].map(([v]) => { edit('B02', {lastContacted: v}); return contactLine('B02'); }));
    check('K03', 'Days and hours are counted from the real clock (fixed at Oct 27 12:00): 2 days, 1 day, 5 hours, 1 hour, under an hour', JSON.stringify(seen) === JSON.stringify(['Waiting · 2 days since last contact', 'Waiting · 1 day since last contact', 'Waiting · 5 hours since last contact', 'Waiting · 1 hour since last contact', 'Waiting · Less than an hour since last contact']), `seen=${JSON.stringify(seen)}`);
  });
  run(() => {
    reset();
    withClock('2026-10-27T12:00', () => edit('B02', {lastContacted: '2026-10-25T09:00'}));
    const later = withClock('2026-10-30T12:00', () => { view('matches'); view('all'); return contactLine('B02'); });
    check('K04', 'The elapsed time moves with the clock (3 days later shows 5 days)', later === 'Waiting · 5 days since last contact', `later="${later}"`);
  });
  run(() => {
    reset();
    const stamp = withClock('2026-10-27T12:00', () => { edit('B02', {action: 'Updated-at test'}); return {iso: stored().listings.find(l => l.id === 'B02').updatedAt, line: updatedLine('B02')}; });
    const nextYear = withClock('2027-02-01T09:00', () => { view('matches'); view('all'); return updatedLine('B02'); });
    check('K05', 'Saving records updatedAt (ISO) and the card shows "Updated Oct 27" (with the year once it is a different year)', stamp.iso === new Date('2026-10-27T12:00').toISOString() && stamp.line === 'Updated Oct 27' && nextYear === 'Updated Oct 27, 2026', `iso=${stamp.iso} line="${stamp.line}" nextYear="${nextYear}"`);
    const before = stored().listings.find(l => l.id === 'B02').updatedAt;
    withClock('2026-10-28T12:00', () => edit('B02', {}));
    check('K06', 'Saving with no changes does not move updatedAt', stored().listings.find(l => l.id === 'B02').updatedAt === before && /No changes to save/.test($('toast').textContent), `after=${stored().listings.find(l => l.id === 'B02').updatedAt}`);
  });
  run(() => {
    reset();
    withClock('2026-10-27T12:00', () => { edit('B02', {lastContacted: '2026-10-25T09:00'}); });
    const first = latest();
    withClock('2026-10-27T12:00', () => { edit('B02', {lastContacted: '2026-10-26T18:30'}); });
    check('K07', 'The log records last contacted old → new', hasChange(first, 'last contacted', '', '2026-10-25T09:00') && hasChange(latest(), 'last contacted', '2026-10-25T09:00', '2026-10-26T18:30') && /last contacted: \(empty\) → 2026-10-25T09:00/.test($('activity-list').textContent), `first=${JSON.stringify(first.details?.changes)}`);
  });
  run(() => {
    reset();
    const r = withClock('2026-10-27T12:00', () => { view('all'); document.querySelector('[data-edit="B02"]').click(); $('listing-lastContacted').value = '2026-10-28T09:00'; $('listing-form').requestSubmit(); const out = {open: $('listing-dialog').open, err: $('listing-error').textContent}; $('listing-dialog').close(); return out; });
    check('K08', 'A last-contacted time in the future is rejected on the page', r.open && /cannot be in the future/.test(r.err) && !stored().listings.find(l => l.id === 'B02').lastContacted, `r=${JSON.stringify(r)}`);
  });
  run(() => {
    reset();
    const r = withClock('2026-10-27T12:00', () => { addListing({lastContacted: '2026-10-27T10:00', contact: 'Waiting'}); const u = stored().listings.find(l => l.id === 'U01'); return {u, line: contactLine('U01'), upd: updatedLine('U01')}; });
    check('K09', 'Added listings record updatedAt and last contacted', r.u.updatedAt === new Date('2026-10-27T12:00').toISOString() && r.u.lastContacted === '2026-10-27T10:00' && r.line === 'Waiting · 2 hours since last contact' && r.upd === 'Updated Oct 27', `line="${r.line}" upd="${r.upd}"`);
  });
  run(() => {
    reset(); withClock('2026-10-27T12:00', () => edit('B02', {lastContacted: '2026-10-27T11:00'}));
    $('demo-open').click(); $('deliver-reminder').click();
    check('K10', 'The B02 demo reminder is unchanged and still marked Simulated, whatever last contacted says', /simulated Apr 27, 2026, 21:00 checkpoint/.test(reminderMsg().textContent) && /Simulated/.test(reminderMsg().querySelector('.message-meta').textContent) && !!strip('B02'), `meta="${reminderMsg().querySelector('.message-meta').textContent}"`);
  });

  // --- R-1 (provisional rule): Closed listings leave Matches but stay in All saved ---
  const vis = () => $('listing-visibility').textContent;
  run(() => {
    reset(); view('matches');
    document.querySelector('[data-edit="B06"]').click(); $('listing-contact').value = 'Closed'; $('listing-form').requestSubmit();
    const toast = toastMessage();
    const m = +$('matches-count').textContent, saved = $('saved-count').textContent, text = vis(), inMatches = ids().includes('B06');
    view('all');
    const c = document.querySelector('[aria-label^="B06 "]'), pill = c.querySelector('.contact-pill'), notContacted = document.querySelector('[aria-label^="B03 "] .contact-pill');
    const look = {closed: c.classList.contains('closed'), opacity: getComputedStyle(c).opacity, pill: pill.textContent, pillBg: getComputedStyle(pill).backgroundColor, otherBg: getComputedStyle(notContacted).backgroundColor};
    check('Y01', 'B06 → Closed: Matches 9 → 8, All saved stays 12, status line counts it separately, card dimmed with a distinct label', m === 8 && saved === '12' && !inMatches && text === 'Showing 8 of 12 saved. 1 closed, 3 outside your needs.' && look.closed && look.opacity === '0.72' && look.pill === 'Closed · no longer considering' && look.pillBg === 'rgb(61, 74, 78)' && look.pillBg !== look.otherBg && toast === 'B06 marked Closed. It stays in All saved.', `m=${m} saved=${saved} text="${text}" look=${JSON.stringify(look)} toast="${toast}"`);
    edit('B06', {contact: 'Replied'}); view('matches');
    const back = {m: +$('matches-count').textContent, text: vis(), inMatches: ids().includes('B06')}; const c2 = card('B06');
    check('Y02', 'Back to Replied: everything returns to normal', back.m === 9 && back.inMatches && back.text === 'Showing 9 of 12 saved. 3 outside your needs.' && !c2.classList.contains('closed') && getComputedStyle(c2).opacity === '1' && c2.querySelector('.contact-pill').textContent === 'Replied', `back=${JSON.stringify(back)}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); edit('B06', {contact: 'Closed'}); view('matches');
    check('Y03', 'Example from the rule: $0–$2,000 with B06 closed reads "Showing 7 of 12 saved. 1 closed, 4 outside your needs."', vis() === 'Showing 7 of 12 saved. 1 closed, 4 outside your needs.' && $('matches-count').textContent === '7', `text="${vis()}"`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2200); edit('B10', {contact: 'Closed'}); view('matches');
    check('Y04', 'A listing that is both Closed and outside your needs is counted once, as closed (9 + 1 + 2 = 12)', vis() === 'Showing 9 of 12 saved. 1 closed, 2 outside your needs.', `text="${vis()}"`);
  });
  run(() => {
    reset(); view('matches'); edit('B05', {contact: 'Closed'}); view('matches');
    const w = $('choice-warning').textContent, s = stored();
    check('Y05', 'Closed first choice is kept and warned about', /^B05 is marked Closed\. Your choice and notes are kept\./.test(w) && !!$('choice-warning').querySelector('[data-choice-show-all]') && s.choice === 'B05' && s.note === ORIGINAL, `warn="${w}" choice=${s.choice}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-edit="B02"]').click();
    const opt = [...$('listing-contact').options].find(o => o.value === 'Closed');
    $('listing-contact').value = 'Closed'; $('listing-form').requestSubmit();
    check('Y06', 'Dropdown shows "Closed (rented out / not considering)" but still saves the value "Closed"', opt && opt.textContent === 'Closed (rented out / not considering)' && stored().listings.find(l => l.id === 'B02').contact === 'Closed', `text="${opt?.textContent}" saved=${stored().listings.find(l => l.id === 'B02').contact}`);
  });
  run(() => {
    reset(); addReminder(); edit('B02', {contact: 'Closed'}); view('matches');
    const leftMatches = !ids().includes('B02');
    check('Y07', 'P2-1 unchanged: with B02 Closed the reminder is outdated and not counted, and B02 leaves Matches', /B02 is now Closed/.test(reminderMsg().textContent) && unread() === '0' && !strip('B02') && leftMatches, `unread=${unread()} leftMatches=${leftMatches}`);
  });
  run(() => {
    reset(); view('matches'); addListing({contact: 'Closed'});
    check('Y08', 'Adding a listing as Closed tells the user it is in All saved', $('toast').textContent === 'U01 added as Closed; find it in All saved.' && !ids().includes('U01') && $('saved-count').textContent === '13', `toast="${$('toast').textContent}"`);
  });
  run(() => {
    reset(); edit('B06', {contact: 'Closed'}); view('all'); const c = card('B06');
    c.querySelector('[data-edit]').focus();
    check('Y09', 'A dimmed Closed card returns to full opacity while it has keyboard focus', getComputedStyle(c).opacity === '1', `opacity=${getComputedStyle(c).opacity}`);
  });
  run(() => {
    reset(); for (const id of ['B05', 'B02', 'B03', 'B06', 'B07', 'B08', 'B09', 'B10', 'B11', 'B12', 'B13', 'B14']) edit(id, {contact: 'Closed'}); view('matches');
    check('Y10', 'If every listing is Closed, Matches is empty with a recovery button and the reason is stated', ids().length === 0 && !!document.querySelector('.listing-empty [data-show-all]') && vis() === 'Showing 0 of 12 saved. 12 closed.' && /No open saved listing/.test(document.querySelector('.listing-empty').textContent), `text="${vis()}"`);
  });

  // --- P2-9: compact rows, sorting, bottom navigation (1280px window) ---
  const PREF_KEY = 'shortstay-cp3-view-prefs';
  const rowOf = id => document.querySelector(`[data-row="${id}"]`);
  const sortBy = v => { $('sort-listings').value = v; $('sort-listings').dispatchEvent(new Event('change')); return ids(); };
  run(() => {
    reset(); localStorage.removeItem(PREF_KEY); $('density-detailed').click();
    check('M01', '1280px: Detailed is pressed by default and the bottom navigation is hidden', $('density-detailed').getAttribute('aria-pressed') === 'true' && !$('listings').classList.contains('compact') && getComputedStyle(document.querySelector('.bottom-nav')).display === 'none', `nav=${getComputedStyle(document.querySelector('.bottom-nav')).display}`);
    $('density-compact').click(); view('all');
    const rows = [...document.querySelectorAll('#listings .compact-row')], b05 = rowOf('B05').textContent, body = $('body-B05');
    check('M02', 'Compact: one row per listing with ID, area, rent, date status, contact and unverified count; saved to its own key', rows.length === 12 && rows.every(r => r.getAttribute('aria-expanded') === 'false') && body.hidden && b05 === '★ B05Inwood$1,900/moDates matchReplied4 unverified' && JSON.parse(localStorage.getItem(PREF_KEY)).density === 'compact' && $('density-compact').getAttribute('aria-pressed') === 'true', `rows=${rows.length} b05="${b05}" saved=${localStorage.getItem(PREF_KEY)}`);
    const b07 = rowOf('B07').textContent;
    check('M03', 'Compact rows show gaps ("Starts 9 nights late") and contact status', /Starts 9 nights late/.test(b07) && rowOf('B07').querySelector('.row-dates.gap') && /Waiting/.test(b07), `b07="${b07}"`);
    rowOf('B05').click();
    const opened = rowOf('B05').getAttribute('aria-expanded') === 'true' && !$('body-B05').hidden && !!$('body-B05').querySelector('[data-edit="B05"]');
    document.querySelector('[data-choose="B02"]').click(); view('matches'); view('all');
    const kept = rowOf('B05').getAttribute('aria-expanded') === 'true' && !$('body-B05').hidden;
    rowOf('B05').click();
    check('M04', 'Clicking a row expands the full card (aria-expanded), it stays open across re-renders, and a second click closes it', opened && kept && rowOf('B05').getAttribute('aria-expanded') === 'false' && $('body-B05').hidden, `opened=${opened} kept=${kept}`);
    $('density-detailed').click();
  });
  run(() => {
    reset(); view('all');
    const label = document.querySelector('label[for="sort-listings"]')?.textContent, opts = [...$('sort-listings').options].map(o => o.textContent).join('|');
    const rent = sortBy('rent').join(), datefit = sortBy('datefit').join(), contact = sortBy('contact').join(), plain = sortBy('default').join();
    check('M05', 'Sort select is labelled and offers the five orders', label === 'Sort by' && opts === 'Default|Rent (low→high)|Date fit first|Contact status|Recently updated', `label=${label} opts=${opts}`);
    check('M06', 'Rent (low→high), Date fit first and Contact status orders are correct and stable', rent === 'B13,B14,B09,B07,B06,B11,B05,B08,B02,B12,B03,B10' && datefit === 'B05,B02,B03,B06,B08,B09,B10,B12,B13,B14,B11,B07' && contact === 'B05,B06,B08,B12,B13,B02,B07,B11,B03,B09,B10,B14' && plain === 'B05,B02,B03,B06,B07,B08,B09,B10,B11,B12,B13,B14', `rent=${rent} datefit=${datefit} contact=${contact}`);
    const noDates = sortBy('updated').join();
    withClock('2026-10-27T10:00', () => edit('B09', {action: 'u1'})); withClock('2026-10-27T11:00', () => edit('B14', {action: 'u2'}));
    view('matches'); view('all'); const recent = ids().join();
    check('M07', 'Recently updated: original order when nothing has updatedAt, then newest first with the rest in original order', noDates === plain && recent === 'B14,B09,B05,B02,B03,B06,B07,B08,B10,B11,B12,B13', `recent=${recent}`);
    view('matches'); const matchesSorted = ids().join(); sortBy('rent'); const matchesRent = ids().join();
    check('M08', 'Sorting also applies in Matches and is saved with the layout preference', matchesSorted.startsWith('B14,B09') && matchesRent === 'B13,B14,B09,B06,B05,B08,B02,B12,B03' && JSON.parse(localStorage.getItem(PREF_KEY)).sort === 'rent', `matches=${matchesSorted} rent=${matchesRent}`);
    sortBy('default');
  });
  run(() => {
    reset(); const realSet = Storage.prototype.setItem; let threw = false;
    Storage.prototype.setItem = function (k, v) { if (k === PREF_KEY) throw new DOMException('blocked', 'SecurityError'); return realSet.call(this, k, v); };
    try { $('density-compact').click(); sortBy('rent'); } catch (e) { threw = true; } finally { Storage.prototype.setItem = realSet; }
    const ok = !threw && $('density-compact').getAttribute('aria-pressed') === 'true' && ids()[0] === 'B13';
    $('density-detailed').click(); sortBy('default');
    check('M09', 'If the preference cannot be saved, the toggle and sort still work (try/catch)', ok, `threw=${threw}`);
  });
  run(() => {
    reset(); $('density-compact').click(); view('all'); rowOf('B02').click();
    document.querySelector('[data-edit="B02"]').click(); $('listing-action').value = 'Compact save'; $('listing-form').requestSubmit();
    const f1 = document.activeElement === document.querySelector('[data-edit="B02"]');
    rowOf('B02').click(); edit('B05', {end: '2026-08-13'}); view('matches'); document.querySelector('[data-choice-show-all]').click();
    const f2 = document.activeElement === rowOf('B05');
    $('density-detailed').click();
    check('M10', 'Compact keeps focus sensible: after saving an open row, Review & update; View in All saved focuses the first-choice row', f1 && f2, `f1=${f1} f2=${f2} focus=${document.activeElement.className}`);
  });
  run(() => check('M11', 'Bottom navigation exists with a label but is hidden above 720px', document.querySelector('.bottom-nav')?.getAttribute('aria-label') === 'Quick links' && getComputedStyle(document.querySelector('.bottom-nav')).display === 'none' && parseFloat(getComputedStyle(document.body).paddingBottom) === 0, `display=${getComputedStyle(document.querySelector('.bottom-nav')).display}`));

  // --- Next up: hints between the needs bar and the shortlist, built only from saved data ---
  const FACTS = 'B05: dates and rent match; every check is marked by you. ShortStay doesn’t verify these — review them before paying.';
  const VERDICT = /\bsafe\b|ready to pay|all clear|nothing urgent|all checks are verified/i;
  const saved = () => localStorage.getItem('shortstay-cp3-demo-v1');
  const closeListing = () => { $('listing-dialog').querySelector('.dialog-footer [data-close]').click(); };
  run(() => {
    reset();
    const sec = $('next-up'), heading = $(sec?.getAttribute('aria-labelledby') || ''), items = nextShown();
    const placed = document.querySelector('.needs-bar').nextElementSibling === sec && sec.nextElementSibling === $('shortlist');
    check('NU01', 'After reset: Next up sits between needs and shortlist, is labelled by its heading, and lists B05\'s payment safety, then its unverified checks', placed && heading?.textContent === 'Next up' && items.length === 2 && items[0].kind === 'Safety' && items[0].text === 'Don’t pay for B05 before a live viewing. Pay only by a traceable method (no gift cards, crypto or unexplained transfer requests).' && items[1].kind === 'Checks' && items[1].text === 'B05 — Not verified yet: permission, fees, viewing and host.' && items[1].button === 'Review B05' && !nextEmpty(), `placed=${placed} heading=${heading?.textContent} items=${JSON.stringify(items)}`);
  });
  run(() => {
    reset(); $('demo-open').click(); $('deliver-host').click();
    const items = nextShown();
    check('NU02', 'After the B05 host message: "1 unread update" with Open updates, after the first-choice checks', items.length === 3 && items[0].kind === 'Safety' && items[1].kind === 'Checks' && items[2].text === '1 unread update' && items[2].button === 'Open updates', `items=${JSON.stringify(items)}`);
    document.querySelector('[data-reviewed="host-b05"]').click(); const reviewed = nextShown().map(i => i.text);
    $('demo-open').click(); $('deliver-reminder').click(); const withReminder = nextShown().map(i => i.text);
    edit('B02', {contact: 'Replied'}); const outdated = nextShown().map(i => i.text);
    check('NU03', 'Reviewed messages and outdated reminders are not counted as unread', !reviewed.some(t => /unread/.test(t)) && withReminder.includes('1 unread update') && !outdated.some(t => /unread/.test(t)), `reviewed=${JSON.stringify(reviewed)} reminder=${JSON.stringify(withReminder)} outdated=${JSON.stringify(outdated)}`);
  });
  run(() => {
    reset(); $('demo-open').click(); $('deliver-host').click(); edit('B05', {end: '2026-08-13'});
    const items = nextShown();
    check('NU04', 'B05 checkout set to 08-13: the first entry is the first-choice gap, ahead of its checks and the unread update', items.length === 4 && items[0].kind === 'First choice' && items[0].text === 'B05 checkout ends 2 nights early' && items[0].button === 'Review B05' && items[1].kind === 'Safety' && items[2].kind === 'Checks' && items[3].text === '1 unread update', `items=${JSON.stringify(items)}`);
  });
  run(() => {
    reset();
    const texts = withClock('2026-10-27T12:00', () => { edit('B02', {lastContacted: '2026-10-24T11:00'}); edit('B11', {lastContacted: '2026-10-25T12:00'}); edit('B06', {lastContacted: '2026-10-20T12:00'}); return nextShown(); });
    const waiting = texts.filter(i => i.kind === 'Waiting');
    check('NU05', 'B02 Waiting, last contacted 3 days ago: "B02 waiting 3 days" appears; exactly 2 days (B11), Replied (B06) or no date (B07) do not count', waiting.length === 1 && waiting[0].text === 'B02 waiting 3 days since last contact' && waiting[0].button === 'Review B02', `items=${JSON.stringify(texts)}`);
  });
  run(() => {
    reset(); $('demo-open').click(); $('deliver-host').click(); edit('B05', {end: '2026-08-13'}); edit('B02', {lastContacted: daysAgo(3)});
    const before = saved(), seen = {};
    const open = (text, key) => { nextButton(text).click(); seen[key] = {open: $('listing-dialog').open, id: $('listing-dialog-id').textContent.split(' ')[0], title: $('listing-dialog-title').textContent, focus: document.activeElement.id}; closeListing(); };
    open('checkout ends', 'gap'); open('Not verified yet', 'checks'); open('B02 waiting', 'waiting');
    nextButton('unread').click(); seen.updates = document.activeElement.id;
    const ok = seen.gap.open && seen.gap.id === 'B05' && seen.gap.title === 'Inwood' && seen.gap.focus === 'listing-end' && seen.checks.id === 'B05' && seen.checks.focus === 'listing-verify-permission' && seen.waiting.id === 'B02' && seen.waiting.title === 'Manhattan Valley' && seen.waiting.focus === 'listing-contact' && seen.updates === 'inbox-heading';
    check('NU06', 'Buttons open the right listing dialog (focus on the field in question) or move focus to Updates; nothing is changed', ok && saved() === before && !$('listing-dialog').open, `seen=${JSON.stringify(seen)} unchanged=${saved() === before}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-choose="B06"]').click();
    const draft = 'DRAFT-NU07: still comparing commutes';
    typeNote(draft); pickChoice('B14');
    $('demo-open').click(); $('deliver-reminder').click();
    const texts = nextShown().map(i => i.text), before = saved();
    nextButton('reasoning').click();
    check('NU07', 'With an unsaved draft (note + B14), Next up refreshes for the saved B06 and Review reasoning only moves focus; the draft is kept', $('decision-note').value === draft && $('first-choice').value === 'B14' && /Unsaved/.test(status()) && document.activeElement === $('decision-note') && texts[0].startsWith('Don’t pay for B06') && texts[1].startsWith('B06 — Not verified yet:') && texts.includes('1 unread update') && texts.includes('Your reasoning was written for B05; your first choice is B06') && !texts.some(t => /B14/.test(t)) && saved() === before, `texts=${JSON.stringify(texts)} note="${$('decision-note').value}" status="${status()}"`);
  });
  run(() => {
    reset(); edit('B05', {'verify-permission': 'Verified', 'verify-fees': 'Verified', 'verify-host': 'Verified', 'safety-viewedBeforePaying': 'Done', 'safety-traceablePayment': 'Done', 'safety-identityChecked': 'Done', 'safety-writtenAgreement': 'Done', 'safety-priceReasonable': 'N/A'});
    const section = $('next-up').textContent, styled = getComputedStyle(document.querySelector('#next-body .next-empty')).color === getComputedStyle(document.body).color;
    check('NU08', 'Decision 3, everything marked (3 Verified + viewing Done; safety 4 Done + 1 N/A): Next up states the facts ("B05: dates and rent match; every check is marked by you…") in neutral ink, shows no entries, and nowhere says safe / ready to pay / all clear / Nothing urgent', nextEmpty() === FACTS && !nextShown().length && $('next-list').hidden && !VERDICT.test(section) && styled && !/Nothing urgent|all checks are verified/i.test(document.documentElement.innerHTML), `empty="${nextEmpty()}" items=${nextShown().length} styled=${styled}`);
  });
  run(() => {
    reset(); document.querySelector('[data-choose="B05"]').click();
    const prompt = nextEmpty(), texts = nextShown().map(i => i.text);
    document.querySelector('#next-body [data-next-go="choice"]').click();
    check('NU09', 'No first choice: Next up asks the user to pick one (button focuses the first-choice select) and does not say "Nothing urgent"', /^No first choice yet\./.test(prompt) && !prompt.includes('Nothing urgent') && texts.join('|') === 'Your reasoning was written for B05; your first choice is Undecided' && document.activeElement === $('first-choice'), `prompt="${prompt}" texts=${JSON.stringify(texts)}`);
  });
  run(() => {
    busyNext();
    const items = nextShown(), more = document.querySelector('#next-body [data-next-more]');
    check('NU10', 'Priority order and cap: gap, safety, checks, unread, B02 waiting (B07 waiting and reasoning are 6th and 7th and are left out); all 5 visible at 1280px, no Show all', items.map(i => i.kind).join('|') === 'First choice|Safety|Checks|Updates|Waiting' && items[0].text === 'B11 checkout ends 5 nights early' && items[3].text === '2 unread updates' && items[4].text.startsWith('B02 waiting 3 days') && [...document.querySelectorAll('#next-list .next-item')].every(li => li.getClientRects().length) && more && !more.getClientRects().length, `items=${JSON.stringify(items)}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 1800); edit('B05', {contact: 'Closed'});
    const texts = nextShown().map(i => i.text);
    check('NU11', 'Closed and over-budget first choice: both listed first; checks for a Closed listing are not', texts[0] === 'B05 is marked Closed' && texts[1] === 'B05 rent is $100/month above your maximum' && !texts.some(t => /not verified/.test(t)) && stored().listings.find(l => l.id === 'B05').contact === 'Closed' && stored().choice === 'B05', `texts=${JSON.stringify(texts)}`);
  });
  run(() => {
    reset(); $('demo-open').click(); $('deliver-host').click();
    const button = nextButton('unread'); button.focus(); renderOnly();
    check('NU12', 'A re-render with unchanged hints keeps the same Next up buttons, so keyboard focus is not lost', button.isConnected && document.activeElement === button, `connected=${button.isConnected} focus=${document.activeElement.id || document.activeElement.className}`);
  });

  // --- Apply a host-message change: the suggestion is applied only after the user confirms ---
  const applyButton = () => document.querySelector('[data-apply="host-b05"]');
  const b05 = () => stored().listings.find(l => l.id === 'B05');
  const hostMessage = () => stored().messages.find(m => m.id === 'host-b05');
  const applyRows = () => Object.fromEntries([...$('apply-table').querySelectorAll('div')].map(d => [d.querySelector('dt').textContent, d.querySelector('dd').textContent]));
  const deliverHost = () => { $('demo-open').click(); $('deliver-host').click(); };
  run(() => {
    reset(); deliverHost();
    const b = applyButton();
    check('HM01', 'Delivering the host message does not change B05; it carries the suggestion and shows "Apply: checkout Aug 15 → Aug 13"', b05().end === '2026-08-15' && JSON.stringify(hostMessage().suggestion) === JSON.stringify({listing: 'B05', field: 'end', from: '2026-08-15', to: '2026-08-13'}) && b && !b.disabled && b.textContent === 'Apply: checkout Aug 15 → Aug 13' && !!document.querySelector('[data-message-edit="B05"]'), `end=${b05().end} button="${b?.textContent}"`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); deliverHost();
    const before = localStorage.getItem('shortstay-cp3-demo-v1');
    applyButton().click();
    const shown = {open: $('apply-dialog').open, rows: applyRows(), preview: $('apply-preview').textContent, warning: $('apply-warning').textContent, apply: $('apply-confirm').textContent};
    $('apply-dialog').querySelector('.dialog-footer [data-close]').click();
    check('HM02', 'Apply → Cancel: the dialog shows listing, field, old and new value and the match preview; B05 and the message are unchanged', shown.open && shown.rows.Listing === 'B05 · Inwood' && shown.rows.Field === 'Checkout date' && shown.rows['Current value'] === 'Aug 15, 2026' && shown.rows['New value'] === 'Aug 13, 2026' && shown.preview === 'B05 will no longer match your dates: ends 2 nights early.' && !shown.warning && shown.apply === 'Apply change' && !$('apply-dialog').open && localStorage.getItem('shortstay-cp3-demo-v1') === before && b05().end === '2026-08-15' && !hostMessage().reviewed, `shown=${JSON.stringify(shown)}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); view('matches'); deliverHost();
    const matchesBefore = $('matches-count').textContent, unreadBefore = unread();
    applyButton().click(); $('apply-confirm').click();
    const ev = latest(), toastText = toastMessage();
    check('HM03', 'Apply → Apply change: B05 end 08-13, Matches 8 → 7, message read, log entry with old → new, toast says it left Matches', b05().end === '2026-08-13' && matchesBefore === '8' && $('matches-count').textContent === '7' && hostMessage().reviewed === true && unreadBefore === '1' && unread() === '0' && ev.text === 'B05: checkout date updated from host message.' && hasChange(ev, 'checkout date', '2026-08-15', '2026-08-13') && ev.details.message === 'host-b05' && toastText === 'B05 checkout date updated to Aug 13, 2026. It no longer matches your needs and has left Matches; find it in All saved.' && !ids().includes('B05') && !$('apply-dialog').open, `matches=${matchesBefore}→${$('matches-count').textContent} ev=${JSON.stringify(ev)} toast="${toastText}"`);
    const revert = document.querySelector('[data-revert="host-b05"]');
    check('HM04', 'After applying, the Apply button is replaced by an enabled "Revert: checkout Aug 13 → Aug 15"; the manual "Update B05 details →" entry is still there', !applyButton() && revert?.textContent === 'Revert: checkout Aug 13 → Aug 15' && !revert.disabled && /Update B05 details/.test(document.querySelector('[data-message-edit="B05"]').textContent), `revert="${revert?.textContent}"`);
  });
  run(() => {
    reset(); deliverHost(); edit('B05', {end: '2026-08-13'});
    check('HM05', 'B05 edited by hand to 08-13: the button shows "Already updated" and is disabled', applyButton().textContent === 'Already updated' && applyButton().disabled && !hostMessage().reviewed, `button="${applyButton().textContent}"`);
  });
  run(() => {
    reset(); deliverHost(); edit('B05', {end: '2026-08-10'});
    applyButton().click();
    const shown = {rows: applyRows(), warning: $('apply-warning').textContent, enabled: !$('apply-confirm').disabled};
    $('apply-confirm').click();
    check('HM06', 'B05 edited by hand to 08-10: the dialog warns "Current value differs from the message", shows Aug 10 as current, and applying still sets 08-13', /^Current value differs from the message\./.test(shown.warning) && /expected Aug 15, 2026; this listing now says Aug 10, 2026/.test(shown.warning) && shown.rows['Current value'] === 'Aug 10, 2026' && shown.enabled && b05().end === '2026-08-13' && hasChange(latest(), 'checkout date', '2026-08-10', '2026-08-13'), `shown=${JSON.stringify(shown)} end=${b05().end}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); deliverHost();
    const draft = 'DRAFT-HM07: comparing B05 and B13';
    typeNote(draft); pickChoice('B13');
    applyButton().click(); $('apply-confirm').click();
    check('HM07', 'Applying the change keeps an unsaved decision draft (note and choice)', b05().end === '2026-08-13' && $('decision-note').value === draft && $('first-choice').value === 'B13' && /Unsaved/.test(status()) && stored().choice === 'B05' && stored().note === ORIGINAL_NOTE, `note="${$('decision-note').value}" choice=${$('first-choice').value} status="${status()}"`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-13', 0, 2200); deliverHost();
    applyButton().click(); const fits = $('apply-preview').textContent; $('apply-confirm').click(); const fitsToast = toastMessage();
    reset(); setNeeds('2026-06-01', '2026-08-31', 0, 2200); deliverHost();
    applyButton().click(); const outside = $('apply-preview').textContent; $('apply-dialog').close();
    check('HM08', 'Other previews: still fits (needs end 08-13) and still outside (needs end 08-31) are worded accordingly', fits === 'B05 will still match your needs.' && /It still matches your needs\.$/.test(fitsToast) && outside === 'B05 will still be outside your dates: ends 18 nights early.', `fits="${fits}" toast="${fitsToast}" outside="${outside}"`);
  });

  // --- Safety checks: five user-owned reminders per listing, never verified by ShortStay ---
  const SAFETY = ['viewedBeforePaying', 'identityChecked', 'writtenAgreement', 'traceablePayment', 'priceReasonable'];
  const safetyLine = id => card(id).querySelector('.safety-note')?.textContent || '';
  const safetyWarn = () => $('safety-warning').textContent;
  const FOLLOW_UP = 'Payment checks marked done. Still open: identity checked, written agreement and price reasonable.';
  const NO_VIEWING = 'Don’t pay for B05 before a live viewing.', TRACEABLE = 'Pay only by a traceable method (no gift cards, crypto or unexplained transfer requests).';
  run(() => {
    reset(); view('all');
    const lines = [...document.querySelectorAll('#listings article .safety-note')].map(p => p.textContent);
    check('SF01', 'All 12 default listings say "Safety: 0 of 5 done" and store Not yet ×5', lines.length === 12 && lines.every(t => t === 'Safety: 0 of 5 done') && stored().listings.every(l => SAFETY.every(k => l.safety?.[k] === 'Not yet')), `lines=${JSON.stringify(lines.slice(0, 2))} n=${lines.length}`);
  });
  run(() => {
    reset(); edit('B06', {'safety-identityChecked': 'Done'});
    const one = safetyLine('B06'), first = latest();
    edit('B06', {'safety-priceReasonable': 'N/A'});
    const still = safetyLine('B06'), second = latest();
    check('SF02', 'Changing one item updates the card count and the log records old → new (N/A does not count as done)', one === 'Safety: 1 of 5 done' && first.text === 'B06: updated safety: identity checked.' && hasChange(first, 'safety: identity checked', 'Not yet', 'Done') && still === 'Safety: 1 of 5 done' && hasChange(second, 'safety: price reasonable', 'Not yet', 'N/A') && stored().listings.find(l => l.id === 'B06').safety.priceReasonable === 'N/A' && /safety: identity checked: Not yet → Done/.test($('activity-list').textContent), `one="${one}" still="${still}" first=${JSON.stringify(first)}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-edit="B02"]').click();
    const set = $('listing-dialog').querySelector('.safety-fields'), selects = SAFETY.map(k => $('listing-safety-' + k));
    const labelled = selects.every(el => el && document.querySelector(`label[for="${el.id}"]`) && $(el.getAttribute('aria-describedby').split(' ')[0])?.textContent.length > 10 && [...el.options].map(o => o.value).join('|') === (['viewedBeforePaying', 'traceablePayment'].some(k => el.id.endsWith(k)) ? 'Not yet|Done' : 'Not yet|Done|N/A') && el.value === 'Not yet');
    const note = set?.textContent || ''; $('listing-dialog').close();
    check('SF03', 'Edit dialog has a "Safety checks" section: 5 labelled selects with a short description each (the 2 payment checks without N/A, decision 1), and says ShortStay does not verify hosts or give legal advice', set?.querySelector('legend')?.textContent === 'Safety checks' && labelled && /does not verify hosts or identities and does not give legal advice/.test(note), `labelled=${labelled}`);
  });
  run(() => {
    reset();
    const start = {warn: safetyWarn(), next: nextShown().find(i => i.kind === 'Safety')?.text};
    edit('B05', {'safety-viewedBeforePaying': 'Done'}); const viewed = {warn: safetyWarn(), next: nextShown().find(i => i.kind === 'Safety')?.text};
    edit('B05', {'safety-traceablePayment': 'Done'}); const both = {warn: safetyWarn(), next: nextShown().find(i => i.kind === 'Safety')};
    check('SF04', 'First choice B05 without "viewed before paying": the decision warning and Next up both say "Don’t pay for B05 before a live viewing."; once both payment checks are Done My decision shows a neutral grey line naming the 3 open safety checks and Next up a caution', start.warn === `${NO_VIEWING} ${TRACEABLE}` && start.next === start.warn && viewed.warn === 'Pay for B05 only by a traceable method (no gift cards, crypto or unexplained transfer requests).' && viewed.next === viewed.warn && both.warn === FOLLOW_UP && both.next?.text === 'B05: 3 safety checks still open (identity, written agreement, price)' && !!$('safety-warning').querySelector('.choice-warning.neutral') && !$('safety-warning').querySelector('.choice-warning:not(.neutral)') && !!$('choice-warning').textContent, `both=${JSON.stringify({warn: both.warn, next: both.next?.text})} start=${JSON.stringify(start)} viewed=${JSON.stringify(viewed)}`);
  });
  run(() => {
    reset(); const before = localStorage.getItem('shortstay-cp3-demo-v1');
    nextButton('Don’t pay').click();
    const r = {id: $('listing-dialog-id').textContent.split(' ')[0], focus: document.activeElement.id}; $('listing-dialog').close();
    typeNote('DRAFT-SF05'); pickChoice('B14'); const draftWarn = safetyWarn(), nextStill = nextShown()[0].text;
    edit('B05', {contact: 'Closed'}); pickChoice('B05'); const closed = safetyWarn();
    check('SF05', 'Next up Safety button opens B05 with focus on "Viewed before paying"; the decision warning follows the dropdown draft while Next up keeps the saved choice; no warning for a Closed listing', r.id === 'B05' && r.focus === 'listing-safety-viewedBeforePaying' && localStorage.getItem('shortstay-cp3-demo-v1') !== null && draftWarn.startsWith('Don’t pay for B14') && nextStill.startsWith('Don’t pay for B05') && !closed && $('decision-note').value === 'DRAFT-SF05', `r=${JSON.stringify(r)} draft="${draftWarn}" closed="${closed}" before=${!!before}`);
  });
  run(() => {
    reset(); addListing({'safety-writtenAgreement': 'Done', 'safety-traceablePayment': 'Done'});
    const u = stored().listings.find(l => l.id === 'U01').safety, line = safetyLine('U01');
    const {data} = captureExport(() => $('export-session').click());
    const exported = data.workspace.listings.find(l => l.id === 'U01').safety;
    check('SF06', 'An added listing saves its safety choices (others Not yet), and the export JSON includes safety for every listing', u.writtenAgreement === 'Done' && u.traceablePayment === 'Done' && u.viewedBeforePaying === 'Not yet' && line === 'Safety: 2 of 5 done' && JSON.stringify(exported) === JSON.stringify(u) && data.workspace.listings.every(l => l.safety && Object.keys(l.safety).length === 5), `u=${JSON.stringify(u)} line="${line}"`);
  });
  run(() => {
    const toggle = $('safety-toggle'), body = $('safety-body');
    toggle.focus(); const focusable = document.activeElement === toggle && toggle.tagName === 'BUTTON' && toggle.type === 'button';
    const closed = toggle.getAttribute('aria-expanded') === 'false' && body.hidden && toggle.getAttribute('aria-controls') === 'safety-body';
    toggle.click(); const opened = toggle.getAttribute('aria-expanded') === 'true' && !body.hidden && body.getClientRects().length > 0;
    const tips = body.querySelectorAll('.safety-tips li').length, text = body.textContent, links = [...body.querySelectorAll('a[href]')].length;
    toggle.click(); const again = toggle.getAttribute('aria-expanded') === 'false' && body.hidden && document.activeElement === toggle;
    check('SF07', 'Safety tips: a native button (Enter/Space) toggles aria-expanded and the panel open and closed; 6 tips, the disclaimer, and the unlinked placeholder "Columbia housing resources (link to be added)"', focusable && closed && opened && again && tips === 6 && /does not verify hosts or identities and does not give legal advice/.test(text) && /Columbia housing resources \(link to be added\)/.test(text) && links === 0 && $('safety-heading').contains(toggle), `focusable=${focusable} closed=${closed} opened=${opened} again=${again} tips=${tips} links=${links}`);
  });
  run(() => {
    reset();
    const html = document.documentElement.innerHTML;
    check('SF08', 'The placeholder carries a TODO comment for the team and no invented Columbia URL', /TODO: the team needs to add a verified, official Columbia University housing resources link/.test(html) && !/columbia\.edu/i.test(html), `todo=${/TODO: the team/.test(html)}`);
  });

  // --- Empty workspace and first-use tips ---
  const startEmpty = () => { $('demo-open').click(); $('empty-open').click(); $('empty-confirm').click(); };
  run(() => {
    reset(); $('demo-open').click(); $('deliver-host').click(); edit('B02', {action: 'something to clear'});
    $('demo-open').click(); $('empty-open').click();
    const dialog = {open: $('empty-dialog').open, text: $('empty-dialog').textContent, logNote: $('empty-log-note').textContent};
    $('empty-confirm').click();
    const s = stored(), ev = s.events[0];
    check('EW01', 'Start empty workspace: the confirmation says current data is cleared; afterwards 0 listings, no messages, no choice or reasoning, default needs, mode empty, log entry "Empty workspace started"', dialog.open && /clears the current data/.test(dialog.text) && /activity log \(\d+ entries\) will also be cleared/.test(dialog.logNote) && !$('empty-dialog').open && s.mode === 'empty' && s.listings.length === 0 && s.messages.length === 0 && s.choice === '' && s.note === '' && JSON.stringify(s.needs) === JSON.stringify({start: '2026-06-01', end: '2026-08-15', budgetMin: 0, budgetMax: 2200}) && s.events.length === 1 && /^Empty workspace started\. The previous session had \d+ log entries/.test(ev.text) && ev.role === 'Operator' && $('saved-count').textContent === '0' && /Start your shortlist/.test($('listings').textContent) && !!document.querySelector('[data-add-first]') && $('decision-note').value === '' && $('first-choice').value === '', `dialog=${JSON.stringify(dialog).slice(0, 120)} ev="${ev?.text}" n=${s.listings.length}`);
  });
  run(() => {
    reset(); startEmpty();
    let blob = null; const realURL = URL.createObjectURL, realClick = HTMLAnchorElement.prototype.click;
    $('demo-open').click(); $('empty-open').click();
    URL.createObjectURL = b => { blob = b; return 'blob:qa'; }; HTMLAnchorElement.prototype.click = function () {};
    try { $('empty-export').click(); } finally { URL.createObjectURL = realURL; HTMLAnchorElement.prototype.click = realClick; }
    const note = $('empty-log-note').textContent; $('empty-dialog').close();
    check('EW02', 'The empty-workspace dialog offers "Export session first", like Reset, and then says when it was exported', blob && /It was last exported at/.test(note), `note="${note}"`);
  });
  run(() => {
    reset(); startEmpty(); document.querySelector('[data-add-first]').click();
    for (const [k, v] of Object.entries({area: 'Ridgewood', borough: 'Queens', rent: 1750, start: '2026-06-01', end: '2026-08-15'})) $('listing-' + k).value = v;
    $('listing-form').requestSubmit();
    $('demo-open').click(); const off = $('deliver-host').disabled && $('deliver-reminder').disabled && !$('demo-events-note').hidden; $('demo-dialog').close();
    check('EW03', 'Empty workspace: the first added listing is U01; demo events stay disabled', stored().listings.map(l => l.id).join(',') === 'U01' && off, `ids=${stored().listings.map(l => l.id)} off=${off}`);
  });
  run(() => {
    reset(); startEmpty(); reset();
    $('demo-open').click(); const on = !$('deliver-host').disabled && !$('deliver-reminder').disabled && $('demo-events-note').hidden; $('demo-dialog').close();
    check('EW04', 'Reset demo from an empty workspace returns to the example: 12 listings, B05 first choice, demo events enabled', stored().mode === 'example' && stored().listings.length === 12 && $('saved-count').textContent === '12' && stored().choice === 'B05' && on && $('workspace-tag').textContent === 'Demo workspace', `mode=${stored().mode} n=${stored().listings.length} on=${on}`);
  });
  run(() => {
    reset(); localStorage.removeItem('shortstay-cp3-tips-seen'); $('tips-show').click();
    typeNote('DRAFT-EW11: tips should not touch this');
    $('tips-close').click();
    const r = {hidden: $('tips').hidden && $('tips').getClientRects().length === 0, key: localStorage.getItem('shortstay-cp3-tips-seen'), focus: document.activeElement === document.querySelector('.page-intro h1')};
    $('tips-show').click();
    const back = {visible: !$('tips').hidden && $('tips').getClientRects().length > 0, key: localStorage.getItem('shortstay-cp3-tips-seen')};
    check('EW11', 'Dismissing the tips stores the separate "seen" key and moves focus to the page heading; Show tips again re-shows them; the decision draft is untouched', r.hidden && r.key === '1' && r.focus && back.visible && back.key === null && $('decision-note').value === 'DRAFT-EW11: tips should not touch this' && /Unsaved/.test(status()) && !('tipsSeen' in stored()), `r=${JSON.stringify(r)} back=${JSON.stringify(back)}`);
  });
  run(() => {
    const realGet = Storage.prototype.getItem, realSet = Storage.prototype.setItem, realRemove = Storage.prototype.removeItem;
    let threw = null;
    Storage.prototype.setItem = function (k, v) { if (k === 'shortstay-cp3-tips-seen') throw new DOMException('blocked', 'SecurityError'); return realSet.call(this, k, v); };
    Storage.prototype.removeItem = function (k) { if (k === 'shortstay-cp3-tips-seen') throw new DOMException('blocked', 'SecurityError'); return realRemove.call(this, k); };
    try { $('tips-close').click(); $('tips-show').click(); } catch (e) { threw = String(e); } finally { Storage.prototype.setItem = realSet; Storage.prototype.removeItem = realRemove; Storage.prototype.getItem = realGet; }
    check('EW12', 'If the tips key cannot be written, dismissing and re-showing still work (try/catch)', !threw && !$('tips').hidden, `threw=${threw}`);
  });

  // --- Undo: the latest easy-to-misclick action can be reverted for 8 seconds; the log keeps both entries ---
  const undoButton = () => $('toast').querySelector('[data-undo]');
  const clickUndo = () => undoButton().click();
  const eventTexts = () => stored().events.map(e => e.text);
  run(() => {
    reset(); addListing({});
    const before = JSON.stringify(stored().listings.find(l => l.id === 'U01'));
    view('all'); document.querySelector('[data-edit="U01"]').click(); $('listing-remove').click(); $('remove-confirm').click();
    const gone = !stored().listings.some(l => l.id === 'U01') && !!undoButton();
    clickUndo();
    const after = JSON.stringify(stored().listings.find(l => l.id === 'U01')), ev = eventTexts();
    check('UN01', 'Remove U01 → Undo: U01 is back with every field identical; the log has both "U01 removed" and "Undid: U01 removed…"', gone && after === before && ids().includes('U01') && ev[0] === 'Undid: U01 removed: Ditmars, Queens.' && ev[1] === 'U01 removed: Ditmars, Queens.' && ev.some(t => /^U01 added/.test(t)) && toastMessage() === 'Undone: U01 removed: Ditmars, Queens.', `gone=${gone} same=${after === before} ev=${JSON.stringify(ev.slice(0, 3))}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-choose="B14"]').click();
    const chosen = stored().choice; clickUndo();
    check('UN02', 'Choose for now B14 → Undo: first choice is back to B05 (saved and in the dropdown)', chosen === 'B14' && stored().choice === 'B05' && $('first-choice').value === 'B05' && !!document.querySelector('[data-choose="B05"].is-chosen') && eventTexts()[0] === 'Undid: B14 selected as provisional first choice.', `chosen=${chosen} now=${stored().choice}`);
  });
  run(() => {
    reset(); deliverHost(); applyButton().click(); $('apply-confirm').click();
    const applied = b05().end === '2026-08-13' && hostMessage().reviewed;
    clickUndo();
    check('UN03', 'Apply change → Undo: B05 end is back to 08-15, the message is unread again and the Apply button is available', applied && b05().end === '2026-08-15' && hostMessage().reviewed === false && unread() === '1' && !applyButton().disabled && /^Apply: checkout/.test(applyButton().textContent) && eventTexts()[0] === 'Undid: B05: checkout date updated from host message.', `applied=${applied} end=${b05().end} reviewed=${hostMessage().reviewed}`);
  });
  run(() => {
    reset(); const realST = window.setTimeout, timers = [];
    window.setTimeout = (fn, ms, ...rest) => { timers.push({fn, ms}); return realST(() => {}, 0); };
    try {
      view('all'); document.querySelector('[data-choose="B14"]').click();
      const t = timers.filter(x => x.ms === 8000).at(-1);
      undoButton().focus(); t.fn(); const keptWhileFocused = !!undoButton();
      document.activeElement.blur(); timers.filter(x => x.ms === 8000).at(-1).fn();
      check('UN04', 'The Undo toast uses an 8-second timer; while Undo has focus it stays, otherwise the timer removes the button and Undo is no longer possible', !!t && keptWhileFocused && !undoButton() && !$('toast').classList.contains('visible') && stored().choice === 'B14', `timer=${!!t} kept=${keptWhileFocused} button=${!!undoButton()}`);
    } finally { window.setTimeout = realST; }
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-choose="B14"]').click(); document.querySelector('[data-choose="B13"]').click();
    clickUndo(); const afterTwo = stored().choice, stillUndo = !!undoButton();
    document.querySelector('[data-choose="B12"]').click(); edit('B02', {action: 'not undoable'});
    check('UN05', 'Two actions in a row: Undo reverts only the latest (B13 → B14); any later saved change clears the Undo offer', afterTwo === 'B14' && !stillUndo && !undoButton() && stored().choice === 'B12', `afterTwo=${afterTwo} stillUndo=${stillUndo} button=${!!undoButton()}`);
  });
  run(() => {
    reset(); deliverHost(); view('all');
    const draft = 'DRAFT-UN06: keep me'; typeNote(draft); pickChoice('B13');
    document.querySelector('[data-reviewed="host-b05"]').click(); clickUndo();
    check('UN06', 'Undo keeps the unsaved decision draft (note and choice) and the current view (All saved)', hostMessage().reviewed === false && $('decision-note').value === draft && $('first-choice').value === 'B13' && /Unsaved/.test(status()) && $('show-all').getAttribute('aria-pressed') === 'true' && ids().length === 12, `note="${$('decision-note').value}" choice=${$('first-choice').value} view=${$('show-all').getAttribute('aria-pressed')}`);
  });
  run(() => {
    reset(); edit('B06', {contact: 'Closed'}); const closed = {contact: stored().listings.find(l => l.id === 'B06').contact, undo: !!undoButton()};
    clickUndo(); const back = stored().listings.find(l => l.id === 'B06').contact, matches = $('matches-count').textContent;
    edit('B06', {action: 'ordinary edit'}); const ordinary = !!undoButton();
    check('UN07', 'Setting contact to Closed offers Undo and Undo restores Replied (Matches back to 9); an ordinary edit offers no Undo', closed.contact === 'Closed' && closed.undo && back === 'Replied' && matches === '9' && !ordinary, `closed=${JSON.stringify(closed)} back=${back} matches=${matches} ordinary=${ordinary}`);
  });
  run(() => {
    reset(); view('all'); const t = $('toast');
    document.querySelector('[data-choose="B14"]').click();
    const shown = {role: t.getAttribute('role'), live: t.getAttribute('aria-live'), tabindex: t.getAttribute('tabindex'), focusInToast: t.contains(document.activeElement), tag: undoButton()?.tagName, text: undoButton()?.textContent, pointer: getComputedStyle(t).pointerEvents};
    undoButton().focus(); const reachable = document.activeElement === undoButton();
    clickUndo();
    check('UN08', 'Toast is a polite status region that does not take focus; Undo is a real, focusable button; after Undo focus returns to the restored Choose button, not the toast or the page body', shown.role === 'status' && shown.live === 'polite' && shown.tabindex === '-1' && !shown.focusInToast && shown.tag === 'BUTTON' && shown.text === 'Undo' && shown.pointer === 'auto' && reachable && document.activeElement?.dataset?.choose === 'B14' && !t.contains(document.activeElement) && !undoButton(), `shown=${JSON.stringify(shown)} reachable=${reachable} focus=${document.activeElement.outerHTML.slice(0, 60)}`);
  });
  run(() => {
    reset(); const realSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) { if (k === 'shortstay-cp3-demo-v1') throw new DOMException('Quota exceeded', 'QuotaExceededError'); return realSet.call(this, k, v); };
    let r;
    try {
      view('all'); document.querySelector('[data-choose="B14"]').click();
      const failToast = toastMessage(), offered = !!undoButton();
      clickUndo();
      r = {failToast, offered, select: $('first-choice').value, chosenCard: !!document.querySelector('[data-choose="B05"].is-chosen'), banner: !$('storage-alert').hidden && /not being saved/.test($('storage-alert').textContent), toast: toastMessage()};
    } finally { Storage.prototype.setItem = realSet; }
    reset();
    check('UN09', 'Storage write failure: Undo is still offered and works in memory, with the existing not-saved banner and toast', /^Not saved/.test(r.failToast) && r.offered && r.select === 'B05' && r.chosenCard && r.banner && /^Not saved/.test(r.toast), `r=${JSON.stringify(r)}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-choose="B14"]').click(); reset();
    const afterReset = !!undoButton(); startEmpty(); const afterEmpty = !!undoButton(); reset();
    check('UN10', 'Reset demo and Start empty workspace keep their confirmation dialogs and offer no Undo (and clear an earlier one)', !afterReset && !afterEmpty && stored().choice === 'B05', `afterReset=${afterReset} afterEmpty=${afterEmpty}`);
  });

  // --- QA review fixes (REVIEW_UPGRADE_BATCH_1.md, section 4) ---
  const undoBtn = () => $('toast').querySelector('[data-undo]');
  const keyZ = (target, opts) => { const e = new KeyboardEvent('keydown', {key: 'z', bubbles: true, cancelable: true, ...opts}); target.dispatchEvent(e); return e.defaultPrevented; };
  run(() => {
    reset(); const realST = window.setTimeout, timers = [];
    window.setTimeout = (fn, ms, ...rest) => { timers.push({fn, ms}); return realST(() => {}, 0); };
    let r;
    try {
      view('all'); document.querySelector('[data-choose="B14"]').click();
      const t = timers.filter(x => x.ms === 8000).at(-1);
      $('toast').dispatchEvent(new MouseEvent('mouseenter')); t.fn(); const keptWhileHovered = !!undoBtn();
      const before = timers.length; $('toast').dispatchEvent(new MouseEvent('mouseleave'));
      const restarted = timers.slice(before).filter(x => x.ms === 8000);
      restarted.at(-1)?.fn();
      r = {timer: !!t, keptWhileHovered, restarted: restarted.length, goneAfterLeave: !undoBtn()};
    } finally { window.setTimeout = realST; }
    check('RF01', 'P2-1: the 8-second Undo countdown pauses while the pointer is over the toast and restarts in full when it leaves', r.timer && r.keptWhileHovered && r.restarted >= 1 && r.goneAfterLeave, `r=${JSON.stringify(r)}`);
  });
  run(() => {
    reset(); const noUndo = keyZ(document.body, {ctrlKey: true});
    view('all'); document.querySelector('[data-choose="B14"]').click();
    const inField = ['decision-note', 'first-choice', 'session-code'].map(id => keyZ($(id), {ctrlKey: true}));
    const stillB14 = stored().choice === 'B14' && !!undoBtn();
    $('demo-open').click(); const inDialog = keyZ(document.body, {ctrlKey: true}); $('demo-dialog').close();
    const ctrl = keyZ(document.body, {ctrlKey: true}), afterCtrl = stored().choice;
    document.querySelector('[data-choose="B13"]').click(); const meta = keyZ(document.body, {metaKey: true}), afterMeta = stored().choice;
    check('RF02', 'P2-1: Ctrl+Z and ⌘Z undo while Undo is offered; not in a text field, textarea or select, not while a dialog is open, and not when nothing can be undone', !noUndo && inField.every(x => !x) && stillB14 && !inDialog && ctrl && afterCtrl === 'B05' && meta && afterMeta === 'B05' && stored().events[0].text === 'Undid: B13 selected as provisional first choice.', `noUndo=${noUndo} inField=${inField} stillB14=${stillB14} inDialog=${inDialog} ctrl=${ctrl}/${afterCtrl} meta=${meta}/${afterMeta}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-choose="B14"]').click();
    const hint = $('toast').querySelector('.toast-key'), text = hint?.textContent || '';
    const expected = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform || '') ? '⌘Z' : 'Ctrl+Z';
    check('RF03', 'P2-1: the Undo toast names the shortcut ("or press ⌘Z" / "Ctrl+Z", visible at 1280px), Undo carries aria-keyshortcuts, and the message part is unchanged', text === `or press ${expected}` && !!hint.getClientRects().length && undoBtn().getAttribute('aria-keyshortcuts') === 'Control+Z Meta+Z' && toastMessage() === 'First choice updated. Review your reasoning in My decision.', `hint="${text}" expected=${expected} platform=${navigator.userAgentData?.platform || navigator.platform} visible=${!!hint?.getClientRects().length} msg="${toastMessage()}"`);
  });
  run(() => {
    reset(); view('all'); const ch = document.querySelector('[data-choose="B06"]'); ch.focus(); ch.click();
    const afterChoose = document.activeElement, chooseOk = afterChoose?.dataset?.choose === 'B06' && afterChoose !== ch && afterChoose.isConnected;
    deliverHost(); const mr = document.querySelector('[data-reviewed="host-b05"]'); mr.focus(); mr.click();
    const afterReviewed = document.activeElement, reviewedOk = afterReviewed?.matches('[data-message-edit][data-message-id="host-b05"]');
    check('RF04', 'P2-1: after Choose for now focus stays on the re-rendered Choose button; after Mark reviewed it moves to that message\'s edit button (never the page body)', chooseOk && reviewedOk, `choose=${afterChoose?.outerHTML?.slice(0, 70)} reviewed=${afterReviewed?.outerHTML?.slice(0, 70)}`);
  });
  run(() => {
    reset(); addListing({}); openEdit('U01'); $('listing-remove').click(); const text = $('remove-text').textContent; $('remove-dialog').close(); $('listing-dialog').close();
    check('RF05', 'P2-2: the Remove confirmation no longer says it cannot be undone and says how to undo', !/can't be undone/i.test(text) && /You can undo it for a few seconds right after removing it \(Undo, or (⌘Z|Ctrl\+Z)\)\./.test(text), `text="${text}"`);
  });
  run(() => {
    reset(); $('tips-show').click(); $('tips-close').click(); const dismissed = $('tips').hidden && localStorage.getItem('shortstay-cp3-tips-seen') === '1';
    startEmpty(); const afterEmpty = {visible: !$('tips').hidden && $('tips').getClientRects().length > 0, key: localStorage.getItem('shortstay-cp3-tips-seen')};
    $('tips-close').click(); reset(); const afterReset = {hidden: $('tips').hidden, key: localStorage.getItem('shortstay-cp3-tips-seen')};
    check('RF06', 'P2-4: Start empty workspace clears the tips-seen key and shows the tips again; Reset demo leaves them dismissed (unchanged)', dismissed && afterEmpty.visible && afterEmpty.key === null && afterReset.hidden && afterReset.key === '1', `dismissed=${dismissed} afterEmpty=${JSON.stringify(afterEmpty)} afterReset=${JSON.stringify(afterReset)}`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-choose="B14"]').click(); pickChoice('B05');
    const draftStatus = status(); undoBtn().click();
    check('RF07', 'P3-1: after Undo the dirty state is recalculated: dropdown B05 = saved B05, so no "Unsaved" and leaving is not blocked', /Unsaved/.test(draftStatus) && $('first-choice').value === 'B05' && stored().choice === 'B05' && !/Unsaved/.test(status()) && !leaving(), `draft="${draftStatus}" now="${status()}"`);
  });
  run(() => {
    reset(); const exampleIntro = $('shortlist-intro')?.textContent; startEmpty();
    const next = $('next-body').textContent, btn = $('next-body').querySelector('[data-next-go="add"]'), emptyIntro = $('shortlist-intro')?.textContent;
    btn?.click(); const opened = $('listing-dialog').open && $('listing-dialog-title').textContent === 'Add a listing'; $('listing-dialog').close();
    const demoNote = [...$('demo-dialog').querySelectorAll('.demo-step .field-note')][0]?.textContent || '';
    reset();
    check('RF08', 'P3-2: with 0 listings Next up asks to add one first and its button opens Add a listing; the shortlist subtitle follows the mode; demo step 1 mentions Apply change', /^No listings yet\./.test(next) && !/Choose for now/.test(next) && btn?.textContent === '+ Add a listing' && opened && exampleIntro === 'Compare fictional NYC rooms across the five boroughs.' && /^Your own listings\./.test(emptyIntro) && /Apply change/.test(demoNote), `next="${next}" intro=${exampleIntro}|${emptyIntro} opened=${opened} demo="${demoNote}"`);
  });
  run(() => {
    reset(); edit('B05', {'safety-viewedBeforePaying': 'N/A', 'safety-traceablePayment': 'Done'});
    const note = $('safety-na-note')?.textContent || '', next = [...document.querySelectorAll('#next-list .next-item p')].map(p => p.textContent);
    const savedLevel = stored().listings.find(l => l.id === 'B05').safety.viewedBeforePaying;
    check('RF09', 'P3-3, decided (team decision 1): a required payment check cannot be N/A (a forced N/A saves as Not yet), so the "Don’t pay … before a live viewing" warning stays; the N/A note names only the other three checks', savedLevel === 'Not yet' && /^N\/A is only for Identity checked, Written agreement and Price looks reasonable/.test(note) && next.includes('Don’t pay for B05 before a live viewing.') && /Don’t pay for B05 before a live viewing/.test($('safety-warning').textContent), `note="${note}" next=${JSON.stringify(next)}`);
  });
  run(() => {
    reset(); view('all'); const r = {}, where = () => { const a = document.activeElement; return a === document.body ? 'body' : a === $('toast') || $('toast').contains(a) ? 'toast' : a.outerHTML.slice(0, 60); };
    document.querySelector('[data-choose="B14"]').click(); undoBtn().click(); r.choose = document.activeElement?.dataset?.choose === 'B14' ? 'ok' : where();
    addListing({}); openEdit('U01'); $('listing-remove').click(); $('remove-confirm').click(); undoBtn().click(); r.remove = document.activeElement?.dataset?.edit === 'U01' ? 'ok' : where();
    edit('B06', {contact: 'Closed'}); undoBtn().click(); r.closed = document.activeElement?.dataset?.edit === 'B06' ? 'ok' : where();
    deliverHost(); applyButton().click(); $('apply-confirm').click(); undoBtn().click(); r.apply = document.activeElement === applyButton() ? 'ok' : where();
    document.querySelector('[data-reviewed="host-b05"]').click(); undoBtn().click(); r.reviewed = document.activeElement?.dataset?.reviewed === 'host-b05' ? 'ok' : where();
    document.querySelector('[data-choose="B13"]').click(); keyZ(document.body, {ctrlKey: true}); r.shortcut = document.activeElement?.dataset?.choose === 'B13' ? 'ok' : where();
    check('RF10', 'P3-4: after Undo focus returns to the restored object (Choose button, card Review & update, Apply, Mark reviewed), never the toast or body', Object.values(r).every(v => v === 'ok'), `r=${JSON.stringify(r)}`);
  });
  run(() => {
    const ph = document.querySelector('.placeholder-link'), style = getComputedStyle(ph);
    const comments = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_COMMENT); while (walker.nextNode()) comments.push(walker.currentNode.textContent);
    check('RF11', 'P3-5: the Columbia placeholder is plain text without an underline (not a link), and the TODO comment is still there with no URL', ph.tagName === 'SPAN' && !ph.closest('a') && style.textDecorationLine === 'none' && ph.textContent === 'Columbia housing resources (link to be added)' && comments.some(c => /TODO: the team needs to add a verified, official Columbia University housing resources link/.test(c)) && !/https?:/i.test(ph.parentElement.innerHTML), `deco=${style.textDecorationLine} tag=${ph.tagName}`);
  });
  run(() => {
    const r = $('tips-show').getBoundingClientRect();
    check('RF12', 'P3-6: "Show tips again" has a click target at least 24px high (and wide)', r.height >= 24 && r.width >= 24, `w=${r.width} h=${r.height}`);
  });

  // --- Upgrade batch 2 (QA 2026-10-28 simulated-user report: P1-01, P2-02 … P3-10) ---
  const showAdded = () => document.querySelector('[data-show-added]');
  run(() => {
    reset(); edit('B05', {'verify-permission': 'Verified', 'verify-fees': 'Verified', 'verify-host': 'Verified', 'safety-viewedBeforePaying': 'Done', 'safety-traceablePayment': 'Done'});
    const anywhere = /Nothing urgent|all checks are verified/i.test(document.documentElement.innerHTML);
    const items = nextShown(), warn = $('safety-warning').textContent, line = card('B05').querySelector('.safety-note').textContent;
    const box = $('safety-warning').querySelector('.choice-warning'), neutral = box.classList.contains('neutral') && !box.classList.contains('caution') && getComputedStyle(box).color === getComputedStyle(document.querySelector('.field-note') || document.body).color;
    nextButton('safety checks still open').click(); const focus = document.activeElement.id; $('listing-dialog').close();
    check('B201', 'P1-01 / decision 3: 4 verified (viewing = Viewed before paying Done) + only the 2 payment checks Done: "Nothing urgent" / "all checks are verified" appear nowhere; Next up (caution) and My decision (neutral grey "Payment checks marked done. Still open: …") name the 3 open safety checks, and Review B05 focuses the first one', !anywhere && items.length === 1 && items[0].kind === 'Safety' && items[0].text === 'B05: 3 safety checks still open (identity, written agreement, price)' && document.querySelector('#next-list .next-item').classList.contains('caution') && warn === 'Payment checks marked done. Still open: identity checked, written agreement and price reasonable.' && neutral && line === 'Safety: 2 of 5 done' && focus === 'listing-safety-identityChecked', `items=${JSON.stringify(items)} warn="${warn}" focus=${focus}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); view('all'); $('density-compact').click();
    const rent = id => document.querySelector(`[data-row="${id}"] .row-rent`);
    const b03 = {text: rent('B03').textContent, gap: rent('B03').classList.contains('gap'), color: getComputedStyle(rent('B03')).color};
    const b05 = {text: rent('B05').textContent, gap: rent('B05').classList.contains('gap')};
    const red = getComputedStyle(document.querySelector('[data-row="B11"] .row-dates')).color;
    document.querySelector('[data-row="B05"]').click(); document.querySelector('[data-choose="B05"]').click(); const prompt = nextEmpty();
    $('density-detailed').click(); const promptDetailed = nextEmpty();
    check('B202', 'P2-03: Compact rows show "· above max" in the date-gap colour for rent outside the range; with no first choice Next up says to open a listing in Compact view (and not in Detailed)', b03.text === '$2,150/mo · above max' && b03.gap && b03.color === red && b05.text === '$1,900/mo' && !b05.gap && /\(in Compact view, open a listing to see it\)/.test(prompt) && !/Compact view/.test(promptDetailed), `b03=${JSON.stringify(b03)} b05=${JSON.stringify(b05)} prompt="${prompt}"`);
  });
  run(() => {
    reset(); view('all'); document.querySelector('[data-choose="B14"]').click();
    document.querySelector('[data-edit="B06"]').click(); $('listing-form').requestSubmit(); const afterEdit = !!undoBtn();
    reset(); deliverHost(); applyButton().click(); $('apply-confirm').click(); const before = stored().events.length;
    $('decision-form').requestSubmit(); const kept = !!undoBtn(), logged = stored().events.length !== before;
    undoBtn().click();
    check('B203', 'P2-02: a save that changes nothing (listing or decision) writes nothing and keeps the Undo on offer, which still reverts the host change', afterEdit && kept && !logged && b05().end === '2026-08-15' && !hostMessage().reviewed, `afterEdit=${afterEdit} kept=${kept} logged=${logged} end=${b05().end}`);
  });
  run(() => {
    reset(); deliverHost(); applyButton().click(); $('apply-confirm').click(); renderOnly();
    const noUndo = !undoBtn(), revert = document.querySelector('[data-revert="host-b05"]'); revert.click();
    const shown = {open: $('apply-dialog').open, title: $('apply-title').textContent, rows: applyRows(), confirm: $('apply-confirm').textContent, note: $('apply-note').textContent, preview: $('apply-preview').textContent};
    $('apply-confirm').click(); const ev = latest(), focus = document.activeElement === applyButton();
    const after = {end: b05().end, reviewed: hostMessage().reviewed, applied: 'applied' in hostMessage(), unread: unread(), button: applyButton()?.textContent, toast: toastMessage()};
    undoBtn().click(); const undone = {end: b05().end, reviewed: hostMessage().reviewed, revert: !!document.querySelector('[data-revert="host-b05"]')};
    check('B204', 'P2-02: after the Undo window is gone, the message offers "Revert" (dialog: current Aug 13 → value before Aug 15); Revert restores the date, marks the message unread, logs it, re-enables Apply, and can itself be undone', noUndo && shown.open && shown.title === 'Revert this change?' && shown.rows['Current value'] === 'Aug 13, 2026' && shown.rows['Value before the message'] === 'Aug 15, 2026' && shown.confirm === 'Revert change' && /marked unread again/.test(shown.note) && /will match your needs/.test(shown.preview) && after.end === '2026-08-15' && !after.reviewed && !after.applied && after.unread === '1' && after.button === 'Apply: checkout Aug 15 → Aug 13' && after.toast === 'B05 checkout date changed back to Aug 15, 2026; the message is unread again. It now matches your needs and is in Matches.' && ev.text === 'B05: checkout date reverted to before the host message.' && hasChange(ev, 'checkout date', '2026-08-13', '2026-08-15') && focus && undone.end === '2026-08-13' && undone.reviewed && undone.revert, `shown=${JSON.stringify(shown)} after=${JSON.stringify(after)} undone=${JSON.stringify(undone)}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); view('matches'); addListing({rent: 2300, end: '2026-08-10'});
    const text = $('listing-visibility').textContent, focus = document.activeElement === showAdded();
    view('matches'); const goneOnViewChange = !showAdded();
    addListing({rent: 1500}); const matchingNoNotice = !showAdded();
    addListing({rent: 2500}); showAdded().click(); const title = document.activeElement;
    check('B205', 'P2-04: adding a listing that Matches hides keeps a notice with the reasons and a "View in All saved" button (focused); it opens All saved on that card and goes away when the view changes; a matching listing gets no notice', /U01 is saved but not shown here: ends 5 nights early; rent above your maximum\. View U01 in All saved →/.test(text) && focus && goneOnViewChange && matchingNoNotice && $('show-all').getAttribute('aria-pressed') === 'true' && title.tagName === 'H3' && title.closest('article').getAttribute('aria-label').startsWith('U03') && !showAdded(), `text="${text}" focus=${focus} title=${title?.outerHTML?.slice(0, 60)}`);
  });
  run(() => {
    reset(); openAdd(); const folded = {open: $('listing-checks-section').open, later: !$('listing-checks-later').hidden};
    $('listing-dialog').querySelector('.dialog-footer [data-close]').click(); const emptyCloses = !$('listing-dialog').open && !$('discard-dialog').open;
    openAdd(); fill({area: 'Draft area', rent: 1700});
    const esc = new Event('cancel', {cancelable: true}); $('listing-dialog').dispatchEvent(esc);
    const asked = esc.defaultPrevented && $('discard-dialog').open; $('discard-dialog').querySelector('[data-close]').click();
    const kept = $('listing-dialog').open && !$('discard-dialog').open && $('listing-area').value === 'Draft area';
    $('listing-dialog').querySelector('[data-close]').click(); $('discard-confirm').click(); const discarded = !$('listing-dialog').open && stored().listings.length === 12;
    openEdit('B06'); const editOpen = $('listing-checks-section').open && $('listing-checks-later').hidden; $('listing-area').value = 'Changed'; $('listing-dialog').querySelector('.dialog-footer [data-close]').click();
    const editCloses = !$('listing-dialog').open && !$('discard-dialog').open && stored().listings.find(l => l.id === 'B06').area === 'Harlem';
    check('B206', 'P2-05: Add folds Verification and Safety checks ("Optional now…"), edit shows them open; an empty Add form closes at once; with typed values Escape/Cancel ask first, Keep editing keeps the text, Discard closes; editing a saved listing still closes directly', !folded.open && folded.later && emptyCloses && asked && kept && discarded && editOpen && editCloses, `folded=${JSON.stringify(folded)} emptyCloses=${emptyCloses} asked=${asked} kept=${kept} discarded=${discarded} editOpen=${editOpen} editCloses=${editCloses}`);
  });
  run(() => {
    reset(); openEdit('B05'); const status = () => $('listing-viewing-status').textContent, sel = $('listing-safety-viewedBeforePaying');
    const form = {noSelect: !$('listing-verify-viewing'), tag: $('listing-viewing-status').tagName, start: status(), confirmHidden: $('viewing-confirm-note').hidden};
    sel.value = 'Done'; sel.dispatchEvent(new Event('change', {bubbles: true})); form.live = status(); $('listing-form').requestSubmit();
    const note = verifyNote('B05'), next = nextShown().find(i => i.kind === 'Checks')?.text, decision = $('choice-warning').textContent;
    $('density-compact').click(); const row = document.querySelector('[data-row="B05"] .row-open').textContent; $('density-detailed').click();
    openEdit('B05'); form.reopened = status(); $('listing-dialog').close();
    check('B207', 'Decision 2: Live viewing is a read-only output that follows Safety\'s Viewed before paying; once that is Done, the card, Compact row, Next up and My decision no longer list viewing as unverified', form.noSelect && form.tag === 'OUTPUT' && form.start === 'Viewing: Not yet — set in Safety checks' && form.confirmHidden && form.live === 'Viewing: Done — set in Safety checks' && form.reopened === form.live && note === 'Not yet verified: permission · fees · host' && next === 'B05 — Not verified yet: permission, fees and host.' && !/viewing/.test(decision) && row === '3 unverified', `form=${JSON.stringify(form)} note="${note}" next="${next}" decision="${decision}" row="${row}"`);
  });
  run(() => {
    reset(); openEdit('B05'); const opts = k => [...$('listing-safety-' + k).options].map(o => o.value).join('|');
    const required = ['viewedBeforePaying', 'traceablePayment'].every(k => opts(k) === 'Not yet|Done' && $('listing-safety-' + k).getAttribute('aria-describedby').split(' ').some(id => $(id)?.textContent === 'Required before paying — can’t be skipped.'));
    const optional = ['identityChecked', 'writtenAgreement', 'priceReasonable'].every(k => opts(k) === 'Not yet|Done|N/A');
    const note = $('safety-na-note').textContent; $('listing-dialog').close();
    check('B210', 'Decision 1: the two required payment checks offer only Not yet / Done with "Required before paying — can’t be skipped."; the other three keep N/A, and the N/A note names only those three', required && optional && /^N\/A is only for Identity checked, Written agreement and Price looks reasonable/.test(note) && !/Viewed before paying|Traceable/.test(note), `required=${required} optional=${optional} note="${note}"`);
  });
  run(() => {
    reset(); const live = ['choice-warning', 'safety-warning'].every(id => $(id).getAttribute('aria-live') === 'polite');
    const node = $('safety-warning').firstElementChild; renderOnly(); const same = $('safety-warning').firstElementChild === node;
    view('all'); document.querySelector('[data-choose="B13"]').click(); keyZ(document.body, {ctrlKey: true});
    const restored = document.activeElement, ring = restored?.classList.contains('focus-ring') && restored.dataset.choose === 'B13';
    restored.blur(); const cleared = !restored.classList.contains('focus-ring');
    check('B208', 'P2-07/P2-08: the decision and safety warnings are polite live regions that are not rewritten when unchanged; after Ctrl/⌘Z the restored button gets a visible focus ring until it loses focus', live && same && ring && cleared, `live=${live} same=${same} ring=${ring} cleared=${cleared}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); view('matches');
    const link = document.querySelector('[data-show-hidden]').getBoundingClientRect();
    addListing({area: 'W'.repeat(60)}); view('all'); const h3 = document.querySelector('[aria-label^="U01"] h3');
    const placeholder = document.querySelector('.safety-link'), claimed = [...$('listing-verify-permission').options].map(o => o.textContent).join('|'), help = $('verify-help').textContent, described = ['permission', 'fees', 'host'].every(k => $('listing-verify-' + k).getAttribute('aria-describedby') === 'verify-help');
    check('B209', 'P3-09/P3-10 and copy: the "outside your needs" button is at least 24px high; a 60-character unbroken area wraps inside its card; the Columbia placeholder is hidden; Verification options are short (Unknown / Claimed / Verified) with their meaning in help text under the fields, and the reasoning label explains itself', link.height >= 24 && h3.scrollWidth <= h3.clientWidth + 1 && placeholder.hidden && !placeholder.getClientRects().length && claimed === 'Unknown|Claimed|Verified' && /Claimed: the host says so, no proof\. Verified: you saw proof yourself/.test(help) && described && document.querySelector('label[for="decision-note"]').textContent === 'Why is this your first choice? What still needs checking?', `h=${link.height} h3=${h3.scrollWidth}/${h3.clientWidth} claimed="${claimed}"`);
  });

  // --- Regression: filtering and the B05 host-message flow are unchanged ---
  const table = [[0, 2200, 'B05,B02,B03,B06,B08,B09,B12,B13,B14'], [0, 2000, 'B05,B02,B06,B08,B09,B12,B13,B14'], [1800, 2000, 'B05,B02,B06,B08,B12'], [1900, 2000, 'B05,B02,B08,B12'], [1950, 2200, 'B02,B03,B08,B12'], [2000, 2000, 'B02,B12'], [0, 1000, ''], [0, 3000, 'B05,B02,B03,B06,B08,B09,B10,B12,B13,B14']];
  run(() => {
    reset(); view('matches');
    const bad = table.filter(([a, b, want]) => { setNeeds('2026-06-01', '2026-08-15', a, b); return ids().join(',') !== want; });
    setNeeds('2026-06-01', '2026-08-31', 0, 3000); const wide = ids().join(',');
    check('G01', 'Budget/date table unchanged (8 ranges + 06-01–08-31)', !bad.length && wide === 'B03,B06,B10,B12,B13', `failing=${JSON.stringify(bad)} wide=${wide}`);
  });
  run(() => {
    reset(); setNeeds('2026-06-01', '2026-08-15', 0, 2000); view('matches');
    typeNote('Flow D reasoning'); $('decision-form').requestSubmit();
    const before = +$('matches-count').textContent;
    $('demo-open').click(); $('deliver-host').click();
    const endAfterMessage = stored().listings.find(l => l.id === 'B05').end;
    edit('B05', {end: '2026-08-13'}); view('matches');
    check('G02', 'Flow D: 8→7 matches, 12 saved, "ends 2 nights early" warning, reasoning kept', before === 8 && endAfterMessage === '2026-08-15' && $('matches-count').textContent === '7' && $('saved-count').textContent === '12' && /ends 2 nights early/.test($('choice-warning').textContent) && stored().note === 'Flow D reasoning', `before=${before} after=${$('matches-count').textContent} warn="${$('choice-warning').textContent.trim()}"`);
  });

  publish();
})();
