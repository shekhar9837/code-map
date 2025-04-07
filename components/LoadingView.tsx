import { Youtube } from 'lucide-react';
import React from 'react'
import { Skeleton } from './ui/skeleton';

const LoadingView = () => (
  <div className="space-y-8">
    <h2 className="text-lg font-bold flex items-center gap-2">
      <Youtube className="h-5 w-5 text-red-500" />
      Video Tutorials
      <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-40 w-full rounded-lg bg-card" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>
    <h2 className="text-lg font-bold flex items-center gap-2">
      <Youtube className="h-5 w-5 text-red-500" />
      Blogs & Repositories
      <span className="text-sm text-muted-foreground ml-2">(Loading...)</span>
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {Array(4).fill(0).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-40 w-full rounded-lg bg-card" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}
    </div>

    <div className="w-full">
      <Skeleton className="md:min-h-[40vh] h-[50vh] w-full rounded-lg bg-card" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  </div>
);
export default LoadingView