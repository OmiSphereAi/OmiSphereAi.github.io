import { NextRequest, NextResponse } from 'next/server';
import { setAnalysisPublic } from '@/lib/db';

export async function POST(req: NextRequest) {
  let body: { id?: string; isPublic?: boolean; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { id, isPublic, password } = body;

  if (typeof id !== 'string' || typeof isPublic !== 'boolean') {
    return NextResponse.json(
      { error: 'id (string) and isPublic (boolean) are required' },
      { status: 400 }
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminPassword && password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    setAnalysisPublic(id, isPublic);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
