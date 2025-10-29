'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

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
  // Real market data from Pokemon API
  market_price?: number
  price_source?: string
  tcg_player_id?: string
  set_name?: string
  card_number?: string
  rarity?: string
  psa_10_price?: number
  psa_9_price?: number
  psa_8_price?: number
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<CardAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
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

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

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
    setSuccessMessage(null)
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
    setSuccessMessage(null)

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

      // Add market data fields if available
      if (result.market_price) {
        formData.append('market_price', result.market_price.toString())
      }
      if (result.price_source) {
        formData.append('price_source', result.price_source)
      }
      if (result.tcg_player_id) {
        formData.append('tcg_player_id', result.tcg_player_id)
      }
      if (result.set_name) {
        formData.append('set_name', result.set_name)
      }
      if (result.card_number) {
        formData.append('card_number', result.card_number)
      }
      if (result.rarity) {
        formData.append('rarity', result.rarity)
      }
      if (result.psa_10_price) {
        formData.append('psa_10_price', result.psa_10_price.toString())
      }
      if (result.psa_9_price) {
        formData.append('psa_9_price', result.psa_9_price.toString())
      }
      if (result.psa_8_price) {
        formData.append('psa_8_price', result.psa_8_price.toString())
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
      setSuccessMessage('Card saved successfully!')
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
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(/pokemon-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* White overlay */}
      <div className="absolute inset-0 bg-white/40 dark:bg-[#1a1f2e]/40 z-0" />
      
      <main className="container mx-auto px-6 pt-15 pb-16 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-6xl font-black text-white mb-3 drop-shadow-lg">
            PokéWealth
          </h1>

        </div>

        {/* Upload Section */}
        <div className="bg-[#f8f9fb]/30 dark:bg-[#242b3d]/30 backdrop-blur-md rounded-2xl shadow-lg border border-[#e1e4e8] dark:border-[#3d4556] p-8 animate-fade-in">
          <div className="mb-8">
            <label
              htmlFor="card-upload"
              className="flex flex-col items-center justify-center w-full h-72 border-2 border-dashed border-[#e1e4e8] dark:border-[#3d4556] rounded-xl cursor-pointer hover:border-[#0078ff] transition-colors relative overflow-hidden bg-white dark:bg-[#1a1f2e]"
            >
              {/* Floating Pokeballs */}
              <div className="floating-pokeball"><div className="pokeball"></div></div>
              <div className="floating-pokeball"><div className="pokeball"></div></div>
              <div className="floating-pokeball"><div className="pokeball"></div></div>
              <div className="floating-pokeball"><div className="pokeball"></div></div>
              
              {selectedImage ? (
                <div className="relative w-full h-full p-4 z-10">
                  <Image
                    src={selectedImage}
                    alt="Selected card"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-[#0078ff]/10 flex items-center justify-center mb-4">
                    <svg
                      className="w-8 h-8 text-[#0078ff]"
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
                  </div>
                  <p className="mb-2 text-base font-semibold text-[#2c3e50] dark:text-[#f0f0f0]">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-sm text-[#5a6c7d] dark:text-[#a8b2c1]">
                    JPG, PNG or WEBP
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
            <div className="text-center py-12 animate-fade-in">
              <div className="pokeball-loader mx-auto mb-4"></div>
              <p className="text-[#5a6c7d] dark:text-[#a8b2c1] font-medium">
                Analyzing your card...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-[#ff4444] rounded-lg p-4 mb-6 animate-fade-in">
              <p className="text-[#ff4444] font-semibold">{error}</p>
            </div>
          )}

          {/* Success Toast */}
          {successMessage && (
            <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 rounded-lg p-4 shadow-2xl animate-fade-in max-w-md">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-green-800 dark:text-green-200 font-bold text-lg">{successMessage}</p>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">Your card has been added to your collection!</p>
                </div>
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="flex-shrink-0 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="border-t-2 border-[#e0e0e0] dark:border-[#333333] pt-8 animate-fade-in">
              <h2 className="text-3xl font-black text-[#1a1a1a] dark:text-white mb-6">
                {result.card_name}
              </h2>

              <div className="bg-white dark:bg-[#242b3d] border-l-4 border-[#0078ff] rounded-xl p-6 mb-6 shadow-sm">
                <p className="text-sm font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-2 uppercase tracking-wide">
                  Estimated Value
                </p>
                <p className="text-4xl font-black text-[#0078ff]">
                  {result.estimated_price}
                </p>
                {result.price_source && (
                  <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mt-2">
                    {result.price_source === 'api' ? '✓ Real market price from TCGPlayer' : 'AI estimated price'}
                  </p>
                )}
              </div>

              {/* Card Details */}
              {(result.set_name || result.card_number || result.rarity) && (
                <div className="bg-white dark:bg-[#242b3d] border border-[#e1e4e8] dark:border-[#3d4556] rounded-xl p-6 mb-6 shadow-sm">
                  <p className="text-sm font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-3 uppercase tracking-wide">
                    Card Details
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.set_name && (
                      <div>
                        <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mb-1">Set</p>
                        <p className="font-semibold text-[#2c3e50] dark:text-white">{result.set_name}</p>
                      </div>
                    )}
                    {result.card_number && (
                      <div>
                        <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mb-1">Number</p>
                        <p className="font-semibold text-[#2c3e50] dark:text-white">{result.card_number}</p>
                      </div>
                    )}
                    {result.rarity && (
                      <div>
                        <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mb-1">Rarity</p>
                        <p className="font-semibold text-[#2c3e50] dark:text-white">{result.rarity}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* PSA Grading Prices */}
              {(result.psa_10_price || result.psa_9_price || result.psa_8_price) && (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-6 shadow-sm">
                  <p className="text-sm font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-3 uppercase tracking-wide flex items-center">
                    <span className="mr-2">🏆</span> PSA Graded Card Values
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.psa_10_price && (
                      <div className="bg-white dark:bg-[#242b3d] rounded-lg p-4 border-2 border-yellow-400">
                        <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mb-1">PSA 10 - Gem Mint</p>
                        <p className="text-2xl font-black text-yellow-600 dark:text-yellow-400">
                          ${result.psa_10_price.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {result.psa_9_price && (
                      <div className="bg-white dark:bg-[#242b3d] rounded-lg p-4 border-2 border-gray-400">
                        <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mb-1">PSA 9 - Mint</p>
                        <p className="text-2xl font-black text-gray-600 dark:text-gray-400">
                          ${result.psa_9_price.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {result.psa_8_price && (
                      <div className="bg-white dark:bg-[#242b3d] rounded-lg p-4 border-2 border-orange-400">
                        <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mb-1">PSA 8 - NM/Mint</p>
                        <p className="text-2xl font-black text-orange-600 dark:text-orange-400">
                          ${result.psa_8_price.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] mt-3 italic">
                    * Professional grading values based on recent eBay sales
                  </p>
                </div>
              )}

              {/* Overall Grade */}
              {result.overall_grade && (
                <div className="bg-white dark:bg-[#242b3d] border border-[#e1e4e8] dark:border-[#3d4556] rounded-xl p-6 mb-6 shadow-sm">
                  <p className="text-sm font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-2 uppercase tracking-wide">
                    Overall Grade
                  </p>
                  <div className="flex items-center gap-3">
                    <p className={`text-5xl font-black ${getGradeColor(result.overall_grade)}`}>
                      {result.overall_grade}
                    </p>
                    <span className="text-3xl font-bold text-[#5a6c7d] dark:text-[#a8b2c1]">/10</span>
                  </div>
                </div>
              )}

              {/* Grading Details */}
              {(result.centering || result.corners || result.edges || result.surface) && (
                <div className="bg-[#f8f9fb] dark:bg-[#242b3d] border border-[#e1e4e8] dark:border-[#3d4556] rounded-xl p-6 mb-6">
                  <p className="text-lg font-black text-[#2c3e50] dark:text-[#f0f0f0] mb-5 uppercase tracking-wide">
                    Detailed Grading
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.centering && (
                      <div className="bg-white dark:bg-[#121212] border border-[#e0e0e0] dark:border-[#333333] rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-[#666666] dark:text-[#b0b0b0] uppercase tracking-wide">Centering</span>
                          <span className={`text-2xl font-black ${getGradeColor(result.centering.score)}`}>
                            {result.centering.score}
                          </span>
                        </div>
                        <p className="text-xs text-[#5a6c7d] dark:text-[#a8b2c1] leading-relaxed">{result.centering.description}</p>
                      </div>
                    )}
                    {result.corners && (
                      <div className="bg-white dark:bg-[#121212] border border-[#e0e0e0] dark:border-[#333333] rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-[#666666] dark:text-[#b0b0b0] uppercase tracking-wide">Corners</span>
                          <span className={`text-2xl font-black ${getGradeColor(result.corners.score)}`}>
                            {result.corners.score}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] dark:text-[#b0b0b0] leading-relaxed">{result.corners.description}</p>
                      </div>
                    )}
                    {result.edges && (
                      <div className="bg-white dark:bg-[#121212] border border-[#e0e0e0] dark:border-[#333333] rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-[#666666] dark:text-[#b0b0b0] uppercase tracking-wide">Edges</span>
                          <span className={`text-2xl font-black ${getGradeColor(result.edges.score)}`}>
                            {result.edges.score}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] dark:text-[#b0b0b0] leading-relaxed">{result.edges.description}</p>
                      </div>
                    )}
                    {result.surface && (
                      <div className="bg-white dark:bg-[#121212] border border-[#e0e0e0] dark:border-[#333333] rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-bold text-[#666666] dark:text-[#b0b0b0] uppercase tracking-wide">Surface</span>
                          <span className={`text-2xl font-black ${getGradeColor(result.surface.score)}`}>
                            {result.surface.score}
                          </span>
                        </div>
                        <p className="text-xs text-[#666666] dark:text-[#b0b0b0] leading-relaxed">{result.surface.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-[#242b3d] border border-[#e1e4e8] dark:border-[#3d4556] rounded-xl p-6 mb-6 shadow-sm">
                <p className="text-sm font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-3 uppercase tracking-wide">
                  Additional Details
                </p>
                <p className="text-[#2c3e50] dark:text-[#f0f0f0] leading-relaxed">
                  {result.details}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowGradingForm(!showGradingForm)}
                  className="flex-1 px-6 py-3 bg-white dark:bg-[#242b3d] border-2 border-[#e1e4e8] dark:border-[#3d4556] hover:border-[#5a6c7d] dark:hover:border-[#5a6c7d] text-[#2c3e50] dark:text-[#f0f0f0] font-bold rounded-lg transition-all duration-200"
                >
                  {showGradingForm ? 'Hide' : 'Edit'} Grading
                </button>
                <button
                  onClick={handleSaveCard}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-[#0078ff] hover:bg-[#0060d9] text-white font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {saving ? 'Saving...' : 'Save to Collection'}
                </button>
              </div>
            </div>
          )}

          {/* Grading Form */}
          {showGradingForm && result && (
            <div className="border-t-2 border-[#e1e4e8] dark:border-[#3d4556] pt-8 mt-8 animate-fade-in">
              <h3 className="text-2xl font-black text-[#2c3e50] dark:text-[#f0f0f0] mb-6">
                Edit Grading Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Centering */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#2c3e50] dark:text-[#f0f0f0]">
                    Centering Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.centering_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, centering_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="9.5"
                  />
                  <textarea
                    value={gradingData.centering_comment}
                    onChange={(e) => setGradingData(prev => ({ ...prev, centering_comment: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="Slightly bottom-heavy"
                    rows={2}
                  />
                </div>

                {/* Corners */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#2c3e50] dark:text-[#f0f0f0]">
                    Corners Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.corners_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, corners_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="9.0"
                  />
                  <textarea
                    value={gradingData.corners_description}
                    onChange={(e) => setGradingData(prev => ({ ...prev, corners_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="Two tiny dots of whitening on back corners"
                    rows={2}
                  />
                </div>

                {/* Edges */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#2c3e50] dark:text-[#f0f0f0]">
                    Edges Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.edges_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, edges_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="9.5"
                  />
                  <textarea
                    value={gradingData.edges_description}
                    onChange={(e) => setGradingData(prev => ({ ...prev, edges_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="Near perfect"
                    rows={2}
                  />
                </div>

                {/* Surface */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#2c3e50] dark:text-[#f0f0f0]">
                    Surface Score (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={gradingData.surface_score}
                    onChange={(e) => setGradingData(prev => ({ ...prev, surface_score: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="8.0"
                  />
                  <textarea
                    value={gradingData.surface_description}
                    onChange={(e) => setGradingData(prev => ({ ...prev, surface_description: e.target.value }))}
                    className="w-full px-3 py-2 border border-[#e1e4e8] dark:border-[#3d4556] rounded-lg focus:ring-2 focus:ring-[#0078ff] dark:bg-[#242b3d] dark:text-[#f0f0f0] bg-white"
                    placeholder="One visible surface scratch on holographic area"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4">  
          <p className="text-xl text-[#ffffff]">
            Powered by <span className="text-l font-bold text-yellow-500 dark:text-yellow-400">Gemini AI</span>
          </p>
        </div>
      </main>
    </div>
  )
}
