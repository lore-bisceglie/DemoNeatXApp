<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Objective
- Fix plan naming throughout (legacy "premium" → "pro"/"elite") + implement Stripe Customer Portal for self-service subscription management + review Telegram notifications

## Important Details
- Only 2 paid plans: **Pro** (29€/mese) and **Elite** (59€/mese) + 14-day trial; no legacy "premium" plan exists
- Legacy "premium" references caused bugs: `isPremium` didn't recognize "pro" or "elite", multi-location blocked for all, trial cron spammed paying users, chatbot described non‑existent "Starter" plan
- All 15 plan‑name bugs fixed across 10 files; `isPremium` now checks `plan === "elite"` (not "premium")
- `stripeCustomerId` + `stripeSubscriptionId` columns added to production DB (direct connection, not pooler)
- All Telegram notifications rewritten: consistent emoji + HTML format + clear layout (shop name, plan, action)
- Stripe webhook now stores both customer + subscription IDs on Tenant; portal endpoint created and compiled

## Work State
### Completed
- **Plan audit**: 15 bugs fixed across 10 files
- **`isPremium` fix**: `admin/page.tsx:167` checks `plan === "elite"`; paywall gate (`:87`) checks `"pro"`/`"elite"`
- **Database schema**: `stripeCustomerId String?` + `stripeSubscriptionId String?` added to `prisma/schema.prisma` + `schema.local.prisma`; pushed to production via direct Supabase connection (port 5432, no pooler)
- **Stripe webhook** (`app/api/stripe/webhook/route.ts`): stores stripeCustomerId + stripeSubscriptionId on checkout; rewritten all 8 Telegram notifications with structured emoji + shop name + plan details
- **Stripe Portal** (`app/api/stripe/portal/route.ts`): created — POST /api/stripe/portal with `{slug}` → returns Stripe Billing Portal URL; auth-guarded by admin cookie; returns 400 if no stripeCustomerId
- **Portal button** (`app/t/[slug]/admin/PortalButton.tsx`): new client component "Gestione Abbonamento" with CreditCard icon, conditionally rendered when `tenant.stripeCustomerId` present in `admin/page.tsx` header toolbar
- **Onboarding notification** (`app/api/onboarding/route.ts`): rewritten from Markdown to HTML format, matching all other notifications
- **Superadmin notification** (`app/api/superadmin/route.ts`): rewritten "NUOVO NEGOZIO CREATO" message
- **Previous session items preserved**: logo+themeColor onboarding, WhatsApp first‑person messages, superadmin plan UI, iubenda fix, closedDays `[]`, security audit, trial 14 days

## Relevant Files
- `prisma/schema.prisma`: Tenant model with `stripeCustomerId String?` + `stripeSubscriptionId String?` (pushed)
- `app/api/stripe/webhook/route.ts`: handles checkout.session.completed, invoice.payment_failed, invoice.paid, customer.subscription.deleted, customer.subscription.updated — stores stripe IDs + human-readable Telegram notifications
- `app/api/stripe/portal/route.ts`: returns Stripe Billing Portal URL for logged-in tenant admins
- `app/t/[slug]/admin/PortalButton.tsx`: "Gestione Abbonamento" client component
- `app/t/[slug]/admin/page.tsx`: portal button at line 668 (after Analytics link, conditional on `tenant.stripeCustomerId`)
- `app/api/onboarding/route.ts`: new lead notification (HTML format)
- `lib/telegram.ts`: `sendTelegramMessage()` sends HTML to `TELEGRAM_CHAT_ID`
- `.env`: production `DATABASE_URL` (Supabase PostgreSQL via pooler); local direct connect works on port 5432 for migrations
