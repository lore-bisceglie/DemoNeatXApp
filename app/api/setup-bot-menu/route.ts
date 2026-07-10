import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ error: 'no token' }, { status: 500 });

  const commands = [
    { command: 'start', description: 'Avvia il bot' },
    { command: 'stats', description: 'Statistiche generali NeatX' },
    { command: 'agents', description: 'Stato agenti e lead' },
    { command: 'agent', description: 'Esegue gli agenti ora' },
    { command: 'ultimi', description: 'Ultimi 3 saloni iscritti' },
    { command: 'cerca', description: 'Cerca un salone per nome' },
    { command: 'entra', description: 'Entra nel pannello di un salone' },
    { command: 'aiuto', description: 'Guida completa ai comandi' },
  ];

  const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commands }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
