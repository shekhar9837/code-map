'use client'
import { useAuth } from '@/hooks/useAuth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'

export default function Dashboard() {
  const { user, loading } = useAuth()
  const [topic, setTopic] = useState("React")
  const [resources, setResources] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  async function fetchResources(topic: string) {
    setIsLoading(true)
    setResources("")
    
    try {
      const response = await fetch("/api/fetchResources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Convert the chunk to text and append to resources
        const chunk = new TextDecoder().decode(value);
        setResources(prev => prev + chunk);
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setIsLoading(false)
    }
  }

  function formatResourcesAsMarkdown(jsonString: string) {
    try {
      const data = JSON.parse(jsonString);
      let markdown = '# Learning Roadmap\n\n';
      
      data.roadmap.forEach((item: any, index: number) => {
        markdown += `## ${index + 1}. ${item.topic}\n\n`;
        markdown += `### 📺 YouTube Playlist\n${item.youtube_playlist}\n\n`;
        
        markdown += `### 📝 Blog Articles\n`;
        item.blog_articles.forEach((article: string) => {
          markdown += `- ${article}\n`
        });
        markdown += '\n';
        
        markdown += `### 💻 GitHub Repositories\n`;
        item.github_repositories.forEach((repo: string) => {
          markdown += `- ${repo}\n`
        });
        markdown += '\n---\n\n';
      });
      
      return markdown;
    } catch (e) {
      return jsonString; // Return original string if parsing fails
    }
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.email}</h1>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input 
            className="flex-1 p-2 border rounded"
            placeholder='Enter topic you want to learn' 
            value={topic} 
            onChange={(e) => setTopic(e.target.value)}
          />
          <Button 
            onClick={() => fetchResources(topic)}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Fetch Resources'}
          </Button>
        </div>

        {resources && (
          <div className="mt-4 p-4 border rounded bg-gray-50 prose max-w-none dark:prose-invert">
            <ReactMarkdown>
              {formatResourcesAsMarkdown(resources)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}