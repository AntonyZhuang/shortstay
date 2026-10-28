// Runs before app.js and sets up the starting storage state for each pass (see run.sh).
const QA_KEY = 'shortstay-cp3-demo-v1';
const QA_MODE = location.search.slice(1);
if (QA_MODE === 'legacy') {
  // A save from before noteFor existed, with an old max-only budget, one added listing and an older reminder.
  localStorage.setItem(QA_KEY, JSON.stringify({
    version: 1, needs: {start: '2026-06-01', end: '2026-08-15', budget: 2000},
    choice: 'B02', note: 'LEGACY note for B02', listings: [{id: 'B02', area: 'Manhattan Valley', rent: 2000, start: '2026-06-01', end: '2026-08-15', contact: 'Waiting', terms: 't', checks: 'c', action: 'a'},
      {id: 'U01', added: true, area: 'Ditmars', borough: 'Queens', source: 'WeChat group', sourceDetail: 'https://example.com/post/123', rent: 1900, start: '2026-06-01', end: '2026-08-15', contact: 'Not contacted', terms: '', checks: '', action: ''}],
    // host-b05 is in the pre-suggestion format (no suggestion field); it is reviewed so the unread count stays 1.
    messages: [{id: 'host-b05', kind: 'host', text: 'Correction: the latest checkout is August 13, two days earlier than originally posted. Other terms are unchanged.', reviewed: true}, {id: 'reminder-b02', kind: 'reminder', text: 'At the simulated 21:00 checkpoint, this entry is still marked Waiting after 12 hours (last contact 09:00). Review the conversation or contact a backup.', reviewed: false}], events: [{role: 'User', text: 'OLD event without details', time: '2026-10-20T12:00:00.000Z'}]
  }));
}
// Storage-problem passes. window.__qaSeed is the exact text that was in storage before the page loaded.
const QA_UNREADABLE = JSON.stringify({version: 2, choice: 'B02', note: 'CORRUPT-V2 note that must survive', listings: [{id: 'B02', rent: 1980}]});
if (['corrupt', 'again', 'nobackup'].includes(QA_MODE)) window.__qaSeed = QA_UNREADABLE;
if (QA_MODE === 'garbage') window.__qaSeed = '{"version":1, "listings": [ not json';
if (window.__qaSeed) localStorage.setItem(QA_KEY, window.__qaSeed);
if (QA_MODE === 'again') localStorage.setItem(QA_KEY + '-backup-earlier', window.__qaSeed);
if (QA_MODE === 'nobackup') {
  const realSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) { if (String(key).includes('-backup-')) throw new DOMException('Quota exceeded', 'QuotaExceededError'); return realSet.call(this, key, value); };
}
if (QA_MODE === 'nostorage') {
  Storage.prototype.getItem = function () { throw new DOMException('Storage disabled', 'SecurityError'); };
  Storage.prototype.setItem = function () { throw new DOMException('Storage disabled', 'SecurityError'); };
}
if (QA_MODE === 'biglog') {
  // A valid save whose log holds 1,999 entries (the cap is 2,000), newest first.
  const events = Array.from({length: 1999}, (_, i) => ({role: 'User', text: `seed event ${1999 - i}`, time: new Date(Date.UTC(2026, 9, 27, 12, 0, 1999 - i)).toISOString()}));
  localStorage.setItem(QA_KEY, JSON.stringify({version: 1, needs: {start: '2026-06-01', end: '2026-08-15', budgetMin: 0, budgetMax: 2200}, choice: 'B05', noteFor: 'B05', note: 'n', listings: [], messages: [], events}));
}
if (QA_MODE === 'empty') {
  // Reloading an empty workspace: no listings may come back. The tips were dismissed in an earlier visit.
  localStorage.setItem(QA_KEY, JSON.stringify({version: 1, mode: 'empty', needs: {start: '2026-06-01', end: '2026-08-15', budgetMin: 0, budgetMax: 2200}, choice: '', noteFor: '', note: '', listings: [], messages: [], events: [{role: 'Operator', text: 'Empty workspace started. The previous session had 3 log entries; it was not exported.', time: '2026-10-27T12:00:00.000Z'}]}));
  localStorage.setItem('shortstay-cp3-tips-seen', '1');
}
if (QA_MODE === 'prefs') localStorage.setItem('shortstay-cp3-view-prefs', JSON.stringify({density: 'compact', sort: 'rent'}));
if (QA_MODE === 'nullentries') {
  // QA review P3-7 / P3-8: non-object entries must be dropped on load; a reminder for B06 must be labelled B06; a listing ID with a quote.
  window.__qaErrors = []; window.addEventListener('error', e => window.__qaErrors.push(String(e.message)));
  localStorage.setItem(QA_KEY, JSON.stringify({version: 1, needs: {start: '2026-06-01', end: '2026-08-15', budgetMin: 0, budgetMax: 2200}, choice: 'B05', noteFor: 'B05', note: 'n',
    listings: [{id: 'U9"x', added: true, area: 'Quote', borough: 'Queens', rent: 1500, start: '2026-06-01', end: '2026-08-15', contact: 'Not contacted', terms: '', checks: '', action: ''}],
    messages: [null, 7, 'text', [], {id: 'host-b05', kind: 'host', text: 'Correction: the latest checkout is August 13, two days earlier than originally posted. Other terms are unchanged.', reviewed: false},
      {id: 'reminder-b06', kind: 'reminder', listing: 'B06', text: 'A reminder about B06 that is still unread.', reviewed: false}],
    events: [null, 'string event', 3, {role: 'User', text: 'the only real event', time: '2026-10-27T12:00:00.000Z'}]}));
}
if (QA_MODE === 'migrate') {
  // Team decisions 1 and 2 (QA 2026-10-28): a save from before them. B05 has N/A on both required payment checks (and on an optional one)
  // and Live viewing Verified; B06 has Live viewing Verified and Viewed before paying Done; U01 has N/A on Traceable payment only;
// U02 has Live viewing Verified and Viewed before paying Not yet (confirmed later as still Not yet).
  const verify = viewing => ({permission: 'Unknown', fees: 'Unknown', viewing, host: 'Unknown'});
  const safety = (viewed, traceable, price) => ({viewedBeforePaying: viewed, identityChecked: 'Not yet', writtenAgreement: 'Not yet', traceablePayment: traceable, priceReasonable: price});
  localStorage.setItem(QA_KEY, JSON.stringify({version: 1, mode: 'example', needs: {start: '2026-06-01', end: '2026-08-15', budgetMin: 0, budgetMax: 2200}, choice: 'B05', noteFor: 'B05', note: 'n',
    listings: [
      {id: 'B05', area: 'Inwood', borough: 'Manhattan', rent: 1900, start: '2026-06-01', end: '2026-08-15', contact: 'Replied', terms: '', checks: '', action: '', verify: verify('Verified'), safety: safety('N/A', 'N/A', 'N/A')},
      {id: 'B06', area: 'Harlem', borough: 'Manhattan', rent: 1800, start: '2026-06-01', end: '2026-08-31', contact: 'Replied', terms: '', checks: '', action: '', verify: verify('Verified'), safety: safety('Done', 'Not yet', 'Not yet')},
      {id: 'U01', added: true, area: 'Ditmars', borough: 'Queens', rent: 1700, start: '2026-06-01', end: '2026-08-15', contact: 'Not contacted', terms: '', checks: '', action: '', verify: verify('Claimed'), safety: safety('Not yet', 'N/A', 'Not yet')},
      {id: 'U02', added: true, area: 'Sunset Park', borough: 'Brooklyn', rent: 1650, start: '2026-06-01', end: '2026-08-15', contact: 'Replied', terms: '', checks: '', action: '', verify: verify('Verified'), safety: safety('Not yet', 'Not yet', 'Not yet')},
    ],
    messages: [], events: [{role: 'User', text: 'event from before the team decisions', time: '2026-10-27T12:00:00.000Z'}]}));
  localStorage.setItem('shortstay-cp3-tips-seen', '1');
}
