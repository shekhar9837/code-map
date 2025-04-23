import { unstable_cache } from 'next/cache';
import { tavily } from '@tavily/core';

// Define an interface for the structure you want to return
export interface BlogArticle {
  title: string;
  url: string;
}

export const fetchYouTubeVideoForStep = unstable_cache(
  async (searchQuery: string): Promise<string | null> => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null;
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        searchQuery
      )}&type=video&key=${apiKey}&maxResults=1&relevanceLanguage=en`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      const videoId = data.items?.[0]?.id?.videoId;
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
    } catch {
      return null;
    }
  },
  ['youtube-videos'],
  {
    revalidate: 3600 * 24,
    tags: ['external-apis', 'youtube']
  }
);

export const fetchGitHubRepos = unstable_cache(
  async (topic: string): Promise<string[]> => {
    try {
      const query = `${encodeURIComponent(topic)} language:${encodeURIComponent(topic)} sort:stars`;
      const url = `https://api.github.com/search/repositories?q=${query}&order=desc&per_page=3`;
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeMap-Learning-App'
      };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) return [];
      const data = await response.json();
      return data.items?.map((repo: { html_url: string }) => repo.html_url) || [];
    } catch {
      return [];
    }
  },
  ['github-repos'],
  {
    revalidate: 3600 * 6,
    tags: ['external-apis', 'github']
  }
);

const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
export const fetchBlogArticles = unstable_cache(
  async (query: string): Promise<BlogArticle[]> => {
    try {
      const response = await tavilyClient.search(query, {
        search_depth: 'basic',
        max_results: 5,
        include_domains: [],
        exclude_domains: []
      });
      if (response?.results && Array.isArray(response.results)) {
        const articles: BlogArticle[] = response.results
          .map((item: any) => ({
            title: typeof item.title === 'string' ? item.title : 'Untitled',
            url: typeof item.url === 'string' ? item.url : '',
          }))
          .filter(item => item.url);
        return articles;
      } else {
        return [];
      }
    } catch {
      return [];
    }
  },
  ['blog-articles'],
  {
    revalidate: 3600 * 12,
    tags: ['external-apis', 'blogs', 'tavily']
  }
);