import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(req: Request) {
  const auth = req.headers.get('x-admin-password');
  if (auth !== 'NeatxAdmin2026') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

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

    // Definisci i servizi in base al template scelto
    let defaultServices = [];
    if (template === 'barbiere') {
      defaultServices = [
        { name: 'Taglio Capelli', duration: 30, price: 20 },
        { name: 'Taglio e Barba', duration: 45, price: 30 },
      ];
    } else if (template === 'parrucchiere') {
      defaultServices = [
        { name: 'Taglio Donna', duration: 45, price: 35 },
        { name: 'Colore e Piega', duration: 90, price: 80 },
        { name: 'Piega', duration: 30, price: 20 },
      ];
    } else if (template === 'estetista') {
      defaultServices = [
        { name: 'Massaggio Relax', duration: 60, price: 50 },
        { name: 'Pulizia Viso', duration: 45, price: 35 },
        { name: 'Semipermanente Mani', duration: 45, price: 25 },
      ];
    } else if (template === 'medico') {
      defaultServices = [
        { name: 'Prima Visita', duration: 45, price: 100 },
        { name: 'Visita di Controllo', duration: 20, price: 60 },
      ];
    } else if (template === 'nutrizionista') {
      defaultServices = [
        { name: 'Prima Visita e Dieta', duration: 60, price: 90 },
        { name: 'Controllo Mensile', duration: 30, price: 50 },
      ];
    } else if (template === 'personaltrainer') {
      defaultServices = [
        { name: 'Lezione Individuale', duration: 60, price: 40 },
        { name: 'Valutazione Fisica', duration: 30, price: 25 },
      ];
    } else if (template === 'tatuatore') {
      defaultServices = [
        { name: 'Consulenza Gratuita', duration: 30, price: 0 },
        { name: 'Tatuaggio Piccolo/Medio', duration: 120, price: 150 },
      ];
    } else if (template === 'consulente') {
      defaultServices = [
        { name: 'Consulenza 30 min', duration: 30, price: 50 },
        { name: 'Consulenza 60 min', duration: 60, price: 90 },
      ];
    } else if (template === 'toelettatura') {
      defaultServices = [
        { name: 'Bagno e Taglio (Taglia Piccola)', duration: 60, price: 40 },
        { name: 'Bagno e Taglio (Taglia Grande)', duration: 90, price: 60 },
      ];
    } else if (template === 'psicologo') {
      defaultServices = [
        { name: 'Prima Visita', duration: 60, price: 80 },
        { name: 'Seduta di Supporto', duration: 60, price: 70 },
      ];
    } else {
      defaultServices = [
        { name: 'Appuntamento Standard', duration: 30, price: 0 }
      ];
    }

    const trialLimit = new Date();
    trialLimit.setDate(trialLimit.getDate() + 7);

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
        services: {
          create: defaultServices
        }
      }
    });

    if (ownerEmail) {
      const tenantUrl = `https://${slug}.neatx.store`;
      await sendWelcomeEmail(ownerEmail, name, finalPassword, tenantUrl);
    }

    // Notifica Telegram al SuperAdmin
    await sendTelegramMessage(
      `🎉 <b>NUOVO NEGOZIO CREATO!</b>\n\n` +
      `Hai appena generato un gestionale per: <b>${name}</b>\n` +
      `Categoria: ${template}\n` +
      `Link: https://${slug}.neatx.store`
    );

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (error) {
    console.error('Errore SuperAdmin:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
