# Majlees Attendance

A lightweight web app to track Majlees attendance with:
- Dark mode by default
- Session date and start time
- Host details shown in summary (`Majlees Senior` or `Majlees Junior`)
- Guest list with expected arrival times
- Check-in timestamps
- Status tracking (`Pending`, `Arrived`, `No-show`)
- Consolidated summary cards and arrival outlook
- CSV export
- Installable as a phone app (PWA)

Current default is `Guest-only mode`:
- Guests can only submit `name + expected arrival time`
- Guest names are restricted to your predefined alphabetical list
- Host/session/admin controls are hidden from the public page

Admin access:
- Open the same page with `?admin=1` appended to the URL
- Example: `https://celestiiiall.github.io/majlees-attendance/?admin=1`

Note: this is a convenience toggle in a static app, not secure authentication.

Phone app install:
- iPhone (Safari): open the URL, tap Share, then `Add to Home Screen`.
- Android (Chrome): open the URL, tap menu, then `Install app`.

## Run locally

This app has no dependencies.

1. Open `/Users/celestial/Desktop/GITHUB/majlees-attendance/index.html` in a browser.
2. Enter session details and save.
3. Add guests with expected arrival times.
4. Use `Check In` when each guest arrives.
5. Export CSV any time.

## Publish as a public link (GitHub Pages)

After you push this folder to a new GitHub repository, GitHub Actions will deploy it automatically.

1. Create a new GitHub repository named `majlees-attendance`.
2. From this folder run:

```bash
cd /Users/celestial/Desktop/GITHUB/majlees-attendance
git init
git branch -M main
git add .
git commit -m "Initial Majlees attendance app"
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/majlees-attendance.git
git push -u origin main
```

3. In GitHub repo settings, open `Pages` and set source to `GitHub Actions` (only needed if not auto-enabled).
4. Your app link will be:

`https://<YOUR_GITHUB_USERNAME>.github.io/majlees-attendance/`

## Data storage

Data is stored in browser `localStorage` under key `majlees-attendance-v1`.
