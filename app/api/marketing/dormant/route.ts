import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant mancante' }, { status: 400 });
  }
  const authError = await requireTenantAdmin(tenantId);
  if (authError) return authError;

  try {
    // Troviamo tutti gli appuntamenti passati
    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId,
        NOT: [
          { customerName: { contains: 'PAUSA' } },
          { customerName: { contains: 'FERIE' } }
        ]
      },
      include: {
        service: true
      },
      orderBy: { date: 'desc' }
    });

    const now = new Date();
    // Normalizziamo oggi a YYYY-MM-DD
    const todayStr = now.toISOString().split('T')[0];
    
    // Raggruppiamo per cliente
    const customerMap = new Map<string, { lastVisit: string, name: string, totalSpent: number, futureAppointments: number }>();
    
    appointments.forEach(app => {
      const phone = app.customerPhone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          lastVisit: app.date,
          name: app.customerName,
          totalSpent: 0,
          futureAppointments: 0
        });
      }
      
      const cust = customerMap.get(phone)!;
      
      // Calcolo spesa
      if (app.date <= todayStr && app.isPaid) {
        cust.totalSpent += (app.service?.price || 0);
      }
      
      // Controllo appuntamenti futuri
      if (app.date >= todayStr) {
        cust.futureAppointments++;
      }
      
      // Aggiorno lastVisit se è più recente ma passata
      if (app.date <= todayStr && app.date > cust.lastVisit) {
        cust.lastVisit = app.date;
      }
    });


    const dormantCustomers = [];
    let estimatedRecoverableRevenue = 0;

    for (const [phone, data] of customerMap.entries()) {
      if (data.futureAppointments === 0 && data.lastVisit < todayStr) {
        // Calcola giorni passati
        const lastDate = new Date(data.lastVisit);
        const diffTime = Math.abs(now.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Se son passati più di 30 giorni, lo consideriamo dormiente
        if (diffDays >= 30) {
          dormantCustomers.push({
            phone,
            name: data.name,
            lastVisit: data.lastVisit,
            daysSince: diffDays,
            totalSpent: data.totalSpent
          });
          
          // Stima di recupero: calcoliamo un 35€ medio per cliente (o media della sua spesa)
          estimatedRecoverableRevenue += (data.totalSpent > 0 ? (data.totalSpent / 3) : 35);
        }
      }
    }

    return NextResponse.json({
      count: dormantCustomers.length,
      customers: dormantCustomers.sort((a, b) => b.daysSince - a.daysSince),
      estimatedRevenue: Math.round(estimatedRecoverableRevenue)
    });

  } catch (error) {
    console.error("Errore API marketing dormienti", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
