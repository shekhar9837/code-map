"use client";

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
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

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [topic, setTopic] = useState("React");
  const [resources, setResources] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient();
  const [recentTopics, setRecentTopics] = useState<string[]>([
    "React",
    "TypeScript",
    "Next.js",
  ]);
  console.log("resources", resources);
  const { youtubeLinks, githubLinks } = extractLinks(resources);
  console.log("youtubeLinks", youtubeLinks);
  console.log("githubLinks", githubLinks);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  async function fetchResources(topic: string) {
    setIsLoading(true);
    setResources("");

    try {
      const response = await fetch("/api/fetchResources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode the chunk and append to resources
        const text = decoder.decode(value, { stream: true });
        setResources((prev) => prev + text);
      }

      // Final decode to flush any remaining bytes
      decoder.decode(undefined, { stream: false });
    } catch (error) {
      console.error("Error fetching resources:", error);
      setResources("An error occurred while fetching resources.");
    } finally {
      setIsLoading(false);
    }
  }

  function extractLinks(jsonString: string) {
    try {
      if (!jsonString) {
        console.log("Empty jsonString received");
        return { youtubeLinks: [], githubLinks: [] };
      }

      console.log("Processing raw string:", jsonString);

      // Split the string into lines and process only YouTube and GitHub links
      const lines = jsonString.split("\n");
      const youtubeLinks: { url: string; thumbnail: string }[] = [];
      const githubLinks: { url: string; thumbnail: string }[] = [];

      lines.forEach((line) => {
        // Extract YouTube links
        const youtubeMatch = line.match(
          /\[.*?\]\((https:\/\/(?:www\.)?youtube\.com\/.*?)\)/
        );
        if (youtubeMatch) {
          const url = youtubeMatch[1];
          const thumbnail = getYouTubeThumbnail(url);
          if (thumbnail) {
            youtubeLinks.push({ url, thumbnail });
          }
        }

        // Extract GitHub links
        const githubMatch = line.match(
          /\[.*?\]\((https:\/\/github\.com\/.*?)\)/
        );
        if (githubMatch) {
          const url = githubMatch[1];
          const thumbnail = getGitHubThumbnail(url);
          githubLinks.push({ url, thumbnail });
        }
      });

      console.log("Extracted links:", { youtubeLinks, githubLinks });
      return { youtubeLinks, githubLinks };
    } catch (e) {
      console.error("Error in extractLinks:", e);
      return { youtubeLinks: [], githubLinks: [] };
    }
  }

  function getYouTubeThumbnail(url: string) {
    try {
      const videoIdMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
      );
      if (!videoIdMatch) return null;
      return `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
    } catch (e) {
      console.error("Error getting YouTube thumbnail:", e);
      return null;
    }
  }

  function getGitHubThumbnail(url: string) {
    try {
      const repoPath = url.replace("https://github.com/", "");
      return `https://opengraph.githubassets.com/1/${repoPath}`;
    } catch (e) {
      console.error("Error getting GitHub thumbnail:", e);
      return null;
    }
  }

  function formatResourcesAsMarkdown(jsonString: string) {
    try {
      let markdown = jsonString;
      const { youtubeLinks, githubLinks } = extractLinks(jsonString);

      let formattedContent = `
# ✨ Learning Path for ${topic}

> 🎯 **Resource Summary:** ${youtubeLinks.length} Videos · ${
        githubLinks.length
      } Repositories



${
  markdown
  // .replace(/\*\*/g, "✨**")
  // .replace(/^#\s/gm, "# 🎯 ")
  // .replace(/^##\s/gm, "## 📌 ")
  // .replace(/^###\s/gm, "### 🔍 ")
  // .replace(/\*(.*?)\*/g, "🔸 *$1*")
}
`;

      return formattedContent;
    } catch (e) {
      console.error("Error formatting content:", e);
      return jsonString;
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
              <h2 className="text-lg font-bold">YouTube Playlists</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {youtubeLinks.map(
                  ({ url, thumbnail }) =>
                    thumbnail && (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <img
                          src={thumbnail}
                          alt="YouTube Thumbnail"
                          className="rounded-lg shadow-md"
                        />
                      </a>
                    )
                )}
              </div>

              <h2 className="text-lg font-bold">GitHub Repositories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {githubLinks.map(({ url, thumbnail }) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={thumbnail}
                      alt="GitHub Thumbnail"
                      className="rounded-lg shadow-md"
                    />
                  </a>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden">
              <Tabs defaultValue="formatted">
                <div className="border-b px-4">
                  <TabsList className="w-full justify-start rounded-none border-b-0 p-0">
                    <TabsTrigger
                      value="formatted"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      Formatted View
                    </TabsTrigger>
                    {/* <TabsTrigger
                      value="markdown"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary"
                    >
                      Markdown
                    </TabsTrigger> */}
                  </TabsList>
                </div>
                <TabsContent value="formatted" className="m-0">
                  <div className="p-6 prose max-w-none dark:prose-invert">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {formatResourcesAsMarkdown(resources)}
                    </ReactMarkdown>
                  </div>
                </TabsContent>
                <TabsContent value="markdown" className="m-0">
                  <pre className="p-6 overflow-auto bg-muted/50 text-sm">
                    {formatResourcesAsMarkdown(resources)}
                  </pre>
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
