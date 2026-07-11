import { NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN non configurato' }, { status: 500 });
  }

  const res = await fetch('https://api.github.com/repos/neatxinfo-db/DemoNeatXApp/actions/workflows/auto-neatx-agents.yml/dispatches', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: 'main' }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: `GitHub API error: ${res.status}` }, { status: 502 });
  }

  return NextResponse.json({ success: true });
}
