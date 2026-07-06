# Setup pubblicazione Reel NeatX

Il bot locale ora usa `STRICT_PUBLISH=true`: se Instagram, TikTok o YouTube non sono pronti, l'esecuzione fallisce e non fa finta che sia tutto ok.

## File locale

Nel file `.env` dentro questa cartella servono questi nomi:

```env
OPENAI_API_KEY=...
META_ACCESS_TOKEN=...
IG_ACCOUNT_ID=...
TIKTOK_COOKIES_JSON=...
TIKTOK_SESSION_ID=...
```

YouTube puo usare `token.json` locale, oppure `YOUTUBE_TOKEN_JSON` se il bot gira su GitHub Actions.

## Dove vedere cosa e successo

Ogni run locale crea un file in:

```text
logs/reel_bot_YYYYMMDD-HHMMSS.log
```

Lo script crea anche:

```text
publish_report.json
```

Nel report trovi `instagram`, `tiktok` e `youtube`, ognuno con `ok: true/false` e il motivo.

## Controllo manuale senza pubblicare

Puoi lanciare:

```text
controlla_pubblicazione.bat
```

Questo controlla credenziali e video locale, ma non carica nulla.

## Comportamento atteso

- Se mancano Instagram o TikTok, il bot si ferma prima di caricare YouTube.
- Se YouTube e pronto ma TikTok no, non pubblica solo YouTube.
- Windows Task Scheduler mostrera errore, cosi il problema e visibile subito.
