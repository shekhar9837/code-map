import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY!;
const GOOGLE_CX = process.env.GOOGLE_CX!; // Custom Search Engine ID

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function fetchYouTubeVideos(topic: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
    topic
  )}&type=video&key=${YOUTUBE_API_KEY}&maxResults=3`
    );
    console.log("YouTube API Response:", response);
    const data = await response.json();

    return data?.items?.map((item: any) => `https://www.youtube.com/watch?v=${item.id.videoId}`);
  } catch (error) {
    console.error("YouTube API Error:", error);
    return [];
  }
}

async function fetchGitHubRepos(topic: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(topic)}&sort=stars&order=desc`,
      {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }
    );
    const data = await response.json();
    return data.items.slice(0, 2).map((repo: any) => repo.html_url);
  } catch (error) {
    console.error("GitHub API Error:", error);
    return [];
  }
}

async function fetchBlogArticles(topic: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(topic)}&key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_CX}&num=3`
    );
    const data = await response.json();
    return data.items.map((item: any) => item.link);
  } catch (error) {
    console.error("Google Search API Error:", error);
    return [];
  }
}

async function fetchResources(topic: string) {
  const [youtube, github, blogs] = await Promise.all([
    fetchYouTubeVideos(topic),
    fetchGitHubRepos(topic),
    fetchBlogArticles(topic),
  ]);

  return { youtube, github, blogs };
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    const resources = await fetchResources(topic);
    console.log("✅ Validated Resources:", resources);

    if (!resources.youtube.length && !resources.github.length && !resources.blogs.length) {
      return NextResponse.json({ error: "No valid resources found" }, { status: 404 });
    }

    const prompt = `
    Create a structured learning path for ${topic} with steps. Each step should include:
    - A title
    - Duration (e.g., "4 hours")
    - A brief description
    - Learning resources: [Title](URL)
    - Practice exercises
    - **Validated Resources**:
      - YouTube Videos: ${resources.youtube.map((url) => `- [Watch Here](${url})`).join("\n")}
      - GitHub Repositories: ${resources.github.map((url) => `- [Explore Here](${url})`).join("\n")}
      - Blog Articles: ${resources.blogs.map((url) => `- [Read Here](${url})`).join("\n")}
    
    Return JSON like:
    {
      "steps": [
        {
          "id": "1",
          "title": "Step title",
          "duration": "X hours",
          "description": "What will be learned",
          "resources": ["Resource: [Title](URL) - Description"],
          "practice": ["Practice exercise: Description"]
        }
      ]
    }`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContentStream(prompt);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            controller.enqueue(chunk.text());
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to generate learning path" }, { status: 500 });
  }
}
