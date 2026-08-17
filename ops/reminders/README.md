# Promemoria WhatsApp automatici

## Stato attuale

Questa configurazione e **pronta ma inattiva**. Non modifica `main`, non manda
messaggi da sola e non sostituisce ancora UltraMsg. Il test manuale con OpenWA
ha gia inviato correttamente un promemoria reale al negozio prova Green Beauty.

L'attivazione avverra soltanto dopo il test completo sul branch e dopo una
decisione esplicita di pubblicazione.

## Flusso finale

```text
GitHub Actions (ogni giorno alle 10:00 Europe/Rome)
  -> webhook protetto n8n sul server 24/7
  -> POST /api/reminders/queue su NeatX
  -> un promemoria alla volta
  -> OpenWA / WhatsApp
  -> POST /api/reminders/delivery (inviato oppure fallito)
```

Il database e la coda di consegna bloccano i doppioni: una prenotazione puo
risultare inviata una sola volta per canale. Se il provider restituisce un
errore, il credito riservato viene restituito e l'errore resta tracciato.

## Cosa serve prima di attivarla davvero

1. Un piccolo server europeo acceso 24/7 con Docker, n8n e OpenWA. Non usa il
   PC personale e conserva la sessione WhatsApp in un volume persistente.
2. Applicare la migrazione `20260815000000_reminder_delivery_outbox` al
   database scelto per l'ambiente interessato.
3. In n8n, sostituire il solo trigger manuale con un webhook protetto e
   mantenere questi nodi: richiesta coda -> un promemoria alla volta -> invio
   OpenWA -> conferma consegna. Il percorso resta quello gia testato.
4. Impostare questi segreti GitHub (mai nel repository):
   - `N8N_REMINDER_WEBHOOK_URL`
   - `N8N_REMINDER_WEBHOOK_TOKEN`
   - `REMINDER_AUTOMATION_ENABLED` con valore `true` **solo dopo il test**.
5. Fare un ultimo invio reale al negozio prova e controllare il registro
   consegne. Solo allora si puo sostituire il vecchio invio UltraMsg.

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

GitHub avvia il webhook alle **10:00 Europe/Rome**, anche durante il cambio
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
