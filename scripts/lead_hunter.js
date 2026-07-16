/**
 * LEAD HUNTER - Operazione Olimpo
 * Estrae barbieri e parrucchieri in Italia usando OpenStreetMap (Overpass API).
 * Nessuna API key richiesta. Estrae nome, città, telefono e (se disponibile) website.
 */

const fs = require('fs');

async function huntLeads(city = "Milano", limit = 50) {
  console.log(`🔍 Radar Attivo: Ricerca saloni a ${city}...`);
  
  const overpassQuery = `
    [out:json][timeout:25];
    area["name"="${city}"]->.searchArea;
    (
      node["shop"="hairdresser"](area.searchArea);
      way["shop"="hairdresser"](area.searchArea);
    );
    out body ${limit};
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: overpassQuery,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const leads = [];

    data.elements.forEach(el => {
      if (el.tags && el.tags.name) {
        leads.push({
          nome: el.tags.name,
          citta: city,
          indirizzo: el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}` : '',
          telefono: el.tags.phone || el.tags['contact:phone'] || 'N/A',
          sito_web: el.tags.website || el.tags['contact:website'] || 'N/A',
          fonte: 'OpenStreetMap'
        });
      }
    });

    console.log(`🎯 Trovati ${leads.length} saloni a ${city}.`);
    
    // Salva in CSV
    if (leads.length > 0) {
      const csvHeader = "Nome,Città,Indirizzo,Telefono,Sito Web,Fonte\n";
      const csvRows = leads.map(l => `"${l.nome}","${l.citta}","${l.indirizzo}","${l.telefono}","${l.sito_web}","${l.fonte}"`).join('\n');
      
      const fileName = `leads_${city.toLowerCase()}.csv`;
      fs.writeFileSync(fileName, csvHeader + csvRows);
      console.log(`✅ File CSV generato: ${fileName}`);
    }

  } catch (error) {
    console.error("❌ Errore durante l'estrazione:", error.message);
  }
}

// Esegui la caccia per le top città
async function startHunting() {
  const cities = ["Milano", "Roma", "Napoli"];
  for (const city of cities) {
    await huntLeads(city, 20); // 20 per demo
    // Attendi 3 secondi per non sovraccaricare l'API pubblica
    await new Promise(r => setTimeout(r, 3000));
  }
}

startHunting();
