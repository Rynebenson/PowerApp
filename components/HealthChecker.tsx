'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface HealthStatus {
  status: string
  stage: string
  timestamp: string
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function HealthChecker() {
  const { data: health, error, isLoading } = useSWR<HealthStatus>(
    `${process.env.NEXT_PUBLIC_API_URL}/health`,
    fetcher
  )

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="mx-auto my-8 px-4 max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div>
              <div className="flex justify-between py-3 border-b">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="flex justify-between py-3 border-b">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="flex justify-between py-3">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-32" />
              </div>
            </div>
          )}
          {error && <div className="text-red-500 text-center">API Error: {error.message}</div>}
          {health && (
            <div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Status</span>
                <span className="text-green-600">✓ {health.status}</span>
              </div>
              <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Stage</span>
                <span>{health.stage}</span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-gray-500">Timestamp</span>
                <span className="text-sm">{formatTimestamp(health.timestamp)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}