"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, Square } from "lucide-react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import LoadingView from "@/components/LoadingView";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recentTopics, setRecentTopics] = useState<string[]>([
    "React",
    "TypeScript",
    "Next.js",
  ]);

  const { loading, user } = useAuth();
  const router = useRouter();

  async function fetchResources(topic: string) {
    // Check if topic is provided
    if (!topic.trim()) {
      toast.error("Please enter a topic");
      return;
    }

    // Check if user is logged in - ask to login when entering a prompt
    if (!user) {
      toast.error("Please login to generate your learning roadmap", {
        duration: 4000,
        icon: "🔐",
      });
      // Small delay to show the toast before redirecting
      setTimeout(() => {
        router.push("/login");
      }, 500);
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/api/fetchResources", { topic });

      // Update recent topics
      setRecentTopics((prev) => {
        const newTopics = [topic, ...prev.filter((t) => t !== topic)].slice(0, 5);
        return newTopics;
      }
      );

      // Dispatch event to update sidebar
      window.dispatchEvent(new Event('historyUpdated'));

      // Redirect to roadmap page
      router.push(`/roadmap/${encodeURIComponent(topic)}`);
      
    } catch (error) {
      console.error("Error fetching resources:", error);

      // Get error message from axios error response if available
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : "An error occurred while fetching resources.";

      // Show error toast
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }




  return (
    <main className="home-page">
      {isLoading ? (
        <LoadingView />
      ) : (
        <div className="home-hero">
          <h2 className="home-title">
            What tech skill do you <br />want to learn?
          </h2>
          
          <PromptInput
            value={topic}
            onValueChange={setTopic}
            isLoading={isLoading}
            onSubmit={() => fetchResources(topic)}
            className="home-prompt"
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

          <div className="home-popular">
            <span className="text-sm  font-light text-slate-300">Popular searches: </span>
            {recentTopics.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                className="home-topic-badge text-xs font-light cursor-pointer bg-transparent text-slate-100 border border-gray-700 gap-2 flex flex-wrap tracking-wider"
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
      )}
    </main>
  );
}
