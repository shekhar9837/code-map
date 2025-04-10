"use client";



import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Box, Github, Youtube } from "lucide-react";
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
import LoadingView from "@/components/LoadingView";
import toast from "react-hot-toast";
import { RoadmapData, Step } from "@/lib/types";
import { extractLinks } from "@/lib/helper";
import { useAuth } from "@/hooks/useAuth";


export default function Home() {
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
  const [blogsLinks, setBlogsLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);

  const { loading, user } = useAuth();

  console.log("user", user); // Debug log

  // console.log("blogsLinks", blogsLinks); // Debug log

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
    if (!user) {
      toast.error("Please login to continue");
      // window.location.href = "/login";
      return;
    }
    setIsLoading(true);
    setIsSearching(true);
    setResources("");

    try {
      const response = await axios.post("/api/fetchResources", { topic });
      console.log("response", response.data);

      setBlogsLinks(response.data.resources.blogs || []);
      console.log("blogs", response.data.resources.blogs || []);


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
      }
      );
    } catch (error) {
      console.error("Error fetching resources:", error);

      // Get error message from axios error response if available
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : "An error occurred while fetching resources.";

      // Show error toast
      toast.error(errorMessage);

      // Set error in resources state
      setResources("");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }


  // Add a function to handle the submit action
  // const handleSubmit = () => {
  //   if (!user) {
  //     toast.error("Please login to continue");
  //     window.location.href = "/login";
  //     return;
  //   }
  //   fetchResources(topic);
  // };

  // Add useEffect to check auth status on mount
  // useEffect(() => {
  //   if (loading) return;
  //   if (!user) {
  //     // Optional: Redirect if trying to access directly
  //     window.location.href = "/";
  //   }
  // }, [user, loading]);


  return (
    // <div className="w-full">
      <main className="py-6 md:py-10 px-8 w-full ">
        {isLoading ? (
          <LoadingView />
        ) : !resources ? (
          // Show PromptInput only when there's no data
          <div className="w-full pt-28 max-w-3xl mx-auto flex items-center justify-center flex-col">
            <h2 className="text-5xl font-semibold pb-12 text-center text-slate-100">
              What tech skill do you <br />want to learn?
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

            <div className="mt-6 flex md:flex-row flex-col flex-wrap gap-2 items-center justify-center">
              <span className="text-sm text-slate-300">Popular searches: </span>
              {recentTopics.map((t) => (
                <Badge
                  key={t}
                  variant="secondary"
                  className="cursor-pointer px-8 py-2 mx-1 bg-transparent text-slate-100 border border-gray-700 gap-2 flex flex-wrap tracking-wider"
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
              {/* Blogs section */}
              <div className="space-y-6">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                  <Book className="h-5 w-5 text-red-500" />
                  Blogs to read
                  {isLoading && (
                    <span className="text-sm text-muted-foreground ml-2">
                      (Loading...)
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {blogsLinks.length > 0 ? (
                    blogsLinks.map((item, index) => (
                      <a
                        key={index}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block space-y-2 transition-transform hover:scale-105"
                      >
                        <div className="relative overflow-hidden rounded-lg  ">
                          <img
                            src={item.thumbnail || `https://s2.googleusercontent.com/s2/favicons?domain_url=${item.url}`}
                            alt={item.thumbnail || `Blog Thumbnail ${index + 1}`}
                            className="w-full object-cover transition-transform group-hover:scale-110"
                            style={{ aspectRatio: "16/9" }}
                          />
                          {/* <p>Blog {index}</p> */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {item?.thumbnail}
                        </p>
                      </a>
                    ))
                  ) : (
                    <p className="text-slate-200 col-span-3 text-center py-8">
                      No blogs found. Try searching for a different topic.
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


                </Tabs>
              </Card>
            </div>
          </div>)}


      </main>
    // </div>
  );
}
