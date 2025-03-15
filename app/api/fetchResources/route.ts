import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

const createLearningPathPrompt = (topic: string) => `
# Learning Path: ${topic}
Before starting, Search on the internet for the best resources to learn about ${topic}.

For each milestone below, provide:
1. 2-3 curated YouTube videos (with creator names) that meet these criteria:
   - Video links from established educational channels
   - Videos with high view counts (>10,000 views)
   - Published within the last 2 years
   - High like-to-dislike ratio
   - Active comment section with positive feedback

2. 2-3 high-quality blog articles that meet these criteria:
   - From reputable platforms (Medium/Dev.to/HashNode)
   - Written by recognized authors in the field
   - Published within the last 2 years
   - High engagement (claps/reactions/comments)
   - Comprehensive coverage with practical examples

3. 1-2 GitHub repositories that meet these criteria:
   - Active maintenance (updated within last 6 months)
   - Significant stars (>500)
   - Clear documentation and examples
   - Active issue resolution
   - Good code quality and test coverage

4. Estimated time to complete each milestone (in hours)
5. Key concepts to master before moving forward

Please organize content from beginner to advanced level, ensuring:
- Each resource is thoroughly vetted for quality and relevance
- Content focuses on practical implementation and best practices
- Resources come from recognized experts in the field
- Clear progression between concepts and milestones
- All links are validated and resources are currently available

Format the response in markdown with clear headings and bullet points.`;

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
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1&no_html=1&skip_disambig=1&t=code-map&kl=wt-wt&kd=-1`
    );
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data: DuckDuckGoResponse = await response.json();
    
    // Extract URLs from Results array with validation
    const resultUrls = data.Results?.map(r => r.FirstURL).filter(url => url && url.startsWith('http')) || [];
    
    // Extract URLs from RelatedTopics array with validation
    const topicUrls = data.RelatedTopics?.filter(t => t.FirstURL && t.FirstURL.startsWith('http'))
      .map(t => t.FirstURL as string) || [];
    
    // Combine and ensure unique URLs
    const urls = Array.from(new Set([...resultUrls, ...topicUrls]));
    
    // Log the found URLs for debugging
    console.log(`Found ${urls.length} URLs for query: ${query}`);
    if (urls.length > 0) {
      console.log('Sample URLs:', urls.slice(0, 2));
    }

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
      searchDuckDuckGo(`youtube videos ${topic} site:youtube.com tutorial`),
      searchDuckDuckGo(`github repo for practice${topic} site:github.com`),
      searchDuckDuckGo(`medium blogs for ${topic} (site:medium.com OR site:dev.to OR site:hashnode.com)`)
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

    const model = genAI.getGenerativeModel({
       model: "gemini-2.0-pro-exp-02-05",
       systemInstruction: "You are an expert learning path curator with deep knowledge of educational resources. Your role is to analyze topics, break them down into logical milestones, and provide carefully vetted, high-quality learning resources. You excel at creating structured learning paths that progress from fundamentals to advanced concepts, always prioritizing reputable sources, practical examples, and modern, relevant content. You validate all resources for accuracy and accessibility before recommending them.",

       });
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