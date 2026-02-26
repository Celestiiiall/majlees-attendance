# Majlees Attendance

A lightweight web app to track Majlees attendance with:
- Session date and start time
- Host name
- Guest list with expected arrival times
- Check-in timestamps
- Status tracking (`Pending`, `Arrived`, `No-show`)
- Consolidated summary cards and arrival outlook
- CSV export

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
