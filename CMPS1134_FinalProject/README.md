# Hosting this project with GitHub Pages

This repository contains a simple static site (HTML/CSS/JS). The repo is preconfigured to deploy to GitHub Pages using a GitHub Actions workflow on pushes to the `main` branch.

## What I added

- `.github/workflows/deploy-pages.yml` — GitHub Actions workflow that publishes the repository contents to GitHub Pages on push to `main`.
- `.nojekyll` — empty file to prevent GitHub Pages from running Jekyll and ignoring files/folders that start with underscores.
- This `README.md` with steps to get your site online.

## Quick steps (PowerShell)

1. Initialize git (if not already):

```powershell
cd "C:\Users\jacob\OneDrive\Desktop\CMPS1134_FinalProject"
# initialize repo if needed
git init
git add .
git commit -m "Initial site files"
# make main branch
git branch -M main
```

2. Create a GitHub repo (either via the web UI or using the GitHub CLI `gh repo create`). Then add remote and push:

```powershell
# Replace USER and REPO with your GitHub username and repo name
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

3. After push, the GitHub Actions workflow will run and publish the site to GitHub Pages automatically. It may take a minute.

4. Visit `https://<your-username>.github.io/<repo>` or check the repository `Settings > Pages` to see the published site URL.

## Notes

- If you prefer manual Pages setup, you can enable GitHub Pages in repository Settings and choose the `gh-pages` branch or `main`/`docs` folder as source.
- If you want a custom domain, add a `CNAME` file in the root with your domain and configure DNS.
- If you don't want automatic deploys, skip adding the workflow and push normally, then enable Pages in Settings.
