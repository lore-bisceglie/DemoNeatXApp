import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = req.headers.get('x-admin-password');
  if (auth !== 'NeatxAdmin2026') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, slug, template } = body;

    if (!name || !slug || !template) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

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

    // Crea il Tenant con i servizi annessi
    const newTenant = await prisma.tenant.create({
      data: {
        name,
        slug,
        services: {
          create: defaultServices
        }
      }
    });

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (error) {
    console.error('Errore SuperAdmin:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
