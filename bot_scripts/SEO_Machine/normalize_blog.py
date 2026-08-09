# -*- coding: utf-8 -*-
"""
Normalizza il frontmatter e aggiunge FAQ finali ai 22 articoli del blog NeatX.
Uso: python normalize_blog.py [--apply]

Modalita:
  - default (dry-run): mostra cosa cambierebbe, non scrive nulla.
  - --apply: applica le modifiche ai file.
"""
import os
import re
import sys
from datetime import datetime

BLOG_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "content", "blog")
BLOG_DIR = os.path.normpath(BLOG_DIR)

ITALIAN_MONTHS = {
    "gennaio": 1, "febbraio": 2, "marzo": 3, "aprile": 4, "maggio": 5, "giugno": 6,
    "luglio": 7, "agosto": 8, "settembre": 9, "ottobre": 10, "novembre": 11, "dicembre": 12,
}

# Mappa: file -> (description pertinente, 2 FAQ [q, a])
# Le FAQ rispecchiano fedelmente il contenuto reale di ogni articolo.
PER_FILE = {
    "abbandonare-treatwell-fresha-zero-commissioni.md": (
        "Perché sempre più saloni, barbieri e parrucchieri lasciano Treatwell e Fresha: commissioni nascoste, dati clienti di proprietà della piattaforma e poco controllo. NeatX, l'alternativa a zero commissioni.",
        [
            ("Perché i saloni stanno abbandonando Treatwell e Fresha?",
             "Per le commissioni sulle prenotazioni, la perdita di controllo sui dati dei clienti e regole stringenti. Con NeatX non paghi commissioni: un abbonamento fisso e gli incassi vanno dritti sul tuo conto."),
            ("Come faccio a passare da Treatwell a un gestionale senza commissioni?",
             "Con NeatX crei subito la tua agenda online brandizzata, importi le tue disponibilità e invii il tuo link di prenotazione ai clienti. Niente contratti, prova gratis 14 giorni, zero commissioni sulle prenotazioni."),
        ],
    ),
    "barbieri-conferme-appuntamento-con-neatx.md": (
        "Barbieri: riduci i no-show con le conferme appuntamento di NeatX. Un'interazione pulita e privata, un'app white-label con il tuo brand e zero commissioni.",
        [
            ("Come posso ridurre i no-show nel mio negozio di barbiere?",
             "Con NeatX puoi chiedere una conferma o un acconto al momento della prenotazione. Chi ha già confermato o pagato si presenta, e tu riempi l'agenda senza perdite di tempo."),
            ("Cos'è un'app white-label e come mi aiuta?",
             "È un'app di prenotazione con il tuo nome e il tuo logo, senza il marchio di una piattaforma esterna. I tuoi clienti prenotano direttamente con te, con NeatX che lavora in sottofondo."),
        ],
    ),
    "barbieri-prenotazione-24-ore-su-24-con-neatx.md": (
        "Barbieri: fai prenotare i clienti 24 ore su 24, anche mentre dormi, con l'agenda online di NeatX. Gestione orari, fogli presenze e recupero clienti automatico.",
        [
            ("I miei clienti possono prenotare di notte?",
             "Sì. Con NeatX la tua pagina di prenotazione è online 24/7: i clienti scelgono servizio, giorno e orario da soli, anche alle 23 di sera, senza doverti chiamare."),
            ("Come gestisco orari e ferie nel mio salone?",
             "Blocchi orari, ferie e disponibilità direttamente nell'agenda di NeatX. I clienti vedono solo gli slot realmente disponibili, evitando doppi incastri."),
        ],
    ),
    "barbieri-recensioni-automatiche-con-neatx.md": (
        "Barbieri: raccogli recensioni automatiche e gestisci gli acconti con NeatX. Niente bot vocale, un'app white-label e analytics per decidere con dati reali.",
        [
            ("Come funzionano le recensioni automatiche di NeatX?",
             "Dopo l'appuntamento, NeatX chiede automaticamente una recensione ai tuoi clienti, senza che tu debba ricordartene. Puoi usare le recensioni per crescere senza bot che parlano al posto tuo."),
            ("Come chiedo un acconto senza perdere clienti?",
             "NeatX ti permette di chiedere un acconto online con Stripe al momento della prenotazione, in modo chiaro e trasparente. La maggior parte dei clienti lo accetta volentieri e si presenta."),
        ],
    ),
    "barbieri-timesheet-commercialista-con-neatx.md": (
        "Barbieri: timesheet e fogli presenze esportabili in CSV per il commercialista. Gestione orari, pacchetti messaggi e invito clienti con NeatX.",
        [
            ("Come preparo i fogli presenze per il commercialista?",
             "NeatX registra le ore di ogni collaboratore e ti permette di esportare i fogli presenze in CSV con un click. Il tuo commercialista riceve tutto pronto, senza ricostruzioni a mano."),
            ("Posso gestire gli orari dei miei collaboratori?",
             "Sì, ogni collaboratore ha la sua agenda e le sue disponibilità. Tu vedi le ore lavorate e blocchi turni, ferie e permessi da un'unica dashboard."),
        ],
    ),
    "barbieri-zero-no-show-con-neatx.md": (
        "Barbieri: riduci gli appuntamenti mancati con NeatX. Blocca orari, invia promemoria e recupera i clienti inattivi da oltre 30 giorni con sconti automatici.",
        [
            ("Come posso ridurre i no-show nel mio salone?",
             "NeatX ti aiuta con la gestione degli orari, i promemoria via messaggio e la possibilità di chiedere un acconto. Chi ha pagato o è stato ricordato si presenta."),
            ("Cosa fa il recupero clienti automatico?",
             "Se un cliente non torna da più di 30 giorni, NeatX invia automaticamente un messaggio con uno sconto integrato per riportarlo in salone, senza che tu debba pensarci."),
        ],
    ),
    "centri-estetici-gestione-staff-con-neatx.md": (
        "Centri estetici: gestisci il tuo staff con NeatX. Ogni estetista ha la sua agenda, fogli presenze esportabili e pacchetti messaggi per comunicare con i clienti.",
        [
            ("Come gestisco più estetiste nel mio centro?",
             "Ogni collaboratore ha la sua agenda separata e i clienti scelgono con chi prenotare. Tu gestisci turni, ferie e permessi da un'unica dashboard."),
            ("Come monitoro le ore del mio team?",
             "I fogli presenze di NeatX registrano le ore lavorate di ogni estetista e sono esportabili in CSV per il commercialista, con trasparenza totale."),
        ],
    ),
    "centri-estetici-zero-no-show-con-neatx.md": (
        "Centri estetici: elimina i no-show con NeatX. Acconti online, interazione umana senza bot vocale e analytics per decidere con i dati del tuo centro.",
        [
            ("Come posso chiedere un acconto senza perdere clienti?",
             "NeatX rende l'acconto una scelta trasparente: il cliente paga una caparra con Stripe al momento della prenotazione. Chi ha pagato si presenta, e il centro non perde incassi."),
            ("Perché NeatX non usa un bot vocale?",
             "Perché l'interazione umana è più efficace: i tuoi clienti prenotano online da soli e, quando serve, parlano con una persona reale. Niente risposte automatiche che allontanano."),
        ],
    ),
    "coach-e-consulenti-conferme-appuntamento-con-neatx.md": (
        "Coach e consulenti: conferme appuntamento e acconti con NeatX. Un'app white-label con il tuo brand e zero commissioni, senza intermediari che ti portano via clienti.",
        [
            ("Come faccio a chiedere l'acconto senza che i clienti scappino?",
             "NeatX lo rende naturale: chiedi un acconto o il pagamento completo al momento della prenotazione, in modo chiaro. Chi ha già pagato si presenta e il tuo tempo è protetto."),
            ("Ma Treatwell o simili non mi portano clienti nuovi?",
             "I clienti che arrivano dalle piattaforme sono di proprietà della piattaforma, non tuoi. Con NeatX costruisci un tuo canale di prenotazione con il tuo brand, e nessuno ti fa concorrenza."),
        ],
    ),
    "coach-e-consulenti-promemoria-whatsapp-con-neatx.md": (
        "Coach e consulenti: promemoria appuntamento con NeatX. Gestione orari, fogli presenze, pacchetti messaggi e recupero clienti per ridurre le dimenticanze.",
        [
            ("Come ricordo ai miei clienti l'appuntamento?",
             "NeatX ti permette di inviare promemoria via messaggio prima dell'appuntamento, così i clienti non dimenticano. Riduci le dimenticanze e i buchi in agenda."),
            ("Come gestisco le mie disponibilità?",
             "Blocchi orari, ferie e slot personalizzati nell'agenda di NeatX. I tuoi clienti vedono solo i momenti in cui sei davvero disponibile."),
        ],
    ),
    "coach-e-consulenti-timesheet-commercialista-con-neatx.md": (
        "Coach e consulenti: timesheet per il commercialista con NeatX. Fogli presenze esportabili in CSV, gestione orari e crescita sostenibile senza intermediari.",
        [
            ("Come traccio le ore dei miei collaboratori?",
             "Con i fogli presenze di NeatX: ogni ora lavorata viene registrata e puoi esportare il tutto in CSV per il tuo commercialista, senza ricostruzioni manuali."),
            ("NeatX è adatto a un libero professionista singolo?",
             "Sì, il piano Pro parte da 29€ al mese e include agenda, pagamenti online e link brandizzato. Perfetto anche per chi lavora da solo."),
        ],
    ),
    "fisioterapisti-gestione-staff-con-neatx.md": (
        "Fisioterapisti: gestione staff e identità con NeatX. Ogni professionista ha la sua agenda, acconti online e analytics per smontare le obiezioni sulle piattaforme generaliste.",
        [
            ("Come gestisco lo staff del mio studio?",
             "Ogni fisioterapista ha la sua agenda separata con turni, ferie e permessi. I pazienti scelgono con chi prenotare e tu monitori le ore lavorate."),
            ("Perché non dovrei affidarmi a una piattaforma generalista?",
             "Le piattaforme generaliste ti fanno pagare commissioni e ti controllano la clientela. NeatX ti dà il tuo brand, zero commissioni e la piena proprietà dei dati dei pazienti."),
        ],
    ),
    "fisioterapisti-recensioni-automatiche-con-neatx.md": (
        "Fisioterapisti: recensioni automatiche e gestione acconti con NeatX. Niente bot vocale, un'app white-label per il tuo studio e analytics per decidere con dati reali.",
        [
            ("Come raccolgo le recensioni dei miei pazienti?",
             "NeatX chiede automaticamente una recensione dopo l'appuntamento, così la reputazione del tuo studio cresce senza che tu debba ricordartene."),
            ("Come riduco gli appuntamenti mancati in studio?",
             "Chiedi un acconto con Stripe al momento della prenotazione: chi ha già pagato si presenta. NeatX gestisce tutto in modo trasparente, senza allontanare i pazienti."),
        ],
    ),
    "parrucchieri-recensioni-automatiche-con-neatx.md": (
        "Parrucchieri: recensioni automatiche e acconti su Stripe con NeatX. Niente bot, un'app white-label e statistiche per scegliere senza dipendere dalle piattaforme.",
        [
            ("Come funzionano le recensioni automatiche per il mio salone?",
             "Dopo il servizio, NeatX invia una richiesta di recensione ai tuoi clienti in automatico. Le recensioni crescono senza sforzo e la tua reputazione si costruisce da sola."),
            ("Come gestisco gli acconti senza spaventare i clienti?",
             "Con Stripe, il pagamento dell'acconto è integrato nella prenotazione: chiaro e sicuro. La maggior parte dei clienti lo accetta e l'appuntamento è blindato."),
        ],
    ),
    "parrucchieri-timesheet-commercialista-con-neatx.md": (
        "Parrucchieri: timesheet e fogli presenze per il commercialista con NeatX. Gestione orari, pacchetti messaggi, invito clienti e recupero automatico dei clienti inattivi.",
        [
            ("Come preparo i fogli presenze del mio salone?",
             "NeatX registra le ore di ogni collaboratore e le esporta in CSV con un click: il tuo commercialista riceve tutto pronto, senza ricostruzioni a mano."),
            ("Come recupero i clienti che non vengono più?",
             "Il recupero clienti automatico invia messaggi con sconti integrati a chi non torna da più di 30 giorni, riportando le persone in salone."),
        ],
    ),
    "parrucchieri-zero-no-show-con-neatx.md": (
        "Parrucchieri: zero no-show con NeatX. Acconti online, interazione senza bot vocale e la soluzione definitiva ai clienti che non si presentano.",
        [
            ("Come faccio a far pagare l'acconto senza perdere clienti?",
             "NeatX integra l'acconto nella prenotazione in modo trasparente: una caparra con Stripe che protegge il tuo tempo. I clienti lo capiscono e si presentano."),
            ("Perché NeatX non usa un bot vocale?",
             "Perché la fiducia si costruisce con le persone. I tuoi clienti prenotano online da soli e, quando serve, parlano con qualcuno reale del salone."),
        ],
    ),
    "personal-trainer-conferme-appuntamento-con-neatx.md": (
        "Personal trainer: riduci i no-show e il costo degli appuntamenti mancati con NeatX. Interazioni genuine, un brand forte e analytics per crescere senza intermediari.",
        [
            ("Come riduco i no-show come personal trainer?",
             "NeatX ti permette di chiedere una conferma o un acconto al momento della prenotazione. Chi ha già confermato si presenta e il tuo tempo è protetto."),
            ("Come costruisco un brand forte?",
             "Con l'app white-label di NeatX, i tuoi clienti prenotano su una pagina con il tuo nome e il tuo logo, senza il marchio di una piattaforma esterna."),
        ],
    ),
    "personal-trainer-recensioni-automatiche-con-neatx.md": (
        "Personal trainer: recensioni automatiche e gestione orari con NeatX. Fogli presenze trasparenti, pacchetti messaggi e recupero clienti per far crescere il tuo business.",
        [
            ("Come raccolgo recensioni come personal trainer?",
             "NeatX invia automaticamente una richiesta di recensione dopo ogni appuntamento. La tua reputazione cresce senza che tu debba chiederla ogni volta."),
            ("Come gestisco la mia agenda di allenamenti?",
             "Con la gestione orari di NeatX: blocchi le tue disponibilità e i clienti prenotano negli slot liberi, evitando sovrapposizioni e doppi incastri."),
        ],
    ),
    "tatuatori-prenotazione-24-ore-su-24-con-neatx.md": (
        "Tatuatori: fai prenotare i clienti 24 ore su 24 con NeatX. Acconti veri, interazione diretta e analisi per scegliere con i fatti, non con le promesse delle piattaforme.",
        [
            ("Come gestisco gli acconti per le mie sessioni di tatuaggio?",
             "NeatX ti permette di richiedere un acconto online con Stripe al momento della prenotazione. Il cliente si impegna davvero e tu riduci i buchi in agenda."),
            ("Come faccio a prenotare 24 ore su 24?",
             "La tua pagina NeatX è online sempre: i clienti scelgono servizio, giorno e orario da soli, anche di notte, mentre tu lavori o dormi."),
        ],
    ),
    "tatuatori-recensioni-automatiche-con-neatx.md": (
        "Tatuatori: recensioni automatiche e acconti su Stripe con NeatX. Niente bot vocale e un'interazione diretta per costruire una clientela che torna.",
        [
            ("Come raccolgo recensioni per il mio studio di tatuaggi?",
             "NeatX invia una richiesta di recensione automatica dopo l'appuntamento. Le recensioni crescono senza sforzo e il tuo studio diventa più visibile."),
            ("Come chiedo l'acconto per la mia sessione?",
             "Con Stripe: l'acconto è integrato nella prenotazione, chiaro e sicuro. I clienti che hanno pagato si presentano, e tu lavori senza perdite di tempo."),
        ],
    ),
    "tatuatori-statistiche-e-dati-con-neatx.md": (
        "Tatuatori: prendi decisioni con i dati di NeatX. Statistiche su appuntamenti e incassi, gestione acconti e la tua indipendenza dalle piattaforme generaliste.",
        [
            ("Quali statistiche posso vedere con NeatX?",
             "Vedi quanti appuntamenti hai, quanto hai incassato e quali servizi richiedono i clienti. Dati reali per decidere cosa promuovere e come organizzare lo studio."),
            ("Come smonto le obiezioni sulle piattaforme?",
             "Le piattaforme generaliste ti fanno pagare commissioni e controllano la clientela. NeatX ti dà zero commissioni e la piena proprietà dei dati dei tuoi clienti."),
        ],
    ),
    "tatuatori-timesheet-commercialista-con-neatx.md": (
        "Tatuatori: timesheet e analytics per il tuo studio con NeatX. Addio ai clienti facili promessi dalle piattaforme, benvenuto il controllo del tuo brand.",
        [
            ("Come gestisco le ore dei miei collaboratori?",
             "Con i fogli presenze di NeatX: ogni ora lavorata è registrata ed esportabile in CSV per il commercialista. Trasparenza totale con il tuo team."),
            ("NeatX mi aiuta a costruire il mio brand?",
             "Sì, con un'app white-label con il tuo nome e il tuo logo. I clienti prenotano direttamente con te, non con una piattaforma che ti fa concorrenza."),
        ],
    ),
}

# Articoli "standard" (pattern {settore}-{topic}-con-neatx.md) il cui frontmatter
# e' gia' coerente ma la description ripete il titolo: la sostituiamo con la
# description pertinente della mappa. Gli altri file (es. quello di transizione)
# ricevono anche slug/author se mancanti.


def normalize_date(raw: str) -> str:
    """Converte date italiane ('17 Luglio 2026') o ISO in ISO YYYY-MM-DD."""
    raw = raw.strip().strip('"').strip("'")
    m = re.match(r"^(\d{1,2})\s+([A-Za-zàèéìòù]+)\s+(\d{4})$", raw)
    if m:
        day, month_word, year = m.groups()
        month = ITALIAN_MONTHS.get(month_word.lower())
        if month:
            return f"{int(year):04d}-{month:02d}-{int(day):02d}"
    # gia' ISO o altro
    try:
        return datetime.strptime(raw, "%Y-%m-%d").strftime("%Y-%m-%d")
    except Exception:
        return raw


def slugify_filename(filename: str) -> str:
    return filename.replace(".md", "")


def main() -> None:
    apply = "--apply" in sys.argv
    if not os.path.isdir(BLOG_DIR):
        print("Directory blog non trovata:", BLOG_DIR)
        sys.exit(1)

    files = sorted(f for f in os.listdir(BLOG_DIR) if f.endswith(".md"))
    print(f"Trovati {len(files)} articoli. Modalita': {'APPLICA' if apply else 'DRY-RUN'}\n")

    for fname in files:
        path = os.path.join(BLOG_DIR, fname)
        with open(path, encoding="utf-8") as fh:
            raw = fh.read()

        # Estrai frontmatter
        m = re.match(r"^---\n(.*?)\n---\n", raw, re.S)
        original = raw
        changes = []

        if m:
            fm = m.group(1)
            rest = raw[m.end():]
            fields = {}
            for line in fm.splitlines():
                if ":" in line:
                    k, _, v = line.partition(":")
                    fields[k.strip()] = v.strip().strip('"').strip("'")
        else:
            fm, rest = "", raw
            fields = {}

        # 1) date ISO
        if "date" in fields:
            new_date = normalize_date(fields["date"])
            if new_date != fields["date"]:
                changes.append(f"date: '{fields['date']}' -> '{new_date}'")
                fields["date"] = new_date
        else:
            changes.append("date: mancante")

        # 2) description pertinente
        if fname in PER_FILE:
            new_desc = PER_FILE[fname][0]
            if fields.get("description", "") != new_desc:
                changes.append(f"description aggiornata (da '{fields.get('description', '')[:40]}...')")
                fields["description"] = new_desc

        # 3) author
        if fields.get("author", "").lower() not in ("neatx", "team neatx"):
            changes.append("author: aggiunto 'Team NeatX'")
            fields["author"] = "Team NeatX"

        # 4) slug
        if not fields.get("slug"):
            changes.append(f"slug: aggiunto '{slugify_filename(fname)}'")
            fields["slug"] = slugify_filename(fname)

        # 5) FAQ finali
        faq_block = ""
        if fname in PER_FILE:
            faqs = PER_FILE[fname][1]
            faq_lines = ["", "---", "", "## Domande frequenti"]
            for q, a in faqs:
                faq_lines.append("")
                faq_lines.append(f"### {q}")
                faq_lines.append("")
                faq_lines.append(a)
            faq_block = "\n".join(faq_lines) + "\n"

        has_faq = "## Domande frequenti" in rest
        if faq_block and not has_faq:
            changes.append("FAQ finali: aggiunte (2 domande)")
            rest = rest.rstrip() + "\n" + faq_block

        # Ricostruisci frontmatter
        new_fm_lines = [f"{k}: \"{v}\"" for k, v in fields.items()]
        new_raw = f"---\n{chr(10).join(new_fm_lines)}\n---\n{rest}"

        if new_raw == original:
            continue

        print(f"### {fname}")
        for c in changes:
            print(f"   - {c}")
        if apply:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(new_raw)
        print()

    print("DONE. Nessuna modifica" if not apply else "DONE. Modifiche applicate.")


if __name__ == "__main__":
    main()
