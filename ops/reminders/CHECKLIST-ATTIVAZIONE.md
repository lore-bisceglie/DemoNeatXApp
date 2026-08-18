# CHECKLIST ATTIVAZIONE promemoria WhatsApp — per il primo cliente

> Scopo: attivare l'invio automatico dei promemoria quando arriverà il primo
> cliente. Segui i punti IN ORDINE. Ogni punto è verificabile.
> Tempo stimato: 20-30 minuti la prima volta.

---

## FASE 0 — Prerequisiti (tutto già fatto, solo verifica)

- [ ] Il lavoro sul limite e sul trigger è pushato sul ramo giusto (vedi `../..` nota git). *(da fare, vedi fine checklist)*
- [ ] Il server n8n Cloud è raggiungibile: `https://neatx.app.n8n.cloud` risponde.
- [ ] L'app NeatX è su Vercel (URL produzione: es. `demo-neatx-app.vercel.app`).

---

## FASE 1 — Database di produzione: applicare la migrazione

**Cosa**: creare la tabella `ReminderDelivery` (l'outbox idempotente) nel DB che
usi per prod (Supabase). Senza questa, il primo promemoria va in errore.

**Come** (una delle due strade):

- **Strada A — da Prisma (consigliata)**: con `DATABASE_URL` che punta al DB di
  produzione eseguire:
  ```bash
  npx prisma migrate deploy
  ```
  (deve applicare `20260815000000_reminder_delivery_outbox`).

- **Strada B — SQL diretto** (es. in Supabase SQL Editor): il contenuto della
  migrazione è in
  `prisma/migrations/20260815000000_reminder_delivery_outbox/migration.sql`
  → incollarlo ed eseguire.

**Verifica**:
```sql
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='ReminderDelivery'
);  -- deve restituire true
```
Oppure: in Vercel console, un log senza errore dataset al primo giro.

---

## FASE 2 — Segreti su GitHub (Settings → Secrets and variables → Actions)

Aggiungere **3 secret** (mai nel repository):

| Secret | Valore |
|---|---|
| `N8N_REMINDER_WEBHOOK_URL` | `https://neatx.app.n8n.cloud/webhook/neatx-reminders` ⚠️ **URL di produzione** (senza `-test`) |
| `N8N_REMINDER_WEBHOOK_TOKEN` | il token del webhook (dalla dashboard n8n Cloud) |
| `REMINDER_AUTOMATION_ENABLED` | `true` **solo dopo il test manuale** della FASE 5 (mettere `false` o non mettere per restare inattivo) |

> Nota: il workflow, se manca `REMINDER_AUTOMATION_ENABLED=true`, esce "senza
> inviare" (sicuro). Il token si trova su n8n Cloud → nodo Webhook → sezione
> "Authentication" / "HTTP Header".

---

## FASE 3 — n8n Cloud: mettere il workflow ATTIVO

1. Vai su `neatx.app.n8n.cloud` → apri il workflow **"NeatX — Promemoria automatici OpenWA"**.
2. Controlla che il trigger sia il **Webhook** (non il trigger manuale) con path `neatx-reminders`.
3. Verifica le env del workflow n8n (nella sezione *Workflow Settings / Credentials* o *Environment Variables* di n8n Cloud):
   - `NEATX_PREVIEW_URL` → l'URL dell'app **di produzione** (es. `https://demo-neatx-app.vercel.app`)
   - `NEATX_CRON_SECRET` → lo stesso valore di `CRON_SECRET` usato su Vercel
   - `OPENWA_BASE_URL`, `OPENWA_API_KEY`, `OPENWA_SESSION_ID` → i dati OpenWA
4. Metti il workflow su **"Active"** (oggi il file ha `"active": false`).
5. **Verifica**: nella dashboard n8n il workflow non deve mostrare "Inactive".

> ⚠️ Se il workflow usa ancora `NEATX_PREVIEW_URL` per un ambiente di test,
> sostituirlo con l'URL di produzione prima dell'attivazione.

---

## FASE 4 — Vercel: env di produzione

Assicurati che nell'ambiente di **Production** su Vercel (Project → Settings →
Environment Variables) esista:

| Env | Valore |
|---|---|
| `REMINDERS_ENABLED` | `true` |

> Senza questo flag, `/api/reminders/queue` risponde `mode: "disabled"` e nessun
> messaggio parte. Impostarlo **solo quando** le Fasi 2-3 sono pronte.

---

## FASE 5 — TEST REALE prima dell'attivazione (obbligatorio)

Fai un **proxy test** con un appuntamento vero del primo cliente su un negozio di
prova (es. Green Beauty), con `REMINDER_AUTOMATION_ENABLED=false` ancora:

1. In GitHub → Actions → workflow **NeatX Reminder Dispatcher** → **Run workflow**.
2. Immetti il campo **confirm** = `SEND_REMINDERS` (scrivere esattamente questo).
3. Oppure testa l'endpoint direttamente (solo lettura):
   ```bash
   curl -X POST https://neatx.app.n8n.cloud/webhook-test/neatx-reminders \
     -H "Content-Type: application/json" \
     -H "X-NeatX-Reminder-Token: <token>" \
     -d '{"date":"<ANNO>-<MESE>-<GIORNO>"}'
   ```
4. Verifica che:
   - il cliente riceva il messaggio su WhatsApp;
   - su DB, `ReminderDelivery` abbia `status='SENT'` per quell'appuntamento;
   - il campo `smsCredits` (StoreSettings) sia diminuito di 1.

**Solo quando il test è OK**: metti `REMINDER_AUTOMATION_ENABLED=true` su GitHub
e `REMINDERS_ENABLED=true` su Vercel.

---

## FASE 6 — Attivazione finale e monitoraggio

- [ ] `REMINDER_AUTOMATION_ENABLED=true` su GitHub.
- [ ] L'app ha `REMINDERS_ENABLED=true` (Vercel prod).
- [ ] Workflow n8n Active.
- [ ] Primo giro automatico: **ore 18:00 Roma** vedi `ReminderDelivery` popolarsi.

**Controlli periodici**:
- Telefono: ricevono i clienti? (primo campanello)
- DB: `SENT` / `FAILED` nel `ReminderDelivery`.
- Log Actions GitHub: il run non deve mostrare errori `Configurazione incompleta`.

---

## Checklist GIT (portare questo lavoro in produzione)

- [ ] Commit su `codex/reminder-main-release` delle modifiche (limite + trigger).
- [ ] Merge su `main` (o push del ramo e PR a `main`).
- [ ] Push → **Vercel** fa deploy automatico → il deploy NON include più il cron
      reminder (solo GitHub lo attiva). Verificare in Vercel che gli altri 3 cron restino.

> Cosa NON fare mai: mettere URL OpenWA / chiavi WhatsApp / token in file del repo.