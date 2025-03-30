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
  console.log("Parsing resources:", { resources, type });
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

const ResourceSection = ({ title, items }: { title: string; items: Array<{ title: string; url: string }> }) =>
    // console.log("ResourceSection Props:", { title, items }) || // Debugging log
  (
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

export function StepCard({ id, title, duration, description, resources, practice, validatedResources }: StepCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  console.log("StepCard Props:", { id, title, duration, description, resources, practice, validatedResources });
  // Handle different validatedResources formats
  let youtubeVideos: Array<{ title: string; url: string }> = [];
  let githubRepositories: Array<{ title: string; url: string }> = [];
  let blogArticles: Array<{ title: string; url: string }> = [];

  // Check if validatedResources exists and has the expected properties
  if (validatedResources) {
    // Format 1: Arrays of objects already in the right format
    if (validatedResources.youtubeVideos) {
      youtubeVideos = validatedResources.youtubeVideos;
    }
    if (validatedResources.githubRepositories) {
      // Format 2: String-based resources that need parsing
      if (Array.isArray(validatedResources.githubRepositories) && 
          validatedResources.githubRepositories.every(repo => typeof repo === 'string')) {
        githubRepositories = (validatedResources.githubRepositories as string[]).map(repo => {
          if (typeof repo === 'string' ) {
            const match = repo.match(/Explore Here: \[(.*?)\]\((.*?)\)/);
            if (match) {
              return { title: match[1], url: match[2] };
            }
            return { title: repo, url: "" };
          }
          return repo;
        });
      } else {
        githubRepositories = validatedResources.githubRepositories as Array<{ title: string; url: string }>;
      }
    }
    if (validatedResources.blogArticles) {
      // Format 2: String-based resources that need parsing
      if (Array.isArray(validatedResources.blogArticles) && 
       validatedResources.blogArticles.every( blog => typeof blog === 'string') ){
        blogArticles = (validatedResources.blogArticles as string[]).map(blog => {
          if (typeof blog === 'string') {
            const match = blog.match(/Read Here: \[(.*?)\]\((.*?)\)/);
            if (match) {
              return { title: match[1], url: match[2] };
            }
            return { title: blog, url: "" };
          }
          return blog;
        });
      } else {
        blogArticles = validatedResources.blogArticles as Array<{ title: string; url: string }>;
      }
    }
  }

  // Extract YouTube links from resources if not explicitly provided
  if (youtubeVideos.length === 0) {
    resources.forEach(resource => {
      if (resource.toLowerCase().includes('video:') || resource.toLowerCase().includes('watch here')) {
        const match = resource.match(/\[(.*?)\]\((.*?)\)/);
        if (match && (match[2].includes('youtube.com') || match[2].includes('youtu.be'))) {
          youtubeVideos.push({ title: match[1], url: match[2] });
        }
      }
    });
  }

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
                {resources.map((resource, index) => (
                  <li key={index} className="flex gap-2 items-start">
                    <span className="text-primary mt-1">📚</span>
                    <div className="flex-1">{parseMarkdownLink(resource)}</div>
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

            <ResourceSection title="YouTube Videos" items={youtubeVideos} />
            <ResourceSection title="GitHub Repositories" items={githubRepositories} />
            <ResourceSection title="Blog Articles" items={blogArticles} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}