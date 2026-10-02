# Swift West Cleaners — Hostinger Node.js version 2

Independent migration of [senju4477/swift-west-cleaners](https://github.com/senju4477/swift-west-cleaners), source `main` at commit `ddc83c4ab4f602dcbefcc7e3606ccf46f916d80d`. The original repository, live Site, D1 database and DNS remain untouched.

This copy retains the original pages, service descriptions, branding, responsive CSS, WebP photography, quote fields and business-information placeholders. It replaces Vinext, Vite, Wrangler and Cloudflare D1 with official Next.js 16.3.8 and server-only MySQL storage. Internal links use Next Link while retaining their original URLs and styling. Failed submissions retain entered details. Identical retries use one enquiry ID and one stored record.

## Local use

Use Node.js 22.x; tested version is 22.23.3. The committed npm lockfile is required.

```bash
npm ci
cp .env.example .env.local
npm run typecheck
npm run lint
npm run build
npm start
```

`npm start` loads local environment files, runs the generated `.next/standalone/server.js`, listens on `0.0.0.0`, honors `PORT` and defaults to port 3000. Hostinger's Next.js preset starts that same generated server itself; it does not need a custom entry file or a start-command field.

The build command is `next build --webpack && node scripts/prepare-standalone.mjs`. Its preparation script copies public images and Next static files into the standalone artifact and checks that the server exists. A build never connects to a database or creates tables. The preparation script also supports a project without a public directory.

Without database settings, pages still build and load. A valid quote submission returns a recoverable 503 error. Success is shown only after the database insert commits. Existing email-notification disclaimers are retained because the source has no configured email provider.

## Included pages

Home, Services, Commercial Cleaning, Domestic Cleaning, NDIS Cleaning, End of Lease Cleaning, Carpet Cleaning, About, Contact, draft Privacy Policy and draft Terms & Conditions. Their original paths are unchanged. The quote API remains `POST /api/quote`; there is no public enquiry-listing or migration API.

## Deployment and verification

Read [deploy/HOSTINGER.md](deploy/HOSTINGER.md) for exact settings, environment variables, phpMyAdmin setup, data import, rollback and cutover. Read [deploy/VERIFICATION.md](deploy/VERIFICATION.md) for observed test results and account-dependent checks. [deploy/source-manifest.json](deploy/source-manifest.json) records the source inventory and file hashes before implementation.

Run `npm run verify:production` against a running pages-only preview without database configuration. For a different port, set `TEST_BASE_URL`. `SITE_URL` must match the canonical origin used during its build. Optional database checks require an isolated database whose name ends in `_test` and explicit `TEST_ALLOW_DB_WRITE=true`; they insert labelled synthetic data and remove those rows. Never run these write tests against a customer database.

The complete project is uploaded to the independent private repository [senju4477/swift-west-cleaners-hostinger-v2](https://github.com/senju4477/swift-west-cleaners-hostinger-v2), branch `main`. The handover records the verified remote commit and file manifest. Hostinger restricts sign-in from the available cloud browser, so no Hostinger preview has been deployed. No production launch is authorized by this package.
