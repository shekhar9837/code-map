"use client";

interface ValidatedResources {
  youtubeVideos?: Array<{ title: string; url: string }>;
  githubRepositories?: Array<{ title: string; url: string }>;
  blogArticles?: Array<{ title: string; url: string }>;
}

interface Step {
  id: string;
  title: string;
  duration: string;
  description: string;
  resources: string[];
  practice: string[];
  validatedResources: ValidatedResources;
}

interface RoadmapData {
  steps: Step[];
  resources?: {
    github?: string[];
    blogs?: string[];
  };
}

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Github, Youtube } from "lucide-react";
import RoadmapView from "@/components/ui/roadmap-view";
import axios from "axios";
import { StepCard } from "@/components/ui/step-card";
import { ArrowUp, Square, X, ArrowLeft } from "lucide-react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import Navbar from "@/components/Navbar";

// Add this component for the loading state
const LoadingView = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-bold flex items-center gap-2">
      <Youtube className="h-5 w-5 text-red-500" />
      Video Tutorials
      <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-40 w-full rounded-lg bg-card" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
    <h2 className="text-lg font-bold flex items-center gap-2">
      <Youtube className="h-5 w-5 text-red-500" />
      Blogs & Repositories
      <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-40 w-full rounded-lg bg-card" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>

    <div className="w-full">
      <Skeleton className="md:min-h-[40vh] h-[50vh] w-full rounded-lg bg-card" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);

export default function Dashboard() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([
    "React",
    "TypeScript",
    "Next.js",
  ]);

  const [resources, setResources] = useState<RoadmapData | string>("");
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [githubLinks, setGithubLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Process the resources when they change
  useEffect(() => {
    async function processLinks() {
      console.log("Processing resources:", resources); // Debug log
      const { youtubeLinks, githubLinks } = await extractLinks(resources);
      console.log("Extracted links:", { youtubeLinks, githubLinks }); // Debug log
      setYoutubeLinks(youtubeLinks);
      setGithubLinks(githubLinks);
    }

    if (resources) {
      processLinks();
    }
  }, [resources]);

  async function fetchResources(topic: string) {
    setIsLoading(true);
    setIsSearching(true);
    setResources("");

    try {
      const response = await axios.post("/api/fetchResources", { topic });
      console.log("response", response.data);
      
      // Format the data to match our expected structure
      let result;
      if (response.data && response.data.roadmap) {
        // Handle the case where data is returned with a 'roadmap' key
        result = {
          steps: response.data.roadmap.steps,
          resources: response.data.resources // Pass along the additional resources if present
        };
      } else {
        // Handle direct data format
        result = response.data;
      }

      // Set resources
      setResources(result);
      
      // Update recent topics
      setRecentTopics((prev) => {
        const newTopics = [topic, ...prev.filter((t) => t !== topic)].slice(0, 5);
        return newTopics;
      });
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching resources."
      );
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }

  async function extractLinks(data: RoadmapData | string) {
    try {
      if (!data) {
        console.log("Empty data received");
        return { youtubeLinks: [], githubLinks: [] };
      }

      const youtubeLinks: { url: string; thumbnail: string }[] = [];
      const githubLinks: { url: string; thumbnail: string }[] = [];

      // Helper function to extract and process YouTube/GitHub URLs from markdown
      const processMarkdownResource = async (resource: string) => {
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const matches = Array.from(resource.matchAll(markdownLinkRegex));

        for (const match of matches) {
          const url = match[2];
          console.log("Processing URL:", url); // Debug log

          if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const thumbnail = await getYouTubeThumbnail(url);
            if (thumbnail) {
              console.log("Added YouTube link:", url);
              youtubeLinks.push({ url, thumbnail });
            }
          } else if (url.includes("github.com")) {
            const thumbnail = await getGitHubThumbnail(url);
            if (thumbnail) {
              console.log("Added GitHub link:", url);
              githubLinks.push({ url, thumbnail });
            }
          }
        }
      };

      // Process data based on format
      if (typeof data === "object") {
        console.log("Processing roadmap data");
        
        // Process steps if available
        if (data.steps && Array.isArray(data.steps)) {
          for (const step of data.steps) {
            // Process markdown resources
            if (step.resources?.length) {
              for (const resource of step.resources) {
                await processMarkdownResource(resource);
              }
            }

            // Process validated resources
            if (step.validatedResources) {
              // Process GitHub repositories as strings
              if (step.validatedResources.githubRepositories?.length) {
                for (const repo of step.validatedResources.githubRepositories) {
                  if (typeof repo === 'string') {
                    // Extract URL from "Explore Here: [AwesomeRepo](https://github.com/...)" format
                    const match = (repo as string).match(/\[(.*?)\]\((.*?)\)/);
                    if (match && match[2].includes('github.com')) {
                      const url = match[2];
                      const thumbnail = await getGitHubThumbnail(url);
                      if (thumbnail) {
                        console.log("Added validated GitHub link:", url);
                        githubLinks.push({ url, thumbnail });
                      }
                    }
                  } else if (typeof repo === 'object' && repo.url) {
                    // Handle object format { title, url }
                    const thumbnail = await getGitHubThumbnail(repo.url);
                    if (thumbnail) {
                      console.log("Added validated GitHub link:", repo.url);
                      githubLinks.push({ url: repo.url, thumbnail });
                    }
                  }
                }
              }

              // Look for YouTube videos in resources that contain "Video: [Watch Here]"
              const videoResources = step.resources?.filter(
                (r) => r.toLowerCase().includes("video:") || r.toLowerCase().includes("watch here")
              ) || [];

              for (const resource of videoResources) {
                await processMarkdownResource(resource);
              }
            }
          }
        }
        
        // Process additional resources if available
        if (data.resources) {
          // Process GitHub links
          if (data.resources.github && Array.isArray(data.resources.github)) {
            for (const url of data.resources.github) {
              const thumbnail = await getGitHubThumbnail(url);
              if (thumbnail) {
                console.log("Added additional GitHub link:", url);
                githubLinks.push({ url, thumbnail });
              }
            }
          }
          
          // Process blog links (some might be GitHub)
          if (data.resources.blogs && Array.isArray(data.resources.blogs)) {
            for (const url of data.resources.blogs) {
              if (url.includes('github.com')) {
                const thumbnail = await getGitHubThumbnail(url);
                if (thumbnail) {
                  githubLinks.push({ url, thumbnail });
                }
              }
            }
          }
        }
      } else if (typeof data === "string") {
        await processMarkdownResource(data);
      }

      // Remove duplicates
      const uniqueYoutubeLinks = Array.from(
        new Map(youtubeLinks.map((item) => [item.url, item])).values()
      );
      const uniqueGithubLinks = Array.from(
        new Map(githubLinks.map((item) => [item.url, item])).values()
      );

      console.log("Extracted links:", {
        youtubeLinks: uniqueYoutubeLinks.length,
        githubLinks: uniqueGithubLinks.length,
      });

      return {
        youtubeLinks: uniqueYoutubeLinks,
        githubLinks: uniqueGithubLinks,
      };
    } catch (e) {
      console.error("Error in extractLinks:", e);
      return { youtubeLinks: [], githubLinks: [] };
    }
  }

  async function getYouTubeThumbnail(url: string) {
    try {
      if (!url) {
        console.log("No URL provided");
        return null;
      }

      const videoIdMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
      );
      if (!videoIdMatch) {
        console.log("Invalid YouTube URL format:", url);
        return null;
      }

      const videoId = videoIdMatch[1];
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      
      // If API key is not available, return a default thumbnail
      if (!apiKey) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
      );

      if (!response.ok) {
        console.log("Failed to fetch video data:", url);
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        console.log("Video not found or unavailable:", url);
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } catch (e) {
      console.error("Error getting YouTube thumbnail:", e);
      return null;
    }
  }

  async function getGitHubThumbnail(url: string) {
    try {
      const repoPath = url.replace("https://github.com/", "");
      if (!repoPath || repoPath === url) {
        console.log("Invalid GitHub URL format:", url);
        return null;
      }

      const [owner, repo] = repoPath.split("/");
      const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

      // If GitHub token is not available, return a default image
      if (!githubToken) {
        return `https://opengraph.githubassets.com/1/${repoPath}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: githubToken
            ? {
                Authorization: `token ${githubToken}`,
              }
            : {},
        }
      );

      if (!response.ok) {
        console.log("Failed to fetch repository data:", url);
        return `https://opengraph.githubassets.com/1/${repoPath}`;
      }

      return `https://opengraph.githubassets.com/1/${repoPath}`;
    } catch (e) {
      console.error("Error getting GitHub thumbnail:", e);
      return null;
    }
  }

  // Function to format roadmap data as Markdown
  function formatResourcesAsMarkdown(data: RoadmapData | string): string {
    try {
      // If it's already a string, return it
      if (typeof data === "string") {
        return data;
      }

      // For objects, ensure it's a valid roadmap
      if (data && "steps" in data) {
        let markdown = `# ✨ Learning Path for ${topic}\n\n`;

        data.steps.forEach((step) => {
          markdown += `## ${step.title}\n`;
          markdown += `**Duration:** ${step.duration}\n\n`;
          markdown += `${step.description}\n\n`;

          if (step.resources?.length) {
            markdown += `### Resources\n`;
            step.resources.forEach((resource) => {
              if (resource.startsWith("Resource:")) {
                // Remove the Resource: prefix for cleaner display
                markdown += `- ${resource.replace("Resource:", "📚")}\n`;
              } else {
                markdown += `- ${resource}\n`;
              }
            });
            markdown += "\n";
          }

          if (step.practice?.length) {
            markdown += `### Practice\n`;
            step.practice.forEach((practice) => {
              markdown += `- ✨ ${practice}\n`;
            });
            markdown += "\n";
          }
        });

        // Include additional resources if present
        if (data.resources) {
          markdown += `## Additional Resources\n\n`;
          
          if (data.resources.github?.length) {
            markdown += `### GitHub Repositories\n`;
            data.resources.github.forEach(url => {
              const repoName = url.replace("https://github.com/", "");
              markdown += `- [${repoName}](${url})\n`;
            });
            markdown += "\n";
          }
          
          if (data.resources.blogs?.length) {
            markdown += `### Blog Articles\n`;
            data.resources.blogs.forEach(url => {
              markdown += `- [${url}](${url})\n`;
            });
            markdown += "\n";
          }
        }

        return markdown;
      }

      // If it's an object but not a roadmap, stringify it properly
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error("Error formatting content:", e);
      return String(data);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar/>

      <main className="py-6 md:py-10 px-8 w-full">
        {isLoading ? (
          <LoadingView />
        ) : !resources ? (
          // Show PromptInput only when there's no data
          <div className="w-full pt-28 max-w-3xl mx-auto flex items-center justify-center flex-col">
            <h2 className="text-5xl font-semibold pb-12 text-center text-slate-100">
            What tech skill do you <br/>want to learn?
            </h2>
            <PromptInput
              value={topic}
              onValueChange={setTopic}
              isLoading={isLoading}
              onSubmit={() => fetchResources(topic)}
              className="w-full max-w-(--breakpoint-md) bg-slide-inset/95 backdrop-blur supports-[backdrop-filter]:bg-slide-inset/60"
            >
              <PromptInputTextarea placeholder="Enter topic you want to learn..." />
              <PromptInputActions className="flex items-center justify-end gap-2 pt-2">
                <PromptInputAction tooltip={isLoading ? "Stop generation" : "Send message"}>
                  <Button
                    variant="default"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => fetchResources(topic)}
                  >
                    {isLoading ? (
                      <Square className="size-5 fill-current" />
                    ) : (
                      <ArrowUp className="size-5" />
                    )}
                  </Button>
                </PromptInputAction>
              </PromptInputActions>
            </PromptInput>

            <div className="mt-8 flex md:flex-row flex-col flex-wrap gap-2 items-center justify-center">
              <span className="text-sm text-slate-300">Popular searches: </span>
              {recentTopics.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="cursor-pointer px-8 py-2 mx-2 bg-transparent text-slate-100 border border-gray-700 gap-2 flex flex-wrap tracking-wider"
                  onClick={() => {
                    setTopic(t);
                    fetchResources(t);
                  }}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          // Show content when data is available
          <div className="container mx-auto">
            {/* Add a back button to return to search */}
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => {
                setResources("");
                setTopic("");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to search
            </Button>

            <div className="space-y-8">
              {/* YouTube section */}
              <div className="space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                  <Youtube className="h-5 w-5 text-red-500" />
                  Video Tutorials
                  {isLoading && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (Loading...)
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {youtubeLinks.length > 0 ? (
                    youtubeLinks.map(({ url, thumbnail }) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block space-y-2 transition-transform hover:scale-105"
                      >
                        <div className="relative overflow-hidden rounded-lg">
                          <img
                            src={thumbnail}
                            alt="Video Thumbnail"
                            className="w-full object-cover transition-transform group-hover:scale-110"
                            style={{ aspectRatio: "16/9" }}
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        {/* <p className="text-sm text-muted-foreground truncate">
                          {/* Extract video ID for display */}
                          {/* {url.includes('watch?v=') 
                            ? url.split('watch?v=')[1]
                            : url.includes('youtu.be/')
                              ? url.split('youtu.be/')[1]
                              : url}
                        </p> */} 
                      </a>
                    ))
                  ) : (
                    <p className="text-slate-200 col-span-3 text-center py-8">
                      No video tutorials found. Try searching for a different
                      topic.
                    </p>
                  )}
                </div>
              </div>

            {/* GitHub section */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mt-8  text-slate-100">
                <Github className="h-5 w-5 text-purple-500" />
                GitHub Repositories
                {isLoading && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (Loading...)
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {githubLinks.length > 0 ? (
                  githubLinks.map(({ url, thumbnail }) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block space-y-2 transition-transform hover:scale-105"
                    >
                      <div className="relative overflow-hidden rounded-lg shadow-md">
                        <img
                          src={thumbnail}
                          alt="Repository Preview"
                          className="w-full object-cover transition-transform group-hover:scale-110"
                          style={{ aspectRatio: "16/9" }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      {/* <p className="text-sm text-muted-foreground truncate">
                        {url.split("github.com/")[1]}
                      </p> */}
                    </a>
                  ))
                ) : (
                  <p className=" text-slate-200 col-span-3 text-center py-8">
                    No GitHub repositories found. Try searching for a different
                    topic.
                  </p>
                )}
              </div>
            </div>

            {/* Roadmap card */}
            <Card className="overflow-hidden bg-background ">
              <Tabs defaultValue="formatted" className="w-full bg-roadmap-mesh">
                <TabsList className="grid w-full grid-cols-1">
                  {/* <TabsTrigger value="formatted">Formatted</TabsTrigger> */}
                  {/* <TabsTrigger value="roadmap">Roadmap</TabsTrigger> */}
                </TabsList>
                <TabsContent value="formatted" className="m-0">
                  <div className="p-6">
                    <h1 className="text-3xl font-bold mb-6">
                      ✨ Learning Path for {topic}
                    </h1>
                    <p className="text-slate-100 mb-6">
                      🎯 Resource Summary: {youtubeLinks.length} Videos ·{" "}
                      {githubLinks.length} Repositories
                    </p>
                    {/* {typeof resources === 'object' && 'steps' in resources ? ( */}
                    {resources &&
                      typeof resources === "object" &&
                      "steps" in resources &&
                      resources.steps.map((step: Step) => (
                      <StepCard
                        key={step.id}
                        id={step.id}
                        title={step.title}
                        duration={step.duration}
                        description={step.description}
                        resources={step.resources}
                        practice={step.practice}
                        validatedResources={step.validatedResources}
                      />
                      ))}
                    {/* ) : (
                 <pre className="bg-muted p-4 rounded-lg">
                   {typeof resources === 'string' ? resources : JSON.stringify(resources, null, 2)}
                 </pre>
               )} */}
                  </div>
                </TabsContent>
              
                {/* <TabsContent value="roadmap" className="m-0">
                  <div className="p-6">
                    <RoadmapView
                      content={resources}
                    />
                  </div>
                </TabsContent> */}
              </Tabs>
            </Card>
          </div>
        </div>        )}

       
      </main>
    </div>
  );
}
