'use client'

import { useState, useEffect } from 'react'
import PortfolioChart, { PortfolioAnalytics } from '../components/PortfolioChart'

interface PortfolioData {
    total_value: number
    total_cards: number
    price_changes: {
        '1_day': { value: number; percentage: number }
        '1_month': { value: number; percentage: number }
        '3_months': { value: number; percentage: number }
        '1_year': { value: number; percentage: number }
    }
}

export default function WealthPage() {
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTimeRange, setSelectedTimeRange] = useState<'1d' | '1m' | '3m' | '1y' | 'all'>('1m')

    useEffect(() => {
        fetchPortfolioData()
    }, [])

    const fetchPortfolioData = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('http://localhost:8000/portfolio/analytics')
            if (!response.ok) {
                throw new Error('Failed to fetch portfolio data')
            }

            const data = await response.json()
            setPortfolioData(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const timeRanges = [
        { key: '1d', label: '1 Day' },
        { key: '1m', label: '1 Month' },
        { key: '3m', label: '3 Months' },
        { key: '1y', label: '1 Year' },
        { key: 'all', label: 'All Time' }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading portfolio...</p>
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
                        Portfolio Overview
                    </h1>
                    <p className="text-xl text-[#5a6c7d] dark:text-[#a8b2c1] font-medium mb-8">
                        Track your Pokémon card collection value over time
                    </p>
                </div>

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-[#ff4444] rounded-lg p-4 mb-6 animate-fade-in">
                        <p className="text-[#ff4444] font-semibold">{error}</p>
                    </div>
                )}

                {/* Portfolio Summary */}
                {portfolioData && (
                    <div className="mb-8">
                        <div className="bg-[#f8f9fb] dark:bg-[#242b3d] rounded-2xl border border-[#e1e4e8] dark:border-[#3d4556] shadow-sm p-8 mb-6 animate-fade-in">
                            <div className="text-center">
                                <h2 className="text-lg font-bold text-[#5a6c7d] dark:text-[#a8b2c1] mb-3 uppercase tracking-wide">
                                    Total Portfolio Value
                                </h2>
                                <div className="text-6xl font-black text-[#0078ff] mb-2">
                                    ${portfolioData.total_value.toLocaleString()}
                                </div>
                                <p className="text-lg text-[#5a6c7d] dark:text-[#a8b2c1] font-medium">
                                    {portfolioData.total_cards} cards in collection
                                </p>
                            </div>
                        </div>

                        {/* Price Changes */}
                        <div className="mb-8 animate-fade-in">
                            <h3 className="text-2xl font-black text-[#2c3e50] dark:text-[#f0f0f0] mb-4 uppercase tracking-wide">
                                Performance
                            </h3>
                            <PortfolioAnalytics analytics={portfolioData} />
                        </div>

                        {/* Chart Section */}
                        <div className="bg-[#f8f9fb] dark:bg-[#242b3d] rounded-2xl border border-[#e1e4e8] dark:border-[#3d4556] shadow-sm p-8 animate-fade-in">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                                <h3 className="text-2xl font-black text-[#2c3e50] dark:text-[#f0f0f0] mb-4 sm:mb-0 uppercase tracking-wide">
                                    Portfolio Value Over Time
                                </h3>

                                {/* Time Range Selector */}
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    {timeRanges.map((range) => (
                                        <button
                                            key={range.key}
                                            onClick={() => setSelectedTimeRange(range.key as any)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${selectedTimeRange === range.key
                                                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                                }`}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Chart */}
                            <PortfolioChart
                                timeRange={selectedTimeRange}
                                height={400}
                            />
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!portfolioData && !error && (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 mx-auto mb-4 text-gray-400">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            No portfolio data available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Add some cards to your collection to start tracking your portfolio value!
                        </p>
                        <a
                            href="/"
                            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Add Your First Card
                        </a>
                    </div>
                )}
            </main>
        </div>
    )
}
