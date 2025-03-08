import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);

export async function POST(req) {
  try {
    const { topic } = await req.json();
    if (!topic) {
      return Response.json(
        { message: "Please provide a topic." },
        { status: 400 }
      );
    }

    const prompt = `
     Generate a structured learning roadmap for mastering "{topic}".  
For each topic in the roadmap, include:  
1. A **YouTube playlist** with high-quality tutorials.  
2. The best **Medium/Dev.to blog articles** for deeper understanding.  
3. The most relevant **GitHub repositories** with practical projects.  

Format the response as a JSON object like this:  
{
  "roadmap": [
    {
      "topic": "Fundamentals of React",
      "youtube_playlist": "URL",
      "blog_articles": ["URL1", "URL2"],
      "github_repositories": ["URL1", "URL2"]
    },
    {
      "topic": "React State Management",
      "youtube_playlist": "URL",
      "blog_articles": ["URL1", "URL2"],
      "github_repositories": ["URL1", "URL2"]
    }
  ]
}

    `;

    // Get the streaming model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a new TransformStream for handling JSON chunks
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start the generation with streaming
    const response = await model.generateContentStream(prompt);

    let accumulatedText = "";

    // Process the stream
    (async () => {
      try {
        for await (const chunk of response.stream) {
          const chunkText = chunk.text();
          accumulatedText += chunkText;
          await writer.write(new TextEncoder().encode(chunkText));
        }
        await writer.close();
      } catch (error) {
        console.error("Streaming error:", error);
        await writer.abort(error);
      }
    })();

    // Return the streaming response
    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return Response.json(
      { message: "Failed to fetch resources." },
      { status: 500 }
    );
  }
}
