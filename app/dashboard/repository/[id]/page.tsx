"use client"

import { useParams } from "next/navigation"

export default function RepositoryDetailPage() {
  const params = useParams()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Repository Details</h1>
        <p className="text-lg mb-4">Repository ID: {params.id}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Repository Overview</h2>
            <div className="space-y-2">
              <p><span className="font-semibold">Name:</span> example-repo</p>
              <p><span className="font-semibold">Language:</span> JavaScript</p>
              <p><span className="font-semibold">Last Scan:</span> 2 hours ago</p>
              <p><span className="font-semibold">Status:</span> <span className="text-green-400">Healthy</span></p>
            </div>
          </div>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Vulnerability Breakdown</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Critical</span>
                <span className="text-red-400 font-bold">1</span>
              </div>
              <div className="flex justify-between">
                <span>High</span>
                <span className="text-orange-400 font-bold">3</span>
              </div>
              <div className="flex justify-between">
                <span>Medium</span>
                <span className="text-yellow-400 font-bold">7</span>
              </div>
              <div className="flex justify-between">
                <span>Low</span>
                <span className="text-blue-400 font-bold">12</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
