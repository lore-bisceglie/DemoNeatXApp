"""
Strategia hashtag per TikTok, Instagram, YouTube.
I tag ad alto volume aumentano la reach organica.
"""
# Tag sempreverdi ad alto reach
ALWAYS = [
    "#perte", "#fyp", "#foryou", "#foryoupage", "#viral",
    "#imprenditore", "#businessitalia", "#crescita",
]

# Tag di nicchia (abbinati alla professione del giorno)
NICHE_TAGS = {
    "barbieri": ["#barbiere", "#barbieritalia", "#barbershop", "#barberlife", "#tagliomaschile"],
    "parrucchieri": ["#parrucchiere", "#parrucchieritalia", "#hairsalon", "#capelli", "#salonedibellezza"],
    "centri estetici": ["#estetista", "#centroestetico", "#beautysalon", "#trattamenti", "#benessere"],
    "fisioterapisti": ["#fisioterapia", "#fisioterapista", "#riabilitazione", "#salute", "#benessere"],
    "tatuatori": ["#tatuatore", "#tattooart", "#tattooartist", "#inked", "#tatuaggio"],
    "personal trainer": ["#personaltrainer", "#fitnessitalia", "#palestra", "#allenamento", "#coaching"],
    "coach": ["#coach", "#consulenza", "#imprenditoria", "#crescita", "#motivazione"],
}

# Tag per tipo di contenuto
CONTENT_TAGS = {
    "no_show": ["#noshow", "#clienti", "#appuntamenti"],
    "booking": ["#prenotazioni", "#agenda", "#bookingonline"],
    "timesheet": ["#timesheet", "#commercialista", "#turni"],
    "recensioni": ["#recensioni", "#google", "#5stelle"],
    "promemoria": ["#promemoria", "#whatsapp", "#ricordi"],
    "analytics": ["#statistiche", "#dati", "#analytics"],
    "multi_staff": ["#team", "#staff", "#gestione"],
}


def build_hashtags(niche: str, feature: str = "") -> str:
    """Costruisce una stringa di hashtag ottimizzata per reach."""
    tags = list(ALWAYS)

    # Aggiunge tag di nicchia
    niche_lower = niche.lower().strip()
    if niche_lower in NICHE_TAGS:
        tags.extend(NICHE_TAGS[niche_lower])
    else:
        tags.append(f"#{niche_lower.replace(' ', '')}")

    # Aggiunge tag di contenuto
    if feature and feature in CONTENT_TAGS:
        tags.extend(CONTENT_TAGS[feature])

    # Mescola leggermente per variare (ma tiene i migliori primi)
    import random
    top = tags[:3]
    rest = tags[3:]
    random.shuffle(rest)

    return " ".join(top + rest)
