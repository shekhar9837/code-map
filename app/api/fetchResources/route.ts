// /app/api/fetchResources/route.ts

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { tavily } from '@tavily/core';
import { unstable_cache } from 'next/cache'; // Import Next.js caching
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis"; // see below for cloudflare and fastly adapters

// Create a new ratelimiter, that allows 10 requests per 10 seconds

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(), // Use Upstash Redis from environment variables
  limiter: Ratelimit.slidingWindow(10, "5 h"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

// ======================
// Environment Variable Checks (Optional but Recommended)
// ======================
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}
if (!process.env.TAVILY_API_KEY) {
  throw new Error("Missing TAVILY_API_KEY environment variable");
}
if (!process.env.YOUTUBE_API_KEY) {
  console.warn("Missing YOUTUBE_API_KEY environment variable. YouTube lookups will fail.");
}
// GITHUB_TOKEN is optional but recommended for higher rate limits
if (!process.env.GITHUB_TOKEN) {
  console.warn("Missing GITHUB_TOKEN environment variable. GitHub API rate limits may be lower.");
}

// ======================
// Initialize APIs
// ======================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });

// ======================
// Interfaces
// ======================
interface RoadmapStep {
  id: string;
  title: string;
  duration: string;
  description: string;
  resources: string[]; // Initially generated strings, later potentially modified
  practice: string[];
}

// Structure expected directly from Gemini (before parsing)
interface GeminiRoadmapResponse {
  steps: RoadmapStep[];
}

// ======================
// Helper Functions
// ======================

/**
 * Fetch with timeout and abort signal to prevent hanging requests.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout = 5000 // Increased timeout slightly
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`Fetch request to ${url} timed out after ${timeout}ms.`);
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      // Log non-OK responses for debugging
      console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
      try {
        const errorBody = await response.text();
        console.error(`Error body: ${errorBody.substring(0, 500)}...`); // Log part of the error body
      } catch {
        console.error(`Failed to read error body for ${url}`);
      }
    }
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error(`Fetch aborted for ${url} (likely due to timeout).`);
    } else if (error instanceof Error) {
      console.error(`Network error fetching ${url}:`, error.message);
    } else {
      console.error(`Unexpected error fetching ${url}`);
    }
    throw error;
  }
}

// ======================
// API Fetch Functions (with Caching)
// ======================

const fetchYouTubeVideoForStep = unstable_cache(
  async (searchQuery: string): Promise<string | null> => {
    console.log(`Cache miss or revalidating: Fetching YouTube video for: "${searchQuery}"`);
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return null; // Don't attempt if key is missing

    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        searchQuery
      )}&type=video&key=${apiKey}&maxResults=1&relevanceLanguage=en`; // Added language hint

      const response = await fetchWithTimeout(url);
      if (!response.ok) return null; // Handle API errors gracefully

      const data = await response.json();

      const videoId = data.items?.[0]?.id?.videoId;
      return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

    } catch (error) {
      console.error(`YouTube API Error fetching "${searchQuery}":`, error);
      return null; // Return null on error
    }
  },
  ['youtube-videos'], // Cache key prefix
  {
    revalidate: 3600 * 24, // Cache for 24 hours
    tags: ['external-apis', 'youtube'] // Optional tags for granular revalidation
  }
);

const fetchGitHubRepos = unstable_cache(
  async (topic: string): Promise<string[]> => {
    console.log(`Cache miss or revalidating: Fetching GitHub repos for: "${topic}"`);
    try {
      const query = `${encodeURIComponent(topic)} language:${encodeURIComponent(topic)} sort:stars`; // More focused query
      const url = `https://api.github.com/search/repositories?q=${query}&order=desc&per_page=3`; // Get top 3

      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CodeMap-Learning-App' // Use a specific user agent
      };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetchWithTimeout(url, { headers });
      if (!response.ok) return []; // Handle API errors gracefully

      const data = await response.json();
      return data.items?.map((repo: { html_url: string }) => repo.html_url) || [];

    } catch (error) {
      console.error(`GitHub API Error fetching "${topic}":`, error);
      return []; // Return empty array on error
    }
  },
  ['github-repos'], // Cache key prefix
  {
    revalidate: 3600 * 6, // Cache for 6 hours
    tags: ['external-apis', 'github']
  }
);

// Define an interface for the structure you want to return
interface BlogArticle {
  title: string;
  url: string;
}
const fetchBlogArticles = unstable_cache(
  async (query: string): Promise<BlogArticle[]> => {
    console.log(`Cache miss or revalidating: Fetching blog articles for: "${query}"`);
    try {
      // Tavily search function might handle its own retries/timeouts internally
      const response = await tavilyClient.search(query, {
        search_depth: "basic", // Use basic for speed unless advanced is needed
        max_results: 5,       // Limit results
        include_domains: [],  // Optional: filter by domains
        exclude_domains: []   // Optional: filter out domains
      });
      console.log("Tavily response:", response); // Log the response for debugging

      // Use optional chaining and check if 'results' is an array
      if (response?.results && Array.isArray(response.results)) {
        // Map the results directly to the desired BlogArticle structure
        const articles: BlogArticle[] = response.results
          .map((item) => ({ // Use 'any' or a more specific Tavily type if available
            // Provide default values or checks if title/url might be missing
            title: typeof item.title === 'string' ? item.title : 'Untitled',
            url: typeof item.url === 'string' ? item.url : '',
          }))
          .filter(item => item.url); // Filter out any items where URL couldn't be found/is empty

        console.log(`Found ${articles.length} blog articles for "${query}"`);
        return articles; // Return the array of {title, url} objects
      } else {
        console.warn(`Tavily did not return valid results for query: "${query}"`);
        return []; // Return empty array if results are not as expected
      }
    } catch (error) {
      console.error(`Tavily API Error searching "${query}":`, error);
      return []; // Return empty array on error
    }
  },
  ['blog-articles'], // Cache key prefix
  {
    revalidate: 3600 * 12, // Cache for 12 hours
    tags: ['external-apis', 'blogs', 'tavily']
  }
);

// ======================
// Roadmap Generation
// ======================

async function generateRoadmap(topic: string): Promise<RoadmapStep[]> {
  // Choose a suitable model - latest flash is often good balance of speed/capability
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

  // Refined prompt instructing strict JSON output
  const prompt = `
  Create a detailed 5-step learning roadmap for the topic: "${topic}".
  Focus on practical steps and essential concepts for a beginner to intermediate learner.

  For each step, provide:
  - id: A sequential string identifier (e.g., "1", "2", ... "5").
  - title: A concise and descriptive title for the step (max 10 words).
  - duration: An estimated time commitment (e.g., "2-4 hours", "1 day", "3 sessions").
  - description: A brief (1-2 sentences) explanation of the learning goal for this step.
  - resources: An array of 1-2 strings suggesting specific *types* of learning materials (e.g., "Official Documentation pages on X", "Interactive tutorial on Y", "Conceptual overview video").
  - practice: An array of 1-2 strings suggesting concrete practice activities (e.g., "Complete setup guide", "Build a simple example project using Z", "Solve beginner exercises on platform A").

  IMPORTANT: Respond ONLY with the JSON object representing the roadmap, enclosed in a single JSON structure.
  Do NOT include any introductory text, concluding remarks, explanations, apologies, or markdown formatting like \`\`\`json or \`\`\`.
  The response MUST start directly with '{' and end directly with '}'.

  Example JSON Format:
  {
    "steps": [
      {
        "id": "1",
        "title": "Understand Core Concepts",
        "duration": "3-5 hours",
        "description": "Grasp the fundamental principles and terminology.",
        "resources": ["Read official 'Getting Started' guide", "Watch an introductory overview video"],
        "practice": ["Set up development environment", "Run basic 'Hello World' example"]
      },
      // ... more steps (total 5)
      {
        "id": "5",
        "title": "Build a Small Project",
        "duration": "1-2 days",
        "description": "Apply learned concepts by building a simple application.",
        "resources": ["Follow a step-by-step project tutorial", "Refer to documentation for specific APIs"],
        "practice": ["Implement core features X and Y", "Deploy the project to a test environment"]
      }
    ]
  }
  `;

  let rawResponseText = '';
  let jsonString = '';

  try {
    console.log(`Generating roadmap with Gemini for topic: "${topic}"`);
    const result = await model.generateContent(prompt);
    rawResponseText = result.response.text();

    // console.log("Raw response from Gemini:\n", rawResponseText); // DEBUG: Log raw response

    // 1. Attempt to extract JSON from ```json ... ``` block
    const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = rawResponseText.match(codeBlockRegex);

    if (match && match[1]) {
      jsonString = match[1].trim();
      console.log("Extracted JSON string from Markdown code block.");
    } else {
      // 2. If no block, assume the entire response *might* be JSON. Trim aggressively.
      jsonString = rawResponseText.trim();
      // Basic check for JSON structure - helps catch non-JSON responses early
      if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
        console.warn("Gemini response did not contain ```json block and doesn't start/end with {}. Attempting to parse anyway, but might fail.");
        // Optional: Attempt to find the first '{' and last '}' if there's preamble/postamble text
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonString = jsonString.substring(firstBrace, lastBrace + 1);
          console.log("Attempted to extract JSON between first '{' and last '}'.");
        } else {
          console.error("Could not reliably extract JSON object from Gemini response.");
          // Even if we couldn't extract, try parsing `jsonString` as is, it might still work or fail gracefully below.
        }
      } else {
        console.log("No Markdown block found. Assuming raw response is JSON.");
      }
    }

    // 3. Parse the prepared JSON string
    const parsedData = JSON.parse(jsonString) as GeminiRoadmapResponse;

    // 4. Validate the parsed structure
    if (!parsedData || !Array.isArray(parsedData.steps)) {
      console.error("Parsed JSON from Gemini is invalid. Expected '{ steps: [...] }'. Received:", parsedData);
      throw new Error("LLM returned data in an unexpected structure.");
    }
    if (parsedData.steps.length === 0) {
      console.warn(`Gemini returned an empty 'steps' array for topic: "${topic}"`);
      // Depending on requirements, you might throw an error here or return the empty array.
      // For now, we'll allow returning an empty array.
    }


    console.log(`Successfully generated and parsed ${parsedData.steps.length} roadmap steps.`);
    return parsedData.steps; // Return the array of steps

  } catch (error) {
    console.error(`Roadmap generation or parsing encountered an issue for topic "${topic}":`, error instanceof Error ? error.message : String(error));
    console.error("--- Gemini Raw Response ---");
    console.error(rawResponseText || "No raw response captured."); // Log the raw text that caused the error
    console.error("--- String Attempted to Parse ---");
    console.error(jsonString || "No string prepared for parsing."); // Log the string passed to JSON.parse
    // Throw a new error that will be caught by the main POST handler
    if (error instanceof Error) {
      throw new Error(`Failed to generate or parse roadmap from LLM. Details: ${error.message}`);
    } else {
      throw new Error("Failed to generate or parse roadmap from LLM. An unknown error occurred.");
    }
  }
}

// ======================
// Main API Route Handler
// ======================


// Define the handler function with proper Next.js types
export async function POST(req: Request) {
  const identifier = "api";
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    console.warn("Rate limit exceeded for identifier:", identifier);
    return NextResponse.json({
      error:"Unable to process at this time"},
      { status: 429 } // Too Many Requests
    );
  }
  let topic: string | undefined; // Define topic here to use in final error logging

 

  try {
    // 1. Parse and Validate Input
    const body = await req.json();
    topic = body.topic; // Assign topic for logging purposes

    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      console.warn("Invalid topic received:", topic);
      return NextResponse.json(
        { error: "A valid 'topic' string is required in the request body." },
        { status: 400 }
      );
    }
    topic = topic.trim(); // Use trimmed topic
    console.log(`Processing request for topic: "${topic}"`);

    // 2. Fetch Resources in Parallel (Roadmap, GitHub, Blogs)
    const [githubRepos, blogArticles, roadmapSteps] = await Promise.all([
      fetchGitHubRepos(topic),
      fetchBlogArticles(`${topic} learning resources from begineer for advance`), // Refined blog search query
      generateRoadmap(topic) // Generates the core steps or throws error
    ]);

    // Check if roadmap generation resulted in steps (generateRoadmap throws on failure, but could return empty array)
    if (!roadmapSteps || roadmapSteps.length === 0) {
      console.error(`Roadmap generation succeeded but yielded no steps for topic: "${topic}".`);
      // Consider this a server-side issue if steps are expected
      return NextResponse.json(
        { error: "Failed to generate meaningful roadmap steps. Please try a different topic or refine your query." },
        { status: 500 } // Or 404 if topic genuinely yields nothing
      );
    }

    console.log(`Generated ${roadmapSteps.length} steps. Fetching YouTube videos...`);

    // 3. Enrich Steps with YouTube Videos (Parallel fetches per step)
    const stepsWithVideos = await Promise.all(
      roadmapSteps.map(async (step) => {
        // Defensive copy to avoid modifying cached objects directly if caching steps becomes a thing
        const enrichedStep = { ...step, resources: [...step.resources] };
        try {
          // More specific search query for YouTube
          const videoSearchQuery = `${topic} ${step.title} tutorial for beginners`;
          const videoUrl = await fetchYouTubeVideoForStep(videoSearchQuery);

          if (videoUrl) {
            // Add video link clearly formatted (Markdown is common)
            enrichedStep.resources.push(`Video Tutorial: [Watch on YouTube](${videoUrl})`);
          }
        } catch (ytError) {
          // Log specific error but don't fail the whole request
          if(ytError instanceof Error) {
            console.error(`Error fetching YouTube video for step "${step.title}":`, ytError.message);
          }
          // console.error(`Failed to fetch YouTube video for step "${step.title}":`, ytError.message);
        }
        return enrichedStep; // Return the step (with or without video)
      })
    );

    console.log(`Successfully processed and enriched request for topic: "${topic}"`);

    // 4. Construct and Return Success Response
    return NextResponse.json({
      roadmap: { steps: stepsWithVideos },
      resources: {
        github: githubRepos,
        blogs: blogArticles
      }
    }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Example cache control: public CDN cache for 1 hour, allow stale for 1 day
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });

  } catch (error) {
    // 5. Handle All Errors Gracefully
    if(error instanceof Error) {
      console.error(`API Error processing request (Topic: ${topic || 'Unknown'}):`, error);
      // Determine status code based on error type if possible, default to 500
      let statusCode = 500;
      let errorMessage = "An internal server error occurred.";
      
      // Customize based on common errors if needed
      if (error.message.includes("Failed to generate or parse roadmap")) {
        errorMessage = "Could not generate the learning roadmap. The AI might be unavailable or the topic too complex. Please try again later or refine your topic.";
        statusCode = 503; // Service Unavailable might be appropriate
      } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        // This might catch errors from req.json()
        errorMessage = "Invalid request format.";
        statusCode = 400;
      }
      
      return NextResponse.json(
        {
          error: errorMessage,
          // Include specific details only in non-production environments for security
          details: process.env.NODE_ENV !== 'production' ? error.message : undefined
        },
        { status: statusCode }
      );
    }
  }
}