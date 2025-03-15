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
  subSteps: string[];
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
        className="text-primary hover:underline"
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

export function StepCard({ id, title, duration, description, subSteps }: StepCardProps) {
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
          <ul className="space-y-3">
            {subSteps.map((step, index) => (
              <li key={index} className="flex gap-2 items-start">
                <span className="text-primary mt-1">
                  {step.startsWith('Resource:') ? '📚' : '✨'}
                </span>
                <div className="flex-1">
                  {parseMarkdownLink(
                    step.startsWith('Resource:') 
                      ? step.replace('Resource:', '').trim()
                      : step
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
