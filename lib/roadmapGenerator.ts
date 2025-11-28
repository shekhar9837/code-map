import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiRoadmapResponse, RoadmapStep } from "./types";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a 5-step learning roadmap for a given topic using Gemini AI.
 * @param topic - The learning topic to generate a roadmap for.
 * @returns Array of RoadmapStep objects.
 */
export async function generateRoadmap(topic: string): Promise<RoadmapStep[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  const prompt = `\n  Create a detailed 5-step learning roadmap for the topic: "${topic}".\n  Focus on practical steps and essential concepts for a beginner to intermediate learner.\n\n  For each step, provide:\n  - id: A sequential string identifier (e.g., "1", "2", ... "5").\n  - title: A concise and descriptive title for the step (max 10 words).\n  - duration: An estimated time commitment (e.g., "2-4 hours", "1 day", "3 sessions").\n  - description: A brief (1-2 sentences) explanation of the learning goal for this step.\n  - resources: An array of 1-2 strings suggesting specific *types* of learning materials (e.g., "Official Documentation pages on X", "Interactive tutorial on Y", "Conceptual overview video").\n  - practice: An array of 1-2 strings suggesting concrete practice activities (e.g., "Complete setup guide", "Build a simple example project using Z", "Solve beginner exercises on platform A").\n\n  IMPORTANT: Respond ONLY with the JSON object representing the roadmap, enclosed in a single JSON structure.\n  Do NOT include any introductory text, concluding remarks, explanations, apologies, or markdown formatting like \`\`\`json or \`\`\`.\n  The response MUST start directly with '{' and end directly with '}'.\n\n  Example JSON Format:\n  {\n    "steps": [\n      {\n        "id": "1",\n        "title": "Understand Core Concepts",\n        "duration": "3-5 hours",\n        "description": "Grasp the fundamental principles and terminology.",\n        "resources": ["Read official 'Getting Started' guide", "Watch an introductory overview video"],\n        "practice": ["Set up development environment", "Run basic 'Hello World' example"]\n      },\n      // ... more steps (total 5)\n      {\n        "id": "5",\n        "title": "Build a Small Project",\n        "duration": "1-2 days",\n        "description": "Apply learned concepts by building a simple application.",\n        "resources": ["Follow a step-by-step project tutorial", "Refer to documentation for specific APIs"],\n        "practice": ["Implement core features X and Y", "Deploy the project to a test environment"]\n      }\n    ]\n  }\n  `;

  let rawResponseText = '';
  let jsonString = '';

  try {
    const result = await model.generateContent(prompt);
    rawResponseText = result.response.text();
    const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = rawResponseText.match(codeBlockRegex);
    if (match && match[1]) {
      jsonString = match[1].trim();
    } else {
      jsonString = rawResponseText.trim();
      if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
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
    if (error instanceof Error) {
      throw new Error(`Failed to generate or parse roadmap from LLM. Details: ${error.message}`);
    } else {
      throw new Error("Failed to generate or parse roadmap from LLM. An unknown error occurred.");
    }
  }
}