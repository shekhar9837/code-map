import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const createLearningPathPrompt = (topic: string) => `
# Learning Path: ${topic}
Before starting, Search on the internet for the best resources to learn about ${topic}.


For each milestone below, provide:
1. 2-3 curated YouTube video  (with creator names) with video links
2. 2-3 high-quality blog articles from Medium/Dev.to/HashNode or any other platform (with authors) with article links
3. 1-2 GitHub repositories if it is related to code with practical projects/examples (with repository links)
4. Estimated time to complete each milestone (in hours)
5. Key concepts to master before moving forward to the next milestone

Please organize content from beginner to advanced level, ensuring:
- Each resource is recent (preferably from the last 1 years) and relevant
- Content is practical and hands-on focused (not just theoretical) 
- Resources are from reputable creators/authors with good reviews
- Clear progression between concepts and milestones
- Double check for any broken links or outdated resources


Format the response in markdown with clear headings and bullet points.`;

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContentStream(createLearningPathPrompt(topic));

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