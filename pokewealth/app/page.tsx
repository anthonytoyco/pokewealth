'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface GradingCondition {
  score: number
  description: string
}

interface CardAnalysisResult {
  card_name: string
  estimated_price: string
  details: string
  centering?: GradingCondition
  corners?: GradingCondition
  edges?: GradingCondition
  surface?: GradingCondition
  overall_grade?: number
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<CardAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showGradingForm, setShowGradingForm] = useState(false)
  const [gradingData, setGradingData] = useState({
    centering_score: '',
    centering_comment: '',
    corners_score: '',
    corners_description: '',
    edges_score: '',
    edges_description: '',
    surface_score: '',
    surface_description: ''
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Preview image
    const reader = new FileReader()
    reader.onloadend = () => {
      setSelectedImage(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to backend
    setLoading(true)
    setError(null)
    setResult(null)
    setShowGradingForm(false)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/analyze-card', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to analyze card')
      }

      const data = await response.json()
      setResult(data)

      // Pre-populate grading form with AI analysis
      if (data.centering) {
        setGradingData(prev => ({
          ...prev,
          centering_score: data.centering.score.toString(),
          centering_comment: data.centering.description
        }))
      }
      if (data.corners) {
        setGradingData(prev => ({
          ...prev,
          corners_score: data.corners.score.toString(),
          corners_description: data.corners.description
        }))
      }
      if (data.edges) {
        setGradingData(prev => ({
          ...prev,
          edges_score: data.edges.score.toString(),
          edges_description: data.edges.description
        }))
      }
      if (data.surface) {
        setGradingData(prev => ({
          ...prev,
          surface_score: data.surface.score.toString(),
          surface_description: data.surface.description
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCard = async () => {
    if (!result || !selectedFile) return

    setSaving(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image_file', selectedFile)
      formData.append('card_name', result.card_name)
      formData.append('estimated_price', result.estimated_price)
      formData.append('details', result.details)

      // Add grading fields only if they have non-empty values
      if (gradingData.centering_score && String(gradingData.centering_score).trim() !== '') {
        formData.append('centering_score', String(gradingData.centering_score).trim())
      }
      if (gradingData.centering_comment && gradingData.centering_comment.trim() !== '') {
        formData.append('centering_comment', gradingData.centering_comment.trim())
      }
      if (gradingData.corners_score && String(gradingData.corners_score).trim() !== '') {
        formData.append('corners_score', String(gradingData.corners_score).trim())
      }
      if (gradingData.corners_description && gradingData.corners_description.trim() !== '') {
        formData.append('corners_description', gradingData.corners_description.trim())
      }
      if (gradingData.edges_score && String(gradingData.edges_score).trim() !== '') {
        formData.append('edges_score', String(gradingData.edges_score).trim())
      }
      if (gradingData.edges_description && gradingData.edges_description.trim() !== '') {
        formData.append('edges_description', gradingData.edges_description.trim())
      }
      if (gradingData.surface_score && String(gradingData.surface_score).trim() !== '') {
        formData.append('surface_score', String(gradingData.surface_score).trim())
      }
      if (gradingData.surface_description && gradingData.surface_description.trim() !== '') {
        formData.append('surface_description', gradingData.surface_description.trim())
      }

      const response = await fetch('http://localhost:8000/save-card', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to save card' }))
        throw new Error(errorData.detail || 'Failed to save card')
      }

      // Reset form
      setSelectedImage(null)
      setSelectedFile(null)
      setResult(null)
      setShowGradingForm(false)
      setGradingData({
        centering_score: '',
        centering_comment: '',
        corners_score: '',
        corners_description: '',
        edges_score: '',
        edges_description: '',
        surface_score: '',
        surface_description: ''
      })

      // Show success message
      alert('Card saved successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const getGradeColor = (score: number) => {
    if (score >= 9) return 'text-green-600 dark:text-green-400'
    if (score >= 7) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 5) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-16 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            PokeWealth
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Snap your card. Track your value.
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <label
              htmlFor="card-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
            >
              {selectedImage ? (
                <div className="relative w-full h-full p-4">
                  <Image
                    src={selectedImage}
                    alt="Selected card"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-12 h-12 mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Upload a Pokémon card image
                  </p>
                </div>
              )}
              <input
                id="card-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Analyzing card...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {result.card_name}
              </h2>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Estimated Price
                </p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {result.estimated_price}
                </p>
              </div>

              {/* Overall Grade */}
              {result.overall_grade && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Overall Grade
                  </p>
                  <p className={`text-3xl font-bold ${getGradeColor(result.overall_grade)}`}>
                    {result.overall_grade}/10
                  </p>
                </div>
              )}

              {/* Grading Details */}
              {(result.centering || result.corners || result.edges || result.surface) && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    AI Grading Analysis
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.centering && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Centering:</span>
                          <span className={`text-sm font-medium ${getGradeColor(result.centering.score)}`}>
                            {result.centering.score}/10
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.centering.description}</p>
                      </div>
                    )}
                    {result.corners && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Corners:</span>
                          <span className={`text-sm font-medium ${getGradeColor(result.corners.score)}`}>
                            {result.corners.score}/10
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.corners.description}</p>
                      </div>
                    )}
                    {result.edges && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Edges:</span>
                          <span className={`text-sm font-medium ${getGradeColor(result.edges.score)}`}>
                            {result.edges.score}/10
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.edges.description}</p>
                      </div>
                    )}
                    {result.surface && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Surface:</span>
                          <span className={`text-sm font-medium ${getGradeColor(result.surface.score)}`}>
                            {result.surface.score}/10
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{result.surface.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Details
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {result.details}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowGradingForm(!showGradingForm)}
                  className="flex-1 px-6 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {showGradingForm ? 'Hide' : 'Edit'} Grading
                </button>
                <button
                  onClick={handleSaveCard}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save to Collection'}
                </button>
              </div>
            </div>
          )}

          {/* Grading Form */}
          {showGradingForm && result && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Edit Grading Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Centering */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Centering Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.centering_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, centering_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="9.5"
                  />
                  <textarea
                    value={gradingData.centering_comment}
                    onChange={(e) => setGradingData(prev => ({ ...prev, centering_comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Slightly bottom-heavy"
                    rows={2}
                  />
                </div>

                {/* Corners */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Corners Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.corners_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, corners_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="9.0"
                  />
                  <textarea
                    value={gradingData.corners_description}
                    onChange={(e) => setGradingData(prev => ({ ...prev, corners_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Two tiny dots of whitening on back corners"
                    rows={2}
                  />
                </div>

                {/* Edges */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Edges Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.edges_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, edges_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="9.5"
                  />
                  <textarea
                    value={gradingData.edges_description}
                    onChange={(e) => setGradingData(prev => ({ ...prev, edges_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Near perfect"
                    rows={2}
                  />
                </div>

                {/* Surface */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Surface Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.surface_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, surface_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="8.0"
                  />
                  <textarea
                    value={gradingData.surface_description}
                    onChange={(e) => setGradingData(prev => ({ ...prev, surface_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="One visible surface scratch on holographic area"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          Powered by Gemini AI
        </div>
      </main>
    </div>
  )
}
