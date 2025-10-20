"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Github, GitBranch, ExternalLink } from "lucide-react"
import { apiClient } from "@/lib/api"

interface AddRepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  onRepositoryAdded: () => void
}

export function AddRepositoryModal({ isOpen, onClose, onRepositoryAdded }: AddRepositoryModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanningStatus, setScanningStatus] = useState('')
  const [showProgress, setShowProgress] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.url.trim()) {
      setError('Please fill in all fields')
      return
    }

    // Basic URL validation
    try {
      new URL(formData.url)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError('')
    setShowProgress(true)

    try {
      // Step 1: Connecting
      setScanningStatus('🔗 Connecting to repository...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Step 2: Analyzing
      setScanningStatus('📊 Analyzing repository structure...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Step 3: Scanning
      setScanningStatus('🔍 Scanning for vulnerabilities...')
      
      const response = await apiClient.repositories.connect({
        name: formData.name.trim(),
        url: formData.url.trim()
      })
      
      if (response.success) {
        setScanningStatus('✅ Scan completed! Repository added successfully.')
        
        // Refresh the repository list
        onRepositoryAdded()
        
        // Auto-close after success message
        setTimeout(() => {
          resetForm()
          onClose()
        }, 2000)
      }
    } catch (err) {
      console.error('Failed to add repository:', err)
      setScanningStatus('❌ Error adding repository. Please try again.')
      setError('Failed to add repository. Please try again.')
      setTimeout(() => {
        setScanningStatus('')
        setShowProgress(false)
      }, 3000)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ name: '', url: '' })
    setLoading(false)
    setError('')
    setScanningStatus('')
    setShowProgress(false)
  }

  const handleUrlChange = (url: string) => {
    setFormData(prev => ({ ...prev, url }))
    
    // Auto-extract repository name from GitHub URL
    if (url.includes('github.com')) {
      const match = url.match(/github\.com\/[^\/]+\/([^\/]+?)(?:\.git)?(?:\/.*)?$/)
      if (match && match[1] && !formData.name) {
        setFormData(prev => ({ ...prev, name: match[1] }))
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass max-w-md w-full rounded-lg border border-border/50 shadow-xl">
        <div className="p-6 border-b border-border/50 flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Github className="w-5 h-5" />
            Add Repository
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-card rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Repository URL
            </label>
            <input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-3 py-2 bg-input border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              required
            />
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Supports GitHub, GitLab, and other Git repositories
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Repository Name
            </label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="my-awesome-project"
              className="w-full px-3 py-2 bg-input border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              required
            />
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <GitBranch className="w-3 h-3" />
              Display name for your repository
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
              {error}
            </div>
          )}

          {showProgress && scanningStatus && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
              <div className="flex items-center gap-2">
                {!scanningStatus.includes('✅') && !scanningStatus.includes('❌') && (
                  <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                )}
                <span>{scanningStatus}</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {showProgress ? 'Scanning...' : 'Adding...'}
                </div>
              ) : (
                'Add Repository'
              )}
            </Button>
          </div>
        </form>

        <div className="p-4 bg-card/50 border-t border-border/50 rounded-b-lg">
          <div className="text-xs text-muted-foreground">
            <strong>What happens next?</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Repository will be connected to CodeGuardian AI</li>
              <li>Initial security scan will be performed</li>
              <li>Vulnerabilities will be detected and analyzed</li>
              <li>You'll receive actionable security insights</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}