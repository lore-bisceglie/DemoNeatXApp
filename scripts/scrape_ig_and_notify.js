const puppeteer = require('puppeteer');
require('dotenv').config();

async function scrapeIGHandlesAndNotify(city) {
  console.log(`Avvio ricerca lead Instagram per: ${city}...`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Array di query per estrarre più risultati senza impazzire con la paginazione
    const searchTerms = [
      `"parrucchiere" "${city}"`,
      `"barbiere" "${city}"`,
      `"hairstylist" "${city}"`
    ];

    const handles = new Set();
    
    for (const term of searchTerms) {
      console.log(`Scansiono: ${term}`);
      const query = `site:instagram.com ${term}`;
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        const html = await page.content();
        
        // Regex stretta: solo lettere, numeri, punti e underscore. No query params.
        const regex = /instagram\.com\/([a-zA-Z0-9._]{3,30})[\/"'?\\]/g;
        let match;
        while ((match = regex.exec(html)) !== null) {
          let username = match[1];
          // Rimuovi punteggiatura finale se catturata per errore
          username = username.replace(/[._]+$/, '');
          
          const blacklist = ['p', 'reel', 'explore', 'stories', 'tags', 'directory', 'login', 'about', 'developer', 'legal', 'terms'];
          if (username && !blacklist.includes(username) && username.length > 2) {
            handles.add(`@${username}`);
          }
        }
        // Piccola pausa per non farsi bloccare da DuckDuckGo
        await new Promise(r => setTimeout(r, 2000));
      } catch(e) {
        console.log(`Errore o timeout per ${term}`);
      }
    }

    const leadArray = Array.from(handles);
    console.log(`Trovati ${leadArray.length} profili unici verificati formalmente.`);

    if (leadArray.length === 0) {
      console.log("Nessun profilo trovato.");
      await browser.close();
      return;
    }

    // Formatta il messaggio per Telegram
    const messageTitle = `🎯 Nuovi Lead IG: ${city}`;
    const messageBody = `Ho scansionato il web e trovato ${leadArray.length} potenziali saloni a ${city}:\n\n` + 
                        leadArray.join('\n') + 
                        `\n\nPuoi incollarli su Instagram e mandare il messaggio di audit gratuito!`;

    console.log("Invio notifica Telegram in corso...");
    
    // Invia direttamente tramite fetch per evitare problemi di \n su Windows
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (token && chatId) {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🚀 *${messageTitle}*\n\n${messageBody}`,
          parse_mode: 'Markdown'
        })
      });
      if (response.ok) {
        console.log("Completato con successo!");
      } else {
        console.error("Errore Telegram:", await response.text());
      }
    } else {
      console.error("Token Telegram mancanti nel .env");
    }

  } catch (error) {
    console.error("Errore durante lo scraping:", error);
  } finally {
    await browser.close();
  }
}

// Prendi la città dagli argomenti (es: node script.js Milano)
const targetCity = process.argv[2] || "Milano";
scrapeIGHandlesAndNotify(targetCity);
