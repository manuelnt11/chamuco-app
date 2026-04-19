import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface GeonamesResult {
  geonames: Array<{ name: string; adminName1: string }>;
}

export async function GET(req: NextRequest) {
  // Require the routing cookie as a lightweight gate against unauthenticated bots.
  // Not cryptographic auth — real auth happens via Firebase on the NestJS API.
  if (!req.cookies.has('__Host-chamuco-auth')) {
    return NextResponse.json({ geonames: [] }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q') ?? '';
  const country = searchParams.get('country') ?? '';

  if (q.length < 2 || !country) {
    return NextResponse.json({ geonames: [] });
  }

  const username = process.env.GEONAMES_USERNAME;
  if (!username) {
    return NextResponse.json({ geonames: [] });
  }

  try {
    const url = new URL('https://secure.geonames.org/searchJSON');
    url.searchParams.set('q', q);
    url.searchParams.set('country', country);
    url.searchParams.set('featureClass', 'P');
    url.searchParams.set('orderby', 'population');
    url.searchParams.set('maxRows', '15');
    url.searchParams.set('username', username);

    const res = await fetch(url.toString(), { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json({ geonames: [] });
    }

    const data = (await res.json()) as GeonamesResult;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[cities] error:', err instanceof Error ? err.message : String(err));
    return NextResponse.json({ geonames: [] });
  }
}
