# DemoNeatX pronto

Cartella generata partendo da `GreenBeauty - Copia`.

Modifiche principali applicate:
- Tenant frontend impostato a `cmqtds1840000yyqbd23x1jdj`.
- Branding pagina booking aggiornato a Demo NeatX.
- Validazione telefono disattivata in modalità demo lato frontend.
- Validazioni nome/telefono/no-show disattivate lato backend per il tenant DemoNeatX.
- La prenotazione demo viene salvata tramite `/api/book` e poi mostra un popup demo.
- Dashboard vincolata al tenant DemoNeatX, non più al primo tenant trovato nel database.
- Metadata aggiornati al dominio `demo-neatx-app.vercel.app`.
- Messaggi residuali GreenBeauty in reminder, waitlist, cancel e delete sostituiti con Demo NeatX.
- `.env` reale escluso dallo ZIP; usare `.env.example` come base e configurare le variabili su Vercel.

Nota operativa:
Il tenant `cmqtds1840000yyqbd23x1jdj` deve esistere nel database con servizi associati, altrimenti la pagina non potrà caricare i servizi reali da `/api/services`.
