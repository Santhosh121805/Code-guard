"use client"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">CodeGuardian AI Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-400">Critical Issues</h3>
            <p className="text-2xl font-bold">3</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-400">Total Vulnerabilities</h3>
            <p className="text-2xl font-bold">15</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-400">Fixed Issues</h3>
            <p className="text-2xl font-bold">42</p>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-400">Repositories</h3>
            <p className="text-2xl font-bold">8</p>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Recent Vulnerabilities</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div>
                <span className="font-semibold text-red-400">HIGH</span>
                <span className="ml-3">SQL Injection vulnerability detected</span>
              </div>
              <span className="text-gray-400">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div>
                <span className="font-semibold text-yellow-400">MEDIUM</span>
                <span className="ml-3">Outdated dependency: express@4.17.1</span>
              </div>
              <span className="text-gray-400">5 hours ago</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
              <div>
                <span className="font-semibold text-red-400">CRITICAL</span>
                <span className="ml-3">Remote code execution possible</span>
              </div>
              <span className="text-gray-400">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
