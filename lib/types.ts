export interface ValidatedResources {
    youtubeVideos?: Array<{ title: string; url: string }>;
    githubRepositories?: Array<{ title: string; url: string }>;
    blogArticles?: Array<{ title: string; url: string }>;
  }
  
export  interface Step {
    id: string;
    title: string;
    duration: string;
    description: string;
    resources: string[];
    practice: string[];
    validatedResources: ValidatedResources;
  }
  
export  interface RoadmapData {
    steps: Step[];
    resources?: {
      github?: string[];
      blogs?: string[];
    };
  }

export interface HistoryItem {
    id: string;
    topic: string;
    created_at: string;
    roadmap?: RoadmapData;
    resources?: {
      github?: string[];
      blogs?: string[];
    };
  }

  // Interfaces
// ======================
export interface RoadmapStep {
  id: string;
  title: string;
  duration: string;
  description: string;
  resources: string[]; // Initially generated strings, later potentially modified
  practice: string[];
}

// Structure expected directly from Gemini (before parsing)
export interface GeminiRoadmapResponse {
  steps: RoadmapStep[];
}