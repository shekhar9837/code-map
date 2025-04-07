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