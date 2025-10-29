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
}

export default function Collection() {
    const [cards, setCards] = useState<Card[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchCards()
    }, [])

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <main className="container mx-auto px-4 py-16 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
                        My Collection
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                        Track your Pokémon cards and their grades
                    </p>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Cards Grid */}
                {cards.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No cards in your collection yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Start by uploading your first Pokémon card!
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Add Your First Card
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cards.map((card) => (
                            <div
                                key={card.id}
                                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow"
                            >
                                {/* Card Image */}
                                <div className="relative h-64 bg-gray-100 dark:bg-gray-700">
                                    {card.image_filename ? (
                                        <>
                                            <img
                                                src={`http://localhost:8000/cards/${card.id}/image`}
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
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {card.card_name}
                                    </h3>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Estimated Price
                                        </p>
                                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                            {card.estimated_price}
                                        </p>
                                    </div>

                                    {/* Overall Grade */}
                                    {card.overall_grade && (
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                Overall Grade
                                            </p>
                                            <p className={`text-2xl font-bold ${getGradeColor(card.overall_grade)}`}>
                                                {card.overall_grade}/10
                                            </p>
                                        </div>
                                    )}

                                    {/* Grading Details */}
                                    <div className="space-y-2 mb-4">
                                        {card.centering_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Centering:</span>
                                                <span className={`text-sm font-medium ${getGradeColor(card.centering_score)}`}>
                                                    {card.centering_score}/10
                                                </span>
                                            </div>
                                        )}
                                        {card.corners_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Corners:</span>
                                                <span className={`text-sm font-medium ${getGradeColor(card.corners_score)}`}>
                                                    {card.corners_score}/10
                                                </span>
                                            </div>
                                        )}
                                        {card.edges_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Edges:</span>
                                                <span className={`text-sm font-medium ${getGradeColor(card.edges_score)}`}>
                                                    {card.edges_score}/10
                                                </span>
                                            </div>
                                        )}
                                        {card.surface_score && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600 dark:text-gray-400">Surface:</span>
                                                <span className={`text-sm font-medium ${getGradeColor(card.surface_score)}`}>
                                                    {card.surface_score}/10
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
