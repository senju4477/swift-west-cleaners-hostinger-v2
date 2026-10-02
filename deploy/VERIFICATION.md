# Migration verification — 2 October 2026

## Delivery and deployment status

| Stage | Observed status |
|---|---|
| Implementation | Complete independent Node.js/Next.js and MySQL source project |
| Private repository | Created: `senju4477/swift-west-cleaners-hostinger-v2`, branch `main` |
| Uploaded migration source | Complete directory tree on `main`; uploaded through the signed-in GitHub browser after explicit approval |
| Verified remote commit | The final handover records the actual GitHub commit and confirms file-manifest hashes; the initial README-only commit `b825aa518a883097548c46a9bacae36e4bc13062` remains in history |
| Local production build/runtime | Passed on Node.js 22.23.3 and Next.js 16.3.8 with Webpack |
| Built on Hostinger | Not performed; hPanel restricts sign-in from this cloud browser |
| Running on Hostinger | Not deployed; no preview URL exists |
| Database verified | Isolated local MariaDB 10.11.14 passed; hosted engine, Oracle MySQL, privileges and TLS remain unverified |
| Production domain verified | Not performed; production cutover is not authorized |

The original repository's `main` remains at `ddc83c4ab4f602dcbefcc7e3606ccf46f916d80d`, verified again after implementation. This work did not modify the original repository, live Site, D1 database, hosting settings or DNS. The separate repository contains the complete independent project. The current GitHub commit identifier is recorded in the final handover, outside the committed file tree.

## Preserved website and required changes

The original app used Vinext/Vite and Cloudflare Workers/D1. The new copy uses official Next.js 16.3.8, its generated standalone Node server and a lazy `mysql2` connection pool. All 11 page paths, original wording, typography branding, contact placeholders, draft legal notices and seven WebP photographs are retained. The 76 source files in `public/`, `components/`, `vendor/`, `app/content.ts` and `app/globals.css` are byte-identical to the recorded baseline. Original contact details and business claims were not invented.

Internal links now use Next's router. Quote submission validates bounded input, keeps entered details after failure, acknowledges only a committed write, and safely replays an unchanged submission key. Metadata and canonical origins use explicit configuration; preview indexing is disabled by default. No email provider was configured in the source, and email delivery was not added or claimed.

Retained direct UI dependencies are pinned to the original lockfile's resolved versions, except the required Next/ESLint preset change and Lucide. In the observed clean installation of Lucide 1.31.0, the production bundle failed because an entry-point export referenced missing `icons/building-complex.mjs`. Lucide 1.49.0 builds successfully. A comparison of SVG node geometry, excluding internal React keys, confirmed all 16 icons used by the business pages match the original 1.31.0 package, including Sparkles branding. This is evidence for the selected fix, not a claim about every installation of the older package.

Provider deployment scaffolding, competing pnpm lockfiles, D1 runtime bindings and the unused authentication helper are excluded. The original SQLite schema is preserved only as a labelled reference. The complete baseline inventory and source hashes are in `source-manifest.json`.

## Checks that passed

| Check | Evidence/result |
|---|---|
| Clean install | `npm ci` installed the final locked dependency set on Node 22.23.3 |
| Types | `npm run typecheck` passed with strict TypeScript settings |
| Lint | `npm run lint`: zero errors, five advisory `no-img-element` warnings |
| Production build | `npm run build` compiled with Webpack, generated standalone `server.js`, copied public/static assets |
| Startup | Generated standalone server started on default 3000 and custom 32167; actual listening sockets were observed at `0.0.0.0` |
| Pages/assets | All 11 direct page URLs returned 200; 21 original/generated CSS, JS, image and font assets served successfully |
| Routing | Trailing-slash redirect returned 308; unknown page returned 404; page navigation hrefs were inspected over HTTP |
| Metadata/indexing | Per-page titles, canonical URLs, structured data, noindex meta/header, disallowing robots.txt and empty preview sitemap passed |
| API validation | Malformed JSON, wrong types, invalid fields, honeypot, invalid calendar dates/times, oversized bodies, content type, cross-origin requests and invalid retry keys were rejected |
| Missing/disconnected database | Valid submissions returned 503 without a fake success reference, including after the database was stopped |
| Schema import/retry | Initial SQL imported twice; expected table fields and version/checksum were verified with one migration record |
| Real storage | Seven labelled synthetic enquiries stored and read back with expected fields and ISO timestamps; Unicode was preserved |
| Concurrency/retries | Eight parallel identical attempts produced one row and the same reference; changed payload returned 409; six distinct concurrent enquiries were preserved |
| Offline D1 conversion | IDs, timestamps, nulls, empty strings, apostrophes, newlines and Unicode preserved; identical replay succeeded; conflicting IDs failed without overwriting |
| Test cleanup | All labelled test rows were removed; isolated test table count was zero afterward |
| Security audit | Explicit full and production `npm audit` reported zero known vulnerabilities on this date |

Database tests used **10.11.14-MariaDB-0ubuntu0.24.04.1**, running locally in an isolated test database. They do not establish behavior on Oracle MySQL or Hostinger's actual database service. The portable HTTP/database test suite is `tests/production.mjs`. Optional database tests require an isolated database ending in `_test` and explicit `TEST_ALLOW_DB_WRITE=true`; do not run them on a customer database.

## Warnings and unverified checks

Five Next lint warnings concern the original HTML `img` elements. They are advisory; images were preserved for this hosting migration. Installation also warned that the retained ESLint 9.39.4 line is no longer supported. The installed Next 16.3.8 preset accepts it, lint passes and the audit found no known vulnerability; a future dedicated tooling update should choose the then-supported compatible version. Local harness warnings about an experimental HTTP proxy agent, npm's proxy configuration and MariaDB's MAC/file-limit probes did not prevent the tested build or database operations.

Desktop/mobile visual presentation, hydrated navigation/form interactions, overflow and browser console errors remain **unverified**. Local headless browser binaries failed to launch in this execution environment. Preserved CSS/content/assets and HTTP results do not substitute for a real browser check.

Hostinger repository access, build logs, actual Node patch, running process, HTTPS preview URL, runtime logs, database engine/version/privileges/TLS and hosted quote writes have not been verified. No hosted email, production SSL/DNS/domain routing or cutover was performed. Hostinger's current cloud-browser restriction is described at [When a website blocks the task](https://help.openai.com/articles/20001280-using-cloud-browser-in-chatgpt#when-a-website-blocks-the-task).

## Upload and integrity verification

The complete source is uploaded to the separate private repository on `main` through the existing signed-in GitHub browser, after the user explicitly approved that fallback. The GitHub plugin could not access this newly created private repository. Repository visibility and permissions were preserved.

The portable ZIP contains the same complete project with `package.json` at its root, hidden configuration files, npm lockfile, original assets, scripts, SQL and these guides. It excludes dependency/build directories, credentials and customer exports. `deploy/file-manifest.json` records each project's file size, SHA-256 and Git blob SHA; the manifest itself is excluded from its own hash list.

The final handover records the actual remote commit and results of comparing the uploaded directory tree with this file manifest. No ZIP-only upload or flattened directory tree should be treated as a complete source upload. Later edits require regenerating the manifest and verifying the resulting remote tree.

Exact deployment settings, the environment-variable table, no-SSH phpMyAdmin import, rollback and the production-cutover checklist are in `HOSTINGER.md`. No production launch is authorized by this handover.
