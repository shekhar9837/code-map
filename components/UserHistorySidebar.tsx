"use client"

import * as React from "react"
import { PanelLeft, Clock, ChevronLeft, ChevronRight } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface HistoryItem {
  id: string
  topic: string
  created_at: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function UserHistorySidebar() {
  const [history, setHistory] = React.useState<HistoryItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const fetchHistory = React.useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/user-history?page=${page}&limit=${pagination.limit}`)
      console.log(response)
      if (!response.ok) throw new Error('Failed to fetch history')
      const data = await response.json()
      console.log(" history: ", data)
      setHistory(data.history)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [pagination.limit])

  React.useEffect(() => {
    fetchHistory()
  }, [])

  return (
    // <SidebarProvider defaultOpen={false}>
    
      <Sidebar className="bg-neutral-900 border-neutral-900 border-0">
        <SidebarHeader>
          <div className="w-full flex items-center justify-between border-b pb-4 pt-3 px-2">
            <h2 className="text-lg font-semibold text-slate-100">Learning History</h2>
            <SidebarTrigger className="text-white" />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-4 p-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            ) : error ? (
              <p className="text-sm text-red-500">{error}</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet</p>
            ) : (
              <>
                {history.map((item) => (
                  <div key={item.id} className="bg-neutral-900 rounded-lg px-4 py-2 space-y-2 hover:bg-neutral-800 transition-colors duration-200">
                    <h3 className="font-medium text-slate-100">{item.topic}</h3>
                    
                  </div>
                ))}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchHistory(pagination.page - 1)}
                      disabled={pagination.page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchHistory(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages || loading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </SidebarContent>
      </Sidebar>
  )
}