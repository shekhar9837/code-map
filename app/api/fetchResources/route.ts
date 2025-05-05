
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from 'next/headers';
import { ratelimit } from "@/lib/rateLimit";
import { validateTopicInput, fetchAllResources, enrichStepsWithYouTube, saveRoadmapHistory } from "@/lib/apiResourceHelpers";

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const identifier = ip;
  const { success } = await ratelimit.limit(identifier);
  if (!success) {
    console.warn("Rate limit exceeded for identifier:", identifier);
    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
  }
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const input = await validateTopicInput(req);
    if ('error' in input) return input.error;
    const topic = input.topic;
    const [githubRepos, blogArticles, roadmapSteps] = await fetchAllResources(topic);
    if (!roadmapSteps || roadmapSteps.length === 0) {
      return NextResponse.json({ error: "Failed to generate meaningful roadmap steps. Please try a different topic or refine your query." }, { status: 500 });
    }
    const stepsWithVideos = await enrichStepsWithYouTube(topic, roadmapSteps);
    await saveRoadmapHistory(supabase, user, topic, stepsWithVideos, githubRepos, blogArticles);
    return NextResponse.json({
      roadmap: { steps: stepsWithVideos },
      resources: { github: githubRepos, blogs: blogArticles }
    }, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    });
  } catch (error) {
    let statusCode = 500;
    let errorMessage = "An internal server error occurred.";
    if (error instanceof Error) {
      if (error.message.includes("Failed to generate or parse roadmap")) {
        errorMessage = "Could not generate the learning roadmap. The AI might be unavailable or the topic too complex. Please try again later or refine your topic.";
        statusCode = 503;
      } else if (error instanceof SyntaxError && error.message.includes("JSON")) {
        errorMessage = "Invalid request format.";
        statusCode = 400;
      }
    }
    return NextResponse.json({
      error: errorMessage,
      details: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.message : undefined
    }, { status: statusCode });
  }
}


