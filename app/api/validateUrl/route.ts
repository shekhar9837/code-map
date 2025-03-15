import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ isValid: false, error: 'URL is required' });
    }

    // For YouTube URLs, we'll consider them valid without checking
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return NextResponse.json({ isValid: true });
    }

    // For GitHub URLs, we'll do a basic validation
    if (url.includes('github.com')) {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
      return NextResponse.json({ isValid: response.ok });
    }

    // For other URLs
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    return NextResponse.json({ isValid: response.ok });
  } catch (error) {
    console.error('Error validating URL:', error);
    return NextResponse.json({ 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}