# Promemoria WhatsApp automatici

## Stato attuale

Il flusso di produzione è attivo e non dipende da n8n Cloud. GitHub Actions avvia i controlli e gli invii; Vercel gestisce la coda idempotente; OpenWA consegna i messaggi su WhatsApp.

Il test reale su Green Beauty ha verificato anche la lista d’attesa: uno slot liberato ha promosso il primo contatto e ha inviato un messaggio WhatsApp con esito `sent` e zero errori.

## Flusso dei promemoria

```text
GitHub Actions (ogni giorno alle 18:00 Europe/Rome)
  -> POST /api/reminders/queue su Vercel
  -> claim idempotente nel database
  -> invio OpenWA / WhatsApp
  -> POST /api/reminders/delivery
```

La coda impedisce i doppioni e conserva lo stato `SENT`, `FAILED` o `PROCESSING`. In caso di errore il credito riservato viene restituito e l’errore resta tracciato.

## Flusso della lista d’attesa

```text
GitHub Actions (ogni 15 minuti)
  -> POST /api/waitlist/dispatch su Vercel
  -> ricerca di uno slot libero
  -> promozione FIFO del primo contatto
  -> invio OpenWA / WhatsApp
  -> stato della notifica: sent, pending oppure failed
```

La lista usa la stessa sessione OpenWA dei promemoria. Se non c’è uno slot libero, il contatto resta in lista; quando lo slot compare, viene preso in ordine di iscrizione.

## Configurazione da mantenere

### Segreti GitHub Actions

- `REMINDER_AUTOMATION_ENABLED=true` per gli invii automatici dei promemoria.
- `OPENWA_BASE_URL`, `OPENWA_API_KEY`, `OPENWA_SESSION_ID` per il dispatcher dei promemoria.
- `N8N_REMINDER_WEBHOOK_TOKEN`: il nome è storico, ma oggi è solo il token condiviso per autorizzare le chiamate GitHub → Vercel; non richiede n8n Cloud.

### Variabili Vercel

- `REMINDERS_ENABLED=true` abilita coda promemoria e dispatcher waitlist.
- `OPENWA_BASE_URL`, `OPENWA_API_KEY`, `OPENWA_SESSION_ID` devono puntare alla sessione OpenWA attiva.
- `N8N_REMINDER_WEBHOOK_TOKEN` (o `CRON_SECRET`) autorizza le chiamate server-to-server.

Non creare una nuova sessione quando quella attiva è pronta: se WhatsApp si disconnette, si ricollega la stessa sessione dalla pagina SuperAdmin usando il QR rigenerato.

## Orari e sicurezza

Il cron dei promemoria prova più volte in UTC e lascia passare una sola esecuzione alle 18:00 italiane, così il cambio ora legale/solare resta gestito. Il cron Vercel dei promemoria non è attivo: il trigger unico è GitHub Actions.

L’invio manuale richiede `SEND_REMINDERS`; la lista d’attesa richiede `DISPATCH_WAITLIST`. I segreti non vanno mai inseriti nel repository o nei messaggi di log.

## Cosa controllare quando qualcosa non arriva

1. Aprire il run GitHub dell’orario interessato.
2. Verificare che la sessione OpenWA risulti `ready` nella pagina SuperAdmin.
3. Controllare il riepilogo: `sent`, `failed`, `processing` e `notProcessed`.
4. Per la waitlist verificare anche `promoted`, `claimed`, `sent` e `failed`.
5. Se la sessione è disconnessa, ricollegare lo stesso ID e ripetere il controllo; non cambiare chiave o sessione senza motivo.