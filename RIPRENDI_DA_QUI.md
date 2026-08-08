# 🚀 RIPRENDI DA QUI — NeatX Outreach

> Questo file serve a riprendere il lavoro in una **nuova chat di Claude Code** senza perdere il contesto.
> In una nuova chat, apri questo progetto e scrivi: **"leggi RIPRENDI_DA_QUI.md e riprendiamo da lì"**

---

## 📍 DOVE SIAMO (stato al 08/08/2026)

Il progetto è un SaaS di prenotazioni (NeatX) in produzione. Tutto il lavoro tecnico è **fatto e pushato su GitHub**. Resta UN solo obiettivo da chiudere: **il primo invio di email ai saloni di Milano**.

---

## ✅ GIÀ FATTO E PUSHATO (tutto su GitHub, branch main)

1. **SEO negozi** (sitemap, robots, JSON-LD, OG image) — pushato
2. **Test automatici** (7/7 passano, negozio fisso) — pushato
3. **Monitoraggio errori Telegram** (lib/monitor.ts) — pushato
4. **Notifiche Telegram uniformi e veritiere** — pushato
5. **Sistema di outreach email** — pushato (commit `c39c8b5`)

---

## 📧 IL SISTEMA DI OUTREACH (il pezzo da usare)

Tutto in `bot_scripts/Email/`:

| File | Cosa fa |
|------|---------|
| `find_salons.py` | Guida per inserire i saloni (nome, città, email, IG, nota) |
| `auto_outreach.py` | Genera email calde personalizzate e invia con calma (`--limit N` al giorno) |
| `risposte_positive.md` | Raccolta SOLO dei saloni interessati (mai i rifiuti) |
| `test_invio.py` | Verifica che l'invio funzioni (già testato, FUNZIONA) |
| `salons_list.json` | La lista dei saloni da contattare (ora vuota: `[]`) |

**Email di invio**: `neatx.info@gmail.com` configurata nel `.env` come `OUTREACH_GMAIL_USER` + `OUTREACH_GMAIL_PASS` (password app, funziona — test inviato e ricevuto).

---

## 🎯 IL PROSSIMO PASSO (da fare)

1. **Trovare i saloni di Milano** (barbieri/parrucchieri/estetiste). Il proprietario non conosce nomi. La ricerca web era in errore — da riprovare o far cercare al proprietario su Google Maps.
2. **Compilare `salons_list.json`** con 5-10 saloni reali (nome, città, email vera).
3. **Verifica** con `python bot_scripts/Email/auto_outreach.py --dry-run`
4. **Invio** con calma: `python bot_scripts/Email/auto_outreach.py --limit 5`

---

## 📌 REGOLE IMPORTANTI (da rispettare sempre)

- **Mai inviare email a indirizzi inventati** — devono essere email reali trovate (sito del salone, Google Maps, IG bio).
- **Con calma**: max 10 email/giorno da `neatx.info@gmail.com` (rischio spam/blocco).
- **Il proprietario vede SOLO i "sì"** (in `risposte_positive.md`), mai i rifiuti.
- Le email generate si vedono con `--dry-run` prima di inviare.
- `salons_list.json` NON deve contenere i 2 saloni finti di esempio (già svuotato).

---

## 🛠️ NOTE TECNICHE

- Comandi Python si lanciano dalla root del progetto (`DemoNeatXApp/`).
- Le variabili `.env`: `OUTREACH_GMAIL_USER` e `OUTREACH_GMAIL_PASS` (separate da quelle di assistenza).
- Dopo i test Playwright, rigenerare il client Prisma: `npx prisma generate --schema=prisma/schema.prisma`.
- Il proprietario è alle prime armi: spiegare ogni passo con calma, senza termini tecnici inutilmente.

---

*Creato il 08/08/2026. Aggiorna questo file quando lo stato cambia.*
