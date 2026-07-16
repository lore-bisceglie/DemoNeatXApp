/**
 * L'AVANGUARDIA - Operazione Olimpo
 * Script per inviare Cold Emails mirate ai contatti estratti, usando Resend.
 * Le email usano il PR outreach template (Zero Commissioni).
 */

const { Resend } = require('resend');
const fs = require('fs');

// Assicurati di avere RESEND_API_KEY in .env o passala da terminale
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_123');

async function sendOutreachCampaign(csvFilePath) {
  if (!fs.existsSync(csvFilePath)) {
    console.error(`❌ File CSV non trovato: ${csvFilePath}`);
    return;
  }

  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim() !== '' && !line.startsWith('Nome,'));

  console.log(`✉️ Avvio Campagna su ${lines.length} lead...`);

  for (const line of lines) {
    const [nome, citta, indirizzo, telefono, sito_web, fonte] = line.replace(/"/g, '').split(',');

    // Simula estrazione email dal sito_web o usa un placeholder per demo
    const emailTarget = (sito_web && sito_web !== 'N/A') ? `info@${sito_web.replace('https://', '').replace('http://', '').split('/')[0]}` : null;

    if (!emailTarget) {
      console.log(`⚠️ Salto ${nome} - Email non trovabile.`);
      continue;
    }

    const htmlContent = `
      <h2>Ciao Team di ${nome}! 👋</h2>
      <p>Vi scrivo perché ho visto il vostro lavoro su ${citta} e vi faccio i complimenti.</p>
      <p>So quanto Treatwell e Fresha pesino con le loro commissioni (fino al 25% su ogni cliente che in realtà è già vostro!).</p>
      <p>Abbiamo appena lanciato <strong>NeatX</strong>, l'agenda online zero commissioni che potete provare gratuitamente.</p>
      <p>E se vi iscrivete da questo invito, avete 1 mese aggiuntivo in omaggio:</p>
      <p><a href="https://neatx.store/gestionale-parrucchieri-${citta.toLowerCase()}">👉 Scopri NeatX a ${citta}</a></p>
      <p>A presto,<br/>Il Team di NeatX</p>
    `;

    try {
      // De-commentare in produzione
      /*
      const data = await resend.emails.send({
        from: 'NeatX Team <hello@neatx.store>',
        to: emailTarget,
        subject: `${nome}, basta commissioni al 25%! Scopri NeatX`,
        html: htmlContent,
      });
      console.log(`✅ Email inviata a ${emailTarget} (ID: ${data.id})`);
      */
      
      console.log(`✅ [TEST MODE] Email pronta per: ${emailTarget} - Oggetto: ${nome}, basta commissioni al 25%!`);
      
    } catch (error) {
      console.error(`❌ Errore invio a ${emailTarget}:`, error.message);
    }

    // Rate limiting per non finire in spam (attendi 2 sec tra ogni email)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log("🏁 Campagna Completata.");
}

// Per test: esegui su un file demo
// sendOutreachCampaign('./leads_milano.csv');
console.log("Script Avanguardia caricato. Usa node cold_email_campaign.js per testarlo.");
