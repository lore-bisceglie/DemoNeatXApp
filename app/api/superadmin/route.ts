import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';
import { sendTelegramMessage } from '@/lib/telegram';
import { requireSuperAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { 
      name, slug, template, adminPassword, ownerEmail,
      phone, address, instagramUrl, mapsLink, description, openTime, closeTime,
      logoUrl, themeColor
    } = body;

    if (!name || !slug || !template) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    // Genera una password casuale se l'admin non la fornisce
    const finalPassword = adminPassword || Math.random().toString(36).slice(-8);

    // Controlla se lo slug esiste già
    const existing = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json({ error: 'Questo link (slug) è già in uso' }, { status: 400 });
    }

    let defaultServices = [];
    if (template === 'barbiere') {
      defaultServices = [
        { name: 'Taglio Capelli', duration: 30, price: 20 },
        { name: 'Taglio e Barba', duration: 45, price: 30 },
        { name: 'Sfumatura Skin Fade', duration: 30, price: 22 },
        { name: 'Regolazione Barba Veloce', duration: 15, price: 10 },
        { name: 'Modellatura Barba con Panno Caldo', duration: 30, price: 20 },
        { name: 'Taglio Bambino', duration: 30, price: 15 },
        { name: 'Rasatura Completa', duration: 30, price: 20 },
        { name: 'Trattamento Viso Black Mask', duration: 30, price: 15 },
        { name: 'Trattamento Capelli Anticaduta', duration: 20, price: 15 },
      ];
    } else if (template === 'parrucchiere') {
      defaultServices = [
        { name: 'Taglio Donna', duration: 45, price: 35 },
        { name: 'Colore e Piega', duration: 90, price: 80 },
        { name: 'Piega Corta', duration: 30, price: 20 },
        { name: 'Piega Lunga', duration: 45, price: 25 },
        { name: 'Balayage / Degradè', duration: 120, price: 120 },
        { name: 'Meches', duration: 90, price: 90 },
        { name: 'Schiariture', duration: 90, price: 85 },
        { name: 'Trattamento Ristrutturante Cheratina', duration: 60, price: 50 },
        { name: 'Permanente', duration: 90, price: 70 },
        { name: 'Acconciatura Sposa (Prova)', duration: 60, price: 60 },
        { name: 'Taglio Uomo', duration: 30, price: 25 },
      ];
    } else if (template === 'estetista') {
      defaultServices = [
        { name: 'Pulizia Viso Profonda', duration: 60, price: 50 },
        { name: 'Massaggio Relax Total Body', duration: 60, price: 60 },
        { name: 'Ceretta Inguine Totale', duration: 30, price: 25 },
        { name: 'Ceretta Gamba Intera', duration: 45, price: 35 },
        { name: 'Ceretta Mezza Gamba', duration: 30, price: 20 },
        { name: 'Semipermanente Mani', duration: 45, price: 30 },
        { name: 'Ricostruzione Unghie Gel', duration: 90, price: 65 },
        { name: 'Refill Gel', duration: 60, price: 45 },
        { name: 'Pedicure Curativo', duration: 60, price: 40 },
        { name: 'Pedicure Estetico', duration: 45, price: 30 },
        { name: 'Laminazione Ciglia', duration: 60, price: 50 },
        { name: 'Trattamento Corpo Drenante', duration: 60, price: 60 },
      ];
    } else if (template === 'medico') {
      defaultServices = [
        { name: 'Prima Visita Specialistica', duration: 45, price: 120 },
        { name: 'Visita di Controllo', duration: 20, price: 80 },
        { name: 'Visione Esami / Referti', duration: 15, price: 40 },
        { name: 'Elettrocardiogramma (ECG)', duration: 30, price: 50 },
        { name: 'Ecografia', duration: 30, price: 90 },
        { name: 'Check-up Completo', duration: 60, price: 150 },
        { name: 'Certificato Medico Sportivo', duration: 30, price: 50 },
      ];
    } else if (template === 'nutrizionista') {
      defaultServices = [
        { name: 'Prima Visita e Consegna Dieta', duration: 60, price: 100 },
        { name: 'Controllo Mensile e Misure', duration: 30, price: 50 },
        { name: 'Valutazione Bioimpedenziometrica', duration: 30, price: 40 },
        { name: 'Dieta per Sportivi', duration: 60, price: 120 },
        { name: 'Colloquio Conoscitivo Gratuito', duration: 15, price: 0 },
      ];
    } else if (template === 'personaltrainer') {
      defaultServices = [
        { name: 'Lezione Individuale (1h)', duration: 60, price: 50 },
        { name: 'Lezione in Coppia (1h)', duration: 60, price: 70 },
        { name: 'Valutazione Fisica Iniziale', duration: 30, price: 30 },
        { name: 'Creazione Scheda Allenamento', duration: 45, price: 40 },
        { name: 'Pacchetto 10 Lezioni', duration: 60, price: 450 },
        { name: 'Seduta di Stretching', duration: 30, price: 25 },
      ];
    } else if (template === 'tatuatore') {
      defaultServices = [
        { name: 'Consulenza e Preventivo', duration: 30, price: 0 },
        { name: 'Tatuaggio Piccolo (Minimal)', duration: 60, price: 80 },
        { name: 'Tatuaggio Medio (Mezza Seduta)', duration: 120, price: 150 },
        { name: 'Tatuaggio Grande (Seduta Intera)', duration: 240, price: 300 },
        { name: 'Ritocco Tatuaggio', duration: 60, price: 50 },
        { name: 'Piercing Lobo', duration: 20, price: 30 },
        { name: 'Piercing Cartilagine / Naso', duration: 30, price: 45 },
      ];
    } else if (template === 'consulente') {
      defaultServices = [
        { name: 'Consulenza Breve / Call', duration: 30, price: 60 },
        { name: 'Consulenza Strategica Completa', duration: 60, price: 120 },
        { name: 'Revisione Progetto', duration: 90, price: 150 },
        { name: 'Affiancamento Tecnico', duration: 60, price: 100 },
        { name: 'Meeting Mensile', duration: 60, price: 100 },
      ];
    } else if (template === 'toelettatura') {
      defaultServices = [
        { name: 'Bagno e Taglio (Taglia Piccola)', duration: 60, price: 45 },
        { name: 'Bagno e Taglio (Taglia Media)', duration: 75, price: 55 },
        { name: 'Bagno e Taglio (Taglia Grande)', duration: 90, price: 75 },
        { name: 'Solo Bagno (Taglia Piccola)', duration: 30, price: 25 },
        { name: 'Solo Bagno (Taglia Grande)', duration: 45, price: 35 },
        { name: 'Taglio Unghie e Pulizia Orecchie', duration: 15, price: 15 },
        { name: 'Trattamento Snodatura', duration: 30, price: 20 },
        { name: 'Stripping', duration: 90, price: 80 },
      ];
    } else if (template === 'psicologo') {
      defaultServices = [
        { name: 'Primo Colloquio Conoscitivo', duration: 60, price: 70 },
        { name: 'Seduta di Supporto Psicologico', duration: 60, price: 70 },
        { name: 'Psicoterapia Individuale', duration: 60, price: 80 },
        { name: 'Terapia di Coppia', duration: 90, price: 120 },
        { name: 'Consulenza Online (Video)', duration: 60, price: 70 },
      ];
    } else {
      defaultServices = [
        { name: 'Appuntamento Standard', duration: 30, price: 0 },
        { name: 'Consulenza Lunga', duration: 60, price: 0 },
      ];
    }

    const trialLimit = new Date();
    trialLimit.setDate(trialLimit.getDate() + 14);

    // Crea il Tenant con i servizi annessi e la password
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        adminPassword: finalPassword,
        trialEndsAt: trialLimit,
        phone: phone || null,
        address: address || null,
        instagramUrl: instagramUrl || null,
        mapsLink: mapsLink || null,
        description: description || null,
        openTime: openTime || null,
        closeTime: closeTime || null,
        logoUrl: logoUrl || null,
        themeColor: themeColor || 'cyan',
        ownerEmail: ownerEmail || null,
        trialStatus: "trial_active",
        isDemoData: false,
        services: {
          create: defaultServices
        }
      }
    });

    // Fetch the newly created services
    const createdServices = await prisma.service.findMany({
      where: { tenantId: newTenant.id }
    });

    // Create default staff
    const createdStaff = await prisma.staff.create({
      data: {
        name: ownerEmail ? ownerEmail.split('@')[0] : "Titolare",
        tenantId: newTenant.id,
        services: {
          connect: createdServices.map((s) => ({ id: s.id }))
        }
      }
    });

    // Crea Sede Principale di default + StoreSettings + ServiceLocation
    const mainLocation = await prisma.location.create({
      data: {
        name: "Sede Principale",
        slug: `${slug}-sede-principale`,
        phone: phone || null,
        address: address || null,
        city: address || null,
        openTime: openTime || null,
        closeTime: closeTime || null,
        isMain: true,
        isActive: true,
        tenantId: newTenant.id,
        settings: {
          create: {
            smsCredits: 50,
          },
        },
      },
    });

    for (const service of createdServices) {
      await prisma.serviceLocation.create({
        data: {
          serviceId: service.id,
          locationId: mainLocation.id,
          price: service.price,
          isActive: true,
        },
      });
    }

    await prisma.staff.update({
      where: { id: createdStaff.id },
      data: { locationId: mainLocation.id },
    });

    if (ownerEmail) {
      const tenantUrl = `https://${slug}.neatx.store`;
      await sendWelcomeEmail(ownerEmail, name, finalPassword, tenantUrl).catch(e =>
        console.error("[Email] Errore invio benvenuto da superadmin:", e)
      );
    }

    // Notifica Telegram al SuperAdmin
    await sendTelegramMessage(
      `🆕 <b>NEGOZIO CREATO (SUPERADMIN)</b>\n\n` +
      `🏪 <b>${name}</b>\n` +
      `📂 Categoria: ${template}\n` +
      `🔗 https://${slug}.neatx.store`
    );

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (error) {
    console.error('Errore SuperAdmin:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID tenant mancante' }, { status: 400 });
    }

    const allowedFields = [
      'name', 'ownerEmail', 'phone', 'address', 'instagramUrl', 'mapsLink',
      'description', 'openTime', 'closeTime', 'logoUrl', 'themeColor', 'adminPassword',
    ];

    const updateData: Record<string, any> = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const tenant = await prisma.tenant.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error: any) {
    console.error('Errore aggiornamento tenant:', error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
