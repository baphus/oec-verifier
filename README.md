# OEC Verify

OEC Verify is an MVP for public application intake, time-limited receipt links, email delivery, and authenticated evaluator decisions. Applicants submit an application and receive a reference/receipt link; active evaluator or admin profiles can review submissions and record verified, rejected, or revoked decisions.

This is an MVP. It does not provide automated data-retention deletion, and operational review, retention, and access-control policies remain the operator's responsibility.

## Prerequisites

- Node.js and npm
- A Supabase project with email/password authentication
- A Gmail account with 2-Step Verification and an App Password for receipt mail
- A Vercel account for hosted deployment (optional)

## Install

```bash
npm install
```

Copy `.env.example` to `.env.local`, then set these variables. This is the complete current environment-variable list; do not commit the file containing values.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
# Legacy fallback: NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GMAIL_USER
GMAIL_APP_PASSWORD
APP_URL
RECEIPT_VALIDITY_HOURS
RECEIPT_TOKEN_ENCRYPTION_KEY
RATE_LIMIT_HASH_SECRET
RATE_LIMIT_MAX_ATTEMPTS
RATE_LIMIT_WINDOW_MINUTES
EMAIL_DELIVERY_LEASE_SECONDS
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is preferred. Existing deployments may use `NEXT_PUBLIC_SUPABASE_ANON_KEY` as a fallback; at least one must be set. `APP_URL` must be the URL users can reach. `RECEIPT_VALIDITY_HOURS`, `RATE_LIMIT_MAX_ATTEMPTS`, `RATE_LIMIT_WINDOW_MINUTES`, and `EMAIL_DELIVERY_LEASE_SECONDS` must be positive integers; their application defaults are 24, 5, 15, and 900 seconds respectively. The lease must be long enough for normal Gmail SMTP delivery. `RECEIPT_TOKEN_ENCRYPTION_KEY` is mandatory and must decode from Base64 to exactly 32 bytes. `RATE_LIMIT_HASH_SECRET` is mandatory and must be at least 16 characters.

Generate secrets with a local Node.js installation; use separate outputs and keep them in server-side secret storage:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"  # RECEIPT_TOKEN_ENCRYPTION_KEY
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"  # RATE_LIMIT_HASH_SECRET
```

Do not use example values, commit generated secrets, or change the receipt encryption key without a planned ciphertext re-encryption/migration. Existing encrypted receipt tokens must remain decryptable.

## Supabase setup

1. Create a Supabase project and copy its project URL, anon key, and service-role key into the matching environment variables.
2. In Supabase Auth, enable the Email provider/password sign-in. Disable **Allow new users to sign up** (public signup). Evaluator accounts are provisioned manually.
3. Apply these migrations in order in the Supabase SQL Editor: [`202607150001_foundation.sql`](supabase/migrations/202607150001_foundation.sql), [`202607150002_ofw_delivery_hardening.sql`](supabase/migrations/202607150002_ofw_delivery_hardening.sql), [`202607150003_email_delivery_leases.sql`](supabase/migrations/202607150003_email_delivery_leases.sql), and [`202607150004_email_fencing_and_event_reconciliation.sql`](supabase/migrations/202607150004_email_fencing_and_event_reconciliation.sql). A fresh database must run all four. The latter migrations are additive/reconciliation upgrades for databases that already ran earlier versions; apply the complete remaining sequence before deploying the final application. Do not run only the earlier foundation against the final application.
4. In **Authentication → Users**, manually create each evaluator or admin user. Copy the user's UUID and create or update its profile in the SQL Editor:

   ```sql
   insert into public.profiles (id, display_name, role, active)
   values ('AUTH-USER-UUID', 'Evaluator name', 'evaluator', true);

   -- For an administrator, use role = 'admin'.
   update public.profiles
   set role = 'admin', active = true
   where id = 'AUTH-USER-UUID';
   ```

   Replace the placeholder UUID and display name before running the statements. An account must have an active profile with role `evaluator` or `admin` to use protected evaluator operations.

## Gmail receipt mail

For the account in `GMAIL_USER`, turn on Google 2-Step Verification, open Google Account → **Security → App passwords**, create an app password, and put the generated password in `GMAIL_APP_PASSWORD`. Use the app password, not the Gmail account password. Gmail or Workspace policies may prevent App Passwords; verify delivery in a real test account.

## Local development

After Supabase, profiles, and environment variables are configured:

```bash
npm run dev
```

Open `http://localhost:3000`. The application submits public applications at `/apply`; receipt links use `APP_URL`. The form creates a UUID request ID and records consent version `oec-privacy-v1`. Repeating a request with the same request ID is idempotent: it returns the existing submission and does not create another row or initial outbox item.

Useful checks before deployment are:

```bash
npm run lint
npm run typecheck
npm run build
```

## Vercel deployment

Import the repository into Vercel as a Next.js project. In the Vercel project settings, add all twelve variables listed above for the deployment environment, including the generated encryption, rate-limit, and email-lease settings. Set `APP_URL` to the deployed public URL (including `https://`), use the production Supabase values, and set the desired positive integer receipt, rate-limit, and lease settings. Deploy or redeploy after saving environment changes. Apply all four migrations for a fresh production database; for a database already on an earlier migration, apply every later migration in timestamp order before deploying. Provision profiles in Supabase; Vercel does not create database state.

## Database, RLS, and receipts

- RLS is enabled on `profiles`, `submissions`, and `audit_logs`. The migration grants no table access to `anon` or `authenticated`; application server actions use the service role only after validation and evaluator authorization.
- RLS also protects `rate_limit_buckets` and `submission_requests`. Public creation and evaluator state changes are performed by tightly scoped service-role-only RPCs, which couple writes to their audit records transactionally.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS and is server-only. Never expose it to client code, browser requests, source control, or public logs.
- Public submissions are rate-limited independently by hashed client IP and normalized email. The limit is `RATE_LIMIT_MAX_ATTEMPTS` per `RATE_LIMIT_WINDOW_MINUTES` bucket; the raw identifiers are not stored in the rate-limit table. The RPC enforces the limit atomically.
- A client request ID is stored uniquely for idempotency. Retrying the same request ID returns the original submission and stable receipt token rather than creating a duplicate.
- The database stores a SHA-256 receipt-token hash for lookup and an authenticated-encrypted token ciphertext for server-side resend. Receipt links remain stable: resending an email for an active verified submission decrypts and reuses the existing token; it does not rotate it. Only active verified receipts can be resent.
- Email delivery is persistent: submissions and decisions create `email_deliveries` outbox records. Delivery attempts are claimed transactionally with a fencing token and lease, recorded as `sent` or `failed`, and failed attempts become eligible again after five minutes. The application attempts delivery during submission, decision, and evaluator resend actions; committed primary operations return a safe email warning rather than failing when SMTP or completion confirmation is unavailable. There is no separate background worker in this repository, so monitor failed outbox records and invoke an approved server-side retry process. Evaluator resend queues/attempts a resend for an active verified receipt and keeps the same token.
- A receipt expires `RECEIPT_VALIDITY_HOURS` after submission. Expiry changes the receipt's presented state; it does not remove the database row.
- Receipt state is `INVALID` while a submission is pending or rejected, `VALID` only after verification and before expiry, `REVOKED` after revocation, and `EXPIRED` after a verified receipt passes its expiry time. Only a valid receipt shows its reference, submitted date, valid-through date, and QR code; other states show no receipt details or QR code.
- There is no automatic retention-deletion job in this MVP. Set and document an organizational retention period, then perform any approved deletion/backup management as an operator-controlled process.
- Receipt URLs and QR codes are bearer credentials. Treat them as private even though the public receipt intentionally shows limited information. Use HTTPS outside local development.

## Manual end-to-end check

1. Confirm the production/local environment loads and the public home and `/apply` pages open.
2. Submit a complete application: email, surname, first name, gender, category, full Philippine address, province, region, employer/recruitment agency, OEC job position, jobsite/destination, international contact, OEC number, departure date, and privacy consent. Optionally provide middle name, suffix, and additional details. Confirm the success page appears and a UUID request ID is used.
3. Confirm an initial `email_deliveries` outbox record exists and the receipt email is attempted from `GMAIL_USER`. If SMTP fails, confirm the delivery is persisted as failed/eligible for retry rather than losing the submission.
4. Open the receipt link from the email. Before evaluator verification, confirm it shows `INVALID` with no receipt details or QR code; confirm a tampered token is also rejected.
5. Repeat the same request with the same request ID; confirm the same submission/reference is returned, no duplicate submission or initial outbox item is created, and no duplicate initial email is sent.
6. Sign in at `/evaluator` with a manually provisioned active evaluator account, review all submitted fields, and verify the application. Confirm the decision email/outbox delivery is attempted and the receipt becomes `VALID`, showing only its reference, submitted date, valid-through date, and QR code.
7. Use **Resend receipt email** for the active verified submission; confirm it queues/attempts delivery and opens the same stable receipt URL/token. Confirm resend is refused for pending, rejected, revoked, or expired submissions.
8. Reject a second pending submission with a reason and confirm its receipt is `INVALID`; revoke a verified submission with a reason and confirm its receipt is `REVOKED`. Confirm decision delivery failures remain in the outbox for retry.
9. Set a short positive `RECEIPT_VALIDITY_HOURS` in a test environment, verify a submission, and confirm the receipt becomes `EXPIRED` after the configured time with no details or QR code. Restore the intended value afterward.
10. Exceed the configured attempts from one IP and one email within the configured window; confirm later submissions are rejected, then confirm the limit resets in a new window. Confirm inactive/unprofiled users cannot use evaluator operations and no server secrets appear in browser output.

## Security and operational caveats

- Keep the service-role key and Gmail App Password in server-side environment configuration only; rotate them if exposed.
- Keep `RECEIPT_TOKEN_ENCRYPTION_KEY` stable and server-only. Losing or changing it makes stored receipt ciphertext unavailable for resend; rotation requires a deliberate re-encryption migration while the old key remains available.
- Keep `RATE_LIMIT_HASH_SECRET` server-only and rotate it only with awareness that existing rate-limit bucket hashes will no longer match.
- Disable public signup and provision/activate profiles deliberately. Review evaluator/admin access and Supabase audit information operationally.
- Receipt expiry is not deletion. The project does not automatically delete submissions, audit logs, or expired receipt records.
- Use HTTPS for deployed `APP_URL` and protect receipt links in email, logs, screenshots, and support tickets.
- SMTP delivery can fail after a submission is stored; the stable token can be resent for an active verified submission without rotating the receipt. Verify delivery and monitor mail limits and failures.
