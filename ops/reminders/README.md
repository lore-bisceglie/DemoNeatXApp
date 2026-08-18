# Promemoria WhatsApp automatici

> Per attivare il sistema (primo cliente): vedi **[CHECKLIST-ATTIVAZIONE.md](./CHECKLIST-ATTIVAZIONE.md)**.

## Stato attuale

Questa configurazione e **pronta ma inattiva** finche non si attiva il server
n8n Cloud e non si configurano i segreti. Non manda messaggi da sola e non
sostituisce ancora UltraMsg. Il test manuale con OpenWA ha gia inviato
correttamente un promemoria reale al negozio prova Green Beauty.

L'attivazione avverra soltanto dopo il test completo e dopo una decisione
esplicita di pubblicazione.

## Flusso finale

```text
GitHub Actions (ogni giorno alle 18:00 Europe/Rome, la sera prima)
  -> webhook protetto n8n Cloud (server 24/7 a pagamento)
  -> POST /api/reminders/queue su NeatX
  -> un promemoria alla volta (tutti quelli eleggibili, nessun limite di 20)
  -> OpenWA / WhatsApp
  -> POST /api/reminders/delivery (inviato oppure fallito)
```

Il database e la coda di consegna bloccano i doppioni: una prenotazione puo
risultare inviata una sola volta per canale. Se il provider restituisce un
errore, il credito riservato viene restituito e l'errore resta tracciato.

## Cosa serve prima di attivarla davvero

1. Il server n8n Cloud a pagamento (host `neatx.app.n8n.cloud`), con OpenWA,
   che conserva la sessione WhatsApp in un volume persistente.
2. Applicare la migrazione `20260815000000_reminder_delivery_outbox` al
   database scelto per l'ambiente interessato.
3. In n8n, usare un webhook protetto (non il trigger manuale) e mantenere
   questi nodi: richiesta coda -> un promemoria alla volta -> invio OpenWA ->
   conferma consegna. Il percorso resta quello gia testato.
4. Impostare questi segreti GitHub (mai nel repository):
   - `N8N_REMINDER_WEBHOOK_URL` (URL di produzione `/webhook/`, non `-test`)
   - `N8N_REMINDER_WEBHOOK_TOKEN`
   - `REMINDER_AUTOMATION_ENABLED` con valore `true` **solo dopo il test**.
5. Fare un ultimo invio reale al negozio prova e controllare il registro
   consegne. Solo allora si puo sostituire il vecchio invio UltraMsg.

## Trigger unico

L'invio e controllato **solo** da GitHub Actions, ogni giorno alle
**18:00 Europe/Rome** (la sera prima dell'appuntamento). Il cron Vercel
`/api/cron/reminders` e stato rimosso per evitare invii duplicati. La Action
usa una doppia programmazione UTC (16:00 e 17:00) e prosegue solo quando a
Roma sono le 18:00, così il cambio ora legale/solare resta gestito.

## Chi riceve i promemoria

La regola gia implementata e automatica per ogni negozio, presente o futuro:

- piano `pro` o `elite`;
- oppure periodo di prova ancora attivo;
- appuntamento del giorno successivo, numero cliente valido e almeno un
  credito disponibile.

Il piano `basic` resta escluso, coerentemente con le regole commerciali
attuali. Non serve configurare ogni singolo negozio: quando un nuovo negozio
entra in prova, viene incluso automaticamente.

## Orario e sicurezza

GitHub avvia il webhook alle **18:00 Europe/Rome**, anche durante il cambio
tra ora solare e legale. La Action contiene una doppia chiamata tecnica in UTC
ma ne lascia proseguire una sola all'orario italiano corretto.

L'invio manuale dalla pagina Actions richiede di digitare `SEND_REMINDERS`:
non esistono pulsanti che possano mandare messaggi per errore. I segreti sono
salvati solo in GitHub, n8n e nel server OpenWA.

## Cosa non fare

- Non mettere l'URL OpenWA o le chiavi WhatsApp nel repository.
- Non attivare `REMINDER_AUTOMATION_ENABLED` prima del test con server 24/7.
- Non eliminare UltraMsg finche non sono verificati almeno alcuni invii reali
  automatici e il relativo registro consegne.
