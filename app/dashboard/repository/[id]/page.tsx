"use client"

import { useParams } from "next/navigation"

export default function RepositoryDetailPage() {
  const params = useParams()

  return (
    <div className="flex h-screen bg-background">
      <div className="p-6">
        <h1 className="text-2xl font-bold">Repository Details</h1>
        <p>Repository ID: {params.id}</p>
        <p>Repository components are being loaded...</p>
      </div>
    </div>
  )
}
