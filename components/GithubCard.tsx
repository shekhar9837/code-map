import { Github } from 'lucide-react'
import React from 'react'

const GithubCard = ({isLoading, githubLinks}) => {
  return (
    <div className="space-y-6">
    <h2 className="text-lg font-bold flex items-center gap-2 mt-8  text-slate-100">
      <Github className="h-5 w-5 text-purple-500" />
      GitHub Repositories
      {isLoading && (
        <span className="text-sm text-muted-foreground ml-2">
          (Loading...)
        </span>
      )}
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
      {githubLinks.length > 0 ? (
        githubLinks.map(({ url, thumbnail }) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block space-y-2 transition-transform hover:scale-105"
          >
            <div className="relative overflow-hidden rounded-lg shadow-md">
              <img
                src={thumbnail}
                alt="Repository Preview"
                className="w-full object-cover transition-transform group-hover:scale-110"
                style={{ aspectRatio: "16/9" }}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            {/* <p className="text-sm text-muted-foreground truncate">
            {url.split("github.com/")[1]}
          </p> */}
          </a>
        ))
      ) : (
        <p className=" text-slate-200 col-span-3 text-center py-8">
          No GitHub repositories found. Try searching for a different
          topic.
        </p>
      )}
    </div>
  </div>  )
}

export default GithubCard