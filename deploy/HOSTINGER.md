# Deploy Swift West Cleaners on Hostinger

## Repository and build settings

The complete project is uploaded to the separate **private** repository [senju4477/swift-west-cleaners-hostinger-v2](https://github.com/senju4477/swift-west-cleaners-hostinger-v2), branch `main`, with `package.json` at the root. Hidden configuration files, the npm lockfile, original images, scripts and the `deploy/` folder are included. Dependencies, build output, real environment files and customer exports are excluded.

Use **Websites → Add Website → Node.js web app → Import Git repository** for a separate preview app. Connect the owning GitHub account's Hostinger App and grant access to the new private repository. Preserve connections used by other websites. The generic Git file-copy feature does not build this application.

| hPanel setting | Exact value |
|---|---|
| Repository | Separate private `senju4477/swift-west-cleaners-hostinger-v2`  |
| Branch | `main` |
| Root directory | `/` or blank, with `package.json` at the root |
| Framework | Next.js, server mode (`next`) |
| Node.js | 22.x; local test was 22.23.3; hPanel's actual patch is not observed |
| Package manager | npm |
| Build script selector | `build` |
| Full-command field, if shown | `npm run build` |
| Output directory | `.next` |
| Entry file | Leave blank; ignored by the Next.js preset |
| Startup | Hostinger starts the generated standalone Next server |

Keep `.next` as the output setting. The only Next configuration is an exported object in `next.config.mjs`, with standalone output explicit for local use. Webpack is selected in the actual build script, before the asset-preparation command. Do not append `--webpack` to a chained npm command. Hostinger installs packages itself; no custom install-command or start-command field is assumed.

Use a new preview slot. Do not overwrite an existing site, change production DNS or connect this copy to the original repository's deployment branch.

## Environment variables

Enter real values privately in hPanel's environment-variable settings. Detected variable names do not mean their values are complete. Add missed rows, remove genuinely unused ones and save. Values are supplied at build and runtime; verify the resulting deployment in the dashboard. Do not commit credentials or paste them into chat.

| Key | Value and purpose | Required | Used | Secret | After a change |
|---|---|---|---|---|---|
| `SITE_URL` | Actual separate preview HTTPS origin, without a path; use the authorized production origin only at cutover | Required for correct hosted canonical URLs; local fallback is `http://localhost:3000` | Build and runtime metadata | No | Rebuild and redeploy |
| `SITE_INDEXABLE` | `false` for preview; `true` only after launch approval | Defaults to false | Build and runtime | No | Rebuild and redeploy |
| `HOSTNAME` | `0.0.0.0` for Hostinger's generated server | Set for hosted startup; local start enforces it | Runtime | No | Restart or redeploy |
| `PORT` | Hostinger-assigned value; do not add a fixed hosting port | Platform supplied; local default 3000 | Runtime | No | Platform managed |
| `DB_HOST` | Actual host displayed for the **new** database; often `localhost` | Required for quotes | Runtime only | Configuration | Restart or redeploy |
| `DB_PORT` | Actual port; defaults to `3306` | Optional when 3306 is correct | Runtime only | No | Restart or redeploy |
| `DB_USER` | Full new username, including Hostinger prefix | Required for quotes | Runtime only | Yes | Restart or redeploy |
| `DB_PASSWORD` | Actual new database password | Required for quotes | Runtime only | Yes | Restart or redeploy |
| `DB_NAME` | Full new database name, including Hostinger prefix | Required for quotes | Runtime only | Configuration | Restart or redeploy |
| `DB_SSL_CA` | Optional trusted CA certificate in PEM format if the database requires TLS; literal `\n` is supported | Only if the verified connection requires TLS | Runtime only | Keep private | Restart or redeploy |

No `DATABASE_URL` or `NEXT_PUBLIC_*` credential is used. Quote storage uses the separate `DB_*` variables. A pages-only preview can omit the database rows, but successful form submission is then unavailable. HTTP 503 is intentional in that case.

Preview pages emit a noindex meta tag and `X-Robots-Tag: noindex, nofollow, noarchive`; robots.txt disallows crawling and the preview sitemap is empty. These are indexing controls, not password protection. The original public-page behavior is retained. Apply hosting access controls if the preview must be restricted to named reviewers.

## New database setup without SSH

1. Open **Websites → Dashboard → Databases → Management**. Create a separate database and user. Record the full prefixed names and actual host privately.
2. Open phpMyAdmin for that new database. Record its actual engine/version, default encoding, privileges and connection-security requirements. Hosted capabilities remain unverified until this step is completed.
3. Select the new database, choose **Import**, and import `deploy/schema.mysql.sql`. No build, terminal, SSH or public migration endpoint is involved.
4. In phpMyAdmin, confirm `enquiries` has all 12 original columns, uses InnoDB and utf8mb4, and `schema_migrations` contains version `001` with the checksum printed at the top of the SQL file.
5. Configure the real `DB_*` values in hPanel, then restart/redeploy the preview. Submit one clearly labelled test enquiry and verify the actual row and reference. Remove that test row after review.

The import uses baseline SQL compatible with MySQL 5.7/8.x syntax and MariaDB; only MariaDB 10.11.14 was tested locally. It avoids server-admin grants, stored procedures and provider-specific bindings. Oracle MySQL and Hostinger's actual engine must be verified before calling their database setup complete.

The initial migration is also versioned as `deploy/migrations/001-initial.sql`. Those files are identical. Before repeating an import, compare the stored checksum with the file and inspect the column definitions. Re-importing this unchanged initial schema preserves existing rows and produces one migration record; it does not upgrade an older or incompatible table. Never edit an applied migration. Future upgrades need a new reviewed migration. MySQL DDL is not transactionally rollbackable.

The connection pool is created lazily, has five connections and a bounded queue, uses parameterized statements and stores ISO UTC creation timestamps as text, preserving the original representation. Optional enquiry fields retain their original names and meanings. The API validates and limits input, retains the honeypot and origin check, and acknowledges only committed storage. A repeat of the same request key and payload returns the same reference; a conflicting payload returns 409.

## Existing D1 records and offline import

The original live `enquiries` table was inspected read-only on 2 October 2026. It returned **zero rows**, with no truncation or further page. Nothing needs transferring from that observed snapshot. The original table and schema were not changed. Recheck before any later cutover because new enquiries may arrive meanwhile.

If records exist at cutover, export complete original rows through an authorized read-only database/export workflow. Keep the export private and outside the project. The bounded Sites database viewer is suitable for inspection; do not treat truncated cells or partial pages as a complete export. The original SQLite DDL is retained only as `deploy/source-reference/d1-enquiries.sql` and must not be imported as MySQL.

Convert a complete JSON array on your local computer:

```bash
node scripts/convert-d1-export.mjs /private/enquiries.json /private/enquiries.mysql.sql
```

The converter preserves source IDs, timestamps, all fields, empty strings and nulls. It uses hexadecimal UTF-8 values so apostrophes, newlines and Unicode are preserved. It rejects duplicate source IDs, missing fields, invalid types and oversize values without truncating or overwriting an output file. The generated SQL contains customer records and must never enter GitHub or a delivery archive.

Back up the **new** database before importing records. In phpMyAdmin, import the private SQL into the selected new database and stop on any error; do not enable continuing after failures. The data statements use an InnoDB transaction. An identical retry leaves existing matching rows intact; conflicting IDs fail rather than overwrite them. If any error occurs, verify rollback and actual row counts before retrying; do not assume a client that continues after errors provides automatic all-or-nothing behavior. Compare source and destination counts, every ID and all fields. Reconcile any records created while exporting, then obtain launch approval.

## Hosted verification and rollback

A green build is only one stage. Inspect the actual deployed commit, build log, runtime log and HTTPS preview URL. Open all 11 page paths directly. Check CSS, JavaScript, WebP images, navigation, mobile layouts, quote validation, a real stored test row, noindex controls, SSL and redirects. The original site has no email provider; storing a quote does not send an email.

If this preview fails, redeploy its last verified commit or remove only the new preview app after preserving any enquiries received there. The original live repository, website, D1 data and DNS remain the restore point. A Git rollback does not restore a MySQL database; recover the new database from its separate backup and reviewed migration history.

Production cutover is **not authorized**. Before requesting launch approval, confirm the intended domain, business phone/email/hours/legal entity, service details and final Privacy/Terms. Verify hosted database writes, arrange the actual owner enquiry-review process and separately configure/test email notifications if wanted. Obtain approval before changing DNS, replacing a live app, assigning the production domain or setting `SITE_INDEXABLE=true`. After an approved cutover, rebuild with the real HTTPS origin and verify production canonicals, sitemap, robots, forms and HTTPS routing.

## Official references checked on 2 October 2026

- https://docs.hostinger.com/node.js/build-settings
- https://docs.hostinger.com/node.js/overview-1/next
- https://docs.hostinger.com/node.js/github
- https://docs.hostinger.com/node.js/environment-variables
- https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/
- https://nextjs.org/docs/app/api-reference/config/next-config-js/output
- https://nextjs.org/docs/app/guides/upgrading/version-16
