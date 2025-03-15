import { NextResponse } from 'next/server';

const BRAVE_SEARCH_API_KEY = process.env.BRAVE_SEARCH_API_KEY;
const BRAVE_SEARCH_API_URL = 'https://api.search.brave.com/res/v1/web';

interface BraveSearchParams {
  q: string;
  type?: string;
  domain?: string;
}

async function searchBrave({ q, type, domain }: BraveSearchParams) {
  try {
    const params = new URLSearchParams({
      q: q + (domain ? ` site:${domain}` : ''),
    });

    const response = await fetch(`${BRAVE_SEARCH_API_URL}?${params}`, {
      headers: {
        'X-Subscription-Token': BRAVE_SEARCH_API_KEY!,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching Brave:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { query, type } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    if (!BRAVE_SEARCH_API_KEY) {
      return NextResponse.json(
        { error: 'Brave Search API key is not configured' },
        { status: 500 }
      );
    }

    let results;
    switch (type) {
      case 'youtube':
        results = await searchBrave({
          q: `${query} youtube tutorial`,
          domain: 'youtube.com',
        });
        break;
      case 'github':
        results = await searchBrave({
          q: `${query} github repository`,
          domain: 'github.com',
        });
        break;
      case 'blog':
        results = await searchBrave({
          q: `${query} (site:medium.com OR site:dev.to OR site:hashnode.com)`,
        });
        break;
      default:
        results = await searchBrave({ q: query });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to search resources' },
      { status: 500 }
    );
  }
}