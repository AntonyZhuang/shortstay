# ShortStay demo guide

## Example data

The demo starts with 12 fictional furnished-room listings across NYC's five boroughs. Dates, rents, deposits, terms, verification states, and messages are invented test data. No listing is a real offer, and the prototype does not verify housing or contacts.

## Quick walkthrough

1. Open `dist/index.html` or use the local server described in the README.
2. Review the first-use tips. Adjust move-in and checkout dates and the monthly rent range.
3. Compare Matches my needs with All saved. Switch Compact / Detailed views and change sorting.
4. Open a listing with Review & update, change its contact status or notes, and save.
5. Use Choose for now and review the reasoning under My decision.
6. Open Team demo controls and trigger the simulated host message. In Updates, review the proposed checkout-date change, confirm Apply change, and observe its effect on matching. Undo or revert it.
7. Review the first choice's Safety checks. Viewed before paying and Traceable payment only must be Done to clear the required payment reminder. Other reminders may remain. ShortStay does not validate these self-reported checks.
8. Use Demo activity to enter a non-identifying session code such as T1 and export a JSON session if needed.
9. Use Start empty workspace to demonstrate adding your own fictional listings, or Reset demo to return to the built-in example.

## Browser storage

Each browser/device has its own workspace. Changes are not shared through GitHub and do not synchronize with another browser. Using a different URL or local server port can also use a different storage area.

The workspace uses `shortstay-cp3-demo-v1`; layout preferences use `shortstay-cp3-view-prefs`; dismissed first-use tips use `shortstay-cp3-tips-seen`. Backup keys can begin with `shortstay-cp3-demo-v1-backup-`.

For a clean participant demonstration, use a fresh browser profile or clear this prototype's saved storage and reload. Reset demo alone does not clear all view preferences or dismissed tips. Enter the session code again after resetting or starting an empty workspace.

Exported session JSON can contain user-entered notes and full before/after records. Keep exports outside the public repository. Never enter participant names or real contact details in a public screenshot or test fixture.

## Expected examples

With the default June 1–August 15, 2026 dates and unchanged example records:

- Monthly rent $0–$2,200: 9 matches.
- Monthly rent $0–$2,000: 8 matches.
- Monthly rent $1,800–$2,000: 5 matches.
- Applying B05's simulated checkout change from August 15 to August 13 makes it end two nights early and removes it from Matches.

Built-in message delivery and reminders are facilitator-triggered simulations. The application does not send messages, connect to hosts, or run a real reminder service. Next up lists remaining work and does not certify that a listing is safe.
