"use client"

import { useState, useEffect } from 'react'

export default function ApiTestPage() {
  const [apiStatus, setApiStatus] = useState('Testing...')
  const [repositories, setRepositories] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const testAPI = async () => {
      try {
        // Test direct fetch
        console.log('Testing API connection...')
        
        const response = await fetch('/api/health')
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Health check data:', data)
        setApiStatus('✅ Next.js API is working!')

        // Test repositories
        const repoResponse = await fetch('/api/repositories')
        const repoData = await repoResponse.json()
        console.log('Repositories data:', repoData)
        setRepositories(repoData.repositories || [])
        
      } catch (err) {
        console.error('API Test Error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        setApiStatus('❌ Backend API failed: ' + errorMessage)
      }
    }

    testAPI()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-8">🧪 CodeGuardian API Test</h1>
      
      <div className="space-y-6">
        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">API Connection Status:</h2>
          <p className="text-lg">{apiStatus}</p>
          {error && <p className="text-red-400 mt-2">Error: {error}</p>}
        </div>

        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Repositories ({repositories.length}):</h2>
          <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(repositories, null, 2)}
          </pre>
        </div>

        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Frontend Status:</h2>
          <p>✅ Next.js Frontend: http://localhost:3002</p>
          <p>✅ Next.js API Routes: /api</p>
          <p>✅ Environment: {process.env.NODE_ENV}</p>
          <p>✅ API URL: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>
        </div>

        <div className="border border-gray-700 p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">Quick Actions:</h2>
          <a href="/" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mr-4 inline-block">
            → Landing Page
          </a>
          <a href="/dashboard" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded inline-block">
            → Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}