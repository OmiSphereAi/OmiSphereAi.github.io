import { NextRequest, NextResponse } from 'next/server';
import { analyzeUrl } from '@/lib/analyze';
import { saveAnalysis } from '@/lib/db';
import { DEMO_RESULT } from '@/lib/demo';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  try {
    const result = await analyzeUrl(url);
    saveAnalysis(result);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    if (message === 'NO_API_KEY') {
      // Return demo data when no API key is configured
      return NextResponse.json({ ...DEMO_RESULT, isDemo: true });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
