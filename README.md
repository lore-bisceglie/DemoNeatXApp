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
- 📊 **Sincronizzazione Turni con Google Sheets**: Possibilità di definire e aggiornare i turni del personale da un semplice foglio Google Sheets.
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
- **Google Sheets API** - Importazione e sincronizzazione bidirezionale dei turni dello staff.
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
│   ├── demo/                     # Ambiente sandbox e demo interattiva
│   ├── login/                    # Autenticazione e login gestori
│   ├── onboarding/               # Wizard di registrazione e attivazione nuovo salone
│   ├── paywall/                  # Gestione abbonamenti e upgrade piano
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
│   └── seed.ts                   # Script per popolare il DB con dati demo
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
- **`Location`**: Rappresenta le sedi fisiche del salone per i business multi-store, ciascuna con indirizzo, orari e link ai fogli Google Sheets.
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
- `POST /api/locations/[id]/sync-sheets` - Sincronizzazione forzata turni da Google Sheets.

### 📢 Marketing & Automazioni
- `POST /api/marketing/dormant` - Identificazione e invio campagne di riattivazione clienti dormienti.
- `POST /api/social/generate` - Generazione automatica di post social tramite intelligenza artificiale.
- `GET /api/cron/reminders` - Cron job per l'invio automatizzato dei promemoria WhatsApp/Email.
- `GET /api/cron/trials` - Cron job per la gestione delle scadenze dei periodi di prova.

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

### 1. Sincronizzazione Turni tramite Google Sheets
Molti barbieri e parrucchieri utilizzano già fogli di calcolo condivisi per organizzare i turni dei dipendenti. Sviluppare da zero una UI complessa per turni ruotanti avrebbe aumentato la curva d'apprendimento. NeatX permette di incollare il link di un foglio Google Sheets pubblicamente accessibile, eseguendo il parsing automatico dei turni e mappandoli sul calendario.

### 2. Stripe Connect per gli Acconti Saloni
Per eliminare i problemi di gestione fiscale e l'onere delle fatturazioni per conto terzi, NeatX utilizza **Stripe Connect Express/Custom**. I pagamenti effettuati dai clienti sui saloni vanno direttamente al conto bancario del salone, lasciando a Stripe le verifiche KYC e la conformità finanziaria.

### 3. Subdomini Multi-Tenant via Next.js Proxy (`proxy.ts`)
Anziché richiedere infrastrutture complesse, l'architettura sfrutta il file `proxy.ts` (middleware Next.js) per intercettare l'header `Host`. La richiesta proveniente da `barberia.neatx.store` viene riscritta internamente alla rotta `/t/barberia` mantenendo l'URL pulito nel browser dell'utente e fornendo un'esperienza completamente personalizzata.

### 4. Protezione Anti No-Show
Il modello `NoShow` registra automaticamente o manualmente i clienti che non si presentano. Quando lo stesso numero di telefono tenta di effettuare una nuova prenotazione in qualunque salone della rete, il sistema notifica il gestore o richiede l'obbligo di acconto.

### 5. Rate Limiting Distribuito con Upstash Redis
Gli endpoint critici (prenotazione appuntamenti, invio OTP, reset password) sono protetti da un rate limiter basato sull'algoritmo *sliding window* gestito tramite **Upstash Redis**, prevenendo attacchi brute-force o spam senza sovraccaricare il database relazionale principale.

---

<p center="align">
  Sviluppato con ❤️ per trasformare l'operatività di barbieri e saloni di bellezza.
</p>
