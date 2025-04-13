'use client'
import BlogsCard from "@/components/BlogsCard";
import GithubCard from "@/components/GithubCard";
import LoadingView from "@/components/LoadingView";
import RoadmapCard from "@/components/RoadmapCard";
import { Button } from "@/components/ui/button";
import YoutubeVideoCard from "@/components/YoutubeVideoCard";
import { HistoryItem, RoadmapData } from "@/lib/types";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { extractLinks } from "@/lib/helper";
import { set } from "react-hook-form";

export default function Page({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resources, setResources] = useState<RoadmapData | string>("");
  const [youtubeLinks, setYoutubeLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [githubLinks, setGithubLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [blogsLinks, setBlogsLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
  const [topic, setTopic] = useState("");
  const [historyData, setHistoryData] = useState<HistoryItem | null>(null);
  // console.log('historyData', historyData); // Debug log

  useEffect(() => {
    fetchHistory()
  }, [])

  useEffect(() => {
    async function processYoutubeLinks() {
      // console.log("Processing Youtube Links", historyData); // Debug log
      if (historyData?.roadmap) {
        const { youtubeLinks, githubLinks } = await extractLinks({
          steps: historyData.roadmap.steps,
          resources: historyData.resources
        });
        setYoutubeLinks(youtubeLinks);
        setGithubLinks(githubLinks);
        // console.log("Extracted links:", { youtubeLinks }); // Debug log
      }
    }
    if (historyData) {
      processYoutubeLinks();
    }
  }, [historyData]);

  async function fetchHistory() {

    setIsLoading(true);
    setIsSearching(true);
    setResources("");

    try {
      const response = await axios(`/api/user-history/${params.id}`)
      const historyItem = response.data.history[0]; // Get the first history item
      setHistoryData(historyItem);
      // console.log("historyItem", historyItem); // Debug log
// 
      // Format the data to match our expected structure
      let result;
      if (historyItem && historyItem.roadmap) {
        // Handle the case where data is returned with a 'roadmap' key
        result = {
          steps: historyItem.roadmap?.steps,
          resources: historyItem.resources // Pass along the additional resources if present
        };
      } else {
        // Handle direct data format
        result = historyItem;
      }
      // Set resources with roadmap data and null checks
      setResources(result);
      setBlogsLinks(historyItem.resources.blogs || []);


    } catch (error) {
      console.error("Error fetching history:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : "An error occurred while fetching history.";
      toast.error(errorMessage);
      setResources("");
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  }


  if (isLoading) return <div className="py-6 md:py-10 px-8 w-full "><LoadingView /></div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="py-6 md:py-10 px-8 w-full ">

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
      </div>
    </div>


  )
}
