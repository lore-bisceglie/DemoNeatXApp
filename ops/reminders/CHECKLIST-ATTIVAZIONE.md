# CHECKLIST OPERATIVA — promemoria e lista d’attesa

Questa checklist descrive il flusso attuale di produzione. Non serve attivare n8n Cloud.

## 1. Prerequisiti

- [ ] Il progetto è aggiornato su `main`.
- [ ] L’app di produzione risponde su Vercel.
- [ ] OpenWA è raggiungibile e la sessione configurata è `ready`.
- [ ] La tabella `ReminderDelivery` esiste nel database di produzione.

## 2. Segreti GitHub Actions

In **Settings → Secrets and variables → Actions** devono essere presenti:

| Segreto | Uso |
|---|---|
| `REMINDER_AUTOMATION_ENABLED` | `true` per il cron automatico dei promemoria |
| `OPENWA_BASE_URL` | URL del server OpenWA |
| `OPENWA_API_KEY` | chiave API OpenWA |
| `OPENWA_SESSION_ID` | ID della sessione WhatsApp attiva |
| `N8N_REMINDER_WEBHOOK_TOKEN` | nome storico del token GitHub → Vercel |

Il nome `N8N_REMINDER_WEBHOOK_TOKEN` è mantenuto per compatibilità. Non implica che n8n sia in uso.

## 3. Variabili Vercel

In **Project → Settings → Environment Variables** verificare in Production:

| Variabile | Valore |
|---|---|
| `REMINDERS_ENABLED` | `true` |
| `OPENWA_BASE_URL` | stesso server OpenWA dei segreti GitHub |
| `OPENWA_API_KEY` | stessa chiave OpenWA |
| `OPENWA_SESSION_ID` | stesso ID di sessione attiva |
| `N8N_REMINDER_WEBHOOK_TOKEN` oppure `CRON_SECRET` | token per le chiamate protette |

Dopo una modifica alle variabili Vercel serve un nuovo deployment.

## 4. Promemoria automatici

- [ ] Workflow **NeatX Reminder Dispatcher** attivo.
- [ ] Schedule: alle 18:00 Europe/Rome (con guardia sul fuso).
- [ ] Il run mostra `sent` oppure `0` se non ci sono appuntamenti eleggibili.
- [ ] Nessun errore OpenWA o `Not found`.
- [ ] Un appuntamento già `SENT` non viene reinviato.

Per un test manuale usare **Run workflow → mode `send`**, indicare la data e scrivere esattamente `SEND_REMINDERS` nel campo di conferma.

## 5. Lista d’attesa

- [ ] Workflow **NeatX Waitlist Dispatcher** attivo.
- [ ] Schedule: ogni 15 minuti.
- [ ] Il run mostra `promossi`, `elaborati`, `inviati` e `falliti`.
- [ ] Con uno slot libero, il primo contatto viene promosso in ordine FIFO.
- [ ] La notifica passa a `sent` nel database e il messaggio arriva su WhatsApp.
- [ ] Se non c’è posto, il contatto resta in lista senza errore.

Per un test manuale usare **Run workflow → mode `dispatch`** e scrivere `DISPATCH_WAITLIST` nel campo di conferma.

## 6. Ricollegamento WhatsApp

Il QR non è permanente. Se la sessione è disconnessa:

1. Aprire la pagina SuperAdmin OpenWA.
2. Premere **Aggiorna stato**.
3. Scansionare il QR nuovo con lo stesso WhatsApp Business.
4. Attendere lo stato `ready`/`connesso`.
5. Ripetere un run in modalità `check`.

Non creare una nuova sessione e non ruotare la chiave se quella attuale è valida.

## 7. Diagnosi rapida

- `Not found`: token, URL o ID sessione non corrispondono.
- `Session not ready`: ricollegare la stessa sessione OpenWA.
- `0 promossi`: nessuno slot libero per le date presenti in lista.
- `failed`: leggere `lastError` nella notifica e riprovare dopo aver risolto la causa.