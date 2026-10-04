# Verification

Verified 2 October 2026 in the local browser:

- Production build and TypeScript compilation pass for /, /provider and /admin.
- All four categories visible; Food, Stay and Local Products show informational states only.
- Transport request creation; provider acceptance; passenger status update.
- Passenger fulfilment, provider ride completion, feedback submission.
- Provider decline appears in unmet demand.
- Dashboard totals reconciled: 3 requests, 2 fulfilled, 1 declined/unmet during testing.
- Mobile layout checked at the browser-reported 390px viewport; no document-level horizontal overflow on passenger and provider views.
- Lato verified via computed styles on body and form controls; supplied logo loads successfully.
- DWAAR green/gold/orange styling applied consistently, with compact cards and orange actions.
- Presentation labels are shortened in the UI; stored provider records remain explicitly synthetic.

Limitations: Supabase was not connected or SQL executed against a database. Cross-device synchronization requires the supplied Supabase setup. Vercel deployment was blocked by approval review pending explicit user approval; no public deployment URL or QR asset exists yet. Local mode shares records only between tabs using the same browser and origin.

## Shared deployment — 4 October 2026

Live app: https://laabh-lpai.vercel.app/ now connects to dedicated Supabase project `uuegczteqbceqnkslzkz` (LPAI, Mumbai). The public URL and publishable key are configured as Vercel Production environment variables; a fresh production deployment is Ready. No service-role key is used.

Cross-session check: an independent Node client created request RP-4A77D964. The live browser Provider Portal received it, accepted it, and completed it. The live dashboard showed total 1, fulfilled 1, unmet 0. SQL independently confirmed acceptance. The generated test request was then removed, leaving a clean shared database. Database security advisor returned no lints. Realtime publication includes providers, requests and feedback.

Existing QR remains valid. These are shared research-demo portals without authentication; do not enter personal data. Old local browser requests are not migrated. Provider view filters by selected provider; admin includes every provider.
