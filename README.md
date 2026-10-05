# LAABH — powered by LPAI

Your gateway to local services…

Small mobile-first internship research prototype. All providers are fictional demo records, not actual businesses or official LPAI verification. No real booking or payment is made.

## Run locally

Node.js 20.9+ required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Passenger: `/`; provider: `/provider`; dashboard: `/admin`.

Without environment variables the app uses localStorage, starts with three demo providers and no invented request statistics, and synchronizes between tabs in the **same browser and origin**. Separate phones/browsers do not share local demo records. Do not enter personal information.

## 60-second demonstration

1. Open Passenger, Provider portal and LPAI dashboard in three tabs of one browser.
2. Passenger: Transport → Bahraich → Taxi → Find Transport → Local Taxi 01 → Send Request.
3. Provider: choose Local Taxi 01 → Accept.
4. Passenger updates automatically. Admin shows the request as Accepted.
5. Provider: Ride completed (or passenger: Mark as fulfilled).
6. Passenger: Yes/No → optional feedback → Submit Feedback. Admin fulfilment and feedback update.

Food, Stay and Local Products show informational messages only. Bus searches honestly show no matching provider. Searches without a provider do not create requests and are not included in demand metrics. Taxi capacity is 4, auto 3; collective capacity needs confirmation. Accepted counts include completed requests. Unmet/pending includes requested, accepted and declined, not only confirmed failures.

## Connect Supabase

Use a **dedicated disposable demo project**, not an operational database.

1. Run `supabase/setup.sql` once in its SQL Editor. It creates the four tables, provider/category seeds, validation, grants, RLS and Realtime publication entries.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the project's URL and publishable key. Never put service-role keys in the app.
4. Restart the app. Its banner changes to Connected demo.

RLS intentionally permits anonymous shared demo access because the brief excludes authentication. All visitors can see demo requests, update status and provider availability. Column grants restrict editable fields and a trigger enforces Requested → Accepted/Declined → Fulfilled. This is not production authorization. Use only synthetic data, keep the demonstration limited, and remove the demo database when finished. No service-role key is needed.

Realtime subscriptions refresh views; a 4-second polling fallback also reconciles data. SQL deployment and cross-device Supabase behavior require a configured project and must be tested after connection. Local records are not automatically migrated.

## Vercel

Import this GitHub repository into Vercel, choose Next.js, and deploy from the repository root. Add the two public Supabase variables before deploying if cross-device sharing is needed. No custom build settings are required (`npm run build`). An unconfigured deployment remains clearly marked local demo mode.

After a public passenger URL is known, generate a QR pointing to that exact HTTPS root URL. Do not put localhost in a presentation QR. Test the QR from a phone and confirm shared status updates with Supabase before presenting.

## Checks

`npm run build` and `npm run typecheck`. See `TESTING.md` for actual test results and limitations.

## Visual identity

LAABH uses the supplied unchanged logo, Lato throughout, deep green navigation, gold/orange service accents and orange primary actions. Repeated demo labels are removed from presentation screens at the user's request. Underlying provider records remain synthetic; this is not a live booking service.

## Live shared database

As of 4 October 2026, Production is connected to the dedicated LPAI Supabase database. Passenger: https://laabh-lpai.vercel.app/ ; provider: /provider ; admin: /admin. The existing QR is unchanged. Separate phones now share submitted requests. Refresh any already-open tab once and check for Connected session. Select the passenger's chosen provider in the provider dropdown. Previous local-storage records stay local and are not automatically migrated.

## Presentation fares and checkout
Each listing has a fixed per-request fare from INR 100 to INR 250. LPAI fee is an additional 2%: INR 200 + INR 4 = INR 204. The server snapshots fare and fee when a request is created. After fulfilment, the passenger can confirm a simulated payment. No money moves. One payment per request prevents duplicate revenue. Dashboard totals include only confirmed payments: total collected = base fares + fees, net local revenue = base fares, LPAI revenue = fees. Existing rides remain unpaid until confirmed.
For an existing database apply supabase/add-fares-payments.sql once; setup.sql includes it for a new installation.
