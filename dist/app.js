(() => {
  'use strict';

  // ===== Constants and configuration =====
  const STORAGE = 'shortstay-cp3-demo-v1';
  const CALENDAR_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/></svg>';
  const DEMO_LISTINGS = [
    {
      id: 'B05', area: 'Inwood', borough: 'Manhattan', rent: 1900, start: '2026-06-01', end: '2026-08-15', contact: 'Replied',
      terms: '$450 refundable deposit; utilities $70/month.',
      checks: 'Permission email requested; live tour pending.',
      action: 'Arrange viewing and review permission information.',
    },
    {
      id: 'B02', area: 'Manhattan Valley', borough: 'Manhattan', rent: 2000, start: '2026-06-01', end: '2026-08-15', contact: 'Waiting',
      terms: '$500 refundable deposit; utilities unknown.',
      checks: 'Permission claimed; supporting evidence not received.',
      action: 'Review reply status; consider a backup.',
    },
    {
      id: 'B03', area: 'Chelsea', borough: 'Manhattan', rent: 2150, start: '2026-06-01', end: '2026-08-31', contact: 'Not contacted',
      terms: 'Full August rent required; utilities included; $500 refundable deposit.',
      checks: 'Permission and viewing not yet checked.',
      action: 'Ask about the full-August payment requirement.',
    },
    {
      id: 'B06', area: 'Harlem', borough: 'Manhattan', rent: 1800, start: '2026-06-01', end: '2026-08-31', contact: 'Replied',
      terms: '$400 refundable deposit; utilities $80/month; monthly payments.',
      checks: 'Written permission requested; live viewing not arranged.',
      action: 'Ask for written permission and viewing times.',
    },
    {
      id: 'B07', area: 'Washington Heights', borough: 'Manhattan', rent: 1700, start: '2026-06-10', end: '2026-08-31', contact: 'Waiting',
      terms: '$350 refundable deposit; utilities included; earliest move-in June 10.',
      checks: 'Earlier access not confirmed; permission not reviewed.',
      action: 'Ask whether move-in can be brought forward to June 1.',
    },
    {
      id: 'B08', area: 'Astoria', borough: 'Queens', rent: 1950, start: '2026-06-01', end: '2026-08-15', contact: 'Replied',
      terms: '$500 refundable deposit; utilities $55/month; monthly payments.',
      checks: 'Permission document requested; room layout only seen in photos.',
      action: 'Schedule a live room tour and review the permission document.',
    },
    {
      id: 'B09', area: 'Sunnyside', borough: 'Queens', rent: 1600, start: '2026-05-25', end: '2026-08-20', contact: 'Not contacted',
      terms: '$400 refundable deposit; utilities $90/month; shared bathroom.',
      checks: 'Permission, viewing, and deposit return timing not checked.',
      action: 'Send an initial inquiry about permission and deposit terms.',
    },
    {
      id: 'B10', area: 'Long Island City', borough: 'Queens', rent: 2600, start: '2026-06-01', end: '2026-08-31', contact: 'Not contacted',
      terms: '$700 refundable deposit; utilities included; monthly payments.',
      checks: 'Permission and viewing not checked; rent may exceed the search range.',
      action: 'Confirm payment terms before deciding whether to reconsider the budget.',
    },
    {
      id: 'B11', area: 'Bushwick', borough: 'Brooklyn', rent: 1850, start: '2026-06-01', end: '2026-08-10', contact: 'Waiting',
      terms: '$450 refundable deposit; utilities $60/month; latest checkout August 10.',
      checks: 'Extension and August payment terms not confirmed.',
      action: 'Ask whether checkout can be extended through August 15.',
    },
    {
      id: 'B12', area: 'Crown Heights', borough: 'Brooklyn', rent: 2000, start: '2026-05-28', end: '2026-08-31', contact: 'Replied',
      terms: '$500 refundable deposit; utilities $100/month; August payment terms unclear.',
      checks: 'Permission requested; total August cost and live viewing not confirmed.',
      action: 'Clarify August charges and arrange a live viewing.',
    },
    {
      id: 'B13', area: 'Parkchester', borough: 'Bronx', rent: 1450, start: '2026-06-01', end: '2026-08-31', contact: 'Replied',
      terms: '$300 refundable deposit; utilities included; monthly payments.',
      checks: 'Permission and live viewing pending; travel route not checked.',
      action: 'Review permission and the travel route before choosing.',
    },
    {
      id: 'B14', area: 'St. George', borough: 'Staten Island', rent: 1550, start: '2026-06-01', end: '2026-08-15', contact: 'Not contacted',
      terms: '$350 refundable deposit; utilities $65/month; monthly payments.',
      checks: 'Permission, live viewing, and travel route not checked.',
      action: 'Ask for permission details and assess the travel route.',
    },
  ];
  // The two scripted demo events. They refer to example listings, so they only run in the example workspace.
  // The host message suggests one field change; it is applied only after the user confirms it in a dialog.
  const DEMO_MESSAGES = {
    host: {
      message: () => ({
        id: 'host-b05', kind: 'host',
        text: 'Correction: the latest checkout is August 13, two days earlier than originally posted. Other terms are unchanged.',
        reviewed: false, suggestion: {listing: 'B05', field: 'end', from: '2026-08-15', to: '2026-08-13'},
      }),
      log: 'Delivered fictional B05 host message. Listing dates were not changed automatically.',
      toast: 'Simulated host message delivered to Updates.',
    },
    reminder: {
      message: () => ({
        id: 'reminder-b02', kind: 'reminder', listing: 'B02',
        text: 'At the simulated Apr 27, 2026, 21:00 checkpoint, this entry is still marked Waiting after 12 hours (last contact Apr 27, 2026, 09:00). Review the conversation or contact a backup.',
        reviewed: false,
      }),
      log: 'Manually added B02 follow-up reminder using the scripted 12-hour checkpoint.',
      toast: 'Manual demo reminder added.',
    },
  };
  const HOST_DEMO = DEMO_MESSAGES.host.message();
  // How each kind of message is labelled; the listing ID always comes from the message itself.
  const MESSAGE_TYPES = {
    host: {heading: 'HOST MESSAGE', edit: id => `Update ${id} details →`, name: id => `${id} host message`},
    reminder: {heading: 'MANUAL REMINDER', edit: id => `Review ${id} & next action →`, name: id => `${id} reminder`},
  };
  // What the user has actually confirmed for a listing. Matching on dates and rent says nothing about these.
  // Team decision 2 (2026-10-28): Live viewing has no level of its own; it is Safety's viewedBeforePaying, so only three are stored.
  const VERIFY_KEYS = ['permission', 'fees', 'host'], VERIFY_LEVELS = ['Unknown', 'Claimed', 'Verified'];
  // The four checks a card lists as verified or not, in display order; 'viewing' reads viewedBeforePaying === 'Done'.
  const CHECK_KEYS = ['permission', 'fees', 'viewing', 'host'];
  // Safety checks are the user's own anti-scam reminders. ShortStay does not verify any of them.
  const SAFETY_KEYS = ['viewedBeforePaying', 'identityChecked', 'writtenAgreement', 'traceablePayment', 'priceReasonable'];
  const SAFETY_LEVELS = ['Not yet', 'Done', 'N/A'];
  // Team decision 1 (2026-10-28): the two checks that must be Done before paying are Not yet / Done only (no N/A);
  // the other three keep N/A for checks that do not apply.
  const PAYMENT_KEYS = ['viewedBeforePaying', 'traceablePayment'];
  const SAFETY_SHORT = {identityChecked: 'identity', writtenAgreement: 'written agreement', priceReasonable: 'price'};
  const SAFETY_LABELS = {
    viewedBeforePaying: 'viewed before paying', identityChecked: 'identity checked', writtenAgreement: 'written agreement',
    traceablePayment: 'traceable payment', priceReasonable: 'price reasonable',
  };
  // Layout and sort are viewer preferences, kept apart from the workspace data and never required.
  const PREFS = 'shortstay-cp3-view-prefs', SORTS = ['default', 'rent', 'datefit', 'contact', 'updated'];
  // Activity is research evidence: keep full timestamps and before/after values, and count anything dropped.
  const MAX_EVENTS = 2000, SHOWN_EVENTS = 100, MAX_RENT = 20000;
  // Undo for easy-to-misclick actions: a deep copy of the workspace (not the log or session details) taken just before
  // the action. Only the latest one is kept, and any other saved change clears it, so an undo never reverts later work.
  const UNDO_MS = 8000, LOG_KEYS = ['events', 'droppedEvents', 'sessionCode', 'lastExportAt'];
  // Ctrl+Z (⌘Z on Apple devices) also undoes while the Undo button is offered.
  const UNDO_KEY = /mac|iphone|ipad/i.test(navigator.userAgentData?.platform || navigator.platform || '') ? '⌘Z' : 'Ctrl+Z';
  const CONTACT_ORDER = ['Replied', 'Waiting', 'Not contacted', 'Closed'];
  const SHORT_FIELD = {start: 'move-in', end: 'checkout', rent: 'rent'};
  const NEXT_MAX = 5, NEXT_MOBILE = 3, WAIT_LIMIT = 2 * 86400000;
  // Where Next up's 'Open updates', 'Review reasoning' and 'Choose in My decision' buttons go: [section to scroll to, element to focus].
  const NEXT_TARGETS = {inbox: ['inbox', 'inbox-heading'], decision: ['decision', 'decision-note'], choice: ['decision', 'first-choice']};
  const FIELD_LABELS = {
    area: 'area', borough: 'borough', source: 'source', sourceDetail: 'source details', start: 'available-from date', end: 'checkout date',
    rent: 'monthly rent', contact: 'contact status', lastContacted: 'last contacted', terms: 'payment terms', checks: 'open checks', action: 'next action',
  };
  const LISTING_FIELDS = ['area', 'borough', 'source', 'sourceDetail', 'rent', 'contact', 'lastContacted', 'start', 'end', 'terms', 'checks', 'action'];
  // First-use tips: whether they were dismissed is a viewer preference in its own key, outside the workspace data.
  const TIPS = 'shortstay-cp3-tips-seen';
  const UNDECIDED = 'Undecided';
  // Toast copy. A toast is announced by screen readers, so each event always uses the same words.
  const OUTSIDE_NEEDS = 'Outside your needs; find it in All saved.';
  const TOASTS = {
    notSaved: 'Not saved. This browser could not store the change; see the message at the top of the page.',
    undone: label => `Undone: ${label}`,
    choiceUpdated: 'Current first choice updated.',
    choiceUpdatedReviewReasoning: 'First choice updated. Review your reasoning in My decision.',
    markedReviewed: 'Update marked reviewed.',
    listingAdded: id => `${id} added to your saved listings.`,
    listingAddedOutside: id => `${id} added. ${OUTSIDE_NEEDS}`,
    listingAddedClosed: id => `${id} added as Closed; find it in All saved.`,
    listingSaved: 'Listing updated. Date and rent checks recalculated.',
    listingSavedOutside: id => `${id} saved. ${OUTSIDE_NEEDS}`,
    listingClosed: id => `${id} marked Closed. It stays in All saved.`,
    noChanges: 'No changes to save.',
    listingRemoved: (id, isCurrentChoice) => `${id} removed.${isCurrentChoice ? ' Your first choice is now Undecided.' : ''}`,
    hostChangeApplied: (id, field, value, where) => `${id} ${field} updated to ${value}.${where}`,
    hostChangeReverted: (id, field, value, where) => `${id} ${field} changed back to ${value}; the message is unread again.${where}`,
    needsSaved: 'Your needs are saved. Matching listings updated.',
    reasoningKept: 'Reasoning kept for your current first choice.',
    decisionSaved: 'Decision saved in this browser.',
    sessionCodeSaved: 'Session code saved.',
    sessionExported: name => `Session exported as ${name}.`,
    emptyStarted: 'Empty workspace started. Add your first listing.',
    demoReset: 'Demo reset to the original example.',
  };
  // Where a listing ends up after Apply change, appended to TOASTS.hostChangeApplied.
  const APPLY_RESULT = {
    closed: ' It is marked Closed; find it in All saved.',
    stillMatches: ' It still matches your needs.',
    nowMatches: ' It now matches your needs and is in Matches.',
    leftMatches: ' It no longer matches your needs and has left Matches; find it in All saved.',
    stillOutside: ' It is still outside your needs; find it in All saved.',
  };
  // Text filled into the confirmation dialogs.
  const CONFIRM_TEXT = {
    removeTitle: l => `Remove ${l.id} · ${l.area}?`,
    removeBody: (l, isChoice) => `This removes ${l.id} (${l.area}, ${l.borough}) and its terms, checks and next action from this browser. `
      + `You can undo it for a few seconds right after removing it (Undo, or ${UNDO_KEY}). Demo activity keeps a record that it was removed.`
      + `${isChoice ? ' It is your current first choice, so your first choice will become Undecided.' : ''}`,
    logNote: (entries, lastExportAt) => `The activity log (${entries} ${entries === 1 ? 'entry' : 'entries'}) will also be cleared. `
      + `${lastExportAt
        ? `It was last exported at ${new Date(lastExportAt).toLocaleString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}.`
        : 'It has not been exported yet.'}`,
  };
  // Reset demo and Start empty workspace run the same flow (open with the log note, optional export first, confirm);
  // only the dialog, its buttons and the new workspace mode differ.
  const START_OVER_FLOWS = [
    {mode: 'example', dialog: 'reset-dialog', open: 'reset-open', exportFirst: 'reset-export', note: 'reset-log-note', confirm: 'reset-confirm'},
    {mode: 'empty', dialog: 'empty-dialog', open: 'empty-open', exportFirst: 'empty-export', note: 'empty-log-note', confirm: 'empty-confirm'},
  ];

  // ===== Utilities: escaping, dates, formatting =====
  const $ = id => document.getElementById(id);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const formatMoney = n => new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0}).format(n);
  const formatShortDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', timeZone: 'UTC'});
  const formatLongDate = iso => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'});
  const toDayNumber = iso => Date.parse(iso + 'T00:00:00Z') / 86400000;
  // Both ends carry a year when the range crosses into another year.
  const formatDateRange = (start, end) => start.slice(0, 4) === end.slice(0, 4)
    ? `${formatShortDate(start)} – ${formatLongDate(end)}`
    : `${formatLongDate(start)} – ${formatLongDate(end)}`;
  const formatNights = n => `${n} ${n === 1 ? 'night' : 'nights'}`;
  const joinWords = words => words.length < 2 ? words.join('') : `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`;
  const lowercaseFirst = text => text.charAt(0).toLowerCase() + text.slice(1);
  const uppercaseFirst = text => text.charAt(0).toUpperCase() + text.slice(1);
  const getMoreLabel = isOpen => isOpen ? 'Show less' : 'Show more';
  // Elapsed time is measured against the real clock (Date.now) and refreshed in place every minute.
  function formatSinceContact(value) {
    const at = value ? new Date(value).getTime() : NaN;
    if (!Number.isFinite(at)) return 'Last contact: Not recorded';
    const hours = Math.floor((Date.now() - at) / 3600000);
    if (hours < 0) return 'Last contact date is in the future';
    if (hours < 1) return 'Less than an hour since last contact';
    return hours < 24
      ? `${hours} ${hours === 1 ? 'hour' : 'hours'} since last contact`
      : `${Math.floor(hours / 24)} ${Math.floor(hours / 24) === 1 ? 'day' : 'days'} since last contact`;
  }
  function formatUpdated(iso) {
    const at = iso ? new Date(iso) : null;
    if (!at || !Number.isFinite(at.getTime())) return 'Updated: Not recorded';
    return 'Updated ' + at.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', ...(at.getFullYear() !== new Date(Date.now()).getFullYear() ? {year: 'numeric'} : {}),
    });
  }
  // Local date-time string for a datetime-local input.
  const getLocalNow = () => {
    const d = new Date(Date.now());
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };
  const formatFieldValue = (field, v, long) => v === '' || v == null ? '(empty)'
    : field === 'rent' ? formatMoney(v) : (long ? formatLongDate : formatShortDate)(v);
  const makeChange = (field, from, to) => ({field, from: from ?? '', to: to ?? ''});
  function downloadJson(name, text) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([text], {type: 'application/json'}));
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
  const findByData = (name, value) => document.querySelector(`[data-${name}="${CSS.escape(value)}"]`);
  // One click listener per container for its data-* buttons, including ones rendered later. The first [selector, handler]
  // pair whose selector matches the clicked element or an ancestor handles the click, so list order is check order.
  function delegateClicks(containerId, handlers) {
    $(containerId).addEventListener('click', e => {
      for (const [selector, handle] of handlers) {
        const target = e.target.closest(selector);
        if (target) {
          handle(target);
          return;
        }
      }
    });
  }

  // ===== Storage: state, load, normalize, store, backup =====
  // All mutable state, in one place. Initial values are only placeholders: startup fills state, density and sortBy.
  let state = null;                // The workspace saved under STORAGE (listings, messages, decision, activity log).
  let storageNotice = null;        // Why saved data was not used at load: {kind: 'unavailable'} or {kind: 'unreadable', raw, backupKey}.
  let isStorageBlocked = false;    // The unreadable save could not be backed up, so nothing may be written over it.
  let hasStorageFailed = false;    // The latest write failed or was blocked; drives the banner and the leave-page warning.
  let density;                     // Card layout, 'compact' or 'detailed' (a viewer preference, saved under PREFS).
  let sortBy;                      // Card order, one of SORTS (a viewer preference, saved under PREFS).
  let listingView = 'matches';     // Which listings the shortlist shows: 'matches' or 'all'.
  const expandedRows = new Set();  // Compact rows the viewer opened, by listing ID; kept across re-renders.
  const expandedText = new Set();  // Card notes expanded past three lines, as 'id:field'; kept across re-renders.
  let isNoteDirty = false;         // The reasoning box differs from the saved note (an unsaved draft).
  let isChoiceDirty = false;       // The first-choice menu differs from the saved choice (an unsaved draft).
  let isNextExpanded = false;      // Next up shows every entry instead of the first three (phones).
  let nextHtml = null;             // Next up's last markup; the section is rebuilt only when it changes, so focus survives.
  let currentListing = null;       // ID of the listing open in the listing dialog; null while adding a new one.
  let currentApply = null;         // ID of the message whose suggested change is open in the Apply dialog.
  let isRevertApply = false;       // The Apply dialog is putting back the value an earlier Apply change replaced.
  let justAdded = null;            // ID of the latest added listing; while Matches hides it, the status line says why. Cleared on any view change.
  let listingFormStart = '';       // The listing form's values when it opened; a new listing whose form differs has something to lose.
  let undo = null;                 // The one undoable action on offer: {state, label, refocus}; any other saved change clears it.
  let toastTimer;                  // Hides the toast, or checks again whether it may hide yet.
  let isToastHeld = false;         // The pointer is over the toast, which pauses the Undo countdown.
  let clampTimer;                  // Waits for resizing to stop before re-measuring which notes need Show more.
  const migrations = [];           // Log entries for older saves brought up to date while loading (see migrateListing).
  // 'example' starts from the 12 fictional listings; 'empty' starts with nothing so real entry effort can be observed.
  function createInitialState(mode = 'example') {
    const isEmpty = mode === 'empty';
    return {
      version: 1, mode: isEmpty ? 'empty' : 'example', needs: {start: '2026-06-01', end: '2026-08-15', budgetMin: 0, budgetMax: 2200},
      choice: isEmpty ? '' : 'B05', noteFor: isEmpty ? '' : 'B05',
      note: isEmpty ? '' : 'B05 is a provisional preference. Review permission information and complete a live viewing before committing.',
      listings: isEmpty ? [] : DEMO_LISTINGS.map(listing => ({...listing, verify: getVerifyLevels(listing), safety: getSafetyLevels(listing)})),
      messages: [], events: [],
    };
  }
  // Saved data that cannot be read is copied to a backup key instead of being silently replaced.
  // If even the backup fails, saving is paused so the original is never overwritten.
  function backupUnreadable(raw) {
    try {
      const existing = Object.keys(localStorage).find(key => key.startsWith(STORAGE + '-backup-') && localStorage.getItem(key) === raw);
      if (existing) return existing;
      const key = `${STORAGE}-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      localStorage.setItem(key, raw);
      return key;
    } catch (_) {
      return null;
    }
  }
  function loadState() {
    let raw;
    try {
      raw = localStorage.getItem(STORAGE);
    } catch (_) {
      storageNotice = {kind: 'unavailable'};
      return createInitialState();
    }
    if (raw === null) return createInitialState();
    try {
      const value = JSON.parse(raw);
      if (isReadableSave(value)) return normalizeState(value);
    } catch (_) {}
    storageNotice = {kind: 'unreadable', raw, backupKey: backupUnreadable(raw)};
    isStorageBlocked = !storageNotice.backupKey;
    return createInitialState();
  }
  const isReadableSave = value => value?.version === 1
    && Array.isArray(value.listings) && value.listings.every(listing => listing && typeof listing.id === 'string')
    && Array.isArray(value.messages) && Array.isArray(value.events) && value.needs?.start && value.needs?.end;
  // Brings a readable save up to date in place. The steps run in this order so new keys are added in the same order as before.
  function normalizeState(value) {
    value.needs = normalizeNeeds(value.needs);
    // Older saves did not record which choice the reasoning was written for; assume the saved pair matches.
    if (typeof value.noteFor !== 'string') value.noteFor = typeof value.choice === 'string' ? value.choice : '';
    // Entries that are not objects (a damaged or hand-edited save) are dropped so rendering never fails on them.
    const isEntry = x => x !== null && typeof x === 'object' && !Array.isArray(x);
    value.events = value.events.filter(isEntry);
    // Older saves have the B05 host message without its suggestion; add it so the change can still be applied.
    value.messages = value.messages.filter(isEntry).map(m => m.id === HOST_DEMO.id && !m.suggestion ? {...m, suggestion: {...HOST_DEMO.suggestion}} : m);
    // Saves from before modes existed are example workspaces.
    value.mode = value.mode === 'empty' ? 'empty' : 'example';
    value.listings = normalizeListings(value.listings, value.mode === 'example');
    return value;
  }
  function normalizeNeeds(needs) {
    const maximum = Number.isFinite(needs.budgetMax) && needs.budgetMax >= 0 ? needs.budgetMax
      : Number.isFinite(needs.budget) && needs.budget >= 0 ? needs.budget : 2200;
    const minimum = Number.isFinite(needs.budgetMin) && needs.budgetMin >= 0 && needs.budgetMin <= maximum ? needs.budgetMin : 0;
    return {start: needs.start, end: needs.end, budgetMin: minimum, budgetMax: maximum};
  }
  // Only example workspaces get the built-in listings merged back in; an empty workspace must stay empty after a refresh.
  function normalizeListings(listings, isExample) {
    const catalogById = new Map(isExample ? DEMO_LISTINGS.map(listing => [listing.id, listing]) : []);
    const normalized = listings.map(listing => {
      migrateListing(listing);
      return {
        ...catalogById.get(listing.id), ...listing, borough: listing.borough || catalogById.get(listing.id)?.borough || 'New York City',
        verify: getVerifyLevels(listing), safety: getSafetyLevels(listing),
      };
    });
    const savedIds = new Set(normalized.map(listing => listing.id));
    if (isExample) {
      normalized.push(...DEMO_LISTINGS.filter(listing => !savedIds.has(listing.id))
        .map(listing => ({...listing, verify: getVerifyLevels(listing), safety: getSafetyLevels(listing)})));
    }
    return normalized;
  }
  // Team decisions 1 and 2 for older saves. Nothing is marked Done for the user: N/A on a required payment check becomes Not yet,
  // and a Live viewing marked Verified becomes a request to confirm Viewed before paying. Logged once everything is defined.
  function migrateListing(listing) {
    PAYMENT_KEYS.filter(key => listing.safety?.[key] === 'N/A').forEach(key => migrations.push({
      text: `Migrated: N/A → Not yet for required payment check (${listing.id})`,
      details: {listing: listing.id, changes: [makeChange(`safety: ${SAFETY_LABELS[key]}`, 'N/A', 'Not yet')]},
    }));
    if (listing.verify?.viewing === 'Verified' && listing.safety?.viewedBeforePaying !== 'Done') {
      listing.viewingToConfirm = true;
      migrations.push({
        text: `Migrated: Live viewing was Verified; confirm Viewed before paying (${listing.id})`,
        details: {listing: listing.id, changes: [makeChange('viewing check', 'Verified', '(moved to safety: viewed before paying)')]},
      });
    }
  }
  function loadPrefs() {
    try {
      return JSON.parse(localStorage.getItem(PREFS)) || {};
    } catch (_) {
      return {};
    }
  }
  function savePrefs() {
    try {
      localStorage.setItem(PREFS, JSON.stringify({density, sort: sortBy}));
    } catch (_) {}
  }
  function store() {
    if (isStorageBlocked) hasStorageFailed = true;
    else {
      try {
        localStorage.setItem(STORAGE, JSON.stringify(state));
        hasStorageFailed = false;
      } catch (_) {
        hasStorageFailed = true;
      }
    }
    renderStorageAlert();
    return !hasStorageFailed;
  }
  function recordEvent(role, text, details) {
    state.events.unshift({role, text, time: new Date().toISOString(), ...(details ? {details} : {})});
    if (state.events.length > MAX_EVENTS) {
      state.droppedEvents = (state.droppedEvents || 0) + state.events.length - MAX_EVENTS;
      state.events.length = MAX_EVENTS;
    }
  }
  function takeSnapshot() {
    const copy = {...state};
    LOG_KEYS.forEach(key => delete copy[key]);
    return JSON.parse(JSON.stringify(copy));
  }
  function hasSeenTips() {
    try {
      return localStorage.getItem(TIPS) === '1';
    } catch (_) {
      return false;
    }
  }
  function markTipsSeen() {
    try {
      localStorage.setItem(TIPS, '1');
    } catch (_) {}
  }
  function clearTipsSeen() {
    try {
      localStorage.removeItem(TIPS);
    } catch (_) {}
  }

  // ===== Rules: matching, date gaps, budget, verification, safety checks, Next up entries =====
  const getMessageType = m => MESSAGE_TYPES[m.kind === 'host' ? 'host' : 'reminder'];
  // Older saves may lack the listing on a message; fall back to the listing of the matching demo message.
  const getDemoListingId = kind => {
    const m = DEMO_MESSAGES[kind].message();
    return m.listing || m.suggestion.listing;
  };
  const getMessageListingId = m => m.listing || m.suggestion?.listing || getDemoListingId(m.kind === 'host' ? 'host' : 'reminder');
  const getVerifyLevels = listing => Object.fromEntries(VERIFY_KEYS.map(key => [
    key, VERIFY_LEVELS.includes(listing?.verify?.[key]) ? listing.verify[key] : 'Unknown',
  ]));
  const isViewed = listing => getSafetyLevels(listing).viewedBeforePaying === 'Done';
  const listUnverified = listing => CHECK_KEYS.filter(key => key === 'viewing' ? !isViewed(listing) : getVerifyLevels(listing)[key] !== 'Verified');
  // Where a Next up entry about an open check puts focus: viewing is edited in Safety checks.
  const getCheckField = key => key === 'viewing' ? 'safety-viewedBeforePaying' : 'verify-' + key;
  const isSafetyLevelAllowed = (key, level) => SAFETY_LEVELS.includes(level) && !(level === 'N/A' && PAYMENT_KEYS.includes(key));
  const getSafetyLevels = listing => Object.fromEntries(SAFETY_KEYS.map(key => [
    key, isSafetyLevelAllowed(key, listing?.safety?.[key]) ? listing.safety[key] : 'Not yet',
  ]));
  const countSafetyDone = listing => SAFETY_KEYS.filter(key => getSafetyLevels(listing)[key] === 'Done').length;
  // Shown for the first choice until both payment-related checks are Done; nothing for a Closed listing.
  function getSafetyWarning(listing) {
    if (!listing || isClosed(listing)) return '';
    const s = getSafetyLevels(listing), isViewed = s.viewedBeforePaying === 'Done', isTraceable = s.traceablePayment === 'Done';
    return [
      isViewed ? '' : `Don’t pay for ${listing.id} before a live viewing.`,
      isTraceable ? '' : `${isViewed ? `Pay for ${listing.id}` : 'Pay'} only by a traceable method (no gift cards, crypto or unexplained transfer requests).`,
    ].filter(Boolean).join(' ');
  }
  // The other safety checks still Not yet (N/A counts as handled for these), so clearing the payment reminder never reads as "all safe".
  const listOpenSafety = listing => SAFETY_KEYS.filter(key => !PAYMENT_KEYS.includes(key) && getSafetyLevels(listing)[key] === 'Not yet');
  function getSafetyFollowUp(listing) {
    if (!listing || isClosed(listing) || getSafetyWarning(listing)) return '';
    const open = listOpenSafety(listing).map(key => SAFETY_LABELS[key]);
    return open.length ? `Payment checks marked done. Still open: ${joinWords(open)}.` : '';
  }
  function countGapNights(listing) {
    const required = Math.max(0, toDayNumber(state.needs.end) - toDayNumber(state.needs.start));
    const covered = Math.max(0, Math.min(toDayNumber(state.needs.end), toDayNumber(listing.end))
      - Math.max(toDayNumber(state.needs.start), toDayNumber(listing.start)));
    return Math.max(0, required - covered);
  }
  // Says where the dates fall short, instead of a single night count.
  function getGapSides(listing) {
    return {
      none: toDayNumber(listing.end) <= toDayNumber(state.needs.start) || toDayNumber(listing.start) >= toDayNumber(state.needs.end),
      late: Math.max(0, toDayNumber(listing.start) - toDayNumber(state.needs.start)),
      early: Math.max(0, toDayNumber(state.needs.end) - toDayNumber(listing.end)),
    };
  }
  // Why a listing falls outside the needs, as data: the date shortfall (null when the dates are covered) and how far the
  // rent is above the maximum or below the minimum (0 when it is not). Each place that explains it only chooses the wording.
  function mismatch(listing) {
    const sides = countGapNights(listing) ? getGapSides(listing) : null;
    return {
      dates: sides && (sides.none ? {none: true} : {late: sides.late, early: sides.early}),
      above: Math.max(0, listing.rent - state.needs.budgetMax),
      below: Math.max(0, state.needs.budgetMin - listing.rent),
    };
  }
  // Wording for mismatch() and for open verification checks. Every explanation of a date gap, the rent range or unverified
  // checks is built from these tables, so the numbers and phrases agree everywhere; each place only picks its wording.
  const DATE_WORDING = {
    card: {none: 'Doesn’t overlap your dates', late: n => `Starts ${n} late`, early: n => `Ends ${n} early`},
    nextUp: {none: 'dates don’t overlap yours', late: n => `move-in starts ${n} late`, early: n => `checkout ends ${n} early`},
  };
  const RENT_WORDING = {
    // order: which side is listed first when a place names both (only one can apply while the minimum is at most the maximum).
    card: {order: ['below', 'above'], below: () => 'Rent below minimum', above: () => 'Rent above maximum'},
    row: {order: ['below', 'above'], below: () => 'below min', above: () => 'above max'},
    decision: {
      order: ['below', 'above'], below: amount => `${amount}/month below your minimum rent`, above: amount => `${amount}/month above your maximum rent`,
    },
    nextUp: {
      order: ['above', 'below'], above: amount => `rent is ${amount}/month above your maximum`, below: amount => `rent is ${amount}/month below your minimum`,
    },
    preview: {order: ['below', 'above'], below: () => 'rent below your minimum', above: () => 'rent above your maximum'},
  };
  const VERIFY_WORDING = {
    card: {open: keys => `Not yet verified: ${keys.join(' · ')}`, none: 'All four checks verified'},
    row: {open: keys => `${keys.length} unverified`, none: 'All verified'},
    sentence: {open: keys => `Not verified yet: ${joinWords(keys)}.`, none: ''},
  };
  function describeDates(dates, place) {
    if (!dates) return [];
    const words = DATE_WORDING[place];
    if (dates.none) return [words.none];
    return [dates.late ? words.late(formatNights(dates.late)) : '', dates.early ? words.early(formatNights(dates.early)) : ''].filter(Boolean);
  }
  const describeRent = (why, place) => RENT_WORDING[place].order.filter(side => why[side]).map(side => RENT_WORDING[place][side](formatMoney(why[side])));
  const describeUnverified = (keys, place) => keys.length ? VERIFY_WORDING[place].open(keys) : VERIFY_WORDING[place].none;
  // The card's phrases for a listing's date gap, e.g. ['Starts 9 nights late', 'Ends 2 nights early'].
  function describeDateGap(listing) {
    return describeDates(mismatch(listing).dates, 'card');
  }
  function isWithinBudget(listing) {
    return listing.rent >= state.needs.budgetMin && listing.rent <= state.needs.budgetMax;
  }
  // R-1 (provisional rule, to be confirmed by the team): Closed listings stay in All saved but never count as matches.
  const isClosed = listing => listing.contact === 'Closed';
  function fitsNeeds(listing) {
    return isWithinBudget(listing) && countGapNights(listing) === 0;
  }
  function matchesNeeds(listing) {
    return fitsNeeds(listing) && !isClosed(listing);
  }
  // Stable sorts: ties keep the default (saved) order. Listings without updatedAt go last.
  function sortListings(list) {
    const index = new Map(state.listings.map((l, i) => [l.id, i]));
    const key = {
      rent: l => l.rent, datefit: l => countGapNights(l), contact: l => CONTACT_ORDER.indexOf(l.contact), updated: l => -(Date.parse(l.updatedAt) || -Infinity),
    }[sortBy];
    return key ? [...list].sort((a, b) => (key(a) - key(b)) || index.get(a.id) - index.get(b.id)) : list;
  }
  // A waiting-reply reminder is current only while it is unread and its listing is still marked Waiting.
  const getListingContact = m => state.listings.find(l => l.id === getMessageListingId(m))?.contact;
  const isReminderOutdated = m => m.kind === 'reminder' && getListingContact(m) !== 'Waiting';
  const isReminderActive = m => m.kind === 'reminder' && !m.reviewed && !isReminderOutdated(m);
  const findSuggestionTarget = m => m.suggestion && state.listings.find(l => l.id === m.suggestion.listing);
  const countUnread = () => state.messages.filter(m => !m.reviewed && !isReminderOutdated(m)).length;
  // Next up: hints built only from saved data (the saved first choice, never a draft). It changes nothing and suggests no other listing.
  // Order: first choice outside needs, its payment safety (then its other open safety checks), its open checks,
  // viewings to confirm after the decision-2 migration, unread updates, Waiting for over 2 days, reasoning written for another choice.
  function buildNextItems() {
    const chosen = state.listings.find(l => l.id === state.choice), items = chosen ? buildFirstChoiceItems(chosen) : [];
    const unread = countUnread();
    state.listings.filter(l => l.viewingToConfirm).forEach(l => items.push({
      kind: 'Confirm', tone: 'caution', text: `${l.id}: you marked viewing Verified earlier — confirm ‘Viewed before paying’ in Safety checks.`,
      ...makeReviewItem(l, 'safety-viewedBeforePaying'),
    }));
    if (unread) items.push({kind: 'Updates', text: `${unread} unread ${unread === 1 ? 'update' : 'updates'}`, label: 'Open updates', go: 'inbox'});
    state.listings.forEach(l => {
      const waited = Date.now() - (l.lastContacted ? new Date(l.lastContacted).getTime() : NaN);
      if (l.contact === 'Waiting' && waited > WAIT_LIMIT) {
        items.push({kind: 'Waiting', text: `${l.id} waiting ${Math.floor(waited / 86400000)} days since last contact`, ...makeReviewItem(l, 'contact')});
      }
    });
    if (state.note && state.noteFor !== state.choice) {
      items.push({
        kind: 'Reasoning', text: `Your reasoning was written for ${state.noteFor || UNDECIDED}; your first choice is ${state.choice || UNDECIDED}`,
        label: 'Review reasoning', go: 'decision',
      });
    }
    return items.slice(0, NEXT_MAX);
  }
  const makeReviewItem = (l, field) => ({label: `Review ${l.id}`, edit: l.id, field});
  // Entries about the saved first choice: outside the needs, payment safety, open checks.
  function buildFirstChoiceItems(chosen) {
    const items = [], first = (text, field) => items.push({kind: 'First choice', tone: 'warn', text, ...makeReviewItem(chosen, field)});
    if (isClosed(chosen)) first(`${chosen.id} is marked Closed`, 'contact');
    const why = mismatch(chosen);
    if (why.dates) first(`${chosen.id} ${describeDates(why.dates, 'nextUp').join(' and ')}`, why.dates.late || why.dates.none ? 'start' : 'end');
    describeRent(why, 'nextUp').forEach(text => first(`${chosen.id} ${text}`, 'rent'));
    const safety = getSafetyWarning(chosen);
    if (safety) {
      const field = 'safety-' + (getSafetyLevels(chosen).viewedBeforePaying === 'Done' ? 'traceablePayment' : 'viewedBeforePaying');
      items.push({kind: 'Safety', tone: 'warn', text: safety, ...makeReviewItem(chosen, field)});
    }
    const openSafety = listOpenSafety(chosen);
    if (!safety && openSafety.length && !isClosed(chosen)) {
      items.push({
        kind: 'Safety', tone: 'caution',
        text: `${chosen.id}: ${openSafety.length} safety ${openSafety.length === 1 ? 'check' : 'checks'} still open (${openSafety.map(key => SAFETY_SHORT[key]).join(', ')})`,
        ...makeReviewItem(chosen, 'safety-' + openSafety[0]),
      });
    }
    const openChecks = listUnverified(chosen);
    if (openChecks.length && !isClosed(chosen)) {
      items.push({
        kind: 'Checks', tone: 'caution', text: `${chosen.id} — ${describeUnverified(openChecks, 'sentence')}`,
        ...makeReviewItem(chosen, getCheckField(openChecks[0])),
      });
    }
    return items;
  }
  // Added IDs are never reused after a removal, so the activity log stays unambiguous.
  function claimNextListingId() {
    const n = Math.max(state.addedCount || 0, ...state.listings.map(l => /^U(\d+)$/.exec(l.id)).filter(Boolean).map(m => Number(m[1]))) + 1;
    state.addedCount = n;
    return 'U' + String(n).padStart(2, '0');
  }
  // What Matches will say after the change, worked out on a copy of the listing.
  function previewMatch(listing, next) {
    const isMatchBefore = matchesNeeds(listing), isMatchAfter = matchesNeeds(next), rent = mismatch(next);
    if (isClosed(next)) return {isMatchBefore, isMatchAfter, text: `${next.id} is marked Closed, so it stays out of Matches.`};
    if (isMatchAfter) {
      const text = isMatchBefore ? `${next.id} will still match your needs.` : `${next.id} will match your needs and appear in Matches.`;
      return {isMatchBefore, isMatchAfter, text};
    }
    const why = [...describeDateGap(next).map(lowercaseFirst), ...describeRent(rent, 'preview')];
    return {
      isMatchBefore, isMatchAfter,
      text: `${next.id} ${isMatchBefore ? 'will no longer match' : 'will still be outside'} `
        + `${isWithinBudget(next) ? 'your dates' : countGapNights(next) ? 'your needs' : 'your rent range'}: ${why.join('; ')}.`,
    };
  }

  // ===== Rendering: one render function per area =====
  function renderStorageAlert() {
    const notice = storageNotice, download = '<button type="button" class="text-button" data-download-backup>Download backup (JSON)</button>';
    let html = '';
    if (isStorageBlocked) {
      html = '<p><strong>Changes are not being saved.</strong> Saved data in this browser could not be read or backed up, so it has been left untouched. '
        + 'Anything you change now will be lost when you close or refresh this page. Tell the team.</p>'
        + `<div class="storage-actions">${download}</div>`;
    } else if (hasStorageFailed || notice?.kind === 'unavailable') {
      html = '<p><strong>Your changes are not being saved.</strong> This browser would not store them (storage may be full, blocked, or in a private window). '
        + 'They will be lost when you close or refresh this page.</p>';
    } else if (notice?.kind === 'unreadable' && !notice.dismissed) {
      html = '<p><strong>Saved data could not be read.</strong> It may come from a different version of this page. '
        + `It was kept as a backup in this browser (${escape(notice.backupKey)}) and the example workspace is shown instead.</p>`
        + `<div class="storage-actions">${download}<button type="button" class="text-button" data-dismiss-storage>Dismiss</button></div>`;
    }
    $('storage-alert').innerHTML = html;
    $('storage-alert').hidden = !html;
  }
  // The toast is a polite live region: it is announced but never takes focus. Its Undo button stays in the tab order.
  function showToast(message, isUndoable) {
    const undoHtml = '<button type="button" class="toast-undo" data-undo aria-keyshortcuts="Control+Z Meta+Z">Undo</button>'
      + `<span class="toast-key">or press ${UNDO_KEY}</span>`;
    $('toast').innerHTML = `<span>${escape(message)}</span>${isUndoable ? undoHtml : ''}`;
    $('toast').classList.add('visible');
    $('toast').classList.toggle('has-undo', !!isUndoable);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, isUndoable ? UNDO_MS : 3500);
  }
  // While the pointer is over the toast or focus is inside it, the Undo countdown is paused; it restarts in full on leaving.
  const isToastBusy = () => isToastHeld || $('toast').contains(document.activeElement);
  function hideToast() {
    if (undo && isToastBusy()) {
      toastTimer = setTimeout(hideToast, UNDO_MS);
      return;
    }
    undo = null;
    $('toast').classList.remove('visible', 'has-undo');
    $('toast').querySelector('[data-undo]')?.remove();
    $('toast').querySelector('.toast-key')?.remove();
  }
  function pauseToast() {
    if (undo) clearTimeout(toastTimer);
  }
  function resumeToast() {
    if (undo && !isToastBusy()) {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(hideToast, UNDO_MS);
    }
  }
  // Only plain http(s) links become clickable; anything else is shown as text.
  function buildSourceHtml(l) {
    const detail = l.sourceDetail || '';
    const link = /^https?:\/\/\S+$/i.test(detail)
      ? `<a href="${escape(detail)}" target="_blank" rel="noopener noreferrer">${escape(detail)}</a>`
      : escape(detail);
    return l.source || detail ? [l.source ? escape(l.source) : '', link].filter(Boolean).join(' · ') : 'Not recorded';
  }
  // Card notes keep their line breaks; anything longer than 3 lines folds behind Show more.
  // Expanded notes are remembered by listing and field (expandedText), so re-rendering does not collapse them.
  function buildLongText(l, field, fallback, extraClass = '') {
    const key = `${l.id}:${field}`, id = `text-${l.id}-${field}`, isOpen = expandedText.has(key);
    return `<p id="${escape(id)}" class="long-text${isOpen ? '' : ' clamped'}${extraClass}">${escape(l[field] ?? '') || fallback}</p>`
      + `<button type="button" class="text-button more-button" data-more="${escape(key)}" aria-controls="${escape(id)}" aria-expanded="${isOpen}" hidden>`
      + `${getMoreLabel(isOpen)}</button>`;
  }
  function refreshSinceLabels() {
    document.querySelectorAll('#listings [data-since]').forEach(span => {
      span.textContent = ' · ' + formatSinceContact(span.dataset.since);
    });
  }
  function updateClamps() {
    document.querySelectorAll('#listings .long-text').forEach(p => {
      p.nextElementSibling.hidden = p.scrollHeight <= parseFloat(getComputedStyle(p).lineHeight) * 3 + 1;
    });
  }
  // Compact mode: one summary row per listing; the full card opens underneath it.
  function buildRowSummary(l, isChosen) {
    const openChecks = listUnverified(l);
    return `<span class="row-id">${isChosen ? '★ ' : ''}${escape(l.id)}</span><span class="row-area">${escape(l.area)}</span>`
      + `<span class="row-rent${isWithinBudget(l) ? '' : ' gap'}">${formatMoney(l.rent)}/mo`
      + `${describeRent(mismatch(l), 'row').map(text => ` · ${text}`).join('')}</span>`
      + `<span class="row-dates${countGapNights(l) ? ' gap' : ''}">${countGapNights(l) ? describeDateGap(l).join(' · ') : 'Dates match'}</span>`
      + `<span class="row-contact">${isClosed(l) ? 'Closed' : escape(l.contact)}</span>`
      + `<span class="row-open">${describeUnverified(openChecks, 'row')}</span>`;
  }
  // Card pieces. Each returns HTML; user text always goes through escape().
  const getContactClass = l => l.contact === 'Waiting' ? 'waiting' : l.contact === 'Replied' ? 'replied' : isClosed(l) ? 'closed' : '';
  function buildCardTop(l, isChosen) {
    return `<div class="card-top"><span class="listing-id">${escape(l.id)} · SAVED OPTION</span>`
      + `${isChosen
        ? '<span class="choice-label">★ Current first choice</span>'
        : `<span class="source-note">${l.added ? 'Added by you' : 'Fictional listing'}</span>`}</div>`;
  }
  function buildCardSummary(l) {
    return `<div class="area-row"><div><h3 tabindex="-1">${escape(l.area)}</h3>`
      + `<p class="source-note">Furnished room · ${escape(l.borough)}, NYC</p></div></div>`
      + `<p class="contact-line"><span class="contact-pill ${getContactClass(l)}">${isClosed(l) ? 'Closed · no longer considering' : escape(l.contact)}</span>`
      + `<span class="contact-since" data-since="${escape(l.lastContacted || '')}"> · ${formatSinceContact(l.lastContacted)}</span></p>`
      + `<p class="price">${formatMoney(l.rent)}<span>/ month rent</span></p><p class="date-row">${CALENDAR_ICON}${formatDateRange(l.start, l.end)}</p>`;
  }
  function buildCardChecks(l) {
    const why = mismatch(l), openChecks = listUnverified(l);
    const rentCheck = describeRent(why, 'card')[0] || 'Rent in range (excl. fees)';
    return `<div class="check-row">${why.dates
      ? describeDateGap(l).map(part => `<span class="check-pill gap">${part}</span>`).join('')
      : '<span class="check-pill">Matches your dates</span>'}`
      + `<span class="check-pill${isWithinBudget(l) ? '' : ' gap'}">${rentCheck}</span></div>`
      + `<p class="verify-note${openChecks.length ? '' : ' all'}">${describeUnverified(openChecks, 'card')}</p>`
      + `<p class="safety-note">Safety: ${countSafetyDone(l)} of ${SAFETY_KEYS.length} done</p>`;
  }
  function buildCardNotes(l) {
    return '<div class="card-divider"></div>'
      + `<div class="card-detail"><span class="detail-label">Source</span><p class="source-line">${buildSourceHtml(l)}</p></div>`
      + `<div class="card-detail"><span class="detail-label">Other payments / terms</span>${buildLongText(l, 'terms', 'Not recorded yet.')}</div>`
      + `<div class="card-detail"><span class="detail-label">Still needs checking</span>${buildLongText(l, 'checks', 'No notes recorded.')}</div>`
      + '<div class="card-detail next-action"><span class="detail-label">MY NEXT ACTION</span>'
      + `${buildLongText(l, 'action', 'No next action recorded yet.')}</div>`;
  }
  function buildCardReminder(l) {
    const reminder = state.messages.find(m => m.kind === 'reminder' && getMessageListingId(m) === l.id);
    return !reminder ? ''
      : isReminderActive(reminder)
        ? '<p class="reminder-strip">Manual reminder: this conversation was still marked Waiting after 12 hours in the demo scenario.</p>'
        : '<p class="reminder-history">Earlier reminder (scenario Apr 27, 2026, 21:00): Waiting after 12 hours.'
          + `${reminder.reviewed ? ' Reviewed.' : ''} Now ${escape(l.contact)}.</p>`;
  }
  function buildCardButtons(l, isChosen) {
    const id = escape(l.id);
    return '<div class="card-buttons">'
      + `<button class="button secondary small" data-edit="${id}" aria-label="Review and update ${id} ${escape(l.area)}">Review & update</button>`
      + `<button class="button choose-button small${isChosen ? ' is-chosen' : ''}" data-choose="${id}"`
      + ` aria-label="${isChosen ? 'Clear first choice' : 'Make ' + id + ' first choice'}">`
      + `${isChosen ? '★ First choice · Clear' : 'Choose for now'}</button></div>`;
  }
  function buildCardBody(l, isChosen) {
    return `${buildCardTop(l, isChosen)}<div class="card-content">${buildCardSummary(l)}${buildCardChecks(l)}${buildCardNotes(l)}${buildCardReminder(l)}`
      + `<p class="updated-line">${formatUpdated(l.updatedAt)}</p></div>${buildCardButtons(l, isChosen)}`;
  }
  // One card; in Compact mode it sits under its summary row and opens from it.
  function buildListingCard(l) {
    const isChosen = state.choice === l.id, body = buildCardBody(l, isChosen);
    const cls = `listing-card${isChosen ? ' chosen' : ''}${isClosed(l) ? ' closed' : ''}${density === 'compact' ? ' compact' : ''}`;
    const label = escape(l.id + ' ' + l.area);
    if (density !== 'compact') return `<article class="${cls}" aria-label="${label}">${body}</article>`;
    const isOpen = expandedRows.has(l.id);
    return `<article class="${cls}" aria-label="${label}">`
      + `<button type="button" class="compact-row" data-row="${escape(l.id)}" aria-expanded="${isOpen}" aria-controls="body-${escape(l.id)}">`
      + `${buildRowSummary(l, isChosen)}</button>`
      + `<div class="compact-body" id="body-${escape(l.id)}"${isOpen ? '' : ' hidden'}>${body}</div></article>`;
  }
  function buildEmptyShortlist() {
    return '<div class="listing-empty start"><h3>Start your shortlist</h3>'
      + '<p>Add each place you are considering, with where you found it. '
      + 'ShortStay checks every listing against your dates and rent range; nothing is filled in for you.</p>'
      + '<button class="button primary small" type="button" data-add-first>Add your first listing</button></div>';
  }
  function buildNoMatches(total) {
    return '<div class="listing-empty"><h3>No matches right now</h3>'
      + `<p>No open saved listing meets both your dates and monthly rent range. Your ${total} saved listings are still available in All saved.</p>`
      + '<button class="button secondary small" type="button" data-show-all>View all saved</button></div>';
  }
  function renderCards() {
    const matching = state.listings.filter(matchesNeeds);
    const visible = sortListings(listingView === 'all' ? state.listings : matching);
    renderListingControls(matching.length, visible.length);
    renderListingVisibility(matching.length);
    $('listings').innerHTML = visible.map(l => buildListingCard(l)).join('');
    if (!state.listings.length) $('listings').innerHTML = buildEmptyShortlist();
    else if (!visible.length) $('listings').innerHTML = buildNoMatches(state.listings.length);
    renderSummaryPills(visible);
    updateClamps();
  }
  function renderListingControls(matchCount, visibleCount) {
    $('matches-count').textContent = matchCount;
    $('saved-count').textContent = state.listings.length;
    $('shortlist-count').textContent = String(visibleCount).padStart(2, '0');
    $('show-matches').setAttribute('aria-pressed', String(listingView === 'matches'));
    $('density-compact').setAttribute('aria-pressed', String(density === 'compact'));
    $('density-detailed').setAttribute('aria-pressed', String(density === 'detailed'));
    $('listings').classList.toggle('compact', density === 'compact');
    $('sort-listings').value = sortBy;
    $('show-all').setAttribute('aria-pressed', String(listingView === 'all'));
  }
  // "Showing 8 of 12 saved. 1 closed, 3 outside your needs." In Matches, the outside count opens All saved.
  function renderListingVisibility(matchCount) {
    const total = state.listings.length, hidden = total - matchCount, isMatchesView = listingView === 'matches';
    const closedCount = state.listings.filter(isClosed).length, outsideCount = state.listings.filter(l => !isClosed(l) && !fitsNeeds(l)).length;
    const outside = `${outsideCount} outside your needs`;
    const parts = [
      closedCount ? `${closedCount} closed` : '',
      outsideCount
        ? (isMatchesView
          ? `<button type="button" class="text-button visibility-link" data-show-hidden aria-label="${outside} — show them in All saved">${outside}</button>`
          : outside)
        : '',
    ].filter(Boolean);
    const added = isMatchesView && justAdded && state.listings.find(l => l.id === justAdded && !matchesNeeds(l));
    $('listing-visibility').innerHTML = `${isMatchesView ? `Showing ${matchCount} of ${total} saved.` : `Showing all ${total} saved.`} `
      + `${!total ? 'No saved listings yet.' : hidden ? parts.join(', ') + '.' : 'All match your budget and dates.'}`
      + (added ? buildAddedNotice(added) : '');
  }
  // A listing just added outside the needs is saved but hidden here, so say so and why until the view changes.
  function buildAddedNotice(l) {
    const why = isClosed(l) ? ['it is marked Closed'] : [...describeDateGap(l).map(lowercaseFirst), ...describeRent(mismatch(l), 'preview')];
    return `<span class="added-notice"><strong>${escape(l.id)} is saved</strong> but not shown here: ${escape(why.join('; '))}. `
      + `<button type="button" class="text-button visibility-link" data-show-added="${escape(l.id)}">View ${escape(l.id)} in All saved →</button></span>`;
  }
  function renderSummaryPills(visible) {
    const gaps = visible.filter(l => countGapNights(l) > 0).length;
    const waiting = visible.filter(l => l.contact === 'Waiting').length;
    $('summary-pills').innerHTML = `${waiting ? `<span class="summary-pill">${waiting} waiting for a reply (this view)</span>` : ''}`
      + `${gaps ? `<span class="summary-pill warning">${gaps} with a date gap (this view)</span>` : ''}`;
  }
  // What the Apply dialog changes: the message's suggestion, or (Revert) back to the value that Apply change replaced.
  const getApplyChange = (m, isRevert) => isRevert ? {from: m.suggestion.to, to: m.applied.from} : {from: m.suggestion.from, to: m.suggestion.to};
  // Already updated once the listing holds the suggested value, whether applied here or edited by hand.
  // A change applied here can be reverted for as long as the listing still holds it, long after the Undo toast has gone.
  function buildApplyButton(m) {
    const s = m.suggestion;
    if (!s) return '';
    const l = findSuggestionTarget(m), isDone = !l || String(l[s.field]) === String(s.to);
    if (l && isDone && m.applied) {
      return `<button type="button" class="button secondary small apply-button" data-revert="${escape(m.id)}">`
        + `Revert: ${escape(SHORT_FIELD[s.field] || s.field)} ${escape(formatFieldValue(s.field, s.to))} → ${escape(formatFieldValue(s.field, m.applied.from))}`
        + '</button>';
    }
    return `<button type="button" class="button secondary small apply-button" data-apply="${escape(m.id)}"${isDone ? ' disabled' : ''}>`
      + `${isDone
        ? (l ? 'Already updated' : 'Listing removed')
        : `Apply: ${escape(SHORT_FIELD[s.field] || s.field)} ${escape(formatFieldValue(s.field, s.from))} → ${escape(formatFieldValue(s.field, s.to))}`}`
      + '</button>';
  }
  function buildMessage(m) {
    const listingId = getMessageListingId(m), outdated = isReminderOutdated(m);
    return `<article class="message${m.reviewed || outdated ? ' reviewed' : ''}">`
      + `<div class="message-meta"><strong>${getMessageType(m).heading} · ${escape(listingId)}</strong>`
      + `<span>${outdated ? `<span class="outdated-tag">Outdated · ${escape(listingId)} is now ${escape(getListingContact(m) || 'removed')}</span> · ` : ''}`
      + 'Simulated</span></div>'
      + `<p>${escape(m.text)}</p><div class="message-actions">${buildApplyButton(m)}`
      + `<button class="text-button" data-message-edit="${escape(listingId)}" data-message-id="${escape(m.id)}">`
      + `${escape(getMessageType(m).edit(listingId))}</button>`
      + `${m.reviewed ? '<span>✓ Reviewed</span>' : `<button class="text-button" data-reviewed="${escape(m.id)}">Mark reviewed</button>`}`
      + '</div></article>';
  }
  function buildNoMessages() {
    return '<div class="empty-state"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 13h5l2 3h2l2-3h5"/></svg>'
      + `${state.mode === 'empty'
        ? '<strong>No updates in your own workspace.</strong><p>You can record host messages in each listing’s notes.</p>'
        : '<strong>No updates to review yet.</strong>'
          + '<p>When a host changes the details or a conversation needs a follow-up, keep the update here.</p>'}</div>`;
  }
  function renderMessages() {
    const unread = countUnread();
    $('unread-count').textContent = unread;
    $('unread-count').classList.toggle('active', unread > 0);
    $('bottom-unread').textContent = unread;
    $('bottom-unread').classList.toggle('active', unread > 0);
    $('message-count').textContent = `${state.messages.length} ${state.messages.length === 1 ? 'update' : 'updates'}`;
    $('messages').innerHTML = state.messages.length ? state.messages.map(m => buildMessage(m)).join('') : buildNoMessages();
    renderDemoControls();
  }
  // The two demo events refer to example listings, so they only run in the example workspace.
  function renderDemoControls() {
    const isDemoOff = state.mode === 'empty', isSent = type => state.messages.some(m => m.id === DEMO_MESSAGES[type].message().id);
    const isHostSent = isSent('host'), isReminderSent = isSent('reminder');
    $('demo-events-note').hidden = !isDemoOff;
    $('deliver-host').disabled = isDemoOff || isHostSent;
    $('deliver-host').textContent = isHostSent ? 'Message delivered' : 'Deliver host message';
    $('deliver-reminder').disabled = isDemoOff || isReminderSent;
    $('deliver-reminder').textContent = isReminderSent ? 'Reminder added' : 'Add manual reminder';
  }
  // Warns about the first choice shown in My decision (which may be an unsaved draft).
  function buildChoiceWarning(chosen) {
    if (!chosen) return '';
    const reasons = [...describeDateGap(chosen).map(lowercaseFirst), ...describeRent(mismatch(chosen), 'decision')];
    const openChecks = listUnverified(chosen), notVerified = describeUnverified(openChecks, 'sentence');
    const showAll = listingView === 'matches' ? '<button type="button" class="text-button" data-choice-show-all>View in All saved →</button>' : '';
    if (isClosed(chosen)) return `<div class="choice-warning"><p>${escape(chosen.id)} is marked Closed. Your choice and notes are kept.</p>${showAll}</div>`;
    if (reasons.length) {
      return `<div class="choice-warning"><p>${escape(chosen.id)} is outside your needs: ${reasons.join('; ')}.`
        + `${openChecks.length ? ` ${notVerified}` : ''} Your saved choice and notes are kept.</p>${showAll}</div>`;
    }
    return openChecks.length ? `<div class="choice-warning caution"><p>${escape(chosen.id)} fits your needs. ${notVerified}</p></div>` : '';
  }
  // Both warnings are polite live regions, so they are rewritten only when their content changes (no repeated announcements).
  const liveHtml = new Map();
  function setLiveHtml(id, html) {
    if (liveHtml.get(id) === html) return;
    liveHtml.set(id, html);
    $(id).innerHTML = html;
  }
  function renderChoiceWarning() {
    setLiveHtml('choice-warning', buildChoiceWarning(state.listings.find(l => l.id === $('first-choice').value)));
  }
  function renderSafetyWarning() {
    const chosen = state.listings.find(l => l.id === $('first-choice').value), text = getSafetyWarning(chosen), followUp = getSafetyFollowUp(chosen);
    setLiveHtml('safety-warning', text ? `<div class="choice-warning safety-warning"><p>${escape(text)}</p></div>`
      : followUp ? `<div class="choice-warning neutral safety-warning"><p>${escape(followUp)}</p></div>` : '');
  }
  function updateDecisionDirty() {
    isNoteDirty = $('decision-note').value.trim() !== state.note;
    isChoiceDirty = $('first-choice').value !== state.choice;
    renderDecisionStatus();
  }
  function renderDecisionStatus() {
    const isUnsaved = isNoteDirty || isChoiceDirty, text = isUnsaved ? 'Unsaved changes. Save decision to keep them.' : 'You can change your mind.';
    if ($('decision-status').textContent !== text) $('decision-status').textContent = text;
    $('decision-status').classList.toggle('unsaved', isUnsaved);
    renderNoteReview();
  }
  function renderNoteReview() {
    const selected = $('first-choice').value, label = id => id || UNDECIDED;
    const isStale = Boolean(state.note) && state.noteFor !== selected;
    $('decision-note').classList.toggle('needs-review', isStale);
    $('note-review').innerHTML = isStale
      ? `<div class="note-review"><p>Your reasoning was written for ${escape(label(state.noteFor))}. `
        + `First choice is now ${escape(label(selected))}. Review it, then Save decision.</p>`
        + `${isNoteDirty || isChoiceDirty ? '' : '<button type="button" class="text-button" data-keep-note>Keep reasoning as is</button>'}</div>`
      : '';
  }
  function buildNextIntro(items) {
    if (!state.listings.length) {
      return '<div class="next-empty"><p>No listings yet. Add the places you are considering first; '
        + 'once you choose one, Next up will check it against your needs.</p>'
        + '<button type="button" class="text-button" data-next-go="add">+ Add a listing</button></div>';
    }
    if (!state.listings.some(l => l.id === state.choice)) {
      return '<div class="next-empty"><p>No first choice yet. Pick one with “Choose for now” on a card'
        + `${density === 'compact' ? ' (in Compact view, open a listing to see it)' : ''} or in My decision, `
        + 'and Next up will check it against your needs.</p>'
        + '<button type="button" class="text-button" data-next-go="choice">Choose in My decision →</button></div>';
    }
    // Team decision 3: Next up only lists what remains. With nothing left it states the facts and draws no conclusion.
    return items.length ? '' : `<p class="next-empty next-facts">${escape(state.choice)}: dates and rent match; every check is marked by you. `
      + 'ShortStay doesn’t verify these — review them before paying.</p>';
  }
  function buildNextItem(item, i) {
    return `<li class="next-item${item.tone ? ' ' + item.tone : ''}${i >= NEXT_MOBILE ? ' extra' : ''}">`
      + `<div><span class="small-label">${escape(item.kind)}</span><p id="next-text-${i}">${escape(item.text)}</p></div>`
      + `<button type="button" class="button secondary small" ${item.edit
        ? `data-next-edit="${escape(item.edit)}" data-next-field="${escape(item.field)}"`
        : `data-next-go="${escape(item.go)}"`}`
      + ` aria-describedby="next-text-${i}">${escape(item.label)}</button></li>`;
  }
  // On phones only the first three entries show until Show all is pressed.
  function buildNextMore(items) {
    if (items.length <= NEXT_MOBILE) return '';
    return `<button type="button" class="text-button next-more" data-next-more aria-controls="next-list" aria-expanded="${isNextExpanded}">`
      + `${isNextExpanded ? 'Show fewer' : `Show all (${items.length})`}</button>`;
  }
  // Rebuilt only when the content changes, so a focused button survives the minute timer and unrelated renders.
  function renderNextUp() {
    const items = buildNextItems(), list = items.map((item, i) => buildNextItem(item, i)).join('');
    const html = `${buildNextIntro(items)}<ol class="next-list${isNextExpanded ? ' expanded' : ''}" id="next-list"${items.length ? '' : ' hidden'}>${list}</ol>`
      + buildNextMore(items);
    if (html !== nextHtml) {
      nextHtml = html;
      $('next-body').innerHTML = html;
    }
  }
  function buildActivityEntry(e) {
    const short = v => {
      const t = v === '' || v == null ? '(empty)' : String(v);
      return t.length > 60 ? t.slice(0, 57) + '…' : t;
    };
    const stamp = new Date(e.time).toLocaleString('en-US', {month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'});
    return `<li><span class="event-role">${escape(e.role)}</span><div class="event-text"><span>${escape(e.text)}</span>`
      + `${e.details?.changes?.length
        ? `<ul class="event-changes">${e.details.changes
          .map(c => `<li>${escape(c.field)}: ${escape(short(c.from))} → ${escape(short(c.to))}</li>`).join('')}</ul>`
        : ''}`
      + `</div><time datetime="${escape(e.time)}">${stamp}</time></li>`;
  }
  function renderActivity() {
    const shown = state.events.slice(0, SHOWN_EVENTS), dropped = state.droppedEvents || 0;
    $('activity-summary').textContent = `${state.events.length} ${state.events.length === 1 ? 'entry' : 'entries'}`
      + `${state.events.length > SHOWN_EVENTS ? `, latest ${SHOWN_EVENTS} shown` : ''}`
      + `${dropped ? `. ${dropped} earliest ${dropped === 1 ? 'entry was' : 'entries were'} dropped` : ''}. Export keeps every entry with full values.`;
    if ($('session-code') !== document.activeElement) $('session-code').value = state.sessionCode || '';
    $('activity-list').innerHTML = shown.length ? shown.map(e => buildActivityEntry(e)).join('') : '<li>No demo actions recorded yet.</li>';
  }
  function render() {
    $('workspace-tag').textContent = state.mode === 'empty' ? 'Your own workspace' : 'Demo workspace';
    $('shortlist-intro').textContent = state.mode === 'empty'
      ? 'Your own listings. Add each place you are considering; nothing is filled in for you.'
      : 'Compare fictional NYC rooms across the five boroughs.';
    $('need-dates').textContent = formatDateRange(state.needs.start, state.needs.end);
    $('need-budget').textContent = `${formatMoney(state.needs.budgetMin)} – ${formatMoney(state.needs.budgetMax)} / month`;
    renderCards();
    renderMessages();
    renderNextUp();
    renderDecision();
    renderActivity();
  }
  function renderDecision() {
    const pendingChoice = $('first-choice').value;
    $('first-choice').innerHTML = `<option value="">${UNDECIDED}</option>`
      + state.listings.map(listing => `<option value="${escape(listing.id)}">${escape(listing.id + ' · ' + listing.area + ' · ' + listing.borough)}</option>`)
        .join('');
    // Keep unsaved decision edits; other actions re-render the page but must not overwrite a draft.
    $('first-choice').value = isChoiceDirty ? pendingChoice : state.choice;
    if (!isNoteDirty) $('decision-note').value = state.note;
    renderDecisionStatus();
    renderChoiceWarning();
    renderSafetyWarning();
  }

  // ===== Actions: commit, undo and button handlers =====
  function setListingView(view) {
    listingView = view === 'all' ? 'all' : 'matches';
    justAdded = null;
    renderCards();
    renderChoiceWarning();
  }
  // After saving, return focus to the card's Review & update button; if the card left this view, to All saved.
  function focusListing(id) {
    const edit = findByData('edit', id);
    (edit?.getClientRects().length ? edit : findByData('row', id) || $('show-all')).focus();
  }
  // Keeps focus on a card's Choose for now button after the cards are re-rendered (it never falls back to the page body).
  function focusChoose(id) {
    const button = findByData('choose', id);
    button?.getClientRects().length ? button.focus({preventScroll: true}) : focusListing(id);
  }
  // A message's own button: its Apply button or Mark reviewed when offered, otherwise its edit button.
  function focusMessage(id, prefer) {
    const own = prefer && findByData(prefer, id);
    (own && !own.disabled ? own : document.querySelector(`[data-message-edit][data-message-id="${CSS.escape(id)}"]`) || $('inbox-heading')).focus();
  }
  // before: a snapshot that makes the change undoable; refocus: puts focus back on the restored object after an Undo.
  function commit(text, before, refocus) {
    const isSaved = store();
    render();
    undo = before ? {state: before, label: state.events[0].text, refocus} : null;
    showToast(isSaved ? text : TOASTS.notSaved, !!before);
  }
  // A save that changes nothing writes nothing and keeps any Undo on offer (its toast stays as it is).
  function reportNoChanges() {
    if (!undo) showToast(TOASTS.noChanges);
  }
  // Restores the workspace in memory first, so it works even when storage fails; the log keeps both entries.
  // Focus goes back to the restored object (or + Add a listing), never to the toast or the page body.
  function performUndo() {
    if (!undo) return;
    const {state: before, label, refocus} = undo, kept = Object.fromEntries(LOG_KEYS.filter(key => key in state).map(key => [key, state[key]]));
    undo = null;
    state = {...before, ...kept};
    recordEvent('User', `Undid: ${label}`, {undid: label});
    const isSaved = store();
    render();
    updateDecisionDirty();
    showToast(isSaved ? TOASTS.undone(label) : TOASTS.notSaved);
    refocus?.();
    const active = document.activeElement;
    if (!active || active === document.body || $('toast').contains(active)) $('add-listing').focus();
  }
  function holdToast() {
    isToastHeld = true;
    pauseToast();
  }
  function releaseToast() {
    isToastHeld = false;
    resumeToast();
  }
  function resumeToastOnFocusOut(e) {
    if (!$('toast').contains(e.relatedTarget)) resumeToast();
  }
  // Ctrl+Z / ⌘Z while Undo is offered, unless the user is typing in a field (there it keeps its normal meaning) or a dialog is open.
  function undoFromKeyboard(e) {
    if (!undo || !$('toast').querySelector('[data-undo]') || e.key.toLowerCase() !== 'z' || !(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey) return;
    if (e.target.closest?.('input,textarea,select,[contenteditable]:not([contenteditable="false"])') || document.querySelector('dialog[open]')) return;
    e.preventDefault();
    performUndo();
    // Focus moved by script after a mouse click does not match :focus-visible, so show the ring until focus moves on.
    const restored = document.activeElement;
    if (restored && restored !== document.body) {
      restored.classList.add('focus-ring');
      restored.addEventListener('blur', () => restored.classList.remove('focus-ring'), {once: true});
    }
  }
  // Every minute: elapsed-time labels and Next up's Waiting entries follow the real clock.
  function refreshClock() {
    refreshSinceLabels();
    renderNextUp();
  }
  function setDensity(value) {
    density = value;
    savePrefs();
    renderCards();
    renderNextUp();
  }
  function setSort() {
    sortBy = $('sort-listings').value;
    savePrefs();
    renderCards();
  }
  function setLastContactedNow() {
    $('listing-lastContacted').value = getLocalNow();
  }
  function scheduleClampUpdate() {
    clearTimeout(clampTimer);
    clampTimer = setTimeout(updateClamps, 150);
  }
  function dismissStorageNotice() {
    storageNotice.dismissed = true;
    renderStorageAlert();
  }
  function downloadUnreadableBackup() {
    downloadJson('shortstay-unreadable-backup.json', storageNotice.raw);
  }
  function showHiddenListings() {
    setListingView('all');
    $('show-all').focus();
  }
  // View … in All saved →: shows the card and focuses its title (or its compact row).
  function showInAllSaved(id) {
    setListingView('all');
    const card = document.querySelector(`[aria-label^="${CSS.escape(id)} "]`), title = card?.querySelector('h3');
    (title?.getClientRects().length ? title : card?.querySelector('.compact-row'))?.focus();
  }
  const showChoiceInAllSaved = () => showInAllSaved(state.choice);
  // Next up buttons only open a dialog or move focus; the user makes any change themselves.
  function openNextEdit(button) {
    openListingDialog(button.dataset.nextEdit);
    $('listing-' + button.dataset.nextField)?.focus();
  }
  function goToNext(where) {
    if (where === 'add') {
      openListingDialog(null);
      return;
    }
    const [section, target] = NEXT_TARGETS[where];
    $(section).scrollIntoView({behavior: 'smooth', block: 'start'});
    $(target).focus({preventScroll: true});
  }
  function toggleNextMore() {
    isNextExpanded = !isNextExpanded;
    renderNextUp();
    $('next-body').querySelector('[data-next-more]')?.focus();
  }
  function toggleRow(row) {
    const id = row.dataset.row, isOpen = !expandedRows.has(id);
    isOpen ? expandedRows.add(id) : expandedRows.delete(id);
    row.setAttribute('aria-expanded', String(isOpen));
    $('body-' + id).hidden = !isOpen;
    updateClamps();
  }
  function toggleMore(more) {
    const key = more.dataset.more, isOpen = !expandedText.has(key);
    isOpen ? expandedText.add(key) : expandedText.delete(key);
    $(more.getAttribute('aria-controls')).classList.toggle('clamped', !isOpen);
    more.setAttribute('aria-expanded', String(isOpen));
    more.textContent = getMoreLabel(isOpen);
  }
  // Choose for now on a card saves at once (choosing the current first choice again clears it) and can be undone.
  function chooseListing(id) {
    const before = state.choice, snap = takeSnapshot();
    state.choice = state.choice === id ? '' : id;
    isChoiceDirty = false;
    recordEvent('User', state.choice ? `${id} selected as provisional first choice.` : 'First choice changed to Undecided.', {
      changes: [makeChange('first choice', before, state.choice)],
    });
    commit(state.note && state.noteFor !== state.choice ? TOASTS.choiceUpdatedReviewReasoning : TOASTS.choiceUpdated, snap, () => focusChoose(id));
    focusChoose(id);
  }
  function markReviewed(id) {
    const snap = takeSnapshot(), m = state.messages.find(m => m.id === id);
    m.reviewed = true;
    recordEvent('User', `${getMessageType(m).name(getMessageListingId(m))} marked reviewed.`, {message: m.id});
    commit(TOASTS.markedReviewed, snap, () => focusMessage(m.id, 'reviewed'));
    focusMessage(m.id);
  }
  // Apply change marks the message reviewed and remembers the replaced value; Revert puts it back and marks the message unread again.
  function applyHostChange() {
    const m = state.messages.find(x => x.id === currentApply), s = m?.suggestion, l = m && findSuggestionTarget(m);
    const isRevert = isRevertApply && !!m?.applied, change = l && getApplyChange(m, isRevert);
    if (!l || String(l[s.field]) === String(change.to)) {
      closeDialog('apply-dialog');
      return;
    }
    const snap = takeSnapshot(), before = l[s.field], {isMatchBefore, isMatchAfter} = previewMatch(l, {...l, [s.field]: change.to});
    l[s.field] = change.to;
    l.updatedAt = new Date(Date.now()).toISOString();
    m.reviewed = !isRevert;
    if (isRevert) delete m.applied;
    else m.applied = {from: before};
    recordEvent('User', `${l.id}: ${FIELD_LABELS[s.field]} ${isRevert ? 'reverted to before the host message' : 'updated from host message'}.`, {
      listing: l.id, message: m.id, changes: [makeChange(FIELD_LABELS[s.field], before, change.to)],
    });
    const where = isClosed(l) ? APPLY_RESULT.closed
      : isMatchAfter ? (isMatchBefore ? APPLY_RESULT.stillMatches : APPLY_RESULT.nowMatches)
        : isMatchBefore ? APPLY_RESULT.leftMatches : APPLY_RESULT.stillOutside;
    const toast = isRevert ? TOASTS.hostChangeReverted : TOASTS.hostChangeApplied, own = isRevert ? 'revert' : 'apply';
    closeDialog('apply-dialog');
    commit(toast(l.id, FIELD_LABELS[s.field], formatFieldValue(s.field, change.to, true), where), snap, () => focusMessage(m.id, own));
    focusMessage(m.id, isRevert ? 'apply' : null);
  }
  // The listing form's fields, in the order they are saved and logged.
  function readListingForm() {
    return {
      area: $('listing-area').value.trim(), borough: $('listing-borough').value, source: $('listing-source').value,
      sourceDetail: $('listing-sourceDetail').value.trim(), start: $('listing-start').value, end: $('listing-end').value,
      rent: Number($('listing-rent').value), contact: $('listing-contact').value, lastContacted: $('listing-lastContacted').value,
      terms: $('listing-terms').value.trim(), checks: $('listing-checks').value.trim(), action: $('listing-action').value.trim(),
    };
  }
  // The first problem with the form, or '' when it can be saved.
  function getListingFormError({area, borough, start, end, rent, lastContacted}) {
    if (!area || !borough) return 'Enter the area and choose a borough.';
    if (!start || !end || toDayNumber(end) <= toDayNumber(start) || !Number.isFinite(rent) || rent <= 0) {
      return 'Use a checkout date after the start date and a positive monthly rent.';
    }
    if (lastContacted && new Date(lastContacted).getTime() > Date.now() + 60000) return 'Last contacted cannot be in the future.';
    if (rent > MAX_RENT) return `Monthly rent can be at most ${formatMoney(MAX_RENT)}. Check for an extra digit.`;
    return '';
  }
  function saveListingForm(e) {
    e.preventDefault();
    const listing = currentListing ? state.listings.find(l => l.id === currentListing) : null;
    const values = readListingForm(), error = getListingFormError(values);
    if (error) {
      $('listing-error').textContent = error;
      return;
    }
    const verify = Object.fromEntries(VERIFY_KEYS.map(key => [key, $('listing-verify-' + key).value]));
    // Only levels each check allows are saved (a required payment check never stores N/A).
    const safety = Object.fromEntries(SAFETY_KEYS.map(key => [key, $('listing-safety-' + key).value]).map(([key, level]) => [
      key, isSafetyLevelAllowed(key, level) ? level : 'Not yet',
    ]));
    if (listing) updateListing(listing, values, verify, safety);
    else addListing(values, verify, safety);
  }
  function addListing(values, verify, safety) {
    const added = {id: claimNextListingId(), ...values, verify, safety, added: true, updatedAt: new Date(Date.now()).toISOString()};
    state.listings.push(added);
    justAdded = added.id;
    recordEvent('User', `${added.id} added: ${values.area}, ${values.borough}${values.source ? ` (source: ${values.source})` : ''}.`, {listing: {...added}});
    closeDialog('listing-dialog');
    commit(listingView === 'matches' && !matchesNeeds(added)
      ? (isClosed(added) ? TOASTS.listingAddedClosed(added.id) : TOASTS.listingAddedOutside(added.id))
      : TOASTS.listingAdded(added.id));
    const notice = findByData('show-added', added.id);
    notice ? notice.focus() : focusListing(added.id);
  }
  // Only a save that newly marks the listing Closed can be undone (the whole save is reverted).
  function updateListing(listing, values, verify, safety) {
    const changes = [];
    const snap = values.contact === 'Closed' && listing.contact !== 'Closed' ? takeSnapshot() : null;
    Object.keys(values).forEach(key => {
      if ((listing[key] ?? '') !== values[key]) changes.push(makeChange(FIELD_LABELS[key], listing[key], values[key]));
      listing[key] = values[key];
    });
    const before = getVerifyLevels(listing);
    VERIFY_KEYS.forEach(key => {
      if (before[key] !== verify[key]) changes.push(makeChange(`${key} check`, before[key], verify[key]));
    });
    listing.verify = verify;
    const safeBefore = getSafetyLevels(listing);
    SAFETY_KEYS.forEach(key => {
      if (safeBefore[key] !== safety[key]) changes.push(makeChange(`safety: ${SAFETY_LABELS[key]}`, safeBefore[key], safety[key]));
    });
    listing.safety = safety;
    // Saving the form where the confirmation note was shown settles a migrated "viewing Verified" (decision 2), whatever the user chose.
    const isViewingStillOpen = listing.viewingToConfirm && safety.viewedBeforePaying === 'Not yet';
    if (listing.viewingToConfirm) {
      changes.push(makeChange('viewing confirmation', 'Verified earlier (to confirm)', `viewed before paying: ${safety.viewedBeforePaying}`));
      delete listing.viewingToConfirm;
    }
    closeDialog('listing-dialog');
    if (!changes.length) {
      reportNoChanges();
      focusListing(listing.id);
      return;
    }
    listing.updatedAt = new Date(Date.now()).toISOString();
    recordEvent('User', `${listing.id}: updated ${changes.map(c => c.field).join(', ')}.`, {listing: listing.id, changes});
    if (isViewingStillOpen) recordEvent('User', `${listing.id} viewing confirmation: still Not yet`, {listing: listing.id});
    commit(listingView === 'matches' && !matchesNeeds(listing)
      ? (isClosed(listing) ? TOASTS.listingClosed(listing.id) : TOASTS.listingSavedOutside(listing.id))
      : TOASTS.listingSaved, snap, () => focusListing(listing.id));
    focusListing(listing.id);
  }
  function removeListing() {
    const listing = state.listings.find(l => l.id === currentListing);
    if (!listing?.added) {
      closeDialog('remove-dialog');
      return;
    }
    const isCurrentChoice = state.choice === listing.id, snap = takeSnapshot();
    state.listings = state.listings.filter(l => l.id !== listing.id);
    if (isCurrentChoice) state.choice = '';
    if ($('first-choice').value === listing.id) isChoiceDirty = false;
    recordEvent('User', `${listing.id} removed: ${listing.area}, ${listing.borough}.${isCurrentChoice ? ' First choice changed to Undecided.' : ''}`,
      {listing: {...listing}, ...(isCurrentChoice ? {changes: [makeChange('first choice', listing.id, '')]} : {})});
    currentListing = null;
    closeDialog('remove-dialog');
    closeDialog('listing-dialog');
    commit(TOASTS.listingRemoved(listing.id, isCurrentChoice), snap, () => focusListing(listing.id));
    $('add-listing').focus();
  }
  function getNeedsFormError(start, end, budgetMin, budgetMax) {
    if (!start || !end || toDayNumber(end) <= toDayNumber(start)) return 'Use a checkout date after move-in.';
    if ($('budget-min').value === '' || $('budget-max').value === '' || !Number.isFinite(budgetMin) || !Number.isFinite(budgetMax)
      || budgetMin < 0 || budgetMax < budgetMin) {
      return 'Enter a valid rent range: amounts must be 0 or more, and the minimum cannot exceed the maximum.';
    }
    if (budgetMin > MAX_RENT || budgetMax > MAX_RENT) {
      return `Monthly rent can be at most ${formatMoney(MAX_RENT)}. Check the minimum and maximum for an extra digit.`;
    }
    return '';
  }
  function saveNeeds(e) {
    e.preventDefault();
    const start = $('need-start').value, end = $('need-end').value, budgetMin = Number($('budget-min').value), budgetMax = Number($('budget-max').value);
    const error = getNeedsFormError(start, end, budgetMin, budgetMax);
    if (error) {
      $('needs-error').textContent = error;
      return;
    }
    const labels = {start: 'move-in date', end: 'checkout date', budgetMin: 'minimum rent', budgetMax: 'maximum rent'};
    const next = {start, end, budgetMin, budgetMax};
    recordEvent('User', 'Housing dates or monthly rent range updated.', {
      changes: Object.keys(next).filter(key => state.needs[key] !== next[key]).map(key => makeChange(labels[key], state.needs[key], next[key])),
    });
    state.needs = next;
    closeDialog('needs-dialog');
    commit(TOASTS.needsSaved);
  }
  // Changing the first-choice menu is a draft: only the warnings and the unsaved status update.
  function previewChoice() {
    updateDecisionDirty();
    renderChoiceWarning();
    renderSafetyWarning();
  }
  function keepReasoning() {
    recordEvent('User', `Reasoning kept unchanged for ${state.choice || UNDECIDED}.`, {
      changes: [makeChange('reasoning written for', state.noteFor, state.choice)],
    });
    state.noteFor = state.choice;
    commit(TOASTS.reasoningKept);
  }
  function warnBeforeLeaving(e) {
    if (isNoteDirty || isChoiceDirty || hasStorageFailed) {
      e.preventDefault();
      e.returnValue = '';
    }
  }
  function saveDecision(e) {
    e.preventDefault();
    const choice = $('first-choice').value, note = $('decision-note').value.trim();
    if (choice === state.choice && note === state.note && choice === state.noteFor) {
      isNoteDirty = isChoiceDirty = false;
      renderDecision();
      reportNoChanges();
      return;
    }
    recordEvent('User', 'Current decision and reasoning saved.', {
      changes: [makeChange('first choice', state.choice, choice), makeChange('reasoning', state.note, note)].filter(c => c.from !== c.to),
    });
    state.choice = choice;
    state.note = note;
    state.noteFor = choice;
    isNoteDirty = isChoiceDirty = false;
    commit(TOASTS.decisionSaved);
  }
  function deliverDemoMessage(type) {
    const demo = DEMO_MESSAGES[type], message = demo.message();
    if (state.mode === 'empty' || state.messages.some(m => m.id === message.id)) return;
    state.messages.unshift(message);
    recordEvent('Operator', demo.log);
    closeDialog('demo-dialog');
    commit(demo.toast);
    $('inbox').scrollIntoView({behavior: 'smooth', block: 'start'});
  }
  function exportSession() {
    const now = new Date();
    state.lastExportAt = now.toISOString();
    recordEvent('Operator', `Session exported (${state.events.length + 1} log entries).`);
    const code = (state.sessionCode || '').replace(/[^A-Za-z0-9_-]/g, '') || 'unlabeled';
    const name = `shortstay-session-${code}-${now.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-')}.json`;
    const {events, droppedEvents, sessionCode, lastExportAt, ...workspace} = state;
    downloadJson(name, JSON.stringify({
      schemaVersion: 1, app: 'ShortStay CP3 prototype (fictional data, not participant evidence)', exportedAt: state.lastExportAt,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, sessionCode: sessionCode || '', droppedEvents: droppedEvents || 0, workspace,
      events: [...events].reverse(),
    }, null, 2));
    commit(TOASTS.sessionExported(name));
    return name;
  }
  function saveSessionCode() {
    const code = $('session-code').value.trim();
    if (code === (state.sessionCode || '')) return;
    recordEvent('Operator', `Session code set to ${code || '(none)'}.`, {changes: [makeChange('session code', state.sessionCode, code)]});
    state.sessionCode = code;
    commit(TOASTS.sessionCodeSaved);
  }
  // Reset and Start empty both clear the log the same way: offer an export first, then record one entry about the previous session.
  function startOver(mode, dialog) {
    const previous = {
      entries: state.events.length + (state.droppedEvents || 0), sessionCode: state.sessionCode || '', lastExportAt: state.lastExportAt || null,
    };
    state = createInitialState(mode);
    listingView = 'matches';
    justAdded = null;
    isNoteDirty = isChoiceDirty = isNextExpanded = false;
    expandedText.clear();
    expandedRows.clear();
    recordEvent('Operator', `${mode === 'empty' ? 'Empty workspace started' : 'Demo reset'}. `
      + `The previous session${previous.sessionCode ? ` (${previous.sessionCode})` : ''} `
      + `had ${previous.entries} log ${previous.entries === 1 ? 'entry' : 'entries'}; `
      + `${previous.lastExportAt ? `last exported ${previous.lastExportAt}` : 'it was not exported'}.`, {previous});
    // A new empty workspace usually means a new person, so the first-use tips come back. Reset demo leaves them as they are.
    if (mode === 'empty') showTipsAgain();
    closeDialog(dialog);
    commit(mode === 'empty' ? TOASTS.emptyStarted : TOASTS.demoReset);
    window.scrollTo({top: 0, behavior: 'smooth'});
  }
  function dismissTips() {
    markTipsSeen();
    $('tips').hidden = true;
    document.querySelector('.page-intro h1').focus({preventScroll: true});
  }
  function showTipsAgain() {
    clearTipsSeen();
    $('tips').hidden = false;
  }
  function reopenTips() {
    showTipsAgain();
    $('tips-heading').focus();
  }
  function toggleSafetyTips() {
    const isOpen = $('safety-toggle').getAttribute('aria-expanded') !== 'true';
    $('safety-toggle').setAttribute('aria-expanded', String(isOpen));
    $('safety-body').hidden = !isOpen;
  }
  function toggleActivity() {
    const isExpanded = $('activity-toggle').getAttribute('aria-expanded') === 'true';
    $('activity-toggle').setAttribute('aria-expanded', String(!isExpanded));
    $('activity-toggle').textContent = isExpanded ? 'Show activity' : 'Hide activity';
    $('activity-body').hidden = isExpanded;
  }

  // ===== Dialogs =====
  function openDialog(id) {
    $(id).showModal();
  }
  function closeDialog(id) {
    $(id).close();
  }
  // Opens the listing dialog for an existing record, or empty for a new one when id is null.
  function openListingDialog(id, messageId = null) {
    const listing = id ? state.listings.find(l => l.id === id) : null;
    if (id && !listing) return;
    currentListing = id;
    $('listing-dialog-id').textContent = listing
      ? `${id} · ${listing.borough}, NYC · ${listing.added ? 'ADDED BY YOU' : 'FICTIONAL LISTING'}`
      : 'NEW LISTING · ADDED BY YOU';
    $('listing-dialog-title').textContent = listing ? listing.area : 'Add a listing';
    $('listing-submit').textContent = listing ? 'Save changes' : 'Add listing';
    $('listing-remove').hidden = !listing?.added;
    LISTING_FIELDS.forEach(key => $('listing-' + key).value = listing ? listing[key] ?? '' : key === 'contact' ? 'Not contacted' : '');
    const verify = getVerifyLevels(listing);
    VERIFY_KEYS.forEach(key => $('listing-verify-' + key).value = verify[key]);
    const safety = getSafetyLevels(listing);
    SAFETY_KEYS.forEach(key => $('listing-safety-' + key).value = safety[key]);
    $('listing-error').textContent = '';
    const context = listing && messageId && state.messages.find(m => m.id === messageId);
    $('listing-message-context').hidden = !context;
    $('listing-message-context').textContent = context ? (context.kind === 'host' ? 'Host message: ' : 'Reminder: ') + context.text : '';
    // A new listing starts with the basics; its checks stay folded until the user opens them.
    $('listing-checks-section').open = !!listing;
    $('listing-checks-later').hidden = !!listing;
    $('viewing-confirm-note').hidden = !listing?.viewingToConfirm;
    renderViewingStatus();
    listingFormStart = readListingFormSnapshot();
    openDialog('listing-dialog');
  }
  const readListingFormSnapshot = () => JSON.stringify([...$('listing-form').elements].map(el => el.value));
  // Closing the Add form with something typed asks first (Escape, × and Cancel alike); editing a saved listing closes as before.
  function requestCloseListing(e) {
    if (currentListing || readListingFormSnapshot() === listingFormStart) {
      if (!e) closeDialog('listing-dialog');
      return;
    }
    e?.preventDefault();
    openDialog('discard-dialog');
  }
  function discardNewListing() {
    closeDialog('discard-dialog');
    closeDialog('listing-dialog');
  }
  // Live viewing under Verification is read-only: it shows Safety's Viewed before paying, the one place it is recorded.
  function renderViewingStatus() {
    $('listing-viewing-status').textContent = `Viewing: ${$('listing-safety-viewedBeforePaying').value} — set in Safety checks`;
  }
  function openApplyDialog(id, isRevert = false) {
    const m = state.messages.find(x => x.id === id), s = m?.suggestion, l = m && findSuggestionTarget(m);
    if (!l || (isRevert && !m.applied)) return;
    currentApply = id;
    isRevertApply = isRevert;
    const change = getApplyChange(m, isRevert), current = l[s.field], isDifferent = String(current) !== String(change.from), next = {...l, [s.field]: change.to};
    const isInvalid = (s.field === 'end' && toDayNumber(change.to) <= toDayNumber(l.start))
      || (s.field === 'start' && toDayNumber(l.end) <= toDayNumber(change.to));
    const label = FIELD_LABELS[s.field] || s.field, row = (k, v) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`;
    $('apply-title').textContent = isRevert ? 'Revert this change?' : 'Apply this change?';
    $('apply-note').textContent = isRevert
      ? 'Only this field changes back, and the message is marked unread again.'
      : 'Only this field changes, and the message is marked reviewed. ShortStay does not check what the host says.';
    $('apply-confirm').textContent = isRevert ? 'Revert change' : 'Apply change';
    $('apply-table').innerHTML = row('Listing', `${l.id} · ${l.area}`) + row('Field', uppercaseFirst(label))
      + row('Current value', formatFieldValue(s.field, current, true))
      + row(isRevert ? 'Value before the message' : 'New value', formatFieldValue(s.field, change.to, true));
    $('apply-warning').innerHTML = isDifferent
      ? '<p class="choice-warning"><strong>Current value differs from the message.</strong> '
        + `The message expected ${escape(formatFieldValue(s.field, change.from, true))}; `
        + `this listing now says ${escape(formatFieldValue(s.field, current, true))}. `
        + `Applying replaces it with ${escape(formatFieldValue(s.field, change.to, true))}.</p>`
      : '';
    $('apply-preview').textContent = isInvalid ? 'This would put checkout on or before move-in. Edit the listing instead.' : previewMatch(l, next).text;
    $('apply-confirm').disabled = isInvalid;
    openDialog('apply-dialog');
  }
  // Only listings the user added can be removed; built-in examples are restored on every load, so use Closed for those.
  function openRemoveDialog() {
    const listing = state.listings.find(l => l.id === currentListing);
    if (!listing?.added) return;
    $('remove-title').textContent = CONFIRM_TEXT.removeTitle(listing);
    $('remove-text').textContent = CONFIRM_TEXT.removeBody(listing, state.choice === listing.id);
    openDialog('remove-dialog');
  }
  function openNeedsDialog() {
    $('need-start').value = state.needs.start;
    $('need-end').value = state.needs.end;
    $('budget-min').value = state.needs.budgetMin;
    $('budget-max').value = state.needs.budgetMax;
    $('needs-error').textContent = '';
    openDialog('needs-dialog');
  }
  function fillResetNote(id) {
    $(id).textContent = CONFIRM_TEXT.logNote(state.events.length + (state.droppedEvents || 0), state.lastExportAt);
  }
  // Reset demo and Start empty workspace share these; START_OVER_FLOWS names each one's dialog and buttons.
  function openStartOverDialog(flow) {
    closeDialog('demo-dialog');
    fillResetNote(flow.note);
    openDialog(flow.dialog);
  }
  function exportBeforeStartOver(flow) {
    exportSession();
    fillResetNote(flow.note);
  }

  // ===== Event bindings =====
  $('toast').addEventListener('mouseenter', holdToast);
  $('toast').addEventListener('mouseleave', releaseToast);
  $('toast').addEventListener('focusin', pauseToast);
  $('toast').addEventListener('focusout', resumeToastOnFocusOut);
  setInterval(refreshClock, 60000);
  delegateClicks('toast', [['[data-undo]', performUndo]]);
  document.addEventListener('keydown', undoFromKeyboard);
  $('add-listing').addEventListener('click', () => openListingDialog(null));
  $('density-compact').addEventListener('click', () => setDensity('compact'));
  $('density-detailed').addEventListener('click', () => setDensity('detailed'));
  $('sort-listings').addEventListener('change', setSort);
  $('last-contacted-now').addEventListener('click', setLastContactedNow);
  window.addEventListener('resize', scheduleClampUpdate);
  delegateClicks('storage-alert', [['[data-dismiss-storage]', dismissStorageNotice], ['[data-download-backup]', downloadUnreadableBackup]]);
  delegateClicks('listing-visibility', [
    ['[data-show-added]', button => showInAllSaved(button.dataset.showAdded)],
    ['[data-show-hidden]', showHiddenListings],
  ]);
  $('show-matches').addEventListener('click', () => setListingView('matches'));
  $('show-all').addEventListener('click', () => setListingView('all'));
  delegateClicks('choice-warning', [['[data-choice-show-all]', showChoiceInAllSaved]]);
  delegateClicks('next-up', [
    ['[data-next-edit]', openNextEdit],
    ['[data-next-go]', button => goToNext(button.dataset.nextGo)],
    ['[data-next-more]', toggleNextMore],
  ]);
  delegateClicks('listings', [
    ['[data-show-all]', () => setListingView('all')],
    ['[data-add-first]', () => openListingDialog(null)],
    ['[data-row]', toggleRow],
    ['[data-more]', toggleMore],
    ['[data-edit]', button => openListingDialog(button.dataset.edit)],
    ['[data-choose]', button => chooseListing(button.dataset.choose)],
  ]);
  delegateClicks('messages', [
    ['[data-message-edit]', button => openListingDialog(button.dataset.messageEdit, button.dataset.messageId)],
    ['[data-apply]', button => openApplyDialog(button.dataset.apply)],
    ['[data-revert]', button => openApplyDialog(button.dataset.revert, true)],
    ['[data-reviewed]', button => markReviewed(button.dataset.reviewed)],
  ]);
  $('apply-confirm').addEventListener('click', applyHostChange);
  $('listing-form').addEventListener('submit', saveListingForm);
  $('listing-remove').addEventListener('click', openRemoveDialog);
  $('remove-confirm').addEventListener('click', removeListing);
  $('needs-open').addEventListener('click', openNeedsDialog);
  $('needs-form').addEventListener('submit', saveNeeds);
  $('first-choice').addEventListener('change', previewChoice);
  $('decision-note').addEventListener('input', updateDecisionDirty);
  delegateClicks('note-review', [['[data-keep-note]', keepReasoning]]);
  window.addEventListener('beforeunload', warnBeforeLeaving);
  $('decision-form').addEventListener('submit', saveDecision);
  $('demo-open').addEventListener('click', () => openDialog('demo-dialog'));
  $('deliver-host').addEventListener('click', () => deliverDemoMessage('host'));
  $('deliver-reminder').addEventListener('click', () => deliverDemoMessage('reminder'));
  $('export-session').addEventListener('click', exportSession);
  $('session-code').addEventListener('change', saveSessionCode);
  START_OVER_FLOWS.forEach(flow => {
    $(flow.open).addEventListener('click', () => openStartOverDialog(flow));
    $(flow.exportFirst).addEventListener('click', () => exportBeforeStartOver(flow));
    $(flow.confirm).addEventListener('click', () => startOver(flow.mode, flow.dialog));
  });
  $('tips-close').addEventListener('click', dismissTips);
  $('tips-show').addEventListener('click', reopenTips);
  $('safety-toggle').addEventListener('click', toggleSafetyTips);
  $('activity-toggle').addEventListener('click', toggleActivity);
  // Every dialog's Cancel / × / Back buttons carry data-close. The listing dialog first checks for an unsaved new listing.
  document.querySelectorAll('dialog').forEach(dialog => delegateClicks(dialog.id, [
    ['[data-close]', () => dialog.id === 'listing-dialog' ? requestCloseListing() : dialog.close()],
  ]));
  $('listing-dialog').addEventListener('cancel', requestCloseListing);
  $('discard-confirm').addEventListener('click', discardNewListing);
  $('listing-safety-viewedBeforePaying').addEventListener('change', renderViewingStatus);

  // ===== Startup =====
  state = loadState();
  const prefs = loadPrefs();
  density = ['compact', 'detailed'].includes(prefs.density) ? prefs.density : (window.matchMedia('(max-width:720px)').matches ? 'compact' : 'detailed');
  sortBy = SORTS.includes(prefs.sort) ? prefs.sort : 'default';
  $('tips').hidden = hasSeenTips();
  // Logged once everything is defined, so the note about unreadable data is part of the session record.
  if (storageNotice?.kind === 'unreadable') {
    recordEvent('System', storageNotice.backupKey
      ? `Saved data could not be read; kept as backup ${storageNotice.backupKey}.`
      : 'Saved data could not be read or backed up; saving paused.');
  }
  migrations.forEach(({text, details}) => recordEvent('System', text, details));
  if (migrations.length) store();
  render();
  renderStorageAlert();
})();
