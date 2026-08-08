# NeatX 💈✨

> Piattaforma SaaS di Gestione Prenotazioni, Agende Multi-Sede e Automazioni per Barbiere, Saloni di Bellezza e Centri Estetici.

![NeatX Banner](public/opengraph-image.png)

---

## 📌 Indice

- [Panoramica del Progetto](#-panoramica-del-progetto)
- [Architettura & Tech Stack](#-architettura--tech-stack)
- [Struttura del Progetto](#-struttura-del-progetto)
- [Setup & Installazione](#-setup--installazione)
- [Variabili d'Ambiente](#-variabili-dambiente)
- [Schema del Database (Prisma)](#-schema-del-database-prisma)
- [Rotte API (API Endpoints)](#-rotte-api-api-endpoints)
- [Deployment su Vercel](#-deployment-su-vercel)
- [Scelte di Architettura & Design](#-scelte-di-architettura--design)

---

## 🚀 Panoramica del Progetto

**NeatX** è una piattaforma SaaS multi-tenant ad alte prestazioni progettata specificamente per saloni di barbieri, centri estetici e professionisti del benessere. Permette ai titolari di automatizzare completamente la gestione degli appuntamenti, sincronizzare i turni dello staff, ridurre a zero i *No-Show* (clienti che non si presentano) e incassare acconti e pagamenti direttamente online.

### Caratteristiche Principali

- 🌐 **Architettura Multi-Tenant nativa con Sottodomini**: Ogni salone ottiene un portale personalizzato (`salone.neatx.store`) con branding, colori e orari dedicati.
- 📅 **Prenotazioni Online per i Clienti**: Interfaccia fluida e responsive senza l'obbligo per il cliente di registrare un account.
- 📊 **Schedule Engine nativo**: Turni settimanali, ferie, pause e permessi sono gestiti internamente e bloccano subito gli slot non prenotabili.
- 💳 **Stripe Connect Integrato**: Incasso diretto di acconti (fissi o in percentuale) e pagamenti completi sul conto del salone.
- 💬 **Promemoria ed Email Automatiche**: Notifiche WhatsApp via Green-API ed email transazionali per conferme e promemoria appuntamenti.
- 🚫 **Gestione No-Show & Liste d'Attesa**: Tracciamento dei clienti recidivi che non si presentano e lista d'attesa automatizzata.
- 🤖 **Marketing & AI Social Post Generator**: Generazione e programmazione assistita da AI per i contenuti social del salone.

---

## 🛠 Architettura & Tech Stack

### Framework & UI
- **Next.js 16 (App Router & Turbopack)** - Framework React server-first con Server Components, Server Actions e ottimizzazioni avanzate.
- **React 19 & TypeScript** - UI dichiarativa, type-safe e performante.
- **Tailwind CSS v4** - Styling moderno e responsive.
- **Lucide React & Recharts** - Set d'icone e grafici interattivi per le dashboard gestionali.

### Database & Backend
- **PostgreSQL** - Database relazionale principale (ospitato su Neon / Supabase).
- **Prisma ORM 5.22** - ORM type-safe per query e migrazioni trasparenti.
- **Upstash Redis** - Rate limiting distribuito e caching temporaneo.

### Integrations & Services
- **Stripe & Stripe Connect** - Gestione abbonamenti della piattaforma SaaS e onboarding esercenti per pagamenti acconti.
- **Prisma + PostgreSQL** - Persistenza nativa degli orari fissi, delle eccezioni e delle richieste di assenza dello staff.
- **Green-API** - Gateway per l'invio automatizzato di notifiche e promemoria WhatsApp.
- **Resend & Nodemailer** - Invio email transazionali, verifiche account e reset password.
- **Google Gemini / Vercel AI SDK** - Integrazione intelligenza artificiale per il marketing e la generazione di post.

---

## 📁 Struttura del Progetto

```
DemoNeatXApp/
├── app/                          # Next.js 16 App Router (Rotte, Pagine e API)
│   ├── (seo)/                    # Pagine ottimizzate SEO e landing page
│   ├── api/                      # Endpoint API serverless ed elaborazioni cron
│   ├── audit/                    # Strumenti di audit e diagnostica
│   ├── blog/                     # Sezione blog e content marketing
│   ├── calcolatore/              # Calcolatore ROI per i saloni
│   ├── dashboard/                # Dashboard globale e redirection tenant
│   ├── demo/                     # Redirect alla pagina di prenotazione del negozio demo
│   ├── login/                    # Autenticazione e login gestori
│   ├── onboarding/               # Wizard di registrazione e attivazione nuovo salone
│   ├── paywall/                  # Gestione abbonamenti e upgrade piano
│   ├── staff/[token]/            # Portale dipendente (agenda, ferie, permessi)
│   ├── superadmin/               # Portale di amministrazione globale piattaforma
│   └── t/[slug]/                 # Dynamic routes multi-tenant per i singoli saloni
│       ├── admin/                # Pannello di controllo riservato al salone
│       └── page.tsx              # Pagina di prenotazione pubblica del salone
├── components/                   # Componenti React riutilizzabili
│   ├── admin/                    # Componenti dashboard (gestione orari, sedi, foto)
│   ├── booking/                  # Tipi e componenti per il flusso di prenotazione
│   ├── landing/                  # Sezioni della landing page commerciale
│   └── tenant/                   # Componenti pubblici del salone (BookingForm, Header, Modali)
├── lib/                          # Utility, moduli core e client di terze parti
│   ├── activity.ts               # Tracciamento log di attività (ActivityLog)
│   ├── auth.ts                   # Gestione autenticazione HMAC, cookie e sessioni
│   ├── booking-conflict.ts       # Algoritmo di rilevamento sovrapposizioni appuntamenti
│   ├── demo-access.ts            # Accesso libero (con rate limit) per il negozio demo
│   ├── demo-seed.ts              # Logica di ripristino dati finti della demo (reset + cron)
│   ├── domains.ts                # Gestione subdomini e risoluzione URL
│   ├── email.ts                  # Client invio email con template HTML
│   ├── opening-hours.ts          # Calcolo slot di disponibilità e orari salone
│   ├── prisma.ts                 # Istanza Singleton del client Prisma ORM
│   ├── request-rate-limit.ts     # Protezione da abuso API via Upstash Redis
│   ├── schedule.ts               # Parsing e manipolazione orari lavoro staff
│   ├── sheets.ts                 # Parsing e sync turni da Google Sheets CSV
│   ├── sms.ts                    # Invio notifiche WhatsApp via Green-API
│   └── stripe.ts                 # Inizializzazione Stripe SDK
├── prisma/                       # Definizione database e seeding
│   ├── schema.prisma             # Schema PostgreSQL (modelli Tenant, Appointment, ecc.)
│   ├── seed.ts                   # Script per popolare il DB con dati demo
│   ├── seed-demo-shop.ts         # Script che riempie il negozio demo (sedi, staff, orari)
│   └── seed-demo-staff-links.ts  # Genera i link di accesso dipendente per la demo
├── public/                       # Asset statici (loghi, icone, PWA manifest)
├── proxy.ts                      # Next.js Proxy/Middleware per il rewriting dei subdomini
├── package.json                  # Dipendenze e script di build/test
└── playwright.config.ts          # Configurazione test End-to-End con Playwright
```

---

## 📥 Setup & Installazione

### Prerequisiti

Assicurati di avere installato sul tuo sistema:
- **Node.js**: `>= 20.9.0`
- **npm**: `>= 10.0.0`
- Un'istanza **PostgreSQL** attiva (locale o remota via Supabase/Neon)

### Passaggi di Installazione

1. **Clonare la Repository e accedere alla cartella**:
   ```bash
   git clone https://github.com/vostro-org/NeatX.git
   cd DemoNeatXApp
   ```

2. **Installare le dipendenze**:
   ```bash
   npm install
   ```

3. **Configurare le Variabili d'Ambiente**:
   Crea un file `.env` nella radice del progetto copiando il modello delle variabili richieste (vedi la sezione [Variabili d'Ambiente](#-variabili-dambiente)).

4. **Inizializzare Prisma e applicare le migrazioni**:
   ```bash
   # Genera il Prisma Client
   npm run postinstall

   # Push dello schema sul database PostgreSQL
   npm run db:push

   # (Opzionale) Popola il database con dati di test
   npx prisma db seed
   ```

5. **Avviare il Server di Sviluppo**:
   ```bash
   npm run dev
   ```
   L'applicazione sarà accessibile all'indirizzo [http://localhost:3000](http://localhost:3000).

---

## 🛡️ Regole di lavoro (LEGGERE SEMPRE)

> Queste regole proteggono le agende dei clienti reali. Il progetto è **in produzione**: ogni modifica deve essere testata e approvata prima di essere pubblicata.

### Sequenza obbligatoria prima di committare/pushare
1. **A lavoro concluso** si esegue il type-check (`npx tsc --noEmit`) — deve dare **0 errori**.
2. **Si apre localhost** (`npm run dev` → http://localhost:3000) e si verifica che il sito giri e che le pagine toccate funzionino.
3. Solo **con l'ok esplicito dell'utente/proprietario** si committa e si pusha. **Mai** committare senza consenso.

### Cosa NON toccare MAI (senza motivo)
- La **logica delle agende**: prenotazione (`/api/book`), disponibilità (`/api/availability`), spostamento (`/api/appointment/[id]/move`), annullamento (`/api/cancel`), pagamenti.
- Il **database di produzione** (PostgreSQL). I test automatici usano un **DB isolato** (`prisma/test.db`), mai il DB reale.
- Il **flusso di prenotazione pubblica** (`app/t/[slug]/BookingClient.tsx`, `components/tenant/BookingForm.tsx`): se non si modifica, resta com'è.

### Test automatici (Playwright)
- Configurazione: `playwright.config.ts` — usa **`prisma/schema.test.prisma`** (SQLite isolato) e la porta **3001**.
- Prima di ogni run, il DB di test viene resettato (`--force-reset`) e il client Prisma rigenerato dallo schema test.
- **Dopo ogni run**, rigenerare il client con lo schema di **produzione**: `npx prisma generate --schema=prisma/schema.prisma` — altrimenti il sito locale punta al DB sbagliato.
- I test girano su `prisma/test.db`: **non toccano** il DB di produzione né le agende reali.

### Modifiche "invisibili" (SEO, metadati) vs "funzionali" (agende)
- **SEO / metadati** (sitemap, robots, JSON-LD, title, OG image) → vivono in file separati (`lib/seo.ts`, `components/seo/`, `app/api/og/`, `app/sitemap.ts`, `app/robots.ts`). Non toccano il funzionamento delle agende.
- **Funzionali** (agende, prenotazioni, pagamenti) → richiedono ancora più attenzione e test manuali su localhost.

### Chi lavora qui
- **Proprietario**: fa i test manuali di TUTTE le feature (prenotazione, spostamento, annullamento, calendario, "trova il primo posto", dashboard...). Sono tante: non romperle.
- **Operatore di codice / IA**: segue la sequenza sopra, non committa senza ok, non tocca le agende senza motivo, aggiorna il README/AGENTS.md quando cambia qualcosa di importante.

---

## 🔑 Variabili d'Ambiente

Per il corretto funzionamento di NeatX in ambiente locale o in produzione, sono necessarie le seguenti variabili d'ambiente nel file `.env`:

```env
# Database & Cache
DATABASE_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Autenticazione & Sicurezza
SESSION_SECRET=
SUPERADMIN_PASSWORD=
CRON_SECRET=

# Domini & Ambienti
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_ROOT_DOMAIN=
NEXT_PUBLIC_MARKETING_DOMAIN=

# Stripe (Piattaforma e Connect)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Notifiche Email (Resend / SMTP)
SMTP_EMAIL=
SMTP_PASSWORD=
SUPPORT_EMAIL=
RESEND_API_KEY=

# WhatsApp (Green-API)
GREEN_API_ID_INSTANCE=
GREEN_API_TOKEN_INSTANCE=
REMINDERS_ENABLED=

# AI & Supabase Integration
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## 🗄 Schema del Database (Prisma)

Lo schema Prisma (`prisma/schema.prisma`) definisce la struttura multi-tenant di NeatX. Di seguito i modelli principali:

- **`Tenant`**: Entità radice del salone. Contiene lo `slug` del sottodominio, i dati di branding (logo, colori, contatti), il piano di abbonamento (`basic`, `pro`, `elite`), credenziali di login ed orari generali di apertura.
- **`Location`**: Rappresenta le sedi fisiche del salone per i business multi-store, ciascuna con indirizzo e orari indipendenti.
- **`StoreSettings` / `LocationSettings`**: Configurazione delle politiche di incasso acconti (`OFF`, `FIXED`, `PERCENTAGE`), onboarding Stripe Connect e crediti SMS/WhatsApp residui.
- **`Staff` & `StaffLocation`**: I dipendenti/barbieri del salone. Salva i turni settimanali in formato JSON (`baseSchedule`) e le eccezioni ai turni (`shiftExceptions`).
- **`Service` & `ServiceLocation`**: Catalogo dei servizi offerti (es. Taglio, Barba, Colore), con durata in minuti e prezzi personalizzabili per sede.
- **`Appointment`**: La prenotazione vera e propria. Collega cliente, servizio, membro dello staff, sede e data/ora. Contiene un `cancelToken` unico per la disdetta istantanea e traccia lo stato del pagamento Stripe.
- **`NoShow`**: Registro dei clienti che hanno mancato un appuntamento senza disdire, associato al numero di telefono per segnalazioni in fase di prenotazione.
- **`BlockedSlot`**: Giorni o fasce orarie bloccate dal gestore (ferie, pause straordinarie).
- **`CustomerNote`**: Note e preferenze del cliente memorizzate dal salone (es. *preferenza taglio, allergie*).
- **`Waitlist`**: Lista d'attesa per consentire ai clienti di iscriversi in caso di slot esauriti.
- **`ActivityLog`**: Audit trail completo che traccia tutte le azioni eseguite (prenotazione, modifica, cancellazione, invio promemoria).
- **`SocialPost`**: Post pubblicitari e contenuti per Instagram/Facebook generati via AI e programmati nel calendario editoriale.
- **`ProcessedStripeEvent`**: Tracciamento eventi webhook di Stripe per garantire l'idempotenza delle operazioni finanziarie.

---

## ⚡ Rotte API (API Endpoints)

Le rotte API si trovano in `app/api/` e sono suddivise logicamente nelle seguenti categorie:

### 🔒 Autenticazione & Gestione Account
- `POST /api/account-login` - Login gestore salone e rilascio cookie di sessione HMAC.
- `POST /api/tenant-login` - Autenticazione specifica per sottodominio tenant.
- `POST /api/verify-email` - Conferma indirizzo email dopo l'onboarding.
- `POST /api/reset-password` - Procedura di recupero e reimpostazione password.
- `POST /api/superadmin/login` - Accesso al pannello di amministrazione globale.

### 📅 Prenotazioni & Disponibilità
- `GET /api/availability` - Calcolo in tempo reale degli slot orari liberi in base a staff, durata servizio e turni.
- `POST /api/book` - Creazione di una nuova prenotazione (con validazione anti-sovrapposizione).
- `GET/POST /api/cancel/[token]` - Disdetta rapida dell'appuntamento tramite token univoco.
- `POST /api/reschedule/[token]` - Riprogrammazione data/ora appuntamento esistente.
- `PATCH /api/appointment/[id]/move` - Spostamento rapido appuntamento via drag-and-drop da dashboard.
- `PATCH /api/appointment/[id]/paid` - Aggiornamento manuale dello stato di pagamento.

### 💳 Pagamenti & Stripe
- `POST /api/stripe/checkout` - Creazione sessione Checkout per pagamento acconto o abbonamento SaaS.
- `POST /api/stripe/webhook` - Ricezione ed elaborazione asincrona degli eventi webhook Stripe (idempotente).
- `GET /api/stripe/connect` - Avvio procedura Onboarding Stripe Connect per il salone.
- `GET /api/stripe/callback` - Callback di completamento integrazione Stripe Connect.

### 🏢 Amministrazione Tenant & Sedi
- `GET /api/actions/get-dashboard` - Recupero dati aggregati per la dashboard (appuntamenti, incassi, statistiche).
- `GET/POST /api/services` - Gestione del catalogo servizi (aggiunta, modifica, eliminazione).
- `GET/POST /api/staff` - Gestione anagrafica del personale.
- `POST /api/staff/schedule` - Aggiornamento orari lavorativi e turni dello staff.
- `GET/POST /api/locations` - Gestione sedi aziendali.
- `GET/POST/PATCH /api/staff/requests` - Richieste di ferie e permessi dello staff, con approvazione del titolare.

### 📢 Marketing & Automazioni
- `POST /api/marketing/dormant` - Identificazione e invio campagne di riattivazione clienti dormienti.
- `POST /api/social/generate` - Generazione automatica di post social tramite intelligenza artificiale.
- `GET /api/cron/reminders` - Cron job per l'invio automatizzato dei promemoria WhatsApp/Email.
- `GET /api/cron/trials` - Cron job per la gestione delle scadenze dei periodi di prova.
- `GET /api/cron/demo-reset` - Cron job giornaliero che ripristina i dati finti del negozio demo.
- `POST /api/demo/reset` - Pulsante "Reset demo": ripristino manuale dei dati finti (rate-limited).

---

## 🌐 Deployment su Vercel

NeatX è ottimizzato per essere distribuito su **Vercel** sfruttando le sue funzionalità serverless e l'edge network.

### Passaggi per il Deployment:

1. **Importare il Repository su Vercel**:
   Collega il repository GitHub al tuo account Vercel.

2. **Configurare il Dominio Wildcard (Sottodomini Multi-Tenant)**:
   Per consentire il funzionamento dei sottodomini dinamici dei saloni (`salone.neatx.store`), configura nei DNS di Vercel:
   - Dominio principale: `neatx.store`
   - Dominio Wildcard: `*.neatx.store`

3. **Inserire le Variabili d'Ambiente**:
   Copia le variabili del file `.env` nelle **Environment Variables** del progetto su Vercel.

4. **Build Command**:
   Vercel rileverà automaticamente Next.js. Assicurati che lo script di post-installazione generi il client Prisma:
   ```json
   "scripts": {
     "postinstall": "prisma generate",
     "build": "next build"
   }
   ```

---

## 📐 Scelte di Architettura & Design

### 1. Schedule Engine nativo
Ogni collaboratore ha un turno settimanale (`baseSchedule`) e un calendario di eccezioni (`shiftExceptions`). Ferie, pause e permessi approvati sottraggono gli intervalli direttamente al motore di disponibilità; le chiusure del salone vivono in un registro dedicato. Il dipendente accede dal proprio link personale e il titolare approva le richieste senza usare fogli esterni.

### 2. Stripe Connect per gli Acconti Saloni
Per eliminare i problemi di gestione fiscale e l'onere delle fatturazioni per conto terzi, NeatX utilizza **Stripe Connect Express/Custom**. I pagamenti effettuati dai clienti sui saloni vanno direttamente al conto bancario del salone, lasciando a Stripe le verifiche KYC e la conformità finanziaria.

### 3. Subdomini Multi-Tenant via Next.js Proxy (`proxy.ts`)
Anziché richiedere infrastrutture complesse, l'architettura sfrutta il file `proxy.ts` (middleware Next.js) per intercettare l'header `Host`. La richiesta proveniente da `barberia.neatx.store` viene riscritta internamente alla rotta `/t/barberia` mantenendo l'URL pulito nel browser dell'utente e fornendo un'esperienza completamente personalizzata.

### 4. Protezione Anti No-Show
Il modello `NoShow` registra automaticamente o manualmente i clienti che non si presentano. Quando lo stesso numero di telefono tenta di effettuare una nuova prenotazione in qualunque salone della rete, il sistema notifica il gestore o richiede l'obbligo di acconto.

### 5. Rate Limiting Distribuito con Upstash Redis
Gli endpoint critici (prenotazione appuntamenti, invio OTP, reset password) sono protetti da un rate limiter basato sull'algoritmo *sliding window* gestito tramite **Upstash Redis**, prevenendo attacchi brute-force o spam senza sovraccaricare il database relazionale principale.

---

## 📝 Changelog

### 2026-08-08

#### 📣 Notifiche Telegram uniformi e veritiere (audit complete)

**Uniformità**: tutte le notifiche ora seguono lo stesso stile (emoji + titolo in `<b>` + righe etichettate), coerenti tra loro.
- Riepilogo promemoria (`cron/reminders`) → ora con emoji e formato (era testo puro).
- "Nuovo negozio registrato" (`onboarding`) → titolo ALL-CAPS + emoji ai lati, etichette emoji per riga (era mixed-case).
- "NUOVO LEAD" (`marketing/lead`) → emoji `🆕` invece di `🚨` (la sirena è ora riservata agli errori/crash).
- "LEAD MAGNET COMPLETATO" (`public-bot`) → ALL-CAPS coerente con le altre notifiche al proprietario.
- Notifiche Stripe "PAGAMENTO IN RITARDO/RIPRISTINATO" → mostrano il **nome del negozio** invece dell'ID grezzo.
- Supporto e syslog → **escape HTML** dei messaggi utente (evita formattazione rotta) + guardia `NODE_ENV=test` (niente notifiche reali dai test).

**Veridicità pubblicazione contenuti**: il preflight di pubblicazione IG (`publish_reel.py`) ora **verifica davvero** il token Meta (chiama l'API debug) invece di controllare solo che sia presente. Così, se Meta è bloccato/scaduto, la notifica dice "Instagram non pubblicato" e NON "video online" a torto. Stessa logica di fallimento esplicito già presente in `auto_post_bot.py`.

#### 🧪 Test automatici: negozio di test fisso + prenotazione pubblica (`e2e/public-booking.spec.ts`, `prisma/seed-test-shop.ts`, `playwright.config.ts`, `prisma/schema.test.prisma`)

I test E2E ora coprono anche la **prenotazione pubblica** (il cliente che prenota online — prima mancava). In più, usano **un solo negozio di test fisso** invece di registrarne uno nuovo a ogni run (che creava decine di negozi e innescava il rate limit).

- **`prisma/seed-test-shop.ts`**: seed che crea `negozio-test`, un negozio fisso completo e pubblicato (servizi, sede, staff). Eseguito dal webServer Playwright dopo il reset del DB di test.
- **`e2e/public-booking.spec.ts`**: 2 test — (1) il cliente sceglie servizio, orario, nome/telefono, accetta la privacy e prenota (arriva alla pagina di successo); (2) senza servizio il bottone è disabilitato.
- **`playwright.config.ts`**: webServer ora esegue `db push` (schema test) + `seed-test-shop` + `next dev`. `DATABASE_URL=file:./test.db` (path relativo allo schema → `prisma/test.db`).
- **`prisma/schema.test.prisma`**: aggiunti gli 8 campi di sicurezza mancanti rispetto a produzione (emailVerify*, passwordReset*, sessionVersion) — senza, la registrazione nei test falliva.
- **Tutti i test passano**: 7/7 (dashboard: crea/sposta/elimina/paga + onboarding + prenotazione pubblica).
- **Il DB di test è isolato** (`prisma/test.db`): i test non toccano il DB di produzione. **Dopo un run**, rigenerare il client prod: `npx prisma generate --schema=prisma/schema.prisma`.

#### 🚨 Monitoraggio errori server → notifica Telegram (`lib/monitor.ts`, `app/api/book/route.ts`, `app/api/availability/route.ts`, `app/api/appointment/[id]/move/route.ts`, `app/api/cancel/route.ts`)

Il sistema di alert Telegram copriva solo gli errori di **rendering frontend** (via `/api/syslog`). Ora copre anche gli **errori imprevisti delle API server** (le route delle agende), così se una prenotazione/spostamento/annullamento fallisce lato server, il proprietario lo vede subito su Telegram.

- **`lib/monitor.ts`**: helper `notifyError(route, operation, error)` — invia un messaggio Telegram strutturato (route, operazione, errore, stack) usando `sendTelegramMessage`. Non blocca mai la risposta API.
- **Agganciato ai catch finali** delle 4 route critiche: `book` (prenotazione), `availability` (disponibilità), `appointment/[id]/move` (spostamento), `cancel` (annullamento).
- **Nessuna modifica** alla logica di funzionamento: solo aggiunta di notifica negli errori già gestiti (`catch`). Gli errori previsti (validazione, negozio non trovato) non notificano.

#### 🔍 SEO negozi: visibilità su Google + dati strutturati + vendita (`app/sitemap.ts`, `app/robots.ts`, `lib/seo.ts`, `components/seo/JsonLd.tsx`, `app/api/og/tenant/[slug]/route.tsx`, pagine `app/t/[slug]/`, `app/paywall/[slug]/PaywallContent.tsx`, `components/landing/ComparisonTable.tsx`)

Obiettivo: far trovare i negozi su Google quando qualcuno cerca un professionista nella loro città. Tutto su file separati, **nessuna modifica** alle agende/prenotazioni/pagamenti.

- **Sitemap dinamica con i negozi**: ora elenca anche i negozi pubblicati (`{slug}.neatx.store`) e le loro sedi, oltre alle pagine marketing. Fix: il modello `Tenant` non ha `updatedAt`, usati `createdAt`/`publishedAt`.
- **`robots.txt`**: nasconde admin, api, success, paywall, onboarding, superadmin. Pubblica il path della sitemap.
- **`lib/seo.ts`**: helper condivisi — JSON-LD `LocalBusiness` (nome, indirizzo, telefono, orari, mappa, social), titoli ottimizzati "Categoria a Città — Nome", mappa categoria→tipo Schema.org.
- **JSON-LD integrato** nelle 3 pagine tenant: negozio, sedi, sede singola (con dati della sede). Uso sicuro via `<JsonLd>` (escape di `<`/`>`) + `suppressHydrationWarning`.
- **OG image dinamica** `/api/og/tenant/[slug]`: genera una card 1200×630 con nome, categoria e città del negozio per la condivisione su WhatsApp/social. Runtime **Node** (non Edge — Prisma non gira su Edge).
- **Meta tag**: title ottimizzato, canonical e OG image su tutte e 3 le pagine tenant.
- **Vendita**: banner "i clienti ti trovano su Google, zero commissioni" nel paywall; riga "Visibile su Google" nel confronto home; **card VIP 149€** aggiunta al paywall (ora i 3 piani Pro/Elite/VIP sono coerenti ovunque: home, paywall, FAQ).

#### 🎓 Tutorial agende: parte da solo **una sola volta per negozio** (salvato nel database) (`app/t/[slug]/admin/TutorialButton.tsx`, `app/t/[slug]/admin/page.tsx`, `app/api/tenant/tutorial-seen/route.ts`, `prisma/schema.prisma`)

Prima il tutorial della dashboard si auto-avviava basandosi su un marcatore salvato **nel browser** (`localStorage`): se il proprietario accedeva da un altro dispositivo o cancellava i dati del browser, il tutorial **ripartiva da solo**. Ora il "già visto" è salvato **nel database del negozio**, quindi vale per ogni dispositivo e non si ripete mai più in automatico.

- **Nuovo campo `tutorialSeenAt`** sul modello `Tenant` (aggiunto a `schema.prisma`, `schema.local.prisma` e `schema.test.prisma`, poi applicato al database con `prisma db push`). `null` = tutorial mai visto (parte da solo), valorizzato = già visto (mai più da solo).
- **`TutorialButton`** ora riceve `slug` e `tutorialSeen` (dallo stato del negozio): decide l'auto-avvio dal **database**, non solo dal browser.
- **Demo (`demo-neatx`)**: il tutorial **non parte mai da solo** (è aperta a tutti, ogni visitatore vedrebbe il tour). Si apre solo dal tasto "Tutorial".
- **Negozio vero**: al **primo accesso** il tutorial parte da solo (dopo 1 secondo) e subito marca `tutorialSeenAt`; **ricaricando la pagina o tornando dopo non riparte mai più** da solo. Dal tasto "Tutorial" si apre sempre.
- **Nuova route `POST /api/tenant/tutorial-seen`**: marca "tutorial visto" nel database, protetta dal cookie di login del negozio (401 se non autenticato) e rifiuta la demo (400).
- **Nessuna modifica** ad agende, prenotazioni, pagamenti o al funzionamento del tasto Tutorial.

#### 🎪 Demo: tasto "Pubblica negozio reale" spiegato + bottone "Torna alla prenotazione" (`app/t/[slug]/admin/TrialLaunchPanel.tsx`, `app/t/[slug]/admin/page.tsx`)

- **Tasto "Pubblica negozio reale"** nella demo: prima non faceva nulla (la richiesta al server falliva perché richiede il login). Ora, nella demo, al click si apre un **pop-up di spiegazione**: spiega che nei negozi veri questo tasto trasforma i dati demo in dati reali, mentre qui nella demo i dati sono finti e si ripristinano ogni giorno, quindi il pulsante non è attivo. Nei negozi veri il tasto funziona **esattamente come prima**.
- **Bottone "← Torna alla prenotazione"** in alto nella dashboard, visibile **solo nella demo** (`slug === "demo-neatx"`): riporta alla pagina di prenotazione del negozio demo. Negli altri negozi non compare.
- **Nessuna modifica** alla logica di agende, prenotazioni, pagamenti o alla route di pubblicazione.

### 2026-08-07

#### 💓 Fix: Effetto "onda" sulla foto del negozio → "batticuore" contenuto (`components/tenant/TenantHeader.tsx`)

Quando si cliccava la foto/logo in cima alla pagina di prenotazione (`/t/[slug]`, condivisa da tutti i negozi), due anelli colorati si allargavano fino a 1.8× la foto ed **uscivano dal riquadro**. L'effetto è stato sostituito con un **batticuore**: la foto fa due piccole pulsazioni contenute (si gonfia solo dell'8%), tutto dentro il cerchio.

- **Keyframe nuovo** `demoHeartbeat` al posto di `demoRipple` (rimosso): la foto pulsa 2 volte in 1.4s invece di emettere anelli.
- **Niente più anelli**: il blocco `{logoClicked && (<> … )}` con i due `<span>` è stato rimosso. La pulsazione ora si applica al bottone-foto stesso, quindi non può mai uscire dal cerchio.
- Il resto al click è invariato: il logo ruota, brilla e mostra il messaggio "online".
- **Nessuna modifica** ad agende, prenotazioni, pagamenti o funzionamento della pagina.

#### 🎪 Demo pubblica ricostruita come negozio demo completo

Il pulsante "Esplora la demo" della home ora apre la **pagina di prenotazione moderna** del negozio demo (`/t/demo-neatx`), con lo scheletro completo di un'attività reale:

- **Dati finti completi** (`prisma/seed-demo-shop.ts`): 2 sedi con orari, 5 professionisti collegati ai servizi, indirizzo, descrizione, orari 9–19 con pausa, chiuso domenica e lunedì, Instagram e Maps finti.
- **Dashboard a libero accesso**: il tasto "Dashboard demo" in fondo alla pagina apre la dashboard admin completa (come quella dei negozi veri) **senza login e senza paywall, solo per `demo-neatx`** (`app/t/[slug]/admin/page.tsx`). Tutti gli altri negozi restano protetti come prima.
- **Prenotazione simulata**: nella pagina demo le prenotazioni sono simulate e non toccano i sistemi reali.
- **Auto-ripristino giornaliero** (`/api/cron/demo-reset`, alle 5:00): ricrea appuntamenti, waitlist, no-show e note clienti demo. Logica condivisa in `lib/demo-seed.ts` usata anche dal pulsante "Reset demo".
- **`/demo`** ora fa redirect alla pagina moderna (nessun link rotto).
- **Team & link dipendenti**: nella demo il pannello "Team" è attivo a libero accesso. Ogni collaboratore ha un link personale (`/staff/{token}`) per vedere la propria agenda e chiedere ferie o permessi (esempio: Marco ha una ferie in attesa, Giulia un permesso). I link si generano/revocano dal pannello Team come nei negozi veri. Le route admin staff (`/api/staff`, `/api/staff/requests`, `/api/staff/access`) usano `requireTenantAdminOrDemo`, quindi per la demo funzionano senza login ma con rate limit.
- **Nessuna modifica** ad agende, prenotazioni, pagamenti o login dei negozi reali.

#### 🔗 Fix: Link Instagram / TikTok / Google Maps nel pannello admin (`app/t/[slug]/admin/page.tsx`, `app/api/tenant/[slug]/route.ts`)
- **Problema**: Nella scheda "Gestione" → "Impostazioni negozio", i campi Instagram e Google Maps si caricavano vuoti anche se i link erano salvati. Inoltre, salvando un nuovo link Maps, il link Instagram precedentemente salvato spariva (veniva azzerato nel database).
- **Causa**: La pagina admin non passava al pannello i valori `instagramUrl`, `tiktokUrl` e `mapsLink`, quindi i campi partivano vuoti. Al salvataggio, il pannello inviava i campi vuoti come stringa `""` e la route PATCH li normalizzava a `null`, cancellando i dati veri.
- **Fix**: (1) I tre link ora vengono passati al pannello, quindi i campi si riempiono con i dati esistenti. (2) Instagram e TikTok sono protetti: se il campo viene inviato vuoto, il sistema mantiene il valore già presente nel database invece di cancellarlo.
- **Nessuna modifica** ad agende, prenotazioni, pagamenti, sedi o database.

#### 🛠 Migliorie Pannello Super Admin (`app/superadmin/page.tsx`, `app/api/superadmin/list/route.ts`, `app/api/superadmin/publish/route.ts`)
- **Contatore "Demo"**: Aggiunto un filtro/conteggio `Demo (n)` nella lista clienti, così i negozi demo (esclusi dai conteggi Pro/Elite/Trial) si vedono separatamente e non sembra che manchino clienti.
- **Pulsante "Pubblica negozio" (🚀)**: Sulla scheda di ogni negozio ancora demo compare un nuovo pulsante che rimuove l'etichetta "Demo" e pubblica il negozio come reale (imposta `isDemoData: false` e `trialStatus: published`) senza dover entrare nel pannello del negozio. Disponibile solo da superadmin.
- **Verifica email automatica su cambio piano**: Assegnare il piano Pro o Elite da superadmin verifica automaticamente l'email del proprietario, sbloccando l'accesso al pannello senza passaggi extra.

### 2026-07-30

#### 🔧 Fix: ScrollReveal SSR-Friendly (`components/landing/ScrollReveal.tsx`)
- **Problema**: Le sezioni della landing page partivano invisibili (`opacity: 0`) durante l'idratazione React, causando un "buco nero" visibile per 2-3 secondi su dispositivi mobili.
- **Causa**: `useState(false)` rendeva tutto invisibile prima che l'`IntersectionObserver` potesse attivarsi.
- **Fix**: Il contenuto ora parte visibile di default (SSR). Dopo l'idratazione, solo gli elementi fuori dallo schermo vengono nascosti e animati allo scroll. Gli elementi già in viewport restano visibili senza flash.

#### 🔕 Fix: Notifiche Telegram Silenziose (`bot_scripts/Automation/lead_pipeline.py`)
- Aggiunto `disable_notification: True` a tutti i messaggi Telegram successivi al primo.
- Il telefono suona **una sola volta** per sessione, invece di squillare per ogni bolla di messaggio inviata.

#### 💬 Miglioramento: Template DM Instagram (`bot_scripts/Social/ReelGenerator/auto_dm.py`)
- Sostituiti i 4 template di risposta automatica ai commenti Instagram.
- Rimossi riferimenti freddi/aziendali ("demo gratuita") a favore di un tono caldo e diretto.
- Focus spostato sull'azione: registrarsi e crearsi l'agenda, non guardare una demo.

#### ⚡ Ottimizzazione: Performance Mobile Landing Page
- **LiveNotification**: Timer JS disattivati su mobile (il componente era già nascosto via CSS `hidden md:flex` ma i timer giravano comunque a vuoto). Fix anche del memory leak dei timer ricorsivi.
- **FloatingPhone**: L'intervallo da 2.5s ora si attiva solo quando il componente è visibile sullo schermo (via `IntersectionObserver`). Quando l'utente scrolla altrove, il timer si ferma.
- **BeforeAfterSlider**: Rimosso `@import` Google Font bloccante dentro `<style>` inline, sostituito con `<link rel="stylesheet">` non bloccante con `preconnect`.
- **FeaturesSection**: Rimosso `"use client"` inutile — il componente è puramente statico (zero stato/hook), ora è un Server Component che riduce il bundle JS.
- **page.tsx + FloatingPhone**: Blur di sfondo ridotti su mobile (`blur-[80px]` vs `blur-[150px]` e `blur-[30px]` vs `blur-[60px]`) per alleggerire la GPU. Stessi valori su desktop.
- **TrustMarquee**: Ridotto da 6 a 4 copie del ticker (144 → 96 nodi DOM), stessa scorrevolezza visiva.

---

<p center="align">
  Sviluppato con ❤️ per trasformare l'operatività di barbieri, saloni e professionisti che lavorano su appuntamento.
</p>

