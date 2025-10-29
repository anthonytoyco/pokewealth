'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface GradingCondition {
    score: number
    description: string
}

interface Card {
    id: number
    card_name: string
    estimated_price: string
    details: string
    image_filename?: string
    created_at: string
    centering_score?: number
    centering_comment?: string
    corners_score?: number
    corners_description?: string
    edges_score?: number
    edges_description?: string
    surface_score?: number
    surface_description?: string
    overall_grade?: number
    // Real market data
    market_price?: number
    price_source?: string
    tcg_player_id?: string
    set_name?: string
    card_number?: string
    rarity?: string
    psa_10_price?: number
    psa_9_price?: number
    psa_8_price?: number
    is_authentic?: boolean
    authenticity_confidence?: number
    authenticity_notes?: string
}

interface PriceChange {
    value: number
    percentage: number
}

export default function Collection() {
    const [cards, setCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [priceChanges, setPriceChanges] = useState<Record<number, PriceChange>>({})

    useEffect(() => {
        fetchCards()
    }, [])

    useEffect(() => {
        if (cards.length > 0) {
            fetchPriceChanges()
        }
    }, [cards])

    const fetchCards = async () => {
        try {
            const response = await fetch('http://localhost:8000/cards')
            if (!response.ok) {
                throw new Error('Failed to fetch cards')
            }
            const data = await response.json()
            setCards(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchPriceChanges = async () => {
        try {
            const changes: Record<number, PriceChange> = {}

            // For now, we'll create mock price changes
            // In a real implementation, you'd fetch from the price history API
            for (const card of cards) {
                const mockChange = {
                    value: (Math.random() - 0.5) * 50, // Random change between -25 and +25
                    percentage: (Math.random() - 0.5) * 20 // Random percentage between -10% and +10%
                }
                changes[card.id] = mockChange
            }

            setPriceChanges(changes)
        } catch (err) {
            console.error('Error fetching price changes:', err)
        }
    }

    const getGradeColor = (score: number) => {
        if (score >= 9) return 'text-green-600 dark:text-green-400'
        if (score >= 7) return 'text-yellow-600 dark:text-yellow-400'
        if (score >= 5) return 'text-orange-600 dark:text-orange-400'
        return 'text-red-600 dark:text-red-400'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading collection...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white dark:bg-[#1a1f2e]">
            <main className="container mx-auto px-6 py-12 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in">
                    <h1 className="text-6xl font-black text-[#0078ff] mb-3">
                        My Collection
                    </h1>
                    <p className="text-xl text-[#5a6c7d] dark:text-[#a8b2c1] font-medium">
                        Track and manage your Pokémon cards
                    </p>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-[#ff4444] rounded-lg p-4 mb-6 animate-fade-in">
                        <p className="text-[#ff4444] font-semibold">{error}</p>
                    </div>
                )}

                {/* Cards Grid */}
                {cards.length === 0 ? (
                    <div className="text-center py-16 max-w-2xl mx-auto">
                        <div className="w-32 h-32 mx-auto mb-6 bg-[#f8f9fb] dark:bg-[#242b3d] rounded-2xl flex items-center justify-center border border-[#e1e4e8] dark:border-[#3d4556]">
                            <svg className="w-16 h-16 text-[#5a6c7d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-black text-[#2c3e50] dark:text-[#f0f0f0] mb-3">
                            No cards in your collection yet
                        </h3>
                        <p className="text-[#5a6c7d] dark:text-[#a8b2c1] mb-8">
                            Start by uploading your first Pokémon card!
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-8 py-3 bg-[#0078ff] hover:bg-[#0060d9] text-white font-bold rounded-lg transition-colors shadow-sm"
                        >
                            Add Your First Card
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="bg-[#f8f9fb] dark:bg-[#242b3d] rounded-2xl border border-[#e1e4e8] dark:border-[#3d4556] overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 animate-fade-in"
                            >
                                {/* Card Image */}
                                <div className="relative h-64 bg-white dark:bg-[#1a1f2e]">
                                    {card.image_filename ? (
                                        <>
                                            <img
                                                key={card.id}
                                                src={`http://localhost:8000/cards/${card.id}/image?v=${card.id}`}
                                                alt={card.card_name}
                                                className="w-full h-full object-contain p-4"
                                                onError={(e) => {
                                                    const img = e.currentTarget;
                                                    const failedSrc = (img as HTMLImageElement).currentSrc || img.src;
                                                    console.error('Image load error for src:', failedSrc);
                                                    // Hide the image and show fallback
                                                    img.style.display = 'none';
                                                    const fallback = img.nextElementSibling as HTMLElement | null;
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center h-full" style={{ display: 'none' }}>
                                                <div className="text-gray-400 text-center">
                                                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <p className="text-sm">Image Error</p>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="text-gray-400 text-center">
                                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">No Image</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Card Details */}
                                <div className="p-6">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <h3 className="text-xl font-black text-[#2c3e50] dark:text-[#f0f0f0]">
                                            {card.card_name}
                                        </h3>
                                        {typeof card.is_authentic !== 'undefined' && (
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${card.is_authentic ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                {card.is_authentic ? 'Authentic' : 'Counterfeit'}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-2 uppercase tracking-wide">
                                            Estimated Value
                                        </p>
                                        <div className="flex items-center space-x-2">
                                            <p className="text-2xl font-black text-[#0078ff]">
                                                {card.estimated_price || 'N/A'}
                                            </p>
                                            {priceChanges[card.id] && (
                                                <div className={`text-sm font-bold ${priceChanges[card.id].percentage >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}>
                                                    {priceChanges[card.id].percentage >= 0 ? '+' : ''}{priceChanges[card.id].percentage.toFixed(1)}%
                                                </div>
                                            )}
                                        </div>
                                        {priceChanges[card.id] && (
                                            <p className={`text-xs font-semibold mt-1 ${priceChanges[card.id].value >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {priceChanges[card.id].value >= 0 ? '+' : ''}${priceChanges[card.id].value.toFixed(2)} from last update
                                            </p>
                                        )}
                                    </div>

                                    {/* Overall Grade */}
                                    {card.overall_grade && (
                                        <div className="mb-4 pb-4 border-b border-[#e1e4e8] dark:border-[#3d4556]">
                                            <p className="text-xs font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-2 uppercase tracking-wide">
                                                Overall Grade
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className={`text-3xl font-black ${getGradeColor(card.overall_grade)}`}>
                                                    {card.overall_grade}
                                                </p>
                                                <span className="text-xl font-bold text-[#5a6c7d] dark:text-[#a8b2c1]">/10</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Grading Details */}
                                    <div className="space-y-3 mb-4">
                                        {card.centering_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-[#5a6c7d] dark:text-[#a8b2c1]">Centering</span>
                                                <span className={`text-sm font-black ${getGradeColor(card.centering_score)}`}>
                                                    {card.centering_score}
                                                </span>
                                            </div>
                                        )}
                                        {card.corners_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-[#5a6c7d] dark:text-[#a8b2c1]">Corners</span>
                                                <span className={`text-sm font-black ${getGradeColor(card.corners_score)}`}>
                                                    {card.corners_score}
                                                </span>
                                            </div>
                                        )}
                                        {card.edges_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-[#5a6c7d] dark:text-[#a8b2c1]">Edges</span>
                                                <span className={`text-sm font-black ${getGradeColor(card.edges_score)}`}>
                                                    {card.edges_score}
                                                </span>
                                            </div>
                                        )}
                                        {card.surface_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold text-[#5a6c7d] dark:text-[#a8b2c1]">Surface</span>
                                                <span className={`text-sm font-black ${getGradeColor(card.surface_score)}`}>
                                                    {card.surface_score}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {card.details}
                                        </p>
                                    </div>

                                    {/* Date Added */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                                        Added {new Date(card.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
