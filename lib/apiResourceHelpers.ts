import { fetchYouTubeVideoForStep, fetchGitHubRepos, fetchBlogArticles } from "./resourceFetchers";
import { generateRoadmap } from "./roadmapGenerator";
import { NextResponse } from "next/server";

export async function validateTopicInput(req: Request): Promise<{ topic: string } | { error: any }> {
  try {
    const body = await req.json();
    const topic = body.topic;
    if (!topic || typeof topic !== "string" || topic.trim().length === 0) {
      return { error: NextResponse.json({ error: "A valid 'topic' string is required in the request body." }, { status: 400 }) };
    }
    return { topic: topic.trim() };
  } catch (error) {
    return { error: NextResponse.json({ error: "Invalid request format." }, { status: 400 }) };
  }
}

export async function fetchAllResources(topic: string) {
  return Promise.all([
    fetchGitHubRepos(topic),
    fetchBlogArticles(`${topic} learning resources from begineer for advance`),
    generateRoadmap(topic)
  ]);
}

export async function enrichStepsWithYouTube(topic: string, roadmapSteps: any[]) {
  return Promise.all(
    roadmapSteps.map(async (step) => {
      const enrichedStep = { ...step, resources: [...step.resources] };
      try {
        const videoSearchQuery = `${topic} ${step.title} tutorial for beginners`;
        const videoUrl = await fetchYouTubeVideoForStep(videoSearchQuery);
        if (videoUrl) {
          enrichedStep.resources.push(`Video Tutorial: [Watch on YouTube](${videoUrl})`);
        }
      } catch (ytError) {
        // Log error but do not fail
      }
      return enrichedStep;
    })
  );
}

export async function saveRoadmapHistory(supabase: any, user: any, topic: string, stepsWithVideos: any[], githubRepos: any, blogArticles: any) {
  try {
    if (user?.id) {
      const { error: insertError } = await supabase
        .from('roadmap_history')
        .insert([
          {
            user_id: user.id,
            topic,
            roadmap: { steps: stepsWithVideos },
            resources: {
              github: githubRepos,
              blogs: blogArticles
            }
          }
        ]);
      if (insertError) {
        // Log error but do not block response
      }
    }
  } catch (historyError) {
    // Log error but do not block response
  }
}