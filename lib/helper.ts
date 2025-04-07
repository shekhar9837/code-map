import { RoadmapData } from "./types";

  export async function extractLinks(data: RoadmapData | string) {
    try {
      if (!data) {
        console.log("Empty data received");
        return { youtubeLinks: [], githubLinks: [] };
      }

      const youtubeLinks: { url: string; thumbnail: string }[] = [];
      const githubLinks: { url: string; thumbnail: string }[] = [];
      const blogsLinks: { url: string; thumbnail: string }[] = [];

      // Helper function to extract and process YouTube/GitHub URLs from markdown
      const processMarkdownResource = async (resource: string) => {
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const matches = Array.from(resource.matchAll(markdownLinkRegex));

        for (const match of matches) {
          const url = match[2];
          console.log("Processing URL:", url); // Debug log

          if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const thumbnail = await getYouTubeThumbnail(url);
            if (thumbnail) {
              console.log("Added YouTube link:", url);
              youtubeLinks.push({ url, thumbnail });
            }
          } else if (url.includes("github.com")) {
            const thumbnail = await getGitHubThumbnail(url);
            if (thumbnail) {
              console.log("Added GitHub link:", url);
              githubLinks.push({ url, thumbnail });
            }
          }
        }
      };

      // Process data based on format
      if (typeof data === "object") {
        console.log("Processing roadmap data");

        // Process steps if available
        if (data.steps && Array.isArray(data.steps)) {
          for (const step of data.steps) {
            // Process markdown resources
            if (step.resources?.length) {
              for (const resource of step.resources) {
                await processMarkdownResource(resource);
              }
            }

            // Process validated resources
            if (step.validatedResources) {
              // Process GitHub repositories as strings
              if (step.validatedResources.githubRepositories?.length) {
                for (const repo of step.validatedResources.githubRepositories) {
                  if (typeof repo === 'string') {
                    // Extract URL from "Explore Here: [AwesomeRepo](https://github.com/...)" format
                    const match = (repo as string).match(/\[(.*?)\]\((.*?)\)/);
                    if (match && match[2].includes('github.com')) {
                      const url = match[2];
                      const thumbnail = await getGitHubThumbnail(url);
                      if (thumbnail) {
                        console.log("Added validated GitHub link:", url);
                        githubLinks.push({ url, thumbnail });
                      }
                    }
                  } else if (typeof repo === 'object' && repo.url) {
                    // Handle object format { title, url }
                    const thumbnail = await getGitHubThumbnail(repo.url);
                    if (thumbnail) {
                      console.log("Added validated GitHub link:", repo.url);
                      githubLinks.push({ url: repo.url, thumbnail });
                    }
                  }
                }
              }

              // Look for YouTube videos in resources that contain "Video: [Watch Here]"
              const videoResources = step.resources?.filter(
                (r) => r.toLowerCase().includes("video:") || r.toLowerCase().includes("watch here")
              ) || [];

              for (const resource of videoResources) {
                await processMarkdownResource(resource);
              }
            }
          }
        }

        // Process additional resources if available
        if (data.resources) {
          // Process GitHub links
          if (data.resources.github && Array.isArray(data.resources.github)) {
            for (const url of data.resources.github) {
              const thumbnail = await getGitHubThumbnail(url);
              if (thumbnail) {
                console.log("Added additional GitHub link:", url);
                githubLinks.push({ url, thumbnail });
              }
            }
          }

          // Process blog links (some might be GitHub)
          if (data.resources.blogs && Array.isArray(data.resources.blogs)) {
            for (const url of data.resources.blogs) {
              const thumbnail = await getGitHubThumbnail(url);
              if (thumbnail) {
                blogsLinks.push({ url, thumbnail });
              }
            }
          }
        }
      } else if (typeof data === "string") {
        await processMarkdownResource(data);
      }

      // Remove duplicates
      const uniqueYoutubeLinks = Array.from(
        new Map(youtubeLinks.map((item) => [item.url, item])).values()
      );
      const uniqueGithubLinks = Array.from(
        new Map(githubLinks.map((item) => [item.url, item])).values()
      );
      // const uniqueBlogLinks = Array.from(
      //   new Map(blogsLinks.map((item) => [item.url, item])).values()
      // );

      console.log("Extracted links:", {
        youtubeLinks: uniqueYoutubeLinks.length,
        githubLinks: uniqueGithubLinks.length,
        // blogLinks: uniqueBlogLinks.length
      });

      return {
        youtubeLinks: uniqueYoutubeLinks,
        githubLinks: uniqueGithubLinks,
        // blogLinks: uniqueBlogLinks
      };
    } catch (e) {
      console.error("Error in extractLinks:", e);
      return { youtubeLinks: [], githubLinks: [] };
    }
  }

 export async function getYouTubeThumbnail(url: string) {
    try {
      if (!url) {
        console.log("No URL provided");
        return null;
      }

      const videoIdMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
      );
      if (!videoIdMatch) {
        console.log("Invalid YouTube URL format:", url);
        return null;
      }

      const videoId = videoIdMatch[1];
      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

      // If API key is not available, return a default thumbnail
      if (!apiKey) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
      );

      if (!response.ok) {
        console.log("Failed to fetch video data:", url);
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        console.log("Video not found or unavailable:", url);
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }

      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } catch (e) {
      console.error("Error getting YouTube thumbnail:", e);
      return null;
    }
  }

 export async function getGitHubThumbnail(url: string) {
    try {
      const repoPath = url.replace("https://github.com/", "");
      if (!repoPath || repoPath === url) {
        console.log("Invalid GitHub URL format:", url);
        return null;
      }

      const [owner, repo] = repoPath.split("/");
      const githubToken = process.env.NEXT_PUBLIC_GITHUB_TOKEN;

      // If GitHub token is not available, return a default image
      if (!githubToken) {
        return `https://opengraph.githubassets.com/1/${repoPath}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}`,
        {
          headers: githubToken
            ? {
              Authorization: `token ${githubToken}`,
            }
            : {},
        }
      );

      if (!response.ok) {
        console.log("Failed to fetch repository data:", url);
        return `https://opengraph.githubassets.com/1/${repoPath}`;
      }

      return `https://opengraph.githubassets.com/1/${repoPath}`;
    } catch (e) {
      console.error("Error getting GitHub thumbnail:", e);
      return null;
    }
  }