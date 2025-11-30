import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./button";

interface StepCardProps {
  id: string;
  title: string;
  duration: string;
  description: string;
  resources: string[];
  practice: string[];
  validatedResources: {
    youtubeVideos?: Array<{ title: string; url: string }>;
    githubRepositories?: Array<{ title: string; url: string }>;
    blogArticles?: Array<{ title: string; url: string }>;
  };
}

function parseMarkdownLink(text: string) {
  // Parse markdown links [text](url)
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the link
    parts.push(
      <a
        key={match.index}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {match[1]}
      </a>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

// Function to convert string-based resources to object format
function parseResourceStrings(resources: string[], type: string): Array<{ title: string; url: string }> {
  return resources
    .filter(resource => resource.includes(`${type}:`))
    .map(resource => {
      const linkMatch = resource.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        return {
          title: linkMatch[1],
          url: linkMatch[2]
        };
      }
      return { title: resource, url: "" };
    });
}

const ResourceSection = ({ title, items }: { title: string; items: Array<{ title: string; url: string }> }) => (
  items && items.length > 0 && (
    <div className="mt-4">
      <h4 className="font-medium mb-2">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx} className="flex gap-2 items-start">
            {title.includes("YouTube") && <span className="text-red-500 mt-1">🎬</span>}
            {title.includes("GitHub") && <span className="text-purple-500 mt-1">📦</span>}
            {title.includes("Blog") && <span className="text-green-500 mt-1">📝</span>}
            <div className="flex-1">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {item.title}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
);

interface StepData {
  id: string;
  title: string;
  description: string;
  order: number;
  videoUrl?: string;
  // Add other fields that might be present in your step data
}

export function StepCard({ 
  id, 
  title, 
  duration, 
  description, 
  resources = [], 
  practice = [], 
  validatedResources = {},
  videoUrl // Add videoUrl to the props
}: StepCardProps & { videoUrl?: string }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [videos, setVideos] = React.useState<Array<{title: string, url: string}>>([]);
  
  // Process video URL if provided directly
  React.useEffect(() => {
    if (videoUrl) {
      setVideos([{
        title: 'Watch Tutorial',
        url: videoUrl
      }]);
    } else if (validatedResources.youtubeVideos?.length) {
      // Fallback to validated resources if no direct videoUrl
      setVideos(validatedResources.youtubeVideos);
    } else {
      // Extract from resources as a last resort
      const videoItems: Array<{title: string, url: string}> = [];
      
      resources.forEach(resource => {
        if (typeof resource !== 'string') return;
        
        if (resource.toLowerCase().includes('video:') || 
            resource.toLowerCase().includes('youtube') ||
            resource.toLowerCase().includes('watch here')) {
          const match = resource.match(/\[(.*?)\]\((.*?)\)/);
          if (match && match[2] && (match[2].includes('youtube.com') || match[2].includes('youtu.be'))) {
            videoItems.push({
              title: match[1] || 'Watch Tutorial',
              url: match[2].startsWith('http') ? match[2] : `https://${match[2]}`
            });
          }
        }
      });
      
      if (videoItems.length > 0) {
        setVideos(videoItems);
      }
    }
  }, [resources, validatedResources.youtubeVideos, videoUrl]);
  
  // Process other resources (non-video)
  const otherResources = React.useMemo(() => {
    return resources.filter(r => {
      if (typeof r !== 'string') return true;
      return !r.toLowerCase().includes('video:') && 
             !r.toLowerCase().includes('youtube') &&
             !r.toLowerCase().includes('watch here');
    });
  }, [resources]);

  return (
    <Card className="mb-4 overflow-hidden text-slate-300">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/10 transition-colors" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">
              {id}. {title}
            </CardTitle>
            <CardDescription>Duration: {duration}</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <p className="mb-4 text-muted-foreground">{description}</p>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Resources</h4>
              <ul className="space-y-2">
                {otherResources.map((resource, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-primary mt-1">📚</span>
                    <div className="flex-1">
                      {typeof resource === 'string' ? parseMarkdownLink(resource) : resource}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Practice</h4>
              <ul className="space-y-2">
                {practice.map((item, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-primary mt-1">✨</span>
                    <div className="flex-1">{parseMarkdownLink(item)}</div>
                  </li>
                ))}
              </ul>
            </div>

            {videos.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Video Tutorials</h4>
                <ul className="space-y-2">
                  {videos.map((video, index) => (
                    <li key={index} className="flex gap-2 items-start">
                      <span className="text-red-500 mt-1">▶️</span>
                      <a 
                        href={video.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {video.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}