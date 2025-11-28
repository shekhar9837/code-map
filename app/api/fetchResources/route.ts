
import { NextRequest, NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/middleware/api-handler';
import { ResourceService } from '@/lib/services/resource.service';
import { resourceSchemas } from '@/lib/validations/resource.validations';
import { validateRequest } from '@/lib/utils/validation';
import { Database } from '@/lib/types/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { RoadmapStep } from '@/lib/types';

const resourceService = ResourceService.getInstance();

type ResourceResponse = {
  roadmap: {
    steps: Array<{
      id: string;
      title: string;
      description: string;
      order: number;
      videoUrl?: string;
      // Add other step properties as needed
    }>;
  };
  resources: {
    github: Array<{
      id: string;
      name: string;
      description: string;
      // Add other GitHub properties as needed
    }>;
    blogs: Array<{
      id: string;
      title: string;
      url: string;
      // Add other blog properties as needed
    }>;
  };
};

const handler = async ({
  req,
  user,
  supabase,
}: {
  req: NextRequest;
  user: { id: string };
  supabase: ReturnType<typeof createRouteHandlerClient<Database>>;
}) => {
  const body = await req.json();
  const { topic } = validateRequest(resourceSchemas.fetchResources, body);

  const { githubRepos = [], blogArticles = [], roadmapSteps = [] } = await resourceService.fetchResources(topic);

  // Process and format the data according to the ResourceResponse type
  const response: ResourceResponse = {
    roadmap: {
      steps: await Promise.all(roadmapSteps.map(async (step: RoadmapStep, index: number) => {
        const videoSearchQuery = `${topic} ${step.title} tutorial for beginners`;
        const videoUrl = await resourceService.fetchYouTubeVideoForStep(videoSearchQuery);
        
        return {
          id: `step-${index + 1}`,
          title: step.title,
          description: step.description,
          order: index + 1,
          ...(videoUrl && { videoUrl })
        };
      })),
    },
    resources: {
      github: Array.isArray(githubRepos) ? githubRepos.map((repo: string | { id?: string | number; name?: string; description?: string }) => {
        // Handle both string URLs and object formats
        if (typeof repo === 'string') {
          return {
            id: `repo-${Math.random().toString(36).substr(2, 9)}`,
            name: 'Repository',
            description: repo
          };
        }
        return {
          id: repo.id?.toString() || `repo-${Math.random().toString(36).substr(2, 9)}`,
          name: repo.name || 'Unnamed Repository',
          description: repo.description || 'No description available'
        };
      }) : [],
      blogs: Array.isArray(blogArticles) ? blogArticles.map((article: { id?: string; title?: string; url?: string }, index: number) => ({
        id: article.id || `blog-${index}`,
        title: article.title || 'Untitled Article',
        url: article.url || '#'
      })) : []
    },
  };

  return NextResponse.json(response, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
};

// Use the withApiHandler middleware
export const POST = withApiHandler(handler);
