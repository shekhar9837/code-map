"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import YoutubeVideoCard from "@/components/YoutubeVideoCard";
import BlogsCard from "@/components/BlogsCard";
import GithubCard from "@/components/GithubCard";
import RoadmapCard from "@/components/RoadmapCard";
import { RoadmapData } from "@/lib/types";
import { extractLinks } from "@/lib/helper";
import { useRouter, useParams } from "next/navigation";
import LoadingView from "@/components/LoadingView";

export default function RoadmapPage() {
  const router = useRouter();
  const params = useParams();
  const topic = params.topic as string;
  
  const [resources, setResources] = useState<RoadmapData | string>("");
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [githubLinks, setGithubLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [blogsLinks, setBlogsLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadRoadmap() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/fetchResources`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic })
        });
        
        const data = await response.json();
        
        setBlogsLinks(data.resources.blogs || []);

        let result;
        if (data && data.roadmap) {
          result = {
            steps: data.roadmap.steps,
            resources: data.resources
          };
        } else {
          result = data;
        }

        setResources(result);
      } catch (error) {
        console.error("Error loading roadmap:", error);
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    if (topic) {
      loadRoadmap();
    }
  }, [topic, router]);

  useEffect(() => {
    async function processLinks() {
      const { youtubeLinks, githubLinks } = await extractLinks(resources);
      setYoutubeLinks(youtubeLinks);
      setGithubLinks(githubLinks);
    }

    if (resources) {
      processLinks();
    }
  }, [resources]);

  if (isLoading) {
    return <LoadingView />;
  }

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to search
      </Button>

      <div className="space-y-8">
        <YoutubeVideoCard
          isLoading={isLoading}
          youtubeLinks={youtubeLinks}
        />
        <BlogsCard
          isLoading={isLoading}
          blogsLinks={blogsLinks}
        />
        <GithubCard
          isLoading={isLoading}
          githubLinks={githubLinks}
        />
        <RoadmapCard
          topic={topic}
          youtubeLinks={youtubeLinks}
          githubLinks={githubLinks}
          resources={resources}
        />
      </div>
    </div>
  );
}
