# Team contribution guide

1. Clone the repository and read the README and demo guide.
2. Create a branch with a clear name, for example `feature/listing-filters` or `fix/mobile-dialog`.
3. Edit the application files in `dist/`; there is no build step.
4. Open the page at desktop and mobile widths and check the affected interaction.
5. Run `zsh tests/run.sh` on a supported Mac when changing application behavior.
6. Open a pull request with the problem, resulting behavior, and checks performed. Ask a teammate to review before merging into `main`.

Use Issues to record bugs and discuss design changes. Screenshots should use fictional data. Keep recordings, interview notes, participant information, exported sessions, credentials, and local service configuration outside the repository.

Repository access is managed by the owner. Viewing this public repository does not require a collaborator invitation; pushing branches does.

## Suggested manual checks

- Dates and rent filters update the visible listings correctly.
- Add and edit forms save the intended values.
- Applying a simulated host change explains its effect before saving.
- Undo restores the latest supported action.
- Required payment checks retain their reminders until marked Done.
- Refreshing preserves the browser-local workspace.
- Mobile controls and dialogs remain usable.
