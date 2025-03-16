"use client";
// Add this interface near the top with other interfaces
interface ValidatedResources {
  youtubeVideos: Array<{ title: string; url: string }>;
  githubRepositories: Array<{ title: string; url: string }>;
  blogArticles: Array<{ title: string; url: string }>;
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
}
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from "rehype-highlight";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Github, LogOut, Search, Youtube } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import RoadmapView from '@/components/ui/roadmap-view';
import axios from 'axios'
import { StepCard } from '@/components/ui/step-card';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [topic, setTopic] = useState("");
  // const [resources, setResources] = useState<any>("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const [recentTopics, setRecentTopics] = useState<string[]>([
    "React",
    "TypeScript",
    "Next.js",
  ]);

  
  const [resources, setResources] = useState<RoadmapData | string>("");
  console.log("resources", resources);
  console.log("topic", topic);

  const [youtubeLinks, setYoutubeLinks] = useState<{url: string; thumbnail: string}[]>([]);
  const [githubLinks, setGithubLinks] = useState<{url: string; thumbnail: string}[]>([]);

  useEffect(() => {
    async function processLinks() {
      const { youtubeLinks: yl, githubLinks: gl } = await extractLinks(resources);
      setYoutubeLinks(yl);
      setGithubLinks(gl);
    }
    processLinks();
  }, [resources]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Update the type for resources state
  
  async function fetchResources(topic: string) {
    setIsLoading(true);
    setResources("");
  
    try {
      const response = await axios.post("/api/fetchResources", { topic });
      
      // Extract the JSON string from the markdown code block
      const jsonMatch = response.data.match(/```json\n([\s\S]*?)\n```/);
      
      if (jsonMatch && jsonMatch[1]) {
        // Parse the JSON string
        const parsedData = JSON.parse(jsonMatch[1]);
        
        if (parsedData && Array.isArray(parsedData.steps)) {
          // Type check and transform the response data
          const typedSteps: Step[] = parsedData.steps.map((step: any) => ({
            id: String(step.id),
            title: String(step.title),
            duration: String(step.duration),
            description: String(step.description),
            resources: Array.isArray(step.resources) ? step.resources.map(String) : [],
            practice: Array.isArray(step.practice) ? step.practice.map(String) : [],
            validatedResources: {
              youtubeVideos: Array.isArray(step.validatedResources?.youtubeVideos) 
                ? step.validatedResources.youtubeVideos.map((v: any) => ({
                    title: String(v.title),
                    url: String(v.url)
                  }))
                : [],
              githubRepositories: Array.isArray(step.validatedResources?.githubRepositories)
                ? step.validatedResources.githubRepositories.map((r: any) => ({
                    title: String(r.title),
                    url: String(r.url)
                  }))
                : [],
              blogArticles: Array.isArray(step.validatedResources?.blogArticles)
                ? step.validatedResources.blogArticles.map((a: any) => ({
                    title: String(a.title),
                    url: String(a.url)
                  }))
                : []
            }
          }));
        
          // Set resources with properly typed data
          setResources({ steps: typedSteps });
          // Update recent topics
          setRecentTopics(prev => {
            const newTopics = [topic, ...prev.filter(t => t !== topic)].slice(0, 5);
            return newTopics;
          });
        } else {
          throw new Error("Invalid data structure in response");
        }
      } else {
        throw new Error("Could not extract JSON from response");
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources(error instanceof Error ? error.message : "An error occurred while fetching resources.");
    } finally {
      setIsLoading(false);
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

      const processString = async (text: string) => {
        const youtubeMatch = text.match(/\[.*?\]\((https:\/\/(?:www\.)?youtube\.com\/.*?)\)/);
        if (youtubeMatch) {
          const url = youtubeMatch[1];
          const thumbnail = await getYouTubeThumbnail(url);
          if (thumbnail) {
            youtubeLinks.push({ url, thumbnail });
          }
        }

        const githubMatch = text.match(/\[.*?\]\((https:\/\/github\.com\/.*?)\)/);
        if (githubMatch) {
          const url = githubMatch[1];
          const thumbnail = await getGitHubThumbnail(url);
          if (thumbnail) {
            githubLinks.push({ url, thumbnail });
          }
        }
      };

      // Handle structured data
      if (typeof data === 'object' && 'steps' in data) {
        const roadmap = data as RoadmapData;
        for (const step of roadmap.steps) {
          if (step.subSteps) {
            for (const subStep of step.subSteps) {
              if (subStep.includes('Resource:')) {
                await processString(subStep);
              }
            }
          }
        }
      } else if (typeof data === 'string') {
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(data);
          if (parsed.steps) {
            return extractLinks(parsed);
          }
        } catch {
          // Handle as plain text if parsing fails
          const lines = data.split("\n");
          for (const line of lines) {
            await processString(line);
          }
        }
      }

      return { youtubeLinks, githubLinks };
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
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
        );

        if (!response.ok) {
            console.log("Failed to fetch video data:", url);
            return null;
        }

        const data = await response.json();
        if (!data.items || data.items.length === 0) {
            console.log("Video not found or unavailable:", url);
            return null;
        }

        const video = data.items[0];
        const publishedAt = new Date(video.snippet.publishedAt);
        const viewCount = parseInt(video.statistics.viewCount);
        const likeCount = parseInt(video.statistics.likeCount);

        // Validate video criteria
        const isRecent = (new Date().getTime() - publishedAt.getTime()) < (2 * 365 * 24 * 60 * 60 * 1000); // 2 years
        const hasEnoughViews = viewCount > 10000;
        const hasGoodEngagement = likeCount > 100;

        if (!isRecent || !hasEnoughViews || !hasGoodEngagement) {
            console.log("Video doesn't meet quality criteria:", url);
            return null;
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
        
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}`,
            {
                headers: githubToken ? {
                    Authorization: `token ${githubToken}`
                } : {}
            }
        );

        if (!response.ok) {
            console.log("Failed to fetch repository data:", url);
            return null;
        }

        const data = await response.json();
        const lastUpdate = new Date(data.updated_at);
        const isRecent = (new Date().getTime() - lastUpdate.getTime()) < (180 * 24 * 60 * 60 * 1000); // 6 months
        const hasEnoughStars = data.stargazers_count >= 500;
        const isNotArchived = !data.archived;

        if (!isRecent || !hasEnoughStars || !isNotArchived) {
            console.log("Repository doesn't meet quality criteria:", url);
            return null;
        }

        return `https://opengraph.githubassets.com/1/${repoPath}`;
    } catch (e) {
        console.error("Error getting GitHub thumbnail:", e);
        return null;
    }
}

  async function isValidURL(url: string) {
  try {
    if (!url) {
      console.error('No URL provided');
      return false;
    }

    const response = await fetch('/api/validateUrl', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      console.error('API response not ok:', response.status);
      return false;
    }

    const data = await response.json();
    
    if (!data) {
      console.error('No data received from API');
      return false;
    }

    return data.isValid === true;

  } catch (error) {
    console.error('Error checking URL validity:', error);
    return false;
  }
}

// Update formatResourcesAsMarkdown function
function formatResourcesAsMarkdown(data: RoadmapData | string): string {
  try {
    // If it's already a string, return it
    if (typeof data === 'string') {
      return data;
    }

    // For objects, ensure it's a valid roadmap
    if (data && 'steps' in data) {
      let markdown = `# ✨ Learning Path for ${topic}\n\n`;

      data.steps.forEach((step) => {
        markdown += `## ${step.title}\n`;
        markdown += `**Duration:** ${step.duration}\n\n`;
        markdown += `${step.description}\n\n`;
        
        if (step.subSteps?.length) {
          step.subSteps.forEach((subStep) => {
            if (subStep.startsWith('Resource:')) {
              // Remove the Resource: prefix for cleaner display
              markdown += `- ${subStep.replace('Resource:', '📚')}\n`;
            } else {
              markdown += `- ${subStep}\n`;
            }
          });
          markdown += '\n';
        }
      });

      return markdown;
    }

    // If it's an object but not a roadmap, stringify it properly
    return JSON.stringify(data, null, 2);
  } catch (e) {
    console.error("Error formatting content:", e);
    return String(data);
  }
}

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 w-full ">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">CodePath</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <p className="text-sm text-muted-foreground">
                Signed in as {user?.user_metadata.full_name}
                {/* Signed in as {user?.user_metadata.email} */}
              </p>
            </div>
            <Avatar className="h-8 w-8 border">
              <AvatarImage
                src={user?.user_metadata?.avatar_url}
                alt={user?.email || ""}
              />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <Button onClick={handleLogout} variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className=" py-6 md:py-10 px-8 w-full">
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Learning Resources</CardTitle>
                <CardDescription>
                  Enter a topic you want to learn and we'll create a
                  personalized learning path
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Enter topic you want to learn"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && fetchResources(topic)
                      }
                    />
                  </div>
                  <Button
                    onClick={() => fetchResources(topic)}
                    disabled={isLoading}
                  >
                    {isLoading ? "Generating..." : "Generate Path"}
                  </Button>
                </div>
              </CardContent>
              <CardFooter className="flex-wrap gap-2 border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  Recent topics:
                </span>
                {recentTopics.map((t) => (
                  <Badge
                    key={t}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => {
                      setTopic(t);
                      fetchResources(t);
                    }}
                  >
                    {t}
                  </Badge>
                ))}
              </CardFooter>
            </Card>

            <div className="space-y-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                Video Tutorials
                {isLoading && <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-40 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))
                ) : youtubeLinks.length > 0 ? (
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
                          style={{ aspectRatio: '16/9' }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{url.split('watch?v=')[1]}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-3 text-center py-8">
                    No video tutorials found. Try searching for a different topic.
                  </p>
                )}
              </div>

              <h2 className="text-lg font-bold flex items-center gap-2 mt-8">
                <Github className="h-5 w-5 text-purple-500" />
                GitHub Repositories
                {isLoading && <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-40 w-full rounded-lg" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ))
                ) : githubLinks.length > 0 ? (
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
                          style={{ aspectRatio: '16/9' }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{url.split('github.com/')[1]}</p>
                    </a>
                  ))
                ) : (
                  <p className="text-muted-foreground col-span-3 text-center py-8">
                    No GitHub repositories found. Try searching for a different topic.
                  </p>
                )}
              </div>
            </div>

            <Card className="overflow-hidden">
              <Tabs defaultValue="formatted" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="formatted">Formatted</TabsTrigger>
                  <TabsTrigger value="markdown">Markdown</TabsTrigger>
                  <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                </TabsList>
                <TabsContent value="formatted" className="m-0">
                  <div className="p-6">
                    <h1 className="text-3xl font-bold mb-6">✨ Learning Path for {topic}</h1>
                    <p className="text-muted-foreground mb-6">
                      🎯 Resource Summary: {youtubeLinks.length} Videos · {githubLinks.length} Repositories
                    </p>
                    {/* {typeof resources === 'object' && 'steps' in resources ? ( */}
                    { resources && typeof resources === 'object' && 'steps' in resources &&
                      resources.steps.map((step) => (
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
                      ))
                    } 
                    {/* ) : (
                      <pre className="bg-muted p-4 rounded-lg">
                        {typeof resources === 'string' ? resources : JSON.stringify(resources, null, 2)}
                      </pre>
                    )} */}
                  </div>
                </TabsContent>
                <TabsContent value="markdown" className="m-0">
                  <pre className="p-6 overflow-auto bg-muted/50 text-sm">
                    {formatResourcesAsMarkdown(resources)}
                  </pre>
                </TabsContent>
                <TabsContent value="roadmap" className="m-0">
                  <div className="p-6">
                    <RoadmapView content={formatResourcesAsMarkdown(resources)} />
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Learning Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Topics Explored</span>
                    <span className="font-medium">{recentTopics.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Generated</span>
                    <span className="font-medium">{recentTopics[0]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Types</CardTitle>
                <CardDescription>
                  What you'll find in your learning path
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                      <Youtube className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="font-medium">Video Tutorials</p>
                      <p className="text-sm text-muted-foreground">
                        Curated YouTube playlists
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">Blog Articles</p>
                      <p className="text-sm text-muted-foreground">
                        In-depth reading material
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                      <Github className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">GitHub Repositories</p>
                      <p className="text-sm text-muted-foreground">
                        Code examples and projects
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
