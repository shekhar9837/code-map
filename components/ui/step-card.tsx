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
    youtubeVideos: Array<{ title: string; url: string }>;
    githubRepositories: Array<{ title: string; url: string }>;
    blogArticles: Array<{ title: string; url: string }>;
  };
}

function parseMarkdownLink(text: string) {
  // Parse markdown links [text](url)
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts = [];
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

const ResourceSection = ({ title, items }: { title: string; items: Array<{ title: string; url: string }> }) => (
  items.length > 0 && (
    <div className="mt-4">
      <h4 className="font-medium mb-2">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={idx}>
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
);

export function StepCard({ id, title, duration, description, resources, practice, validatedResources }: StepCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <Card className="mb-4">
      <CardHeader 
        className="cursor-pointer hover:bg-muted/50 transition-colors" 
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

            <ResourceSection title="YouTube Videos" items={validatedResources.youtubeVideos} />
            <ResourceSection title="GitHub Repositories" items={validatedResources.githubRepositories} />
            <ResourceSection title="Blog Articles" items={validatedResources.blogArticles} />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
