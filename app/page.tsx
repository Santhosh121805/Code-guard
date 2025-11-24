"use client"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
            CodeGuardian AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Advanced AI-powered code security and vulnerability detection
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Real-time Scanning</h3>
              <p className="text-gray-300">Continuous monitoring of your codebase</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-300">Advanced machine learning detection</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Instant Alerts</h3>
              <p className="text-gray-300">Get notified immediately of issues</p>
            </div>
          </div>
          <div className="mt-12">
            <a 
              href="/dashboard" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
