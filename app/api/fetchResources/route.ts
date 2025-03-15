import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const createLearningPathPrompt = (topic: string) => `
Create a practical learning path for ${topic} with 4-6 steps. For each step include:

1. A clear title
2. Duration in hours (single number followed by the word "hours", e.g., "4 hours", "10 hours")
3. Brief description
4. 2-3 learning resources with markdown links formatted as: "Resource: [Title](URL) - Brief description"
5. 1-2 practice exercises formatted as: "Practice exercise: Description"

Return as JSON:
{
  "steps": [
    {
      "id": "1",
      "title": "Step title",
      "duration": "X hours",
      "description": "What will be learned",
      "subSteps": [
        "Resource: [Title](URL) - Description",
        "Practice exercise: Description"
      ]
    }
  ]
}

Make it practical and achievable.`;

interface DuckDuckGoResponse {
  AbstractText: string;
  Results: Array<{ FirstURL: string }>;
  RelatedTopics: Array<{
    FirstURL?: string;
    Text?: string;
    Result?: string;
  }>;
}

async function searchDuckDuckGo(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1`
    );
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data: DuckDuckGoResponse = await response.json();
    
    // Collect URLs from multiple sources in the API response
    const urls = [
      ...((data.Results || []).map(r => r.FirstURL) || []),
      ...((data.RelatedTopics || []).map(t => t.FirstURL).filter(Boolean) || [])
    ].filter((url): url is string => url !== undefined);

    return urls;
  } catch (error) {
    console.error(`Error searching DuckDuckGo for ${query}:`, error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Fetch real-world resources using DuckDuckGo Search with better error handling
    const [youtubeUrls, githubUrls, blogUrls] = await Promise.all([
      searchDuckDuckGo(`${topic} site:youtube.com tutorial`),
      searchDuckDuckGo(`${topic} site:github.com`),
      searchDuckDuckGo(`${topic} (site:medium.com OR site:dev.to OR site:hashnode.com)`)
    ]);

    const resources = {
      youtube: youtubeUrls.slice(0, 3),
      github: githubUrls.slice(0, 2),
      blogs: blogUrls.slice(0, 3)
    };

    console.log("Resources found:", resources);

    // Add the found resources to the prompt
    const enhancedPrompt = createLearningPathPrompt(topic) + '\n\nConsider including these relevant resources:\n' +
      (resources.youtube.length ? '\nYouTube Videos:\n' + resources.youtube.join('\n') : '') +
      (resources.github.length ? '\nGitHub Repositories:\n' + resources.github.join('\n') : '') +
      (resources.blogs.length ? '\nBlog Articles:\n' + resources.blogs.join('\n') : '');

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContentStream(enhancedPrompt);

    // Create a readable stream from the Gemini response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(text);
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to generate learning path" },
      { status: 500 }
    );
  }
}