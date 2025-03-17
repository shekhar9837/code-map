import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY!;
const GOOGLE_CX = process.env.GOOGLE_CX!; // Custom Search Engine ID

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// ✅ Fetch YouTube video for a specific step title
async function fetchYouTubeVideoForStep(stepTitle: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        stepTitle
      )}&type=video&key=${YOUTUBE_API_KEY}&maxResults=1`
    );
    const data = await response.json();
    console.log("YouTube API Response:", data);

    if (data.items && data.items.length > 0) {
      return `https://www.youtube.com/watch?v=${data.items[0]?.id?.videoId}`;
    }
  } catch (error) {
    console.error("YouTube API Error:", error);
  }
  return null;
}

// ✅ Fetch GitHub repositories
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

async function fetchBlogArticles(query: string) {
  try {
      const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
      const CX = process.env.GOOGLE_CSE_ID;
      const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${API_KEY}&cx=${CX}&num=5`;

      const response = await fetch(url);
      const data = await response.json();

      if (!data.items) {
          console.error("No blog articles found.");
          return []; // Return empty array to prevent undefined error
      }

      return data.items.map((item: any) => item.link);
  } catch (error) {
      console.error("Error fetching blog articles:", error);
      return [];
  }
}

// ✅ Fetch all learning resources
async function fetchResources(topic: string) {
  const [github, blogs] = await Promise.all([
    fetchGitHubRepos(topic),
    fetchBlogArticles(topic),
  ]);

  return { github, blogs };
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic) return NextResponse.json({ error: "Topic is required" }, { status: 400 });

    // Fetch validated resources (GitHub & Blogs)
    const resources = await fetchResources(topic);
    console.log("✅ Validated Resources:", resources);

    if (!resources.github.length && !resources.blogs.length) {
      return NextResponse.json({ error: "No valid resources found" }, { status: 404 });
    }

    // Generate learning roadmap
    const prompt = `
    Create a structured learning path for ${topic} with steps. Each step should include:
    - A title
    - Duration (e.g., "4 hours")
    - A brief description
    - Learning resources: [Title](URL)
    - Practice exercises
    - **Validated Resources**:
      - GitHub Repositories: ${resources.github.map((url) => `- [Explore Here](${url})`).join("\n")}
      - Blog Articles: ${resources.blogs.map((url:any) => `- [Read Here](${url})`).join("\n")}
    
    IMPORTANT: Return ONLY a raw JSON object without any markdown formatting, code blocks, or backticks.
    The response must start with { and end with } and be valid JSON.
    
    Example format:
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
    let text = '';
    for await (const chunk of result.stream) {
      text += chunk.text();
    }
    let roadmap;
    try {
      roadmap = JSON.parse(text);
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return NextResponse.json({ error: "Failed to generate learning path" }, { status: 500 });
    }

    if (roadmap.steps && roadmap.steps.length > 0) {
      // ✅ Fetch YouTube videos for each step title
      for (const step of roadmap.steps) {
        const video = await fetchYouTubeVideoForStep(step.title);
        if (video) {
          step.resources.push(`Video: [Watch Here](${video})`);
        }
      }
    }

    // ✅ Stream the updated roadmap response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(JSON.stringify(roadmap));
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
