# Dolnath Calendar — GitHub Pages

This repository hosts the public, dynamic Dolnath calendar.

## Published site

GitHub Pages serves `index.html` from the repository root.

The page dynamically generates any Dolnath year and calculates:

- all 9 months and 351 days
- weekdays
- seasons
- Xania, Luistea, and Vugeon phases
- fixed holidays
- Cosmos Accord Day's full-moon override
- Veilnight and its three phases
- special lunar events
- the synchronized Roll20 current date

## Repository layout

```text
/
├── index.html
├── .nojekyll
├── README.md
└── setup/
    ├── Code.gs
    └── Dolnath_Roll20_Sync.user.js
```

## 1. Create the GitHub repository

Create a repository such as:

`dolnath-calendar`

A public repository works with GitHub Pages on GitHub Free.

Upload the contents of this folder to the repository root.

## 2. Enable GitHub Pages

In the repository:

1. Open **Settings**
2. Choose **Pages**
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**
4. Select the `main` branch
5. Select `/(root)`
6. Click **Save**

The site entry file is `index.html`.

The included `.nojekyll` file tells GitHub Pages to serve the static files directly.

Your site URL will usually be:

`https://YOUR-GITHUB-USERNAME.github.io/dolnath-calendar/`

## 3. Configure the Google Apps Script middleman

The middleman remains Google Apps Script; GitHub Pages is the public front end.

1. Create a Google Apps Script project.
2. Paste the contents of `setup/Code.gs`.
3. Change:

   `CHANGE_THIS_TO_A_LONG_RANDOM_SECRET`

   to a long random token.

4. Deploy it as a **Web app**.
5. Execute as **Me**.
6. Set access to **Anyone**.
7. Copy the deployed `/exec` URL.

## 4. Configure the GitHub calendar

Edit `index.html`.

Find:

`PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`

Replace it with the Google Apps Script `/exec` URL.

Commit the change.

## 5. Configure Tampermonkey

Install Tampermonkey in the browser used to GM Roll20.

Create a new userscript using:

`setup/Dolnath_Roll20_Sync.user.js`

Set:

- `MIDDLEMAN_URL` to the same Google Apps Script `/exec` URL
- `POST_TOKEN` to the same private token configured in `Code.gs`

Save and enable the userscript, then reload Roll20.

## 6. Install the current Roll20 Mod

Use `DolnathCalendar_v1.4.7.js` in Roll20.

It emits a GM-only sync beacon whenever the date changes.

The userscript detects that beacon and sends the new date to Google Apps Script.

## Sync flow

```text
Roll20 Calendar Mod
        ↓
Tampermonkey userscript
        ↓
Google Apps Script middleman
        ↓
GitHub Pages Dolnath Calendar
```

The public calendar checks the middleman automatically and moves to the current synchronized Dolnath date.

## Testing

1. Open the published GitHub Pages site.
2. Open Roll20 in the browser with Tampermonkey enabled.
3. Run `!calendar sync`.
4. Check the browser console for a successful Dolnath Sync update.
5. On the GitHub calendar, click **Check Now**, or allow the automatic poll to run.
6. Confirm the calendar highlights the same campaign date.

## Updating the site

Edit or replace `index.html` in the repository and commit the change. GitHub Pages republishes from the configured source branch automatically.

Do not put your private `POST_TOKEN` into `index.html` or any other public GitHub file.
