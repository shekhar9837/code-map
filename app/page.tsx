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
import YoutubeVideoCard from "@/components/YoutubeVideoCard";
import BlogsCard from "@/components/BlogsCard";
import GithubCard from "@/components/GithubCard";
import RoadmapCard from "@/components/RoadmapCard";


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
            <YoutubeVideoCard
              isLoading={isLoading}
              youtubeLinks={youtubeLinks}
            />
            {/* Blogs section */}
            <BlogsCard
              isLoading={isLoading}
              blogsLinks={blogsLinks}
            />

            {/* GitHub section */}
            <GithubCard
              isLoading={isLoading}
              githubLinks={githubLinks}
            />

            {/* Roadmap card */}
            <RoadmapCard
              topic={topic}
              youtubeLinks={youtubeLinks}
              githubLinks={githubLinks}
              resources={resources}
            />
          </div>
        </div>)}


    </main>
    // </div>
  );
}
