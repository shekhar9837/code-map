import { LoggerService } from "./logger.service";
import { AppError } from "@/lib/errors/app.error";
import { resourceSchemas } from "@/lib/validations/resource.validations";
import { validateRequest } from "@/lib/utils/validation";
import { unstable_cache } from "next/cache";
import { tavily } from "@tavily/core";
import { GeminiRoadmapResponse } from "../types";
import { genAI } from "../roadmapGenerator";

type BlogArticle = {
  title: string;
  url: string;
};

type TavilySearchResult = {
  title: string;
  url: string;
  [key: string]: unknown;
};

export class ResourceService {
  private static instance: ResourceService;
  private logger: LoggerService;

  private constructor() {
    this.logger = LoggerService.getLogger("ResourceService");
  }

  public static getInstance(): ResourceService {
    if (!ResourceService.instance) {
      ResourceService.instance = new ResourceService();
    }
    return ResourceService.instance;
  }

  public async fetchResources(topic: string) {
    try {
      // Validate input
      const { topic: validatedTopic } = validateRequest(
        resourceSchemas.fetchResources,
        { topic },
        "Invalid topic provided"
      );

      this.logger.info("Fetching resources", { topic: validatedTopic });

      const [githubRepos, blogArticles, roadmapSteps] = await Promise.all([
        this.fetchGithubRepos(validatedTopic),
        this.fetchBlogArticles(validatedTopic),
        this.generateRoadmap(validatedTopic)
      ]);

      if (!roadmapSteps || roadmapSteps.length === 0) {
        throw new AppError("Failed to generate roadmap steps", 500);
      }

      return { githubRepos, blogArticles, roadmapSteps };
    } catch (error) {
      this.logger.error("Error in fetchResources", error);
      throw error;
    }
  }

  private async fetchGithubRepos(topic: string): Promise<string[]> {
    try {
      const query = `${encodeURIComponent(topic)} language:${encodeURIComponent(
        topic
      )} sort:stars`;
      const url = `https://api.github.com/search/repositories?q=${query}&order=desc&per_page=3`;
      const headers: HeadersInit = {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "CodeMap-Learning-App",
      };

      if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) return [];

      const data = await response.json();
      return (
        data.items?.map((repo: { html_url: string }) => repo.html_url) || []
      );
    } catch (error) {
      this.logger.error("Error fetching GitHub repos", error);
      return [];
    }
  }

  private async fetchBlogArticles(topic: string): Promise<BlogArticle[]> {
    try {
      if (!process.env.TAVILY_API_KEY) {
        throw new Error("Tavily API key is not configured");
      }

      const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
      const response = await tavilyClient.search(topic, {
        search_depth: "basic",
        max_results: 5,
        include_domains: [],
        exclude_domains: [],
      });

      if (response?.results && Array.isArray(response.results)) {
        return response.results
          .map((item: TavilySearchResult) => ({
            title: typeof item.title === "string" ? item.title : "Untitled",
            url: typeof item.url === "string" ? item.url : "",
          }))
          .filter((item: BlogArticle) => item.url);
      }
      return [];
    } catch (error) {
      this.logger.error("Error fetching blog articles", error);
      return [];
    }
  }

  private async generateRoadmap(topic: string) {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
    });
    const prompt = `\n  Create a detailed 5-step learning roadmap for the topic: "${topic}".\n  Focus on practical steps and essential concepts for a beginner to intermediate learner.\n\n  For each step, provide:\n  - id: A sequential string identifier (e.g., "1", "2", ... "5").\n  - title: A concise and descriptive title for the step (max 10 words).\n  - duration: An estimated time commitment (e.g., "2-4 hours", "1 day", "3 sessions").\n  - description: A brief (1-2 sentences) explanation of the learning goal for this step.\n  - resources: An array of 1-2 strings suggesting specific *types* of learning materials (e.g., "Official Documentation pages on X", "Interactive tutorial on Y", "Conceptual overview video").\n  - practice: An array of 1-2 strings suggesting concrete practice activities (e.g., "Complete setup guide", "Build a simple example project using Z", "Solve beginner exercises on platform A").\n\n  IMPORTANT: Respond ONLY with the JSON object representing the roadmap, enclosed in a single JSON structure.\n  Do NOT include any introductory text, concluding remarks, explanations, apologies, or markdown formatting like \`\`\`json or \`\`\`.\n  The response MUST start directly with '{' and end directly with '}'.\n\n  Example JSON Format:\n  {\n    "steps": [\n      {\n        "id": "1",\n        "title": "Understand Core Concepts",\n        "duration": "3-5 hours",\n        "description": "Grasp the fundamental principles and terminology.",\n        "resources": ["Read official 'Getting Started' guide", "Watch an introductory overview video"],\n        "practice": ["Set up development environment", "Run basic 'Hello World' example"]\n      },\n      // ... more steps (total 5)\n      {\n        "id": "5",\n        "title": "Build a Small Project",\n        "duration": "1-2 days",\n        "description": "Apply learned concepts by building a simple application.",\n        "resources": ["Follow a step-by-step project tutorial", "Refer to documentation for specific APIs"],\n        "practice": ["Implement core features X and Y", "Deploy the project to a test environment"]\n      }\n    ]\n  }\n  `;

    let rawResponseText = "";
    let jsonString = "";

    try {
      const result = await model.generateContent(prompt);
      rawResponseText = result.response.text();
      const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = rawResponseText.match(codeBlockRegex);
      if (match && match[1]) {
        jsonString = match[1].trim();
      } else {
        jsonString = rawResponseText.trim();
        if (!jsonString.startsWith("{") || !jsonString.endsWith("}")) {
          const firstBrace = jsonString.indexOf("{");
          const lastBrace = jsonString.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
          }
        }
      }
      const parsedData = JSON.parse(jsonString) as GeminiRoadmapResponse;
      if (!parsedData || !Array.isArray(parsedData.steps)) {
        throw new Error("LLM returned data in an unexpected structure.");
      }
      return parsedData.steps;
    } catch (error) {
      this.logger.error("Error generating roadmap", error);
      throw new AppError("Failed to generate roadmap steps", 500);
    }
  }

  public async fetchYouTubeVideoForStep(
    searchQuery: string
  ): Promise<string | null> {
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
    } catch (error) {
      this.logger.error("Error fetching YouTube video", error);
      return null;
    }
  }
}
