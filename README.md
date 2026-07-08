# Letar Inc. — Marketing Website

Public marketing site for [letarinc.com](https://letarinc.com). **This is a standalone static site** — it has no build step and no dependency on the LetarOS application or backend. It lives in this directory temporarily and is destined for its own repository (see "Moving to its own repo" below).

> Extracted from `backend/website/` in 2026-07 so marketing changes no longer require API deploys and the ERP repo carries no public-facing content.
>
> **A full redesign is planned.** Treat this version as the reference implementation — whatever replaces it should keep the pieces that already work: the Supabase REST form wiring below (insert-only RLS + honeypot + DB length guards), and the existing `quote_requests` / `contact_messages` / `website_leads` tables so the office keeps seeing leads in one place. The redesign changes the skin, not the data plumbing.

## Architecture

- Pure static HTML/CSS/JS — five pages (`index`, `capabilities`, `certifications`, `contact`, `privacy`, `terms`), `css/`, `js/`, `assets/`. All paths are relative; any static host serves it as-is.
- **Forms** (quote requests, contact, email capture) post directly to Supabase REST from `js/supabase-client.js` using the **publishable anon key** — public by design; writes are constrained by RLS insert-only policies (`quote_requests`, `contact_messages`, `website_leads`) plus DB length guards and a honeypot field (`_hp`) for bots.
- Quote file uploads go to the `quote-attachments` storage bucket. ⚠️ That bucket must be private with signed-URL reads — tracked as item A17 in `engineering/13-production-readiness-checklist.md` of the main repo.

## Local preview

```bash
cd website && python3 -m http.server 8080   # then open http://localhost:8080
```

## Deploying

Recommended: **Cloudflare Pages** or **Netlify** (free tier, zero-ops, global CDN, automatic TLS) — connect the repo, no build command, publish directory = site root. Alternative if you want to stay single-vendor: a Railway static service.

### Cutover runbook — order matters

Until the final step, the production backend keeps serving this site at its current URL, so nothing breaks if you go slowly.

1. Deploy this directory to the new host (temporary URL).
2. Verify: click through all five pages; submit a test quote/contact form and confirm rows appear in Supabase (`quote_requests`, `contact_messages`).
3. Point `letarinc.com` DNS at the new host (the LetarOS app stays on its own subdomain).
4. Set `MARKETING_URL=https://letarinc.com` on the **backend** Railway service — the API will then 301 old marketing URLs to the new home.
5. Deploy the backend version that no longer bundles this site (any deploy after the extraction commit). Old links keep working via the redirects.

## Moving to its own repo

Simplest (no history): copy this directory into a new repo and delete it from LetarOS.

With history preserved:

```bash
git clone <letaros-repo-url> letar-website && cd letar-website
pip install git-filter-repo
git filter-repo --path website --path backend/website --path-rename website/:. --path-rename backend/website/:.
git remote add origin <new-repo-url> && git push -u origin main
```

Then delete `website/` from the LetarOS repo in a normal PR.
