'use client'
import BlogsCard from "@/components/BlogsCard";
import GithubCard from "@/components/GithubCard";
import RoadmapCard from "@/components/RoadmapCard";
import { Button } from "@/components/ui/button";
import YoutubeVideoCard from "@/components/YoutubeVideoCard";
import { RoadmapData } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface PaginationInfo {
    page: number
    limit: number
    total: number
    totalPages: number
}

export default function Page({ params }: { params: { id: string } }) {
    const [history, setHistory] = useState<[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
    })
      const [resources, setResources] = useState<RoadmapData | string>("");
      const [youtubeLinks, setYoutubeLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
      const [githubLinks, setGithubLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
      const [isSearching, setIsSearching] = useState(false);
      const [blogsLinks, setBlogsLinks] = useState<Array<{ url: string; thumbnail: string }>>([]);
      const [topic, setTopic] = useState("");

    
    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            setIsLoading(true)
            setError(null)
            const response = await fetch(`/api/user-history/${params.id}`)
            if (!response.ok) throw new Error('Failed to fetch history')
            const data = await response.json()
            console.log(" history: ", data.history)

            setHistory(data.history || [])
            console.log(data.history?.resources?.blogs || []);
            setBlogsLinks(data.history?.resources?.blogs || []);
            let result;
            if (data && data.roadmap) {
              // Handle the case where data is returned with a 'roadmap' key
              result = {
                steps: data.roadmap.steps,
                resources: data.resources // Pass along the additional resources if present
              };
            } else {
              // Handle direct data format
              result = data;
            }
      
            // Set resources
            setResources(result);

        } catch (err) {
            console.error("Error fetching history:", err)
            setError(err instanceof Error ? err.message : 'Failed to load history')
        } finally {
            setIsLoading(false)
        }
    }


    if (isLoading) return <div>Loading...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <div>
            <h1>History for ID: {params.id}</h1>
            <div className="container mx-auto">
          {/* Add a back button to return to search */}
          <Button
            variant="ghost"
            className="mb-6"
            
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
