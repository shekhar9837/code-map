import { Youtube } from 'lucide-react'
import React from 'react'

const YoutubeVideoCard = ({isLoading, youtubeLinks}) => {
  return (
    <div className="space-y-6">
    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
      <Youtube className="h-5 w-5 text-red-500" />
      Video Tutorials
      {isLoading && (
        <span className="text-sm text-muted-foreground ml-2">
          (Loading...)
        </span>
      )}
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-4">
      {youtubeLinks.length > 0 ? (
        youtubeLinks.map(({ url, thumbnail }) => (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block space-y-2 transition-transform hover:scale-105"
          >
            <div className="relative overflow-hidden rounded-lg">
              <img
                src={thumbnail}
                alt="Video Thumbnail"
                className="w-full object-cover transition-transform group-hover:scale-110"
                style={{ aspectRatio: "16/9" }}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          
          </a>
        ))
      ) : (
        <p className="text-slate-200 col-span-3 text-center py-8">
          No video tutorials found. Try searching for a different
          topic.
        </p>
      )}
    </div>
  </div>  )
}

export default YoutubeVideoCard