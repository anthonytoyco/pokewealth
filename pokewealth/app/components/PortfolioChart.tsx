'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface PriceData {
    date: string
    value: number
    display: string
}

interface PortfolioAnalytics {
    total_value: number
    total_cards: number
    price_changes: {
        '1_day': { value: number; percentage: number }
        '1_month': { value: number; percentage: number }
        '3_months': { value: number; percentage: number }
        '1_year': { value: number; percentage: number }
    }
}

interface PortfolioChartProps {
    cardId?: number
    timeRange: '1d' | '1m' | '3m' | '1y' | 'all'
    height?: number
}

export default function PortfolioChart({ cardId, timeRange, height = 300 }: PortfolioChartProps) {
    const [data, setData] = useState<PriceData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchChartData()
    }, [cardId, timeRange])

    const fetchChartData = async () => {
        try {
            setLoading(true)
            setError(null)

            let response
            if (cardId) {
                // Fetch individual card price history
                response = await fetch(`http://localhost:8000/cards/${cardId}/price-history`)
                if (!response.ok) throw new Error('Failed to fetch card price history')
                const priceHistory = await response.json()

                // Convert to chart data format
                const chartData = priceHistory.map((entry: any) => ({
                    date: new Date(entry.recorded_at).toLocaleDateString(),
                    value: entry.price,
                    display: entry.price_display
                }))

                setData(chartData)
            } else {
                // For now, we'll create mock data for portfolio view
                // In a real implementation, you'd have a portfolio history endpoint
                const mockData = generateMockPortfolioData(timeRange)
                setData(mockData)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const generateMockPortfolioData = (range: string): PriceData[] => {
        const now = new Date()
        const data: PriceData[] = []

        let days = 7
        switch (range) {
            case '1d': days = 1; break
            case '1m': days = 30; break
            case '3m': days = 90; break
            case '1y': days = 365; break
            case 'all': days = 365; break
        }

        let baseValue = 1000
        for (let i = days; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
            const variation = (Math.random() - 0.5) * 0.1 // ±5% daily variation
            baseValue *= (1 + variation)

            data.push({
                date: date.toLocaleDateString(),
                value: Math.round(baseValue),
                display: `$${Math.round(baseValue).toLocaleString()}`
            })
        }

        return data
    }

    const formatTooltipValue = (value: number, name: string) => {
        return [`$${value.toLocaleString()}`, 'Portfolio Value']
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading chart...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-center">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400">No data available</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#6b7280' }}
                    />
                    <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#6b7280' }}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip
                        formatter={formatTooltipValue}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{
                            backgroundColor: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#6366f1"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}

export function PortfolioAnalytics({ analytics }: { analytics: PortfolioAnalytics }) {
    const timeRanges = [
        { key: '1_day', label: '1D', value: analytics.price_changes['1_day'] },
        { key: '1_month', label: '1M', value: analytics.price_changes['1_month'] },
        { key: '3_months', label: '3M', value: analytics.price_changes['3_months'] },
        { key: '1_year', label: '1Y', value: analytics.price_changes['1_year'] }
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timeRanges.map((range) => (
                <div key={range.key} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {range.label}
                    </div>
                    <div className={`text-lg font-semibold ${range.value.percentage >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                        {range.value.percentage >= 0 ? '+' : ''}{range.value.percentage.toFixed(2)}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                        {range.value.value >= 0 ? '+' : ''}${range.value.value.toFixed(2)}
                    </div>
                </div>
            ))}
        </div>
    )
}
