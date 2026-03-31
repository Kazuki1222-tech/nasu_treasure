# nasu_treasure RESERVA Monitor

## Goal

Monitor the Treasure Stone Park RESERVA page and notify via GitHub when either of these dates becomes selectable:

- `2026-04-11`
- `2026-04-12`

The monitored page is:

- `https://reserva.be/tsp/reserve?mode=service_staff&search_evt_no=2deJwzMrc0NTMAAARkAT4`

This project intentionally does not use GAS anymore. It is a GitHub Actions based monitor.

## Requirements

### Functional requirements

1. Run automatically every 30 minutes.
2. Allow the schedule to be changed by editing a single cron line in `.github/workflows/reserva-monitor.yml`.
3. Open the RESERVA page in a browser context that looks like a regular Chrome session.
4. Detect bot challenge pages and record them without crashing the workflow.
5. Read the DOM directly and determine whether `20260411` or `20260412` is selectable.
6. Save a JSON result file and a screenshot for every run as workflow artifacts.
7. When either target date becomes selectable for the first time, create one GitHub Issue and fail that run once so GitHub Actions can send its workflow failure email.
8. Avoid duplicate alert runs after the first alert issue has already been created.

### Notification requirements

1. GitHub is the notification system.
2. Email delivery must go to `chakazuki@gmail.com`.
3. That email address must be configured and verified in the target GitHub account's notification settings.
4. Repository Issues must be enabled.
5. GitHub Actions email notifications must be enabled for the GitHub account that owns or edits the scheduled workflow.

### Non-functional requirements

1. The monitor must not depend on manual intervention for normal checks.
2. The monitor must degrade safely when Cloudflare or RESERVA changes behavior.
3. The project should remain small and focused on this one monitoring job.

## Detection logic

The current RESERVA page renders each day as a radio input. For example:

- `id="20260411"`
- `id="20260412"`

A date is treated as available when:

- the input exists
- `disabled === false`
- the class name does not contain `is-unavailable`

If the page title or body indicates a Cloudflare verification page, the run is classified as `challenge`.

## E2E test cases

1. Page opens normally and both target date inputs exist.
2. Target dates are disabled, so the run completes successfully with no alert issue creation.
3. One or both target dates become enabled, so the workflow creates the alert issue and fails once.
4. The alert issue already exists and the dates are still enabled, so the workflow does not create a duplicate issue.
5. Cloudflare challenge is shown, so the workflow uploads artifacts and records `pageState=challenge` without creating an availability alert.
6. Navigation or parsing fails, so the workflow records `pageState=error` and uploads artifacts.

## Repository layout

- `.github/workflows/reserva-monitor.yml`: scheduled monitor workflow
- `scripts/monitor-reserva.mjs`: Playwright based checker
- `package.json`: local and CI dependencies

## Setup

1. Create a GitHub repository from this project.
2. In the GitHub account that should receive mail, verify `chakazuki@gmail.com` as an email address.
3. Enable email notifications for GitHub Actions.
4. Enable repository watching or at least issue notifications if you also want the issue email.
5. Push the repository to the default branch.
6. Run the workflow once with `workflow_dispatch`.

## Changing the check frequency

Edit this file:

- `.github/workflows/reserva-monitor.yml`

Change this line:

```yaml
cron: "*/30 * * * *"
```

Examples:

- every 15 minutes: `*/15 * * * *`
- every hour: `0 * * * *`

## Local development

Install dependencies:

```bash
npm install
npx playwright install chromium
```

Run the monitor locally:

```bash
npm run monitor
```

Artifacts are written to `artifacts/` by default.
