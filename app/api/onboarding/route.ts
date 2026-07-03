import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, template } = body;

    if (!name || !template) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    // Auto-genera uno slug basato sul nome, aggiungendo un suffisso random per unicità
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;
    
    // Genera una password admin (es. parola random + 4 numeri)
    const adminPassword = `${baseSlug.substring(0,4)}${Math.floor(1000 + Math.random() * 9000)}`;

    // Controlla se per pura sfortuna lo slug esiste già
    const existing = await prisma.tenant.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json({ error: 'Errore durante la generazione. Riprova.' }, { status: 400 });
    }

    // Definisci i servizi in base al template scelto
    let defaultServices = [];
    if (template === 'barbiere') {
      defaultServices = [
        { name: 'Taglio Capelli', duration: 30, price: 20 },
        { name: 'Taglio e Barba', duration: 45, price: 30 },
      ];
    } else if (template === 'estetista') {
      defaultServices = [
        { name: 'Massaggio Relax', duration: 60, price: 50 },
        { name: 'Pulizia Viso', duration: 45, price: 35 },
        { name: 'Manicure', duration: 30, price: 20 },
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

    // Imposta la fine della trial a 7 giorni da oggi
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    // Crea il Tenant con i servizi annessi
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        adminPassword,
        trialEndsAt,
        services: {
          create: defaultServices
        }
      }
    });

    return NextResponse.json({ success: true, slug: newTenant.slug, password: adminPassword });
  } catch (error) {
    console.error('Errore Onboarding:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
