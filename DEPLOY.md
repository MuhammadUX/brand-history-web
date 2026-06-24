# Deploying to Vercel

The app is build-verified and self-contained. Vercel builds it remotely (no local `node_modules` needed), and the Supabase publishable keys are baked in as fallbacks, so **no env configuration is required** for a first deploy.

## Option A — Vercel CLI (one command)
```bash
cd "/Users/muhammadalfaifi/Brands/brand-history-app"
npx vercel --prod
```
- First run asks you to log in and confirm the project name/scope (your "Muhammad Alfaifi's projects" team). Accept the defaults.
- Vercel detects Next.js automatically, runs `npm install` + `npm run build` in its cloud, and returns a live URL.

## Option B — Git + Vercel integration
1. Create an empty GitHub repo (e.g. `brand-history-web`) and copy its URL.
2. From the app folder, run these one line at a time (replace `REPO_URL` with your repo URL — no angle brackets):

```bash
cd "/Users/muhammadalfaifi/Brands/brand-history-app"
git init
git add .
git commit -m "Brand History — Sprint 0 vertical slice"
git branch -M main
git remote add origin REPO_URL
git push -u origin main
```

3. In Vercel → **Add New Project** → import the repo → Deploy.

> Note: the earlier `zsh: parse error near '\n'` came from the `<your-repo-url>` placeholder — in zsh, `<` and `>` are file-redirection operators, so the angle brackets broke the command. Use a plain value like `REPO_URL` (or your actual `https://github.com/...` URL) with no `<` `>`. Running each line separately (above) also avoids any paste/indentation issues.

## Optional: set env in Vercel (recommended for clarity)
Project → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://osivlxbygjdluzuckvpo.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `<publishable anon key>`
Then redeploy. (Optional — in-source fallbacks already work.)

## After deploy — smoke check
- `/` redirects to `/en`.
- `/en` lists 6 brands (stc, Aramco, Al Rajhi Bank, SABIC, Almarai, flynas).
- `/en/search?q=stc` returns stc; `/ar` shows the Arabic, right-to-left layout.
- `/en/brand/stc` shows the profile with Assets / Guidelines / Timeline.
