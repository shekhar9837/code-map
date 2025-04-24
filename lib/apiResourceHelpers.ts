import { fetchYouTubeVideoForStep, fetchGitHubRepos, fetchBlogArticles, BlogArticle } from "./resourceFetchers";
import { generateRoadmap } from "./roadmapGenerator";
import { NextResponse } from "next/server";
import { RoadmapStep, RoadmapData } from "./types";
import { SupabaseClient, User } from '@supabase/supabase-js';

export async function validateTopicInput(req: Request): Promise<{ topic: string } | { error: NextResponse }> {
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

export async function fetchAllResources(topic: string): Promise<[string[], string[], RoadmapStep[]]> {
  const [githubRepos, blogArticles, roadmapSteps] = await Promise.all([
    fetchGitHubRepos(topic),
    fetchBlogArticles(`${topic} learning resources from begineer for advance`),
    generateRoadmap(topic)
  ]);

  // Convert BlogArticle[] to string[]
  const blogUrls = blogArticles.map(article => article.url);
  
  return [githubRepos, blogUrls, roadmapSteps];
}

export async function enrichStepsWithYouTube(topic: string, roadmapSteps: RoadmapStep[]): Promise<RoadmapStep[]> {
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

export async function saveRoadmapHistory(
  supabase: SupabaseClient,
  user: User | null,
  topic: string,
  stepsWithVideos: RoadmapStep[],
  githubRepos: string[],
  blogArticles: string[]
): Promise<void> {
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