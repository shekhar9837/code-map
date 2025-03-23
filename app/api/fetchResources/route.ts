import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { tavily } from '@tavily/core';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY!;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const client = tavily({ apiKey: "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" });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.items.slice(0, 2).map((repo: any) => repo.html_url);
  } catch (error) {
    console.error("GitHub API Error:", error);
    return [];
  }
}

// Define a type for the blog items
interface BlogItem {
  link: string;
}

async function fetchBlogArticles(query: string): Promise<string[]> {
  try {
    const response = await client.search(query, {});
    console.log("Tavily API Response:", response);

    if (!response) {
      console.error("No blog articles found.");
      return []; // Return empty array to prevent undefined error
    }

    return response.results.map((item: { url: string }) => item.url);
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
    interface Resource {
      github: string[];
      blogs: string[];
    }

    interface Step {
      id: string;
      title: string;
      duration: string;
      description: string;
      resources: string[];
      practice: string[];
    }

    interface Roadmap {
      steps: Step[];
    }

    const prompt = `
    Create a structured learning roadmap based on ${topic} with 7-8 steps. Each step should include:
    - A title
    - Duration (e.g., "4 hours")
    - A brief description
    - Learning resources: [Title](URL)
    - Practice exercises
    - **Validated Resources**:
      - GitHub Repositories:- [Explore Here](url)}
      - Blog Articles: - [Read Here](url)}

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
    const result = await model.generateContent(prompt);
    // console.log("Raw AI Response:", result); // Log the raw response

    let roadmap;
    try {
      roadmap = JSON.parse(result.response.text());
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return NextResponse.json({ error: "Failed to generate learning path" }, { status: 500 });
    }

    if (roadmap.steps && roadmap.steps.length > 0) {
      // ✅ Fetch YouTube videos for each step title
      for (const step of roadmap.steps) {
        const video = await fetchYouTubeVideoForStep(`${topic}` + step.title);

        if (video) {
          step.resources.push(`Video: [Watch Here](${video})`);
        }
      }
    }
    console.log("✅ Learning Roadmap:", roadmap);
    console.log("✅ Resources:", resources);

    // Return the updated roadmap response
    return NextResponse.json(
      {roadmap,
      resources: {
        github: resources.github,
        blogs: resources.blogs
      }
      } ,
      { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Failed to generate learning path" }, { status: 500 });
  }
}